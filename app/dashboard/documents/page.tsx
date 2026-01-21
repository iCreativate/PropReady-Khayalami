'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, FileText, Download, Upload, CheckCircle, AlertCircle, Calendar, X, Building2, Star, Phone, ExternalLink, Trophy, Briefcase, Clipboard } from 'lucide-react';
import MobileNav from '@/components/MobileNav';

interface Document {
    id: string;
    name: string;
    type: 'pre-qualification' | 'id' | 'income' | 'bank-statement' | 'other';
    status: 'uploaded' | 'pending' | 'verified';
    uploadedAt: string;
    size?: string;
}

export default function DocumentsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string>('');
    const [selectedOriginator, setSelectedOriginator] = useState<string>('');

    const bondOriginators = [
        {
            id: 'betterbond',
            name: 'BetterBond',
            description: 'South Africa\'s leading bond originator',
            rating: '4.8/5',
            features: ['Free service', 'Multiple bank comparisons', 'Expert guidance'],
            phone: '0800007111',
            website: 'https://www.betterbond.co.za',
            icon: Trophy
        },
        {
            id: 'ooba',
            name: 'Ooba',
            description: 'Compare deals from 20+ banks',
            rating: '4.7/5',
            features: ['No cost to you', 'Fast approval', 'Dedicated consultant'],
            phone: '0860006622',
            website: 'https://www.ooba.co.za',
            icon: Home
        },
        {
            id: 'multinet',
            name: 'MultiNET Home Loans',
            description: 'Personalized home loan solutions',
            rating: '4.6/5',
            features: ['Free pre-approval', 'Best rates guaranteed', '24/7 support'],
            phone: '0861545444',
            website: 'https://www.multinet.co.za',
            icon: Briefcase
        },
        {
            id: 'mortgageplus',
            name: 'Mortgage Plus',
            description: 'Expert bond origination services',
            rating: '4.5/5',
            features: ['Professional service', 'Competitive rates', 'Quick processing'],
            phone: '0861000000',
            website: 'https://www.mortgageplus.co.za',
            icon: Clipboard
        }
    ];

    useEffect(() => {
        // Check if user is logged in and load documents
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('propReady_currentUser');
            if (!userData) {
                router.push('/login');
            } else {
                // Load documents from localStorage
                const storedDocs = localStorage.getItem('propReady_documents');
                if (storedDocs) {
                    setDocuments(JSON.parse(storedDocs));
                }
                
                // Load selected originator
                const storedOriginator = localStorage.getItem('propReady_selectedOriginator');
                if (storedOriginator) {
                    setSelectedOriginator(storedOriginator);
                }
                
                setIsLoading(false);
            }
        }
    }, [router]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleFileUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        if (!selectedOriginator) {
            setUploadError('Please select a bond originator first before uploading documents.');
            return;
        }

        setUploadError('');
        const newDocs: Document[] = [];

        Array.from(files).forEach((file) => {
            // Validate file type
            const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                setUploadError(`Invalid file type: ${file.name}. Please upload PDF, JPG, or PNG files only.`);
                return;
            }

            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                setUploadError(`File too large: ${file.name}. Maximum size is 10MB.`);
                return;
            }

            // Determine document type based on filename
            let docType: Document['type'] = 'other';
            const fileName = file.name.toLowerCase();
            if (fileName.includes('id') || fileName.includes('passport') || fileName.includes('identity')) {
                docType = 'id';
            } else if (fileName.includes('payslip') || fileName.includes('salary') || fileName.includes('income')) {
                docType = 'income';
            } else if (fileName.includes('bank') || fileName.includes('statement')) {
                docType = 'bank-statement';
            } else if (fileName.includes('pre-qual') || fileName.includes('prequal')) {
                docType = 'pre-qualification';
            }

            const newDoc: Document = {
                id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: docType,
            status: 'uploaded',
                uploadedAt: new Date().toISOString(),
                size: formatFileSize(file.size)
            };

            newDocs.push(newDoc);
        });

        if (newDocs.length > 0) {
            const updatedDocs = [...documents, ...newDocs];
            setDocuments(updatedDocs);
            localStorage.setItem('propReady_documents', JSON.stringify(updatedDocs));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e.target.files);
        e.target.value = ''; // Reset input
    };

    const handleDelete = (docId: string) => {
        const updatedDocs = documents.filter(doc => doc.id !== docId);
        setDocuments(updatedDocs);
        localStorage.setItem('propReady_documents', JSON.stringify(updatedDocs));
    };

    const handleOriginatorSelect = (originatorId: string) => {
        setSelectedOriginator(originatorId);
        localStorage.setItem('propReady_selectedOriginator', originatorId);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-charcoal/70">Loading...</p>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status: Document['status']) => {
        const badges = {
            verified: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle, label: 'Verified' },
            uploaded: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Upload, label: 'Uploaded' },
            pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: AlertCircle, label: 'Pending Review' }
        };

        const badge = badges[status];
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const getTypeLabel = (type: Document['type']) => {
        const labels = {
            'pre-qualification': 'Pre-Qualification',
            'id': 'ID Document',
            'income': 'Proof of Income',
            'bank-statement': 'Bank Statement',
            'other': 'Other'
        };
        return labels[type];
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-charcoal text-xl font-bold">PropReady</span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/search" className="text-charcoal/90 hover:text-charcoal transition">
                                Properties
                            </Link>
                            <Link href="/learn" className="text-charcoal/90 hover:text-charcoal transition">
                                Learning Center | Buyers
                            </Link>
                            <Link
                                href="/sellers"
                                className="px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition"
                            >
                                For Sellers
                            </Link>
                            <Link href="/calculator" className="text-charcoal/90 hover:text-charcoal transition">
                                Bond Calculator
                            </Link>
                            <Link href="/dashboard" className="text-charcoal/90 hover:text-charcoal transition">
                                Dashboard
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <MobileNav
                            links={[
                                { href: '/search', label: 'Properties' },
                                { href: '/learn', label: 'Learning Center | Buyers' },
                                { href: '/sellers', label: 'For Sellers', isButton: true },
                                { href: '/calculator', label: 'Bond Calculator' },
                                { href: '/dashboard', label: 'Dashboard' },
                            ]}
                        />
                        <Link
                            href="/dashboard"
                            className="hidden sm:flex items-center space-x-2 text-charcoal/90 hover:text-charcoal transition"
                        >
                            <span>Back to Dashboard</span>
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative px-4 pt-24 pb-8">
                <div className="container mx-auto max-w-5xl relative z-10">
                    {/* Page Header */}
                    <div className="premium-card rounded-2xl overflow-hidden border border-charcoal/10 shadow-2xl mb-8">
                        <div className="relative px-8 py-7 bg-gradient-to-r from-gold via-gold/90 to-gold/70 text-charcoal">
                            <div className="absolute inset-0 opacity-15 pointer-events-none">
                                <div className="absolute -top-10 -right-16 w-64 h-64 bg-white rounded-full blur-3xl" />
                                <div className="absolute -bottom-10 -left-16 w-64 h-64 bg-white rounded-full blur-3xl" />
                            </div>
                            <div className="relative flex items-start justify-between gap-6">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">My Documents</h1>
                                    <p className="text-white/95 text-base md:text-lg max-w-2xl drop-shadow-sm">
                                        Upload your FICA documents to get prequalified with BetterBond and other bond originators.
                                    </p>
                                </div>
                                <div className="hidden sm:flex items-center gap-3">
                                    <div className="px-4 py-2 rounded-xl bg-white/25 backdrop-blur border border-white/30">
                                        <p className="text-xs font-semibold text-charcoal/70">Uploaded</p>
                                        <p className="text-lg font-extrabold text-charcoal">{documents.length}</p>
                                    </div>
                                    <div className="px-4 py-2 rounded-xl bg-white/25 backdrop-blur border border-white/30">
                                        <p className="text-xs font-semibold text-charcoal/70">Originator</p>
                                        <p className="text-sm font-bold text-charcoal truncate max-w-[10rem]">
                                            {selectedOriginator ? (bondOriginators.find(o => o.id === selectedOriginator)?.name || 'Selected') : 'Not selected'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-5 bg-gradient-to-b from-white to-charcoal/5">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gold/15 rounded-xl flex items-center justify-center flex-shrink-0 border border-gold/20">
                                    <FileText className="w-6 h-6 text-gold" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-charcoal font-bold text-lg mb-1">Get prequalified faster</h3>
                                    <p className="text-charcoal/70 leading-relaxed">
                                        Your documents are required by law (FICA) to verify your identity and financial status for home loan applications.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left column: choose originator + upload */}
                        <div className="lg:col-span-7 space-y-6">
                            {/* Bond Originator Selection */}
                            <div className="premium-card rounded-2xl overflow-hidden border border-charcoal/10 shadow-xl">
                                <div className="px-6 py-5 bg-gradient-to-r from-gold/15 via-gold/10 to-transparent border-b border-charcoal/10">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="w-6 h-6 text-gold" />
                                        <h2 className="text-2xl font-extrabold text-charcoal">Choose Your Bond Originator</h2>
                                    </div>
                                    <p className="text-charcoal/70 mt-3">
                                        Select a bond originator to send your documents to for prequalification. All services are free.
                                    </p>
                                </div>

                                <div className="p-6 bg-gradient-to-b from-white to-charcoal/5">
                                    <div className="grid grid-cols-1 gap-4">
                                        {bondOriginators.map((originator) => (
                                            <button
                                                key={originator.id}
                                                onClick={() => handleOriginatorSelect(originator.id)}
                                                className={`relative p-5 rounded-2xl border transition-all text-left ${
                                                    selectedOriginator === originator.id
                                                        ? 'border-gold bg-gold/10 shadow-lg'
                                                        : 'border-charcoal/10 bg-white hover:border-gold/40 hover:bg-gold/5'
                                                }`}
                                            >
                                                {selectedOriginator === originator.id && (
                                                    <div className="absolute top-3 right-3">
                                                        <CheckCircle className="w-6 h-6 text-gold" />
                                                    </div>
                                                )}

                                                <div className="flex items-start gap-4">
                                                    <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gold/20">
                                                        {(() => {
                                                            const IconComponent = originator.icon;
                                                            return <IconComponent className="w-7 h-7 text-gold" />;
                                                        })()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <h3 className="text-charcoal font-bold text-lg">{originator.name}</h3>
                                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-gold/20 rounded-full">
                                                                <Star className="w-3 h-3 text-gold fill-gold" />
                                                                <span className="text-charcoal text-xs font-semibold">{originator.rating}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-charcoal/60 text-sm mb-3">{originator.description}</p>

                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {originator.features.map((feature, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2 py-1 rounded-full bg-charcoal/5 border border-charcoal/10 text-charcoal text-xs font-medium"
                                                                >
                                                                    {feature}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-charcoal/60">
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="w-3 h-3" />
                                                                <span>{originator.phone}</span>
                                                            </div>
                                                            <a
                                                                href={originator.website}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex items-center gap-1 hover:text-gold transition"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                                <span>Visit Website</span>
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {selectedOriginator && (
                                        <div className="mt-6 p-4 bg-gold/10 border border-gold/30 rounded-2xl">
                                            <div className="flex items-center gap-2 text-charcoal">
                                                <CheckCircle className="w-5 h-5 text-gold" />
                                                <p className="font-semibold">
                                                    Selected:{' '}
                                                    <span className="text-gold">
                                                        {bondOriginators.find(o => o.id === selectedOriginator)?.name}
                                                    </span>
                                                </p>
                                            </div>
                                            <p className="text-charcoal/70 text-sm mt-2 ml-7">
                                                Your documents will be sent to your selected originator for prequalification once uploaded.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Upload Section */}
                            <div className="premium-card rounded-2xl overflow-hidden border border-charcoal/10 shadow-xl">
                                <div className="px-6 py-5 bg-gradient-to-r from-gold/15 via-gold/10 to-transparent border-b border-charcoal/10">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl font-extrabold text-charcoal flex items-center gap-3">
                                                <Upload className="w-6 h-6 text-gold" />
                                                Upload FICA Documents
                                            </h2>
                                            {selectedOriginator && (
                                                <p className="text-charcoal/60 text-sm mt-2">
                                                    Documents will be sent to{' '}
                                                    <span className="font-semibold text-gold">
                                                        {bondOriginators.find(o => o.id === selectedOriginator)?.name}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gradient-to-b from-white to-charcoal/5">
                                    {!selectedOriginator && (
                                        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                            <p className="text-yellow-700 text-sm flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                Please select a bond originator first before uploading documents.
                                            </p>
                                        </div>
                                    )}

                                    {uploadError && (
                                        <div className="mb-4 p-3 bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/30 rounded-xl">
                                            <p className="text-red-600 text-sm flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                {uploadError}
                                            </p>
                                        </div>
                                    )}

                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                                            isDragging ? 'border-gold bg-gold/5' : 'border-charcoal/20 hover:border-gold/50'
                                        }`}
                                    >
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/70 border border-charcoal/10 flex items-center justify-center">
                                            <Upload className={`w-8 h-8 ${isDragging ? 'text-gold' : 'text-charcoal/50'}`} />
                                        </div>
                                        <p className="text-charcoal/70 mb-2">Drag and drop files here, or</p>
                                        <label className="inline-flex items-center justify-center px-6 py-2.5 bg-gold text-white font-semibold rounded-xl hover:bg-gold/90 transition cursor-pointer shadow-sm">
                                            Browse Files
                                            <input
                                                type="file"
                                                multiple
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileInput}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-charcoal/50 text-sm mt-4">
                                            Supported formats: PDF, JPG, PNG (Max 10MB per file)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right column: documents + requirements */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Documents List */}
                            <div className="premium-card rounded-2xl overflow-hidden border border-charcoal/10 shadow-xl">
                                <div className="px-6 py-5 bg-gradient-to-r from-charcoal/5 via-charcoal/0 to-transparent border-b border-charcoal/10">
                                    <h2 className="text-2xl font-extrabold text-charcoal flex items-center gap-3">
                                        <FileText className="w-6 h-6 text-gold" />
                                        Your Documents
                                    </h2>
                                </div>

                                <div className="p-6 bg-gradient-to-b from-white to-charcoal/5">
                                    {documents.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 rounded-2xl bg-charcoal/5 border border-charcoal/10 flex items-center justify-center mx-auto mb-4">
                                                <FileText className="w-8 h-8 text-charcoal/30" />
                                            </div>
                                            <p className="text-charcoal/70 text-lg font-semibold">No documents uploaded yet</p>
                                            <p className="text-charcoal/50 text-sm mt-2">Upload your first document to get started.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {documents.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className="bg-white rounded-2xl p-5 border border-charcoal/10 hover:border-gold/40 transition-all shadow-sm"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                                            <div className="w-12 h-12 bg-gold/15 rounded-xl flex items-center justify-center flex-shrink-0 border border-gold/20">
                                                                <FileText className="w-6 h-6 text-gold" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                                    <h3 className="text-charcoal font-semibold text-base md:text-lg truncate" title={doc.name}>
                                                                        {doc.name}
                                                                    </h3>
                                                                    {getStatusBadge(doc.status)}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-charcoal/70 text-sm">
                                                                    <span>{getTypeLabel(doc.type)}</span>
                                                                    {doc.size && <span>• {doc.size}</span>}
                                                                    <span>• Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <button
                                                                onClick={() => {
                                                                    // In production, this would download the actual file
                                                                    const link = document.createElement('a');
                                                                    link.href = '#'; // Would be actual file URL
                                                                    link.download = doc.name;
                                                                    link.click();
                                                                }}
                                                                className="p-2.5 rounded-xl bg-charcoal/5 hover:bg-charcoal/10 transition text-charcoal border border-charcoal/10"
                                                                title="Download"
                                                            >
                                                                <Download className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(doc.id)}
                                                                className="p-2.5 rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 hover:from-red-500/20 hover:to-red-500/10 transition text-red-600 border border-red-500/30"
                                                                title="Delete"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* FICA Requirements */}
                            <div className="premium-card rounded-2xl overflow-hidden border border-charcoal/10 shadow-xl">
                                <div className="px-6 py-5 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border-b border-charcoal/10">
                                    <div className="flex items-start gap-3">
                                        <Building2 className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="text-charcoal font-extrabold text-xl mb-1">FICA Document Requirements</h3>
                                            <p className="text-charcoal/70 text-sm">
                                                These documents are required by law (FICA) and needed by bond originators for prequalification:
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gradient-to-b from-white to-charcoal/5">
                                    <ul className="space-y-3 text-charcoal/80">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-semibold text-charcoal">Valid South African ID Document</span>
                                                <p className="text-sm text-charcoal/60 mt-1">
                                                    A clear copy of your ID book or smart ID card (both sides if applicable)
                                                </p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-semibold text-charcoal">Proof of Residence</span>
                                                <p className="text-sm text-charcoal/60 mt-1">
                                                    Utility bill, bank statement, or municipal account (not older than 3 months) showing your name and address
                                                </p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-semibold text-charcoal">Proof of Income</span>
                                                <p className="text-sm text-charcoal/60 mt-1">
                                                    Latest 3 months payslips (if employed) or 3 months bank statements showing regular income deposits
                                                </p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-semibold text-charcoal">Bank Statements</span>
                                                <p className="text-sm text-charcoal/60 mt-1">
                                                    Latest 3 months bank statements from your primary account (must show your name and account number)
                                                </p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-semibold text-charcoal">Additional Documents (if applicable)</span>
                                                <p className="text-sm text-charcoal/60 mt-1">
                                                    Marriage certificate (if married), proof of divorce (if applicable), or any other documents requested by the bond originator
                                                </p>
                                            </div>
                                        </li>
                                    </ul>

                                    <div className="mt-6 pt-4 border-t border-blue-500/20">
                                        <p className="text-charcoal/70 text-sm">
                                            <strong className="text-charcoal">Note:</strong> All documents must be clear, legible, and not older than 3 months (except ID).
                                            Once uploaded, these documents will be securely shared with your chosen bond originator for prequalification.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
                </div>
            </main>
        </div>
    );
}

