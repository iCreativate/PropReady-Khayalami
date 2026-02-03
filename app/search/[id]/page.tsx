'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Home, MapPin, Bed, Bath, Square, Video, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

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
        try {
            const stored = JSON.parse(localStorage.getItem('propReady_listedProperties') || '[]');
            const found = stored.find((p: any) => String(p.id) === id);
            if (found && found.published !== false) {
                setImageIndex(0);
                setProperty({
                    id: String(found.id),
                    title: String(found.title || 'Listed Property'),
                    address: String(found.address || ''),
                    type: String(found.type || 'Property'),
                    price: Number(found.price || 0),
                    bedrooms: Number(found.bedrooms || 0),
                    bathrooms: Number(found.bathrooms || 0),
                    size: Number(found.size || 0),
                    description: found.description ? String(found.description) : undefined,
                    images: Array.isArray(found.images) ? found.images : undefined,
                    features: Array.isArray(found.features) ? found.features : undefined,
                    videoUrl: found.videoUrl ? String(found.videoUrl) : undefined,
                    agentId: found.agentId ? String(found.agentId) : undefined,
                    timestamp: found.timestamp ? String(found.timestamp) : undefined,
                });
            }
        } catch {
            setProperty(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-charcoal/70">Loading...</p>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <Home className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-charcoal mb-2">Property not found</h1>
                    <p className="text-charcoal/70 mb-6">This property may have been removed or is no longer available.</p>
                    <Link
                        href="/search"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Properties
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href="/search"
                        className="flex items-center gap-2 text-charcoal hover:text-charcoal/80 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Properties</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                            <Home className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-charcoal text-xl font-bold">PropReady</span>
                    </div>
                    <Link
                        href="/dashboard"
                        className="px-4 py-2 rounded-lg bg-gold text-white font-semibold hover:bg-gold-600 transition"
                    >
                        My Dashboard
                    </Link>
                </nav>
            </header>

            <main className="pt-24 pb-12 px-4">
                <div className="container mx-auto max-w-5xl">
                    {/* Image slider */}
                    <div className="mb-8 rounded-2xl overflow-hidden border border-charcoal/10 shadow-xl relative">
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
                                                src={url}
                                                alt={`${property.title} - ${i + 1}`}
                                                className="w-full h-full object-cover"
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
                        <div className="p-4 rounded-xl bg-charcoal/5 border border-charcoal/10">
                            <p className="text-charcoal/50 text-sm mb-1">Type</p>
                            <p className="text-charcoal font-semibold">{property.type}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-charcoal/5 border border-charcoal/10 flex items-center gap-2">
                            <Bed className="w-5 h-5 text-gold" />
                            <div>
                                <p className="text-charcoal/50 text-sm">Bedrooms</p>
                                <p className="text-charcoal font-semibold">{property.bedrooms}</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-charcoal/5 border border-charcoal/10 flex items-center gap-2">
                            <Bath className="w-5 h-5 text-gold" />
                            <div>
                                <p className="text-charcoal/50 text-sm">Bathrooms</p>
                                <p className="text-charcoal font-semibold">{property.bathrooms}</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-charcoal/5 border border-charcoal/10 flex items-center gap-2">
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
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gold/10 text-gold border border-gold/30 rounded-xl font-semibold hover:bg-gold/20 transition"
                            >
                                <Video className="w-5 h-5" />
                                Watch video tour
                            </a>
                        </div>
                    )}

                    {/* CTA - Contact agent */}
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20">
                        <h2 className="text-xl font-bold text-charcoal mb-2">Interested in this property?</h2>
                        <p className="text-charcoal/70 mb-6">Complete the quiz to get pre-qualified and connect with verified agents who can arrange a viewing.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/quiz"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-white font-semibold rounded-xl hover:bg-gold-600 transition shadow-lg"
                            >
                                Get Pre-Qualified
                            </Link>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-8 py-4 border border-charcoal/20 text-charcoal font-semibold rounded-xl hover:bg-charcoal/5 transition"
                            >
                                My Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
