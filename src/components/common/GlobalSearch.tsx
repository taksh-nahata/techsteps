
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, ChevronRight, Monitor, Wifi, Shield } from 'lucide-react';
import guidesDataRaw from '../../data/guides.json';
import { TroubleshootingGuide } from '../../types/guides';

const guidesData = guidesDataRaw as TroubleshootingGuide[];

// Basic fuzzy search or filter
const filterGuides = (query: string) => {
    if (!query) return [];
    const lower = query.toLowerCase();
    return guidesData.filter(guide =>
        guide.title.toLowerCase().includes(lower) ||
        guide.problemDescription.toLowerCase().includes(lower) ||
        guide.keywords.some(k => k.toLowerCase().includes(lower))
    ).slice(0, 5); // Limit results
};

export const GlobalSearch: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    // Toggle on Command+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Navigate & Close
    const handleSelect = (id: string) => {
        // For now, assuming we have a route for guides or we open the editor
        // In a real app we'd likely have /guide/:id
        // Here we'll redirect to the Learning Center or Editor just to demonstrate
        navigate(`/guide-editor?id=${id}`);
        setIsOpen(false);
        setQuery('');
    };

    if (!isOpen) return null;

    const results = filterGuides(query);

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Search Header */}
                <div className="flex items-center px-4 py-3 border-b border-gray-100">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 text-lg placeholder:text-gray-400 outline-none bg-transparent text-gray-800"
                        placeholder="Search guides... (e.g. 'wifi', 'printer', 'screen')"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded border border-gray-200">
                            <span className="text-xs">ESC</span>
                        </kbd>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Results Body */}
                <div className="max-h-[60vh] overflow-y-auto bg-gray-50/50">
                    {query.trim() === '' ? (
                        <div className="px-6 py-12 text-center text-gray-400">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Type to search the Troubleshooting Library</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Top Matches
                            </h3>
                            <ul>
                                {results.map(guide => (
                                    <li key={guide.id}>
                                        <button
                                            onClick={() => handleSelect(guide.id)}
                                            className="w-full flex items-center px-4 py-3 hover:bg-blue-50 transition-colors group text-left border-l-4 border-transparent hover:border-blue-500"
                                        >
                                            <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm mr-4 group-hover:border-blue-200">
                                                {/* Simple icon logic based on keywords */}
                                                {guide.keywords.includes('wifi') ? <Wifi className="w-5 h-5 text-blue-500" /> :
                                                    guide.keywords.includes('security') ? <Shield className="w-5 h-5 text-green-500" /> :
                                                        <Monitor className="w-5 h-5 text-gray-500" />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-800 group-hover:text-blue-700">
                                                    {guide.title}
                                                </h4>
                                                <p className="text-sm text-gray-500 line-clamp-1">
                                                    {guide.problemDescription}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="px-6 py-8 text-center text-gray-500">
                            <p>No guides found for "{query}"</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
                    <span>{results.length} results</span>
                    <div className="flex gap-2">
                        <span>Use <kbd className="font-mono bg-white border border-gray-200 rounded px-1">↑</kbd> <kbd className="font-mono bg-white border border-gray-200 rounded px-1">↓</kbd> to navigate</span>
                        <span><kbd className="font-mono bg-white border border-gray-200 rounded px-1">↵</kbd> to select</span>
                    </div>
                </div>

            </div>
        </div>
    );
};
