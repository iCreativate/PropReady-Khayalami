'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Home, MapPin, Bed, Bath, Square, Video, ChevronLeft, ChevronRight } from 'lucide-react';
import BuyerPortalShell from '@/components/BuyerPortalShell';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import PortalLoading from '@/components/PortalLoading';
import {
    PORTAL_CARD,
    PORTAL_PAGE_CONTAINER,
    PORTAL_PRIMARY_BTN,
    PORTAL_SECONDARY_BTN,
} from '@/lib/portal-ui';
import { formatCurrency } from '@/lib/currency';
import { getProxiedImageUrl } from '@/lib/image-proxy';

interface Property {
    id: string;
    title: string;
    address: string;
    type: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    size: number;
    description?: string;
    images?: string[];
    features?: string[];
    videoUrl?: string;
    agentId?: string;
    timestamp?: string;
}

export default function PropertyDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageIndex, setImageIndex] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined' || !id) return;
        const toProperty = (p: any): Property => ({
            id: String(p.id),
            title: String(p.title || 'Listed Property'),
            address: String(p.address || ''),
            type: String(p.type || 'Property'),
            price: Number(p.price || 0),
            bedrooms: Number(p.bedrooms || 0),
            bathrooms: Number(p.bathrooms || 0),
            size: Number(p.size || 0),
            description: p.description ? String(p.description) : undefined,
            images: Array.isArray(p.images) ? p.images : undefined,
            features: Array.isArray(p.features) ? p.features : undefined,
            videoUrl: p.videoUrl ? String(p.videoUrl) : undefined,
            agentId: p.agentId ? String(p.agentId) : undefined,
            timestamp: p.timestamp ? String(p.timestamp) : undefined,
        });
        async function loadProperty() {
            try {
                const res = await fetch(`/api/properties?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
                const data = await res.json().catch(() => ({}));
                if (res.ok && Array.isArray(data.properties) && data.properties.length > 0) {
                    const found = data.properties[0];
                    setImageIndex(0);
                    setProperty(toProperty(found));
                    return;
                }
            } catch (e) {
                console.warn('Failed to load property from API', e);
            }
            const stored = JSON.parse(localStorage.getItem('propReady_listedProperties') || '[]');
            const found = stored.find((p: any) => String(p.id) === id);
            if (found && found.published !== false) {
                setImageIndex(0);
                setProperty(toProperty(found));
            } else {
                setProperty(null);
            }
        }
        loadProperty().finally(() => setLoading(false));
    }, [id]);

    const publicChrome = (
        <PublicSiteHeader
            backHref="/search"
            backLabel="Back to Properties"
            showDesktopNav={false}
            ctaHref="/dashboard"
            ctaLabel="My Dashboard"
            mobileLinks={[{ href: '/dashboard', label: 'My Dashboard', isButton: true }]}
        />
    );

    if (loading) {
        return (
            <BuyerPortalShell activePage="properties" title="Property" publicChrome={publicChrome}>
                <PortalLoading variant="inline" message="Loading property…" />
            </BuyerPortalShell>
        );
    }

    if (!property) {
        return (
            <BuyerPortalShell activePage="properties" title="Property" publicChrome={publicChrome}>
                <div className="flex items-center justify-center px-4 py-16">
                    <div className="text-center max-w-md">
                        <Home className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-charcoal mb-2">Property not found</h1>
                        <p className="text-charcoal/70 mb-6">This property may have been removed or is no longer available.</p>
                        <Link href="/search" className={PORTAL_PRIMARY_BTN}>
                            <ArrowLeft className="w-4 h-4" />
                            Back to Properties
                        </Link>
                    </div>
                </div>
            </BuyerPortalShell>
        );
    }

    return (
        <BuyerPortalShell activePage="properties" title={property.title} publicChrome={publicChrome}>
            <div className={PORTAL_PAGE_CONTAINER}>
                    {/* Image slider */}
                    <div className={`mb-8 ${PORTAL_CARD} relative`}>
                        {property.images?.length ? (
                            <>
                                <div className="relative aspect-[16/10] bg-charcoal/10 overflow-hidden">
                                    {property.images.map((url, i) => (
                                        <div
                                            key={i}
                                            className={`absolute inset-0 transition-transform duration-300 ease-out ${
                                                i === imageIndex ? 'translate-x-0 z-10' : i < imageIndex ? '-translate-x-full' : 'translate-x-full'
                                            }`}
                                        >
                                            <img
                                                src={getProxiedImageUrl(url)}
                                                alt={`${property.title} - ${i + 1}`}
                                                className="w-full h-full object-cover gallery-zoom"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                {property.images.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setImageIndex((prev) => (prev === 0 ? property.images!.length - 1 : prev - 1))}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg border border-charcoal/10 flex items-center justify-center text-charcoal hover:text-gold transition"
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setImageIndex((prev) => (prev === property.images!.length - 1 ? 0 : prev + 1))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg border border-charcoal/10 flex items-center justify-center text-charcoal hover:text-gold transition"
                                            aria-label="Next image"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                                            {property.images.map((_, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setImageIndex(i)}
                                                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                                        i === imageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
                                                    }`}
                                                    aria-label={`Go to image ${i + 1}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="absolute top-3 right-3 z-20 px-2 py-1 rounded bg-black/60 text-white text-sm font-medium">
                                            {imageIndex + 1} / {property.images.length}
                                        </span>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="aspect-[16/10] bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                                <Home className="w-24 h-24 text-gold/40" />
                            </div>
                        )}
                    </div>

                    {/* Title & price */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-2">{property.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-charcoal/70">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {property.address}
                            </span>
                            {property.timestamp && (
                                <span>Listed {new Date(property.timestamp).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}</span>
                            )}
                        </div>
                        <p className="text-3xl font-bold text-gold mt-4">{formatCurrency(property.price)}</p>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className={`${PORTAL_CARD} p-4`}>
                            <p className="text-charcoal/50 text-sm mb-1">Type</p>
                            <p className="text-charcoal font-semibold">{property.type}</p>
                        </div>
                        <div className={`${PORTAL_CARD} p-4 flex items-center gap-2`}>
                            <Bed className="w-5 h-5 text-gold" />
                            <div>
                                <p className="text-charcoal/50 text-sm">Bedrooms</p>
                                <p className="text-charcoal font-semibold">{property.bedrooms}</p>
                            </div>
                        </div>
                        <div className={`${PORTAL_CARD} p-4 flex items-center gap-2`}>
                            <Bath className="w-5 h-5 text-gold" />
                            <div>
                                <p className="text-charcoal/50 text-sm">Bathrooms</p>
                                <p className="text-charcoal font-semibold">{property.bathrooms}</p>
                            </div>
                        </div>
                        <div className={`${PORTAL_CARD} p-4 flex items-center gap-2`}>
                            <Square className="w-5 h-5 text-gold" />
                            <div>
                                <p className="text-charcoal/50 text-sm">Size</p>
                                <p className="text-charcoal font-semibold">{property.size} m²</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {property.description && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-charcoal mb-4">Description</h2>
                            <p className="text-charcoal/80 leading-relaxed whitespace-pre-wrap">{property.description}</p>
                        </div>
                    )}

                    {/* Features */}
                    {property.features?.length ? (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-charcoal mb-4">Features</h2>
                            <div className="flex flex-wrap gap-2">
                                {property.features.map((f) => (
                                    <span key={f} className="px-4 py-2 rounded-full bg-gold/10 text-gold font-medium">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* Video */}
                    {property.videoUrl && (
                        <div className="mb-8">
                            <a
                                href={property.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={PORTAL_SECONDARY_BTN}
                            >
                                <Video className="w-5 h-5" />
                                Watch video tour
                            </a>
                        </div>
                    )}

                    {/* CTA - Contact agent */}
                    <div className={`${PORTAL_CARD} p-8 bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20`}>
                        <h2 className="text-xl font-bold text-charcoal mb-2">Interested in this property?</h2>
                        <p className="text-charcoal/70 mb-6">Complete the quiz to get pre-qualified and connect with verified agents who can arrange a viewing.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/quiz" className={PORTAL_PRIMARY_BTN}>
                                Get Pre-Qualified
                            </Link>
                            <Link href="/dashboard" className={PORTAL_SECONDARY_BTN}>
                                My Dashboard
                            </Link>
                        </div>
                    </div>
            </div>
        </BuyerPortalShell>
    );
}
