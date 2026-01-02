
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TroubleshootingGuide } from '../types/guides';
import { ImageAnnotator } from '../components/admin/ImageAnnotator';
import { FlashcardPanel } from '../components/ai/FlashcardPanel';
import { Save, Plus, Trash2, ArrowLeft, Check, Play, FileText, AlertTriangle, Palette, Upload, RefreshCw } from 'lucide-react';
import guidesData from '../data/guides.json';
// import pendingGuidesData from '../data/pending_guides.json';

// MOCK CONSTANTS
const MOCK_CATEGORIES = ['wifi', 'windows', 'ios', 'android', 'browser', 'app-error', 'robotics'];

export const GuideEditorPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');

    // State for lists - using LocalStorage for persistence
    const [guides, setGuides] = useState<TroubleshootingGuide[]>(() => {
        try {
            const saved = localStorage.getItem('techsteps_guides');
            return saved ? JSON.parse(saved) : guidesData;
        } catch { return guidesData; }
    });
    const [pending, setPending] = useState<TroubleshootingGuide[]>([]);

    useEffect(() => {
        fetch('/data/pending_guides.json?t=' + Date.now())
            .then(res => res.json())
            .then(data => setPending(data))
            .catch(e => console.error("Failed to load pending guides", e));
    }, []);

    // Persist to LocalStorage (Guides only)
    useEffect(() => {
        localStorage.setItem('techsteps_guides', JSON.stringify(guides));
    }, [guides]);

    // Removed 'techsteps_pending' localStorage to avoid QuotaExceededError with large batch files.
    // We strictly read from public/data/pending_guides.json now.

    // Derived Categories
    // Derived Categories
    // const allCategories = ... (Removed unused)

    // Selection & Editing
    const [selectedGuide, setSelectedGuide] = useState<TroubleshootingGuide | null>(null);

    // Modal States
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null); // For Image Editor Modal
    const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);

    // [New] Handle URL Params for Global Search
    const [searchParams] = useSearchParams();
    useEffect(() => {
        const guideId = searchParams.get('id');
        if (guideId && !selectedGuide) {
            const allGuides = [...guides, ...pending];
            const found = allGuides.find(g => g.id === guideId);
            if (found) {
                handleSelect(found);
                if (pending.find(p => p.id === guideId)) setActiveTab('pending');
                else setActiveTab('active');
            }
        }
    }, [searchParams, guides, pending]);

    // Deep copy on select
    const handleSelect = (guide: TroubleshootingGuide) => {
        setSelectedGuide(JSON.parse(JSON.stringify(guide)));
        setIsPreviewOpen(false);
        setEditingStepIndex(null);
        // If category is not in mock list (and not empty), default to custom mode
        setIsCustomCategoryMode(!MOCK_CATEGORIES.includes(guide.category) && guide.category !== '');
    };

    const handleSave = () => {
        if (!selectedGuide) return;

        // Remove from pending if applicable
        if (activeTab === 'pending') {
            setGuides([...guides, selectedGuide]);
            setPending(pending.filter(g => g.id !== selectedGuide.id));
            setActiveTab('active');
        } else {
            setGuides(guides.map(g => g.id === selectedGuide.id ? selectedGuide : g));
        }

        alert("Changes saved locally! (In production this would persist to the backend)");
    };

    // Handle Image Upload Helper
    const handleImageUpload = (file: File, stepIndex: number) => {
        if (!selectedGuide) return;
        const objectUrl = URL.createObjectURL(file);
        const newSteps = [...selectedGuide.steps];
        newSteps[stepIndex].image = objectUrl;
        setSelectedGuide({ ...selectedGuide, steps: newSteps });
    };

    // Transform GuideSteps to FlashcardSteps for Preview
    const getPreviewSteps = () => {
        if (!selectedGuide) return [];
        return selectedGuide.steps.map((step, idx) => ({
            id: step.id,
            stepNumber: idx + 1,
            title: step.title,
            content: step.content, // HTML/Markdown
            instructions: [step.content], // Fallback
            audioScript: `${step.title}. ${step.content}`,
            estimatedDuration: 30,
            image: step.image,
            annotations: step.annotations
        }));
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex font-sans">
            {/* Sidebar List */}
            <div className="w-80 border-r border-white/5 flex flex-col bg-slate-900">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                            <FileText size={18} className="text-white" />
                        </div>
                        <h1 className="font-bold text-lg tracking-tight">Guide Library</h1>
                    </div>

                    <button
                        onClick={() => {
                            if (confirm("Load latest data from disk? This will overwrite unsaved browser changes.")) {
                                localStorage.removeItem('techsteps_pending');
                                window.location.reload();
                            }
                        }}
                        className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Sync with Agent (Reload from Disk)"
                    >
                        <RefreshCw size={16} />
                    </button>

                    <div className="flex bg-black/20 p-1 rounded-lg">
                        <button
                            onClick={() => { setActiveTab('pending'); setSelectedGuide(null); }}
                            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${activeTab === 'pending' ? 'bg-indigo-600 shadow-lg text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Pending ({pending.length})
                        </button>
                        <button
                            onClick={() => { setActiveTab('active'); setSelectedGuide(null); }}
                            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${activeTab === 'active' ? 'bg-indigo-600 shadow-lg text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Active ({guides.length})
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {(activeTab === 'pending' ? pending : guides).map(g => (
                        <div
                            key={g.id}
                            onClick={() => handleSelect(g)}
                            className={`p-4 rounded-xl cursor-pointer border transition-all group relative overflow-hidden
                                ${selectedGuide?.id === g.id
                                    ? 'bg-indigo-500/10 border-indigo-500/50'
                                    : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                        >
                            <div className="font-medium truncate pr-4">{g.title}</div>
                            <div className="text-xs text-gray-500 flex justify-between mt-2">
                                <span className={`px-2 py-0.5 rounded-full bg-white/5 uppercase tracking-wider text-[10px]`}>{g.category}</span>
                                <span className={g.meta.difficulty === 'Easy' ? 'text-green-400' : 'text-orange-400'}>{g.meta.difficulty}</span>
                            </div>
                            {selectedGuide?.id === g.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                        </div>
                    ))}
                    {(activeTab === 'pending' ? pending : guides).length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                <Check size={20} className="opacity-20" />
                            </div>
                            No guides found.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 overflow-y-auto bg-slate-950 relative">
                {selectedGuide ? (
                    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-32">
                        {/* Header Actions */}
                        <div className="flex justify-between items-center pb-6 border-b border-white/5 sticky top-0 bg-slate-950 z-20 pt-4">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedGuide(null)} className="p-2 rounded-full hover:bg-white/5 transition">
                                    <ArrowLeft size={20} className="text-gray-400" />
                                </button>
                                {activeTab === 'pending' && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-medium border border-yellow-500/20">
                                        <AlertTriangle size={12} />
                                        Pending Review
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsPreviewOpen(true)}
                                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 flex items-center gap-2 text-sm font-medium border border-white/10 transition"
                                >
                                    <Play size={16} fill="currentColor" /> Preview
                                </button>
                                <button
                                    className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-2 text-sm font-medium border border-red-500/20 transition"
                                    onClick={() => {
                                        if (confirm("Are you sure you want to delete this guide?")) {
                                            if (activeTab === 'pending') {
                                                setPending(pending.filter(g => g.id !== selectedGuide.id));
                                            } else {
                                                setGuides(guides.filter(g => g.id !== selectedGuide.id));
                                            }
                                            setSelectedGuide(null);
                                        }
                                    }}
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-2 font-medium shadow-lg shadow-indigo-500/20 transition transform active:scale-95"
                                >
                                    <Check size={18} />
                                    {activeTab === 'pending' ? 'Approve & Publish' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        {activeTab === 'pending' && selectedGuide.meta.sourceUrl === 'https://reddit.com/r/techsupport/mock-thread' && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
                                <strong>Note:</strong> This guide was generated using fallback mock data.
                            </div>
                        )}

                        {/* Metadata Form */}
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-8 space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold ml-1">Title</label>
                                <input
                                    value={selectedGuide.title}
                                    onChange={e => setSelectedGuide({ ...selectedGuide, title: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-lg font-medium shadow-inner"
                                />
                            </div>
                            <div className="col-span-4 space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold ml-1">Category</label>
                                {isCustomCategoryMode ? (
                                    <div className="relative flex gap-2">
                                        <input
                                            autoFocus
                                            value={selectedGuide.category}
                                            onChange={e => setSelectedGuide({ ...selectedGuide, category: e.target.value })}
                                            className="w-full bg-slate-900 border border-indigo-500 rounded-lg p-3.5 outline-none text-gray-300 animate-in fade-in slide-in-from-left-2"
                                            placeholder="Enter new category..."
                                        />
                                        <button
                                            onClick={() => setIsCustomCategoryMode(false)}
                                            className="p-3.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                            title="Back to List"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            value={selectedGuide.category}
                                            onChange={e => {
                                                if (e.target.value === '__custom__') {
                                                    setIsCustomCategoryMode(true);
                                                    setSelectedGuide({ ...selectedGuide, category: '' });
                                                } else {
                                                    setSelectedGuide({ ...selectedGuide, category: e.target.value });
                                                }
                                            }}
                                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-3.5 focus:border-indigo-500 outline-none text-gray-300 appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select Category...</option>
                                            {MOCK_CATEGORIES.map(c => (
                                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                            ))}
                                            <option disabled>──────────</option>
                                            <option value="__custom__" className="font-bold text-indigo-400">+ Add Custom Category</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="col-span-12 space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold ml-1">Problem Description</label>
                                <textarea
                                    value={selectedGuide.problemDescription}
                                    onChange={e => setSelectedGuide({ ...selectedGuide, problemDescription: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 focus:border-indigo-500 outline-none h-24 resize-none shadow-inner text-gray-300"
                                />
                            </div>
                            <div className="col-span-12 space-y-2">
                                <label className="text-xs uppercase tracking-wider text-blue-400 font-bold ml-1 flex items-center gap-2">
                                    AI Generation Notes <span className="text-[10px] font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">Internal Feedback</span>
                                </label>
                                <textarea
                                    value={(selectedGuide as any).aiGenerationNotes || ''}
                                    onChange={e => setSelectedGuide({ ...selectedGuide, aiGenerationNotes: e.target.value } as any)}
                                    className="w-full bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 focus:border-blue-500/50 outline-none h-20 resize-none text-blue-200 placeholder-blue-500/30 text-sm"
                                    placeholder="Add notes for the AI (e.g., 'Missed the restart step', 'Too technical') - These will be used to improve future generation."
                                />
                            </div>
                        </div>

                        <div className="h-px bg-white/5 my-4" />

                        {/* Steps Editor */}
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                    Solution Steps
                                </h2>
                                <button
                                    onClick={() => setSelectedGuide({
                                        ...selectedGuide,
                                        steps: [...selectedGuide.steps, { id: `step-${Date.now()}`, title: 'New Step', content: '', image: '' }]
                                    })}
                                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition"
                                >
                                    <Plus size={16} /> Add Step
                                </button>
                            </div>

                            {selectedGuide.steps.map((step, idx) => (
                                <div key={step.id} className="bg-slate-900 rounded-xl border border-white/5 p-6 space-y-6 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gray-800 group-hover:bg-indigo-500 transition-colors" />

                                    {/* Step Header */}
                                    <div className="flex justify-between items-start pl-2">
                                        <div className="flex items-center gap-4 flex-1">
                                            <span className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20 shrink-0">
                                                {idx + 1}
                                            </span>
                                            <input
                                                value={step.title}
                                                onChange={e => {
                                                    const newSteps = [...selectedGuide.steps];
                                                    newSteps[idx].title = e.target.value;
                                                    setSelectedGuide({ ...selectedGuide, steps: newSteps });
                                                }}
                                                className="bg-transparent font-bold text-lg focus:border-b-2 border-indigo-500 outline-none w-full text-gray-100 placeholder-gray-600"
                                                placeholder="Step Title"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newSteps = selectedGuide.steps.filter((_, i) => i !== idx);
                                                setSelectedGuide({ ...selectedGuide, steps: newSteps });
                                            }}
                                            className="text-gray-600 hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition"
                                            title="Remove Step"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {/* Content & Image Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pl-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Instructions</label>
                                            <textarea
                                                value={step.content}
                                                onChange={e => {
                                                    const newSteps = [...selectedGuide.steps];
                                                    newSteps[idx].content = e.target.value;
                                                    setSelectedGuide({ ...selectedGuide, steps: newSteps });
                                                }}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-4 text-sm text-gray-300 min-h-[250px] focus:border-indigo-500/50 outline-none leading-relaxed resize-none"
                                                placeholder="Describe exactly what the user should do..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-500 uppercase flex justify-between items-center">
                                                <span>Visual Aid {step.annotations?.length ? `(${step.annotations.length} edits)` : ''}</span>
                                                {step.image && <span className="text-green-400 text-[10px] flex items-center gap-1"><Check size={10} /> Image Added</span>}
                                            </label>

                                            <div className="bg-black/20 rounded-lg border border-white/10 p-2 h-full min-h-[250px] flex flex-col items-center justify-center relative overflow-hidden group/image">
                                                {step.image ? (
                                                    <>
                                                        <img
                                                            src={step.image}
                                                            className="max-h-[200px] w-auto object-contain rounded-md opacity-80 group-hover/image:opacity-40 transition-all duration-300"
                                                            alt="Step"
                                                        />

                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-200">
                                                            <button
                                                                onClick={() => setEditingStepIndex(idx)}
                                                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-2xl transform scale-90 hover:scale-100 transition-all flex items-center gap-2"
                                                            >
                                                                <Palette size={18} /> Edit Image & Annotations
                                                            </button>
                                                        </div>
                                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/image:opacity-100 transition-all">
                                                            <button
                                                                onClick={() => {
                                                                    const newSteps = [...selectedGuide.steps];
                                                                    newSteps[idx].image = undefined;
                                                                    newSteps[idx].annotations = [];
                                                                    setSelectedGuide({ ...selectedGuide, steps: newSteps });
                                                                }}
                                                                className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-500"
                                                                title="Remove Image"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center p-8">
                                                        <label className="cursor-pointer group/upload">
                                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover/upload:bg-indigo-500/20 transition-colors">
                                                                <Upload size={24} className="text-gray-500 group-hover/upload:text-indigo-400" />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-400 group-hover/upload:text-white transition-colors">Click to Upload Image</span>
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    if (e.target.files?.[0]) handleImageUpload(e.target.files[0], idx);
                                                                }}
                                                            />
                                                        </label>
                                                        <div className="my-3 text-xs text-gray-600 font-bold uppercase tracking-widest">OR</div>
                                                        <input
                                                            type="text"
                                                            placeholder="Paste Image URL"
                                                            className="bg-black/40 border border-white/10 rounded px-3 py-1 text-xs text-center w-full focus:border-indigo-500 outline-none"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    const newSteps = [...selectedGuide.steps];
                                                                    newSteps[idx].image = e.currentTarget.value;
                                                                    setSelectedGuide({ ...selectedGuide, steps: newSteps });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* FULL SCREEN IMAGE EDITOR MODAL */}
                        {editingStepIndex !== null && selectedGuide.steps[editingStepIndex] && (
                            <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col animate-in fade-in duration-200">
                                {/* Editor Toolbar Header */}
                                <div className="h-16 border-b border-white/10 bg-slate-900 flex items-center justify-between px-6 shadow-xl z-10">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setEditingStepIndex(null)}
                                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <ArrowLeft size={20} className="text-gray-400" />
                                        </button>
                                        <div>
                                            <h3 className="font-bold text-lg text-white">Image Editor</h3>
                                            <p className="text-xs text-gray-400">Step {editingStepIndex + 1}: {selectedGuide.steps[editingStepIndex].title}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setEditingStepIndex(null)}
                                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                                        >
                                            <Check size={18} /> Done Editing
                                        </button>
                                    </div>
                                </div>

                                {/* Editor Canvas Area */}
                                <div className="flex-1 bg-black/50 p-6 overflow-hidden flex flex-col">
                                    <div className="flex-1 bg-slate-900/50 rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex items-center justify-center p-4">
                                        <div className="w-full h-full max-w-5xl max-h-full">
                                            <ImageAnnotator
                                                imageUrl={selectedGuide.steps[editingStepIndex].image || ''}
                                                annotations={selectedGuide.steps[editingStepIndex].annotations}
                                                onChange={(newAnnos) => {
                                                    const newSteps = [...selectedGuide.steps];
                                                    newSteps[editingStepIndex].annotations = newAnnos;
                                                    setSelectedGuide({ ...selectedGuide, steps: newSteps });
                                                }}
                                                onImageUrlChange={(url) => {
                                                    const newSteps = [...selectedGuide.steps];
                                                    newSteps[editingStepIndex].image = url;
                                                    setSelectedGuide({ ...selectedGuide, steps: newSteps });
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-center text-gray-500 text-xs mt-4">
                                        Changes are auto-saved. Click "Done Editing" when finished.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* PREVIEW MODAL */}
                        {isPreviewOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="w-full max-w-4xl h-[80vh] bg-white rounded-2xl overflow-hidden shadow-2xl relative">
                                    <FlashcardPanel
                                        steps={getPreviewSteps()}
                                        isVisible={true}
                                        onClose={() => setIsPreviewOpen(false)}
                                    />
                                    <div className="absolute top-4 left-4 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg z-[100] pointer-events-none">
                                        PREVIEW MODE
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 ring-4 ring-white/5">
                            <Save className="w-10 h-10 opacity-30" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-300 mb-2">Editor Ready</h2>
                        <p className="max-w-md text-center text-gray-500">
                            Select a guide from the sidebar to review, edit, or publish.
                            Use the <span className="text-indigo-400">Image Annotator</span> to add visual cues.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
