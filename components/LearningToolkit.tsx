"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, FileText, Download, X, Eye, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface ToolkitItem {
    id: string;
    title: string;
    description: string;
    type: 'document' | 'checklist' | 'template';
    content: React.ReactNode;
}

interface LearningToolkitProps {
    items: ToolkitItem[];
}

export default function LearningToolkit({ items }: LearningToolkitProps) {
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [viewingItem, setViewingItem] = useState<ToolkitItem | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const toggleExpand = (itemId: string) => {
        setExpandedItem(expandedItem === itemId ? null : itemId);
    };

    const openViewer = (item: ToolkitItem) => {
        setViewingItem(item);
    };

    const closeViewer = () => {
        setViewingItem(null);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'document':
                return <FileText className="w-5 h-5" />;
            case 'checklist':
                return <FileText className="w-5 h-5" />;
            case 'template':
                return <FileText className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'document':
                return 'Document';
            case 'checklist':
                return 'Checklist';
            case 'template':
                return 'Template';
            default:
                return 'Resource';
        }
    };

    if (items.length === 0) return null;

    return (
        <>
            <div className="mt-16 pt-12 border-t border-charcoal/10">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl flex items-center justify-center border border-gold/20 shadow-lg">
                            <Briefcase className="w-7 h-7 text-gold" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-charcoal mb-1">Toolkit</h2>
                        <p className="text-charcoal/50 text-sm">Interactive resources at your fingertips</p>
                    </div>
                </div>
                <p className="text-charcoal/60 mb-8 text-base leading-relaxed max-w-3xl">
                    Essential resources, templates, and checklists to help you on your home buying journey. 
                    Click <span className="text-gold font-semibold">View</span> to explore each resource in detail.
                </p>

                <div className="space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="group premium-card rounded-2xl border border-charcoal/10 overflow-hidden hover:border-gold/30 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-charcoal/5"
                        >
                            <div
                                className="p-6 cursor-pointer hover:bg-gradient-to-r hover:from-gold/5 hover:to-transparent transition-all duration-300"
                                onClick={() => toggleExpand(item.id)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                                        <div className="w-14 h-14 bg-gradient-to-br from-gold/20 to-gold/10 rounded-xl flex items-center justify-center flex-shrink-0 text-gold border border-gold/20 group-hover:scale-110 group-hover:from-gold/30 group-hover:to-gold/20 transition-transform duration-300">
                                            {getTypeIcon(item.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h3 className="text-xl font-bold text-charcoal group-hover:text-gold transition-colors">{item.title}</h3>
                                                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 text-gold text-xs font-semibold whitespace-nowrap">
                                                    {getTypeLabel(item.type)}
                                                </span>
                                            </div>
                                            <p className="text-charcoal/60 text-sm leading-relaxed">{item.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openViewer(item);
                                            }}
                                            className="px-5 py-2.5 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 text-sm flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span className="hidden sm:inline">View</span>
                                        </button>
                                        <div className="w-10 h-10 rounded-xl bg-charcoal/5 hover:bg-charcoal/10 transition-colors flex items-center justify-center">
                                            {expandedItem === item.id ? (
                                                <ChevronUp className="w-5 h-5 text-charcoal/60" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-charcoal/60" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {expandedItem === item.id && (
                                <div className="px-6 pb-6 pt-0 border-t border-charcoal/10 bg-gradient-to-b from-transparent to-gold/5 transition-all duration-300">
                                    <div className="mt-6 text-charcoal/80 text-sm leading-relaxed">
                                        {item.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Full Screen Viewer Modal (rendered at document.body level) */}
            {isMounted && viewingItem && typeof document !== "undefined" &&
                createPortal(
                    <div 
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300"
                        onClick={closeViewer}
                    >
                        {/* Decorative background elements */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                        </div>

                        <div 
                            className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header with gradient */}
                            <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-8 py-6 border-b border-gold/20">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                                <div className="relative flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                                                {getTypeIcon(viewingItem.type)}
                                            </div>
                                            <div>
                                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
                                                    {viewingItem.title}
                                                </h2>
                                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold">
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    {getTypeLabel(viewingItem.type)}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-white/90 text-base ml-[60px] max-w-2xl">
                                            {viewingItem.description}
                                        </p>
                                    </div>
                                    <button
                                        onClick={closeViewer}
                                        className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group hover:scale-110"
                                        aria-label="Close"
                                    >
                                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                                    </button>
                                </div>
                            </div>

                            {/* Content area with custom scrollbar */}
                            <div className="flex-1 overflow-y-auto px-8 py-8 bg-gradient-to-b from-white to-charcoal/5">
                                <div className="prose prose-lg max-w-none text-charcoal/90">
                                    <style jsx global>{`
                                        .toolkit-content::-webkit-scrollbar {
                                            width: 8px;
                                        }
                                        .toolkit-content::-webkit-scrollbar-track {
                                            background: transparent;
                                        }
                                        .toolkit-content::-webkit-scrollbar-thumb {
                                            background: rgba(0, 0, 0, 0.2);
                                            border-radius: 4px;
                                        }
                                        .toolkit-content::-webkit-scrollbar-thumb:hover {
                                            background: rgba(0, 0, 0, 0.3);
                                        }
                                    `}</style>
                                    <div className="toolkit-content">
                                        {viewingItem.content}
                                    </div>
                                </div>
                            </div>

                            {/* Footer with action button */}
                            <div className="px-8 py-6 bg-white border-t border-charcoal/10 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-charcoal/50 text-sm">
                                    <FileText className="w-4 h-4" />
                                    <span>Toolkit Resource</span>
                                </div>
                                <button
                                    onClick={closeViewer}
                                    className="px-8 py-3.5 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                                >
                                    <span>Done</span>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </>
    );
}
