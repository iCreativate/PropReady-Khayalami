'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import {
    Building2, Plus, MapPin, DollarSign, Bed, Bath, Square, Calendar as CalendarIcon,
    Edit, Trash2, Sparkles, Image as ImageIcon, Video, Upload, Link2, FileEdit,
    AlertCircle, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatNumber, parseAmountForDisplay } from '@/lib/currency';
import { getProxiedImageUrl } from '@/lib/image-proxy';
import {
    ListedProperty,
    PROPERTY_FEATURES,
    EMPTY_PROPERTY_FORM,
} from '@/lib/listed-property';
import PpraVerificationGate from '@/components/PpraVerificationGate';
import AgentPageHeader from '@/components/AgentPageHeader';
import {
    AGENT_CARD,
    AGENT_CARD_HEADER,
    AGENT_CARD_BODY,
    AGENT_PRIMARY_BTN,
    AGENT_EMPTY_ICON,
    AGENT_BADGE,
    AGENT_SECONDARY_BTN,
    AGENT_VIEW_BTN,
    AGENT_PANEL_HEADER,
    AGENT_PANEL_BODY,
} from '@/lib/agent-portal-ui';
import { isAgentPpraVerified } from '@/lib/ppra';

interface AgentListedPropertiesWorkspaceProps {
    agent: {
        id: string;
        fullName: string;
        email?: string;
        company?: string;
        plan?: string;
        sellerPlan?: string;
        verificationStatus?: string;
        status?: string;
    } | null;
    showPageHeader?: boolean;
}

export default function AgentListedPropertiesWorkspace({
    agent: currentAgent,
    showPageHeader = true,
}: AgentListedPropertiesWorkspaceProps) {
    const router = useRouter();
    const [listedProperties, setListedProperties] = useState<ListedProperty[]>([]);
    const [propertiesRefreshKey, setPropertiesRefreshKey] = useState(0);
    const [showPropertyModal, setShowPropertyModal] = useState(false);
    const [showViewPropertyModal, setShowViewPropertyModal] = useState<ListedProperty | null>(null);
    const [viewPropertyImageIndex, setViewPropertyImageIndex] = useState(0);
    const [propertyForm, setPropertyForm] = useState({ ...EMPTY_PROPERTY_FORM });
    const [improveLoading, setImproveLoading] = useState(false);
    const [improveResult, setImproveResult] = useState<{ listingScore: number; feedback: string[] } | null>(null);
    const [bulkImageUrls, setBulkImageUrls] = useState('');
    const [singleImageUrl, setSingleImageUrl] = useState('');
    const [imageUploading, setImageUploading] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [addPropertyMode, setAddPropertyMode] = useState<'choice' | 'import' | 'manual'>('choice');
    const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
    const [importUrl, setImportUrl] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    useEffect(() => {
        async function loadListedProperties() {
                    if (typeof window === 'undefined' || !currentAgent?.id) return;
                    const storedProperties = JSON.parse(localStorage.getItem('propReady_listedProperties') || '[]');
                    let apiProperties: ListedProperty[] = [];
                    try {
                        const res = await fetch(`/api/properties?agentId=${encodeURIComponent(currentAgent.id)}&published=false`, { cache: 'no-store' });
                        const data = await res.json().catch(() => ({}));
                        if (res.ok && Array.isArray(data.properties)) {
                            apiProperties = data.properties.map((p: Record<string, unknown>) => ({
                                ...p,
                                published: (p.published ?? true) as boolean,
                            })) as ListedProperty[];
                        }
                    } catch (e) {
                        console.warn('Failed to load properties from API', e);
                    }
                    const ids = new Set(apiProperties.map((p: ListedProperty) => p.id));
                    const localOnly = storedProperties
                        .filter((p: ListedProperty) => p.agentId === currentAgent.id && !ids.has(p.id))
                        .map((p: ListedProperty) => ({ ...p, published: p.published ?? true }));
                    // Sync local-only properties to database so they appear on all browsers
                    for (const p of localOnly) {
                        try {
                            const res = await fetch('/api/properties', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(p),
                            });
                            if (!res.ok) {
                                const err = await res.json().catch(() => ({}));
                                const msg = res.status === 503
                                    ? 'Database not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Netlify, then redeploy.'
                                    : err?.code === '42P01' || (err?.error && String(err.error).includes('listed_properties'))
                                        ? 'Run supabase-migration-properties.sql in Supabase SQL Editor to create the listed_properties table.'
                                        : err?.error || `Sync failed (${res.status})`;
                                if (!sessionStorage.getItem('propReady_propertySyncAlertShown')) {
                                    sessionStorage.setItem('propReady_propertySyncAlertShown', '1');
                                    alert(`Properties are not syncing to the database.\n\n${msg}\n\nThey will only appear on this browser until fixed. See DATABASE_SETUP.md.`);
                                }
                                break;
                            }
                        } catch {
                            if (!sessionStorage.getItem('propReady_propertySyncAlertShown')) {
                                sessionStorage.setItem('propReady_propertySyncAlertShown', '1');
                                alert('Properties could not sync to the database. Check your connection. They will only appear on this browser.');
                            }
                            break;
                        }
                    }
            const merged = [...apiProperties, ...localOnly];
            setListedProperties(
                merged.sort(
                    (a, b) =>
                        new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
                )
            );
        }
        loadListedProperties();
    }, [currentAgent, propertiesRefreshKey]);

    const openAddProperty = () => {
        setImproveResult(null);
        setBulkImageUrls('');
        setSingleImageUrl('');
        setImageUploadError(null);
        setAddPropertyMode('choice');
        setEditingPropertyId(null);
        setImportUrl('');
        setImportError(null);
        setPropertyForm({ ...EMPTY_PROPERTY_FORM });
        setShowPropertyModal(true);
    };

    const scheduleViewingForProperty = (property: ListedProperty) => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('propReady_schedulePropertyId', property.id);
        }
        router.push('/agents/viewings');
    };

    const handleImproveWithAI = async () => {
        setImproveLoading(true);
        setImproveResult(null);
        try {
            const res = await fetch('/api/property/improve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: propertyForm.title,
                    type: propertyForm.type,
                    bedrooms: propertyForm.bedrooms,
                    bathrooms: propertyForm.bathrooms,
                    size: propertyForm.size,
                    description: propertyForm.description,
                    features: Array.isArray(propertyForm.features) ? propertyForm.features : [],
                    imageCount: propertyForm.images?.length ?? 0,
                }),
            });
            let data: Record<string, unknown> = {};
            try {
                data = await res.json();
            } catch {
                throw new Error('Invalid response from server');
            }
            if (!res.ok) {
                const errMsg = typeof data?.error === 'string' ? data.error : 'Failed to improve listing';
                throw new Error(errMsg);
            }
            const improvedDesc = data.improvedDescription;
            const score = typeof data.listingScore === 'number' ? data.listingScore : (typeof data.listingScore === 'string' ? parseInt(data.listingScore, 10) : 0);
            const feedback = Array.isArray(data.feedback) ? data.feedback.map(String) : [];
            if (typeof improvedDesc === 'string' && improvedDesc) {
                setPropertyForm(prev => ({ ...prev, description: improvedDesc }));
            }
            setImproveResult({ listingScore: isNaN(score) ? 0 : Math.min(100, Math.max(0, score)), feedback });
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Could not improve listing. Check your connection or try again.';
            setImproveResult({ listingScore: 0, feedback: [msg] });
            alert(msg);
        } finally {
            setImproveLoading(false);
        }
    };

    const compressionOptions = {
        maxSizeMB: 1.5,
        initialQuality: 0.92,
        maxWidthOrHeight: 1920,
        useWebWorker: false, // Disabled to avoid CSP violations (eval/Function in worker creation)
    };

    const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        setImageUploading(true);
        setImageUploadError(null);
        const existing = propertyForm.images?.length ? propertyForm.images : [];
        const newUrls: string[] = [];
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;
                const compressed = await imageCompression(file, compressionOptions);
                const form = new FormData();
                form.append('file', compressed, compressed.name || file.name);
                const res = await fetch('/api/property/upload-image', { method: 'POST', body: form });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.url) {
                    newUrls.push(data.url);
                } else {
                    const msg = data?.error || (res.status === 503 ? 'Storage not configured' : `Upload failed (${res.status})`);
                    setImageUploadError(msg);
                    break;
                }
            }
            if (newUrls.length) {
                setPropertyForm(prev => ({ ...prev, images: [...existing, ...newUrls] }));
            }
        } catch (err) {
            console.error('Upload error:', err);
            setImageUploadError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setImageUploading(false);
            e.target.value = '';
        }
    };

    const handleImportFromUrl = async () => {
        const url = importUrl.trim();
        if (!url) {
            setImportError('Please paste a property listing URL');
            return;
        }
        setImportLoading(true);
        setImportError(null);
        try {
            const res = await fetch('/api/property/import-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setImportError(data?.error || `Import failed (${res.status})`);
                return;
            }
            setPropertyForm({
                title: data.title || '',
                address: data.address || '',
                type: data.type || '',
                price: data.price || '',
                bedrooms: data.bedrooms || '',
                bathrooms: data.bathrooms || '',
                size: data.size || '',
                description: data.description || '',
                images: Array.isArray(data.images) ? data.images : [],
                features: Array.isArray(data.features) ? data.features : [],
                videoUrl: data.videoUrl || '',
            });
            setAddPropertyMode('manual');
        } catch (err) {
            setImportError(err instanceof Error ? err.message : 'Import failed');
        } finally {
            setImportLoading(false);
        }
    };

    const handleAddProperty = async () => {
        if (!currentAgent?.id) return;

        const isEditing = !!editingPropertyId;
        const existing = listedProperties.find(p => p.id === editingPropertyId);

        const propertyData: ListedProperty = {
            id: isEditing ? editingPropertyId! : `property-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: propertyForm.title,
            address: propertyForm.address,
            type: propertyForm.type,
            price: parseAmountForDisplay(propertyForm.price) || 0,
            bedrooms: parseInt(propertyForm.bedrooms, 10) || 0,
            bathrooms: parseInt(propertyForm.bathrooms, 10) || 0,
            size: parseFloat(propertyForm.size) || 0,
            description: propertyForm.description,
            images: propertyForm.images?.length ? propertyForm.images : undefined,
            features: propertyForm.features?.length ? propertyForm.features : undefined,
            listingScore: isEditing ? (existing?.listingScore ?? improveResult?.listingScore) : improveResult?.listingScore,
            videoUrl: propertyForm.videoUrl?.trim() || undefined,
            agentId: currentAgent.id,
            timestamp: isEditing ? (existing?.timestamp ?? new Date().toISOString()) : new Date().toISOString(),
            published: isEditing ? (existing?.published ?? false) : false,
        };

        const storedProperties = JSON.parse(localStorage.getItem('propReady_listedProperties') || '[]');
        if (isEditing) {
            const updated = storedProperties.map((p: ListedProperty) =>
                p.id === editingPropertyId ? propertyData : p
            );
            localStorage.setItem('propReady_listedProperties', JSON.stringify(updated));
            setListedProperties(prev => prev.map(p => p.id === editingPropertyId ? propertyData : p));
            try {
                const res = await fetch('/api/properties', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editingPropertyId,
                        title: propertyData.title,
                        address: propertyData.address,
                        type: propertyData.type,
                        price: propertyData.price,
                        bedrooms: propertyData.bedrooms,
                        bathrooms: propertyData.bathrooms,
                        size: propertyData.size,
                        description: propertyData.description,
                        images: propertyData.images,
                        features: propertyData.features,
                        videoUrl: propertyData.videoUrl,
                    }),
                });
                if (!res.ok) console.warn('Property update sync failed:', res.status);
            } catch (e) {
                console.warn('Property update API sync failed', e);
            }
        } else {
            storedProperties.push(propertyData);
            localStorage.setItem('propReady_listedProperties', JSON.stringify(storedProperties));
            setListedProperties([...listedProperties, propertyData]);
            try {
                const res = await fetch('/api/properties', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(propertyData),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    console.warn('Property save to database failed:', res.status, err);
                    const msg = res.status === 503
                        ? 'Database not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Netlify environment variables, then redeploy.'
                        : err?.code === '42P01' || (err?.error && String(err.error).includes('listed_properties'))
                            ? 'Run supabase-migration-properties.sql in Supabase SQL Editor to create the listed_properties table. See DATABASE_SETUP.md.'
                            : err?.error || `Save failed (${res.status})`;
                    alert(`Property saved locally but could not sync to database.\n\n${msg}\n\nProperties will only appear on this browser until the database is set up.`);
                }
            } catch (e) {
                console.warn('Property API sync failed', e);
                alert('Property saved locally but could not sync to database. Check your connection and Netlify environment variables. Properties will only appear on this browser.');
            }
        }

        setPropertyForm({
            title: '',
            address: '',
            type: '',
            price: '',
            bedrooms: '',
            bathrooms: '',
            size: '',
            description: '',
            images: [],
            features: [],
            videoUrl: '',
        });
        setSingleImageUrl('');
        setBulkImageUrls('');
        setImproveResult(null);
        setEditingPropertyId(null);
        setShowPropertyModal(false);
    };

    const handlePublishProperty = async (property: ListedProperty) => {
        const stored = JSON.parse(localStorage.getItem('propReady_listedProperties') || '[]');
        const updated = stored.map((p: ListedProperty) =>
            p.id === property.id ? { ...p, published: true } : p
        );
        localStorage.setItem('propReady_listedProperties', JSON.stringify(updated));
        setListedProperties(prev => prev.map(p => p.id === property.id ? { ...p, published: true } : p));
        setShowViewPropertyModal(prev => prev?.id === property.id ? { ...prev, published: true } : prev);
        try {
            const res = await fetch('/api/properties', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: property.id, published: true }),
            });
            if (!res.ok) console.warn('Property publish sync failed:', res.status);
        } catch (e) {
            console.warn('Property publish API sync failed', e);
        }
    };

    const handleUnpublishProperty = async (property: ListedProperty) => {
        const stored = JSON.parse(localStorage.getItem('propReady_listedProperties') || '[]');
        const updated = stored.map((p: ListedProperty) =>
            p.id === property.id ? { ...p, published: false } : p
        );
        localStorage.setItem('propReady_listedProperties', JSON.stringify(updated));
        setListedProperties(prev => prev.map(p => p.id === property.id ? { ...p, published: false } : p));
        setShowViewPropertyModal(prev => prev?.id === property.id ? { ...prev, published: false } : prev);
        try {
            const res = await fetch('/api/properties', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: property.id, published: false }),
            });
            if (!res.ok) console.warn('Property unpublish sync failed:', res.status);
        } catch (e) {
            console.warn('Property unpublish API sync failed', e);
        }
    };

    const handleEditProperty = (property: ListedProperty) => {
        setPropertyForm({
            title: property.title || '',
            address: property.address || '',
            type: property.type || '',
            price: property.price ? String(property.price) : '',
            bedrooms: property.bedrooms ? String(property.bedrooms) : '',
            bathrooms: property.bathrooms ? String(property.bathrooms) : '',
            size: property.size ? String(property.size) : '',
            description: property.description || '',
            images: Array.isArray(property.images) ? [...property.images] : [],
            features: Array.isArray(property.features) ? [...property.features] : [],
            videoUrl: property.videoUrl || '',
        });
        setSingleImageUrl('');
        setBulkImageUrls('');
        setEditingPropertyId(property.id);
        setAddPropertyMode('manual');
        setShowViewPropertyModal(null);
        setShowPropertyModal(true);
    };

    const handleDeleteProperty = async (property: ListedProperty) => {
        if (!confirm(`Delete "${property.title}"? This cannot be undone.`)) return;
        const stored = JSON.parse(localStorage.getItem('propReady_listedProperties') || '[]');
        const updated = stored.filter((p: ListedProperty) => p.id !== property.id);
        localStorage.setItem('propReady_listedProperties', JSON.stringify(updated));
        setListedProperties(prev => prev.filter(p => p.id !== property.id));
        setShowViewPropertyModal(null);
        try {
            await fetch(`/api/properties?id=${encodeURIComponent(property.id)}`, { method: 'DELETE' });
        } catch (e) {
            console.warn('Property delete API sync failed', e);
        }
    };
    return (
        <>
            <PpraVerificationGate agent={currentAgent} />
            {showPageHeader && (
                <AgentPageHeader
                    variant="premium"
                    eyebrow="Listings"
                    title="My Listed Properties"
                    description="Manage listings, publish to buyers, and schedule viewings"
                />
            )}
            {currentAgent && isAgentPpraVerified(currentAgent) ? (
                <>
                                        <div id="properties-section" className={AGENT_CARD}>
                                            <div className={`${AGENT_CARD_HEADER} flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5`}>
                                                <div>
                                                    <h2 className="text-xl sm:text-2xl font-semibold text-charcoal tracking-tight">Your properties</h2>
                                                    <p className="text-charcoal/45 text-sm mt-2 leading-relaxed">
                                                        {listedProperties.length} listing{listedProperties.length === 1 ? '' : 's'}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={openAddProperty}
                                                    className={`${AGENT_PRIMARY_BTN} self-start sm:self-auto`}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Property
                                                </button>
                                            </div>
                                            <div className={`${AGENT_CARD_BODY} sm:px-6 sm:py-6`}>
                    
                                            {listedProperties.length === 0 ? (
                                                <div className="text-center py-16 px-4">
                                                    <div className={AGENT_EMPTY_ICON}>
                                                        <Building2 className="w-8 h-8 text-charcoal/25" />
                                                    </div>
                                                    <p className="text-charcoal font-semibold text-lg tracking-tight">No properties listed yet</p>
                                                    <p className="text-charcoal/45 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                                                        Add your first property to start connecting with buyers and sellers
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                                                    {listedProperties.map((property) => (
                                                        <div key={property.id} className="rounded-3xl overflow-hidden border border-charcoal/[0.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_6px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)] hover:border-charcoal/[0.12] transition-all duration-300 flex flex-col">
                                                            {property.images?.length && property.images[0] ? (
                                                                <div className="relative w-full aspect-[16/10] bg-charcoal/10">
                                                                    <img
                                                                        src={getProxiedImageUrl(property.images[0])}
                                                                        alt={property.title}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                    />
                                                                    {property.images.length > 1 && (
                                                                        <span className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium">
                                                                            {property.images.length} photos
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="w-full aspect-[16/10] bg-charcoal/10 flex items-center justify-center">
                                                                    <ImageIcon className="w-12 h-12 text-charcoal/30" />
                                                                </div>
                                                            )}
                                                            <div className="p-4 flex-1 flex flex-col">
                                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                                    <h3 className="text-charcoal font-semibold">{property.title}</h3>
                                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                        {!property.published && (
                                                                            <span className={`${AGENT_BADGE} bg-amber-500/10 text-amber-800 border border-amber-500/15`}>
                                                                                Draft
                                                                            </span>
                                                                        )}
                                                                        {property.listingScore != null && (
                                                                            <span className={`${AGENT_BADGE} bg-gold/[0.08] text-gold border border-gold/10`}>
                                                                                {property.listingScore}/100
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1 text-sm text-charcoal/70 mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <MapPin className="w-4 h-4 flex-shrink-0" />
                                                                        <span className="truncate">{property.address}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <DollarSign className="w-4 h-4" />
                                                                        <span>{formatCurrency(property.price)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex items-center gap-1">
                                                                            <Bed className="w-4 h-4" />
                                                                            <span>{property.bedrooms}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Bath className="w-4 h-4" />
                                                                            <span>{property.bathrooms}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Square className="w-4 h-4" />
                                                                            <span>{property.size}m²</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {property.features?.length ? (
                                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                                        {property.features.slice(0, 5).map((f) => (
                                                                            <span key={f} className="px-2 py-0.5 rounded-md bg-charcoal/5 text-charcoal/70 text-xs border border-charcoal/8">
                                                                                {f}
                                                                            </span>
                                                                        ))}
                                                                        {property.features.length > 5 && (
                                                                            <span className="text-charcoal/50 text-xs">+{property.features.length - 5}</span>
                                                                        )}
                                                                    </div>
                                                                ) : null}
                                                                {property.videoUrl ? (
                                                                    <a
                                                                        href={property.videoUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1.5 text-sm text-gold font-semibold hover:underline mb-3"
                                                                    >
                                                                        <Video className="w-4 h-4" />
                                                                        Watch video
                                                                    </a>
                                                                ) : null}
                                                                <div className="flex items-center gap-2 mt-auto">
                                                                    <button
                                                                        onClick={() => { setShowViewPropertyModal(property); setViewPropertyImageIndex(0); }}
                                                                        className={`${AGENT_SECONDARY_BTN} flex-1 h-8 px-3 text-xs`}
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                        View
                                                                    </button>
                                                                    {!property.published && (
                                                                        <button
                                                                            onClick={() => handleEditProperty(property)}
                                                                            className={`${AGENT_VIEW_BTN} h-8 px-3`}
                                                                            title="Edit draft"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDeleteProperty(property)}
                                                                        className="p-2 h-8 w-8 rounded-full border border-red-500/20 text-red-600 hover:bg-red-500/[0.06] transition"
                                                                        title="Delete property"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                    {property.published ? (
                                                                        <button
                                                                            onClick={() => handleUnpublishProperty(property)}
                                                                            className={`${AGENT_SECONDARY_BTN} flex-1 h-8 px-3 text-xs`}
                                                                        >
                                                                            Unpublish
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handlePublishProperty(property)}
                                                                            className={`${AGENT_PRIMARY_BTN} flex-1 h-8 px-3 text-xs`}
                                                                        >
                                                                            Publish
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        scheduleViewingForProperty(property);
                                                                    }}
                                                                    className={`${AGENT_VIEW_BTN} w-full h-9 mt-2`}
                                                                >
                                                                    <CalendarIcon className="w-4 h-4" />
                                                                    Schedule Viewing
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            </div>
                                        </div>
                </>
            ) : (
                <p className="text-charcoal/70 text-sm">Complete PPRA verification to list properties.</p>
            )}
                        {/* Add Property Modal */}
                        {showPropertyModal && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
                                {/* Decorative background elements */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse"></div>
                                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                                </div>
            
                                <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                                    <div className={AGENT_PANEL_HEADER}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h2 className="text-xl md:text-2xl font-semibold text-charcoal tracking-tight leading-tight">
                                                    {editingPropertyId ? 'Edit Property' : 'Add Property to PropReady'}
                                                </h2>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setShowPropertyModal(false);
                                                    setAddPropertyMode('choice');
                                                    setEditingPropertyId(null);
                                                }}
                                                className="flex-shrink-0 w-10 h-10 rounded-xl border border-charcoal/[0.08] bg-white text-charcoal/60 hover:bg-charcoal/[0.03] hover:text-charcoal transition-all duration-200 flex items-center justify-center"
                                                aria-label="Close"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
            
                                    <div className={`flex-1 overflow-y-auto ${AGENT_PANEL_BODY}`}>
            
                                    {/* Step 1: Choose how to add */}
                                    {addPropertyMode === 'choice' && (
                                        <div className="space-y-6">
                                            <p className="text-charcoal/70 text-center">How would you like to add this property?</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setAddPropertyMode('import')}
                                                    className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gold/30 bg-gold/5 hover:bg-gold/10 hover:border-gold/50 transition-all text-left"
                                                >
                                                    <Link2 className="w-12 h-12 text-gold" />
                                                    <div>
                                                        <h3 className="font-semibold text-charcoal">Import from link</h3>
                                                        <p className="text-sm text-charcoal/60 mt-1">Paste a URL from Property24, Private Property, or other listing sites. We&apos;ll extract images, description, features and more.</p>
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setAddPropertyMode('manual')}
                                                    className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-charcoal/20 bg-white hover:bg-charcoal/5 hover:border-charcoal/30 transition-all text-left"
                                                >
                                                    <FileEdit className="w-12 h-12 text-charcoal/60" />
                                                    <div>
                                                        <h3 className="font-semibold text-charcoal">Add manually</h3>
                                                        <p className="text-sm text-charcoal/60 mt-1">Enter property details yourself. Best when you have your own photos and description.</p>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    )}
            
                                    {/* Step 2a: Import from URL */}
                                    {addPropertyMode === 'import' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <button
                                                    type="button"
                                                    onClick={() => { setAddPropertyMode('choice'); setImportError(null); }}
                                                    className="text-charcoal/60 hover:text-charcoal text-sm font-medium"
                                                >
                                                    ← Back
                                                </button>
                                            </div>
                                            <div>
                                                <label className="block text-charcoal font-semibold mb-2">Paste property listing URL</label>
                                                <p className="text-charcoal/60 text-sm mb-2">Works with Property24, Private Property, RE/MAX, and most property listing websites.</p>
                                                <input
                                                    type="url"
                                                    value={importUrl}
                                                    onChange={(e) => { setImportUrl(e.target.value); setImportError(null); }}
                                                    placeholder="https://www.property24.co.za/..."
                                                    className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleImportFromUrl()}
                                                />
                                            </div>
                                            {importError && (
                                                <p className="text-red-600 text-sm flex items-center gap-1" role="alert">
                                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                    {importError}
                                                </p>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleImportFromUrl}
                                                disabled={importLoading || !importUrl.trim()}
                                                className="w-full px-6 py-3.5 bg-gold text-white font-semibold rounded-xl hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                                            >
                                                {importLoading ? (
                                                    <>Fetching listing…</>
                                                ) : (
                                                    <>Import property data</>
                                                )}
                                            </button>
                                        </div>
                                    )}
            
                                    {/* Step 2b/3: Manual form (or edit after import) */}
                                    {addPropertyMode === 'manual' && (
                                    <>
                                    <div className="flex items-center gap-2 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (editingPropertyId) {
                                                    setShowPropertyModal(false);
                                                    setEditingPropertyId(null);
                                                } else {
                                                    setAddPropertyMode('choice');
                                                }
                                            }}
                                            className="text-charcoal/60 hover:text-charcoal text-sm font-medium"
                                        >
                                            ← Back
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-charcoal font-semibold mb-2">Property Title</label>
                                            <input
                                                type="text"
                                                value={propertyForm.title}
                                                onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                                                placeholder="e.g., Modern 3-Bedroom House"
                                                className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                            />
                                        </div>
            
                                        <div>
                                            <label className="block text-charcoal font-semibold mb-2">Address</label>
                                            <input
                                                type="text"
                                                value={propertyForm.address}
                                                onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                                                placeholder="e.g., 123 Main Street, Sandton"
                                                className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                            />
                                        </div>
            
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-charcoal font-semibold mb-2">Type</label>
                                                <select
                                                    value={propertyForm.type}
                                                    onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold [&>option]:text-charcoal"
                                                >
                                                    <option value="">Select type</option>
                                                    <option value="House">House</option>
                                                    <option value="Apartment">Apartment</option>
                                                    <option value="Townhouse">Townhouse</option>
                                                    <option value="Duplex">Duplex</option>
                                                    <option value="Vacant Land">Vacant Land</option>
                                                    <option value="Commercial">Commercial</option>
                                                </select>
                                            </div>
            
                                            <div>
                                                <label className="block text-charcoal font-semibold mb-2">Price (R)</label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={propertyForm.price ? formatNumber(parseAmountForDisplay(propertyForm.price)) : ''}
                                                    onChange={(e) => {
                                                        const digits = e.target.value.replace(/\D/g, '');
                                                        setPropertyForm(prev => ({ ...prev, price: digits }));
                                                    }}
                                                    placeholder="e.g., 1,500,000"
                                                    className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                                />
                                            </div>
                                        </div>
            
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-charcoal font-semibold mb-2">Bedrooms</label>
                                                <input
                                                    type="number"
                                                    value={propertyForm.bedrooms}
                                                    onChange={(e) => setPropertyForm({ ...propertyForm, bedrooms: e.target.value })}
                                                    placeholder="3"
                                                    className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                                />
                                            </div>
            
                                            <div>
                                                <label className="block text-charcoal font-semibold mb-2">Bathrooms</label>
                                                <input
                                                    type="number"
                                                    value={propertyForm.bathrooms}
                                                    onChange={(e) => setPropertyForm({ ...propertyForm, bathrooms: e.target.value })}
                                                    placeholder="2"
                                                    className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                                />
                                            </div>
            
                                            <div>
                                                <label className="block text-charcoal font-semibold mb-2">Size (m²)</label>
                                                <input
                                                    type="number"
                                                    value={propertyForm.size}
                                                    onChange={(e) => setPropertyForm({ ...propertyForm, size: e.target.value })}
                                                    placeholder="120"
                                                    className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                                />
                                            </div>
                                        </div>
            
                                        <div>
                                            <label className="block text-charcoal font-semibold mb-2 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4" />
                                                Images
                                                {(propertyForm.images?.length ?? 0) > 0 && (
                                                    <span className="text-charcoal/60 font-normal text-sm">({propertyForm.images?.length} images)</span>
                                                )}
                                            </label>
                                            <p className="text-charcoal/60 text-sm mb-3">Add or remove images. Upload files, paste URLs, or manage imported images below.</p>
            
                                            {/* Thumbnail grid with delete */}
                                            {(propertyForm.images?.length ?? 0) > 0 && (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
                                                    {(propertyForm.images || []).map((url, idx) => (
                                                        <div key={`${idx}-${url.slice(0, 30)}`} className="relative group aspect-square rounded-lg overflow-hidden border border-charcoal/20 bg-charcoal/5">
                                                            <img
                                                                src={getProxiedImageUrl(url)}
                                                                alt={`Property image ${idx + 1}`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50" y="50" fill="%23999" text-anchor="middle" dy=".3em" font-size="12"%3EFailed%3C/text%3E%3C/svg%3E'; }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const next = (propertyForm.images || []).filter((_, i) => i !== idx);
                                                                    setPropertyForm({ ...propertyForm, images: next });
                                                                }}
                                                                className="absolute top-1 right-1 p-1.5 rounded-full bg-red-500/90 text-white hover:bg-red-600 transition opacity-90 hover:opacity-100"
                                                                aria-label="Remove image"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
            
                                            {/* Add images: upload + single URL + bulk */}
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <input
                                                    ref={imageInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleUploadImages}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => imageInputRef.current?.click()}
                                                    disabled={imageUploading}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold font-semibold hover:bg-gold/20 transition disabled:opacity-50"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    {imageUploading ? 'Compressing & uploading…' : 'Upload images'}
                                                </button>
                                                <div className="flex gap-2 flex-1 min-w-0 max-w-md">
                                                    <input
                                                        type="url"
                                                        value={singleImageUrl}
                                                        onChange={(e) => setSingleImageUrl(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const u = singleImageUrl.trim();
                                                                if (u) {
                                                                    const existing = propertyForm.images?.length ? propertyForm.images : [];
                                                                    setPropertyForm({ ...propertyForm, images: [...existing, u] });
                                                                    setSingleImageUrl('');
                                                                }
                                                            }
                                                        }}
                                                        placeholder="Paste image URL and press Enter or Add"
                                                        className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const u = singleImageUrl.trim();
                                                            if (u) {
                                                                const existing = propertyForm.images?.length ? propertyForm.images : [];
                                                                setPropertyForm({ ...propertyForm, images: [...existing, u] });
                                                                setSingleImageUrl('');
                                                            }
                                                        }}
                                                        disabled={!singleImageUrl.trim()}
                                                        className="px-3 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold font-semibold hover:bg-gold/20 transition disabled:opacity-50 shrink-0"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                            {imageUploadError && (
                                                <p className="text-red-600 text-sm mb-2" role="alert">{imageUploadError}</p>
                                            )}
                                            <details className="mt-2">
                                                <summary className="text-sm text-charcoal/70 cursor-pointer hover:text-charcoal">Paste multiple URLs (one per line)</summary>
                                                <div className="mt-2 space-y-2">
                                                    <textarea
                                                        placeholder="Paste multiple image URLs here (one per line or comma-separated)"
                                                        rows={2}
                                                        value={bulkImageUrls}
                                                        onChange={(e) => setBulkImageUrls(e.target.value)}
                                                        className="w-full px-4 py-2 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const urls = bulkImageUrls.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                                                            if (urls.length > 0) {
                                                                const existing = propertyForm.images?.length ? propertyForm.images : [];
                                                                setPropertyForm({ ...propertyForm, images: [...existing, ...urls] });
                                                                setBulkImageUrls('');
                                                            }
                                                        }}
                                                        disabled={!bulkImageUrls.trim()}
                                                        className="text-sm text-gold font-semibold hover:underline flex items-center gap-1 disabled:opacity-50 disabled:no-underline"
                                                    >
                                                        <Plus className="w-4 h-4" /> Add these URLs ({bulkImageUrls.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).length || 0})
                                                    </button>
                                                </div>
                                            </details>
                                        </div>
            
                                        <div>
                                            <label className="block text-charcoal font-semibold mb-2 flex items-center gap-2">
                                                <Video className="w-4 h-4" />
                                                Video URL
                                            </label>
                                            <p className="text-charcoal/60 text-sm mb-2">YouTube, Vimeo or any other video hosting link (optional)</p>
                                            <input
                                                type="url"
                                                value={propertyForm.videoUrl}
                                                onChange={(e) => setPropertyForm({ ...propertyForm, videoUrl: e.target.value })}
                                                placeholder="e.g. https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                                                className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                            />
                                        </div>
            
                                        <div>
                                            <label className="block text-charcoal font-semibold mb-2">Features & amenities</label>
                                            <div className="flex flex-wrap gap-2">
                                                {PROPERTY_FEATURES.map((f) => (
                                                    <label key={f} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-charcoal/20 bg-white cursor-pointer hover:border-gold/50 transition">
                                                        <input
                                                            type="checkbox"
                                                            checked={(propertyForm.features || []).includes(f)}
                                                            onChange={(e) => {
                                                                const next = e.target.checked
                                                                    ? [...(propertyForm.features || []), f]
                                                                    : (propertyForm.features || []).filter(x => x !== f);
                                                                setPropertyForm({ ...propertyForm, features: next });
                                                            }}
                                                            className="rounded border-charcoal/30 text-gold focus:ring-gold"
                                                        />
                                                        <span className="text-sm text-charcoal">{f}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
            
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-charcoal font-semibold">Description</label>
                                                <button
                                                    type="button"
                                                    onClick={handleImproveWithAI}
                                                    disabled={improveLoading}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition text-sm font-semibold disabled:opacity-50"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    {improveLoading ? 'Improving…' : 'Improve with AI'}
                                                </button>
                                            </div>
                                            {improveResult && (
                                                <div className="mb-3 p-3 rounded-lg bg-charcoal/5 border border-charcoal/10">
                                                    <p className="text-sm font-semibold text-charcoal mb-1">
                                                        Listing score: <span className="text-gold">{improveResult.listingScore}/100</span>
                                                    </p>
                                                    {improveResult.feedback.length > 0 && (
                                                        <ul className="text-sm text-charcoal/70 list-disc list-inside space-y-0.5">
                                                            {improveResult.feedback.map((tip, i) => (
                                                                <li key={i}>{tip}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                            <textarea
                                                value={propertyForm.description}
                                                onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                                                placeholder="Describe the property..."
                                                rows={4}
                                                className="w-full px-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                            />
                                        </div>
                                    </div>
                                    </>
                                    )}
            
                                    </div>
            
                                    {/* Footer - only show when in manual form */}
                                    {addPropertyMode === 'manual' && (
                                    <div className="px-8 py-6 bg-white border-t border-charcoal/10 flex items-center justify-end gap-4">
                                        <button
                                            onClick={() => setShowPropertyModal(false)}
                                            className="px-6 py-3 border border-charcoal/20 text-charcoal rounded-xl hover:bg-charcoal/5 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddProperty}
                                            className="px-8 py-3.5 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            {editingPropertyId ? 'Save changes' : 'Save as Draft'}
                                        </button>
                                    </div>
                                    )}
                                </div>
                            </div>
                        )}
            
                        {/* View Property Modal */}
                        {showViewPropertyModal && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse"></div>
                                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                                </div>
                                <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                                    <div className={AGENT_PANEL_HEADER}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h2 className="text-xl md:text-2xl font-semibold text-charcoal tracking-tight leading-tight">{showViewPropertyModal.title}</h2>
                                                <p className="text-charcoal/45 text-sm flex items-center gap-1 mt-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {showViewPropertyModal.address}
                                                </p>
                                                <span className={`${AGENT_BADGE} mt-2 ${showViewPropertyModal.published ? 'bg-emerald-500/[0.08] text-emerald-700 border border-emerald-500/15' : 'bg-amber-500/[0.08] text-amber-800 border border-amber-500/15'}`}>
                                                    {showViewPropertyModal.published ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setShowViewPropertyModal(null)}
                                                className="flex-shrink-0 w-10 h-10 rounded-xl border border-charcoal/[0.08] bg-white text-charcoal/60 hover:bg-charcoal/[0.03] hover:text-charcoal transition-all duration-200 flex items-center justify-center"
                                                aria-label="Close"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className={`flex-1 overflow-y-auto ${AGENT_PANEL_BODY} space-y-6`}>
                                        {showViewPropertyModal.images?.length ? (
                                            <div className="rounded-xl overflow-hidden border border-charcoal/10 relative">
                                                <div className="relative aspect-[16/10] bg-charcoal/10 overflow-hidden">
                                                    {showViewPropertyModal.images.map((url, i) => (
                                                        <div
                                                            key={i}
                                                            className={`absolute inset-0 transition-transform duration-300 ease-out ${
                                                                i === viewPropertyImageIndex ? 'translate-x-0 z-10' : i < viewPropertyImageIndex ? '-translate-x-full' : 'translate-x-full'
                                                            }`}
                                                        >
                                                            <img
                                                                src={getProxiedImageUrl(url)}
                                                                alt={`${showViewPropertyModal.title} - ${i + 1}`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                {showViewPropertyModal.images.length > 1 && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewPropertyImageIndex((prev) => (prev === 0 ? showViewPropertyModal.images!.length - 1 : prev - 1))}
                                                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg border border-charcoal/10 flex items-center justify-center text-charcoal hover:text-gold transition"
                                                            aria-label="Previous image"
                                                        >
                                                            <ChevronLeft className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewPropertyImageIndex((prev) => (prev === showViewPropertyModal.images!.length - 1 ? 0 : prev + 1))}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg border border-charcoal/10 flex items-center justify-center text-charcoal hover:text-gold transition"
                                                            aria-label="Next image"
                                                        >
                                                            <ChevronRight className="w-5 h-5" />
                                                        </button>
                                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                                                            {showViewPropertyModal.images.map((_, i) => (
                                                                <button
                                                                    key={i}
                                                                    type="button"
                                                                    onClick={() => setViewPropertyImageIndex(i)}
                                                                    className={`w-2 h-2 rounded-full transition-colors ${
                                                                        i === viewPropertyImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
                                                                    }`}
                                                                    aria-label={`Go to image ${i + 1}`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="absolute top-2 right-2 z-20 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium">
                                                            {viewPropertyImageIndex + 1} / {showViewPropertyModal.images.length}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="aspect-video bg-charcoal/10 rounded-xl flex items-center justify-center">
                                                <ImageIcon className="w-16 h-16 text-charcoal/30" />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-charcoal/50 text-xs font-medium mb-1">Price</p>
                                                <p className="text-charcoal font-bold">{formatCurrency(showViewPropertyModal.price)}</p>
                                            </div>
                                            <div>
                                                <p className="text-charcoal/50 text-xs font-medium mb-1">Type</p>
                                                <p className="text-charcoal font-semibold">{showViewPropertyModal.type || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-charcoal/50 text-xs font-medium mb-1">Bedrooms</p>
                                                <p className="text-charcoal font-semibold">{showViewPropertyModal.bedrooms}</p>
                                            </div>
                                            <div>
                                                <p className="text-charcoal/50 text-xs font-medium mb-1">Bathrooms</p>
                                                <p className="text-charcoal font-semibold">{showViewPropertyModal.bathrooms}</p>
                                            </div>
                                            <div>
                                                <p className="text-charcoal/50 text-xs font-medium mb-1">Size</p>
                                                <p className="text-charcoal font-semibold">{showViewPropertyModal.size} m²</p>
                                            </div>
                                            {showViewPropertyModal.listingScore != null && (
                                                <div>
                                                    <p className="text-charcoal/50 text-xs font-medium mb-1">Listing Score</p>
                                                    <p className="text-gold font-bold">{showViewPropertyModal.listingScore}/100</p>
                                                </div>
                                            )}
                                        </div>
                                        {showViewPropertyModal.description && (
                                            <div>
                                                <p className="text-charcoal/50 text-xs font-medium mb-2">Description</p>
                                                <p className="text-charcoal/80 text-sm leading-relaxed whitespace-pre-wrap">{showViewPropertyModal.description}</p>
                                            </div>
                                        )}
                                        {showViewPropertyModal.features?.length ? (
                                            <div>
                                                <p className="text-charcoal/50 text-xs font-medium mb-2">Features</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {showViewPropertyModal.features.map((f) => (
                                                        <span key={f} className="px-3 py-1 rounded-full bg-gold/10 text-gold text-sm font-medium">{f}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                        {showViewPropertyModal.videoUrl && (
                                            <a href={showViewPropertyModal.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gold font-semibold hover:underline">
                                                <Video className="w-4 h-4" />
                                                Watch video
                                            </a>
                                        )}
                                    </div>
                                    <div className="px-8 py-6 bg-white border-t border-charcoal/10 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditProperty(showViewPropertyModal)}
                                                className="px-4 py-2 border border-charcoal/20 text-charcoal rounded-xl hover:bg-charcoal/5 transition text-sm font-semibold flex items-center gap-2"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProperty(showViewPropertyModal)}
                                                className="px-4 py-2 border border-red-500/30 text-red-600 rounded-xl hover:bg-red-500/10 transition text-sm font-semibold"
                                            >
                                                Delete
                                            </button>
                                            {showViewPropertyModal.published ? (
                                                <button
                                                    onClick={() => handleUnpublishProperty(showViewPropertyModal)}
                                                    className="px-4 py-2 border border-charcoal/20 text-charcoal rounded-xl hover:bg-charcoal/5 transition text-sm font-semibold"
                                                >
                                                    Unpublish
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handlePublishProperty(showViewPropertyModal)}
                                                    className="px-6 py-2 bg-gold text-white rounded-xl hover:bg-gold-600 transition text-sm font-semibold"
                                                >
                                                    Publish
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                scheduleViewingForProperty(showViewPropertyModal); setShowViewPropertyModal(null);
                                            }}
                                            className="px-6 py-2 bg-gold/20 text-gold border border-gold/40 rounded-xl hover:bg-gold/30 transition text-sm font-semibold flex items-center gap-2"
                                        >
                                            <CalendarIcon className="w-4 h-4" />
                                            Schedule Viewing
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
        </>
    );
}
