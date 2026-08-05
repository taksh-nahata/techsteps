import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Download,
  FileUp,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { FlashcardPanel } from '../components/ai/FlashcardPanel';
import { GuideImageEditorModal, GuideStepEditor } from '../components/guide-editor/GuideStepEditor';
import Logo from '../components/layout/Logo';
import { guideLibraryService } from '../services/GuideLibraryService';
import { PendingGuideService } from '../services/PendingGuideService';
import { MemoryService } from '../services/MemoryService';
import { imageLibraryService } from '../services/ImageLibraryService';
import { guideToFlashcardSteps, createBlankGuide, extractKeywords, normalizeGuide, GUIDE_CATEGORIES } from '../services/guideUtils';
import { detectGuideDevice, GuideDeviceType } from '../utils/deviceDetection';
import { DevicePreviewPicker } from '../components/guide-editor/DevicePreviewPicker';
import { TroubleshootingGuide } from '../types/guides';

export const GuideEditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('active');
  const [activeGuides, setActiveGuides] = useState<TroubleshootingGuide[]>([]);
  const [pending, setPending] = useState<TroubleshootingGuide[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<TroubleshootingGuide | null>(null);
  const [search, setSearch] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<GuideDeviceType>(() => detectGuideDevice());
  const [editingImageStep, setEditingImageStep] = useState<number | null>(null);
  const [loadingPending, setLoadingPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshActive = useCallback(() => {
    setActiveGuides(guideLibraryService.getAll());
  }, []);

  useEffect(() => {
    refreshActive();
    return guideLibraryService.subscribe(refreshActive);
  }, [refreshActive]);

  const loadPending = useCallback(async (includeSample = false) => {
    setLoadingPending(true);
    try {
      const firestore = await PendingGuideService.loadFromFirestore();
      const sample = includeSample ? await PendingGuideService.loadSampleBatch() : [];
      const combined = [...firestore, ...sample];
      const unique = Array.from(new Map(combined.map((g) => [g.id, g])).values());
      setPending(unique);
      setStatusMessage(`Loaded ${unique.length} pending guide${unique.length === 1 ? '' : 's'}`);
    } catch {
      setStatusMessage('Could not load pending guides');
    } finally {
      setLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    loadPending(false);
  }, [loadPending]);

  useEffect(() => {
    const guideId = searchParams.get('id');
    if (!guideId) return;
    const found =
      activeGuides.find((g) => g.id === guideId) ?? pending.find((g) => g.id === guideId);
    if (found) {
      setSelectedGuide(JSON.parse(JSON.stringify(found)));
      setActiveTab(pending.some((p) => p.id === guideId) ? 'pending' : 'active');
    }
  }, [searchParams, activeGuides, pending]);

  const list = activeTab === 'pending' ? pending : activeGuides;
  const filteredList = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.problemDescription.toLowerCase().includes(q) ||
        g.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [list, search]);

  const selectGuide = (guide: TroubleshootingGuide) => {
    setSelectedGuide(JSON.parse(JSON.stringify(normalizeGuide(guide))));
    setIsPreviewOpen(false);
    setEditingImageStep(null);
  };

  const updateSelected = (patch: Partial<TroubleshootingGuide>) => {
    if (!selectedGuide) return;
    setSelectedGuide(normalizeGuide({ ...selectedGuide, ...patch }));
  };

  const updateStep = (index: number, step: TroubleshootingGuide['steps'][0]) => {
    if (!selectedGuide) return;
    const steps = [...selectedGuide.steps];
    steps[index] = step;
    setSelectedGuide({ ...selectedGuide, steps });
  };

  const handlePublish = async () => {
    if (!selectedGuide) return;
    const normalized = normalizeGuide(selectedGuide);
    if (!normalized.keywords.length) {
      normalized.keywords = extractKeywords(
        `${normalized.title} ${normalized.problemDescription}`
      );
    }
    guideLibraryService.save(normalized);
    imageLibraryService.refresh();

    if (activeTab === 'pending') {
      setPending((p) => p.filter((g) => g.id !== normalized.id));
      if (normalized.meta.source === 'ai-chat') {
        await MemoryService.deletePendingGuide(normalized.id);
      }
      setActiveTab('active');
    }

    setSelectedGuide(normalized);
    setStatusMessage('Guide saved to your library — chat will use it for matching.');
  };

  const handleDelete = async () => {
    if (!selectedGuide || !confirm('Delete this guide permanently?')) return;
    if (activeTab === 'active') {
      guideLibraryService.delete(selectedGuide.id);
    } else {
      setPending((p) => p.filter((g) => g.id !== selectedGuide.id));
      if (selectedGuide.meta.source === 'ai-chat') {
        await MemoryService.deletePendingGuide(selectedGuide.id);
      }
    }
    setSelectedGuide(null);
    setStatusMessage('Guide deleted');
  };

  const handleImportJson = async (file: File) => {
    try {
      const imported = await PendingGuideService.importFromFile(file);
      if (activeTab === 'pending') {
        setPending((p) => {
          const map = new Map(p.map((g) => [g.id, g]));
          imported.forEach((g) => map.set(g.id, g));
          return Array.from(map.values());
        });
      } else {
        imported.forEach((g) => guideLibraryService.save(g));
      }
      setStatusMessage(`Imported ${imported.length} guide(s)`);
    } catch {
      setStatusMessage('Invalid JSON file');
    }
  };

  const previewSteps = selectedGuide ? guideToFlashcardSteps(selectedGuide, previewDevice) : [];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="sticky top-0 z-40 border-b border-hairline bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/dashboard" className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink focus-ring rounded-lg">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to chat</span>
            </Link>
            <Logo size="sm" responsiveText />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => guideLibraryService.downloadExport()}
              className="btn-pill btn-pill-ghost text-sm hidden sm:flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Export library
            </button>
            <label className="btn-pill btn-pill-ghost text-sm cursor-pointer flex items-center gap-1.5">
              <FileUp className="w-4 h-4" />
              <span className="hidden sm:inline">Import JSON</span>
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImportJson(e.target.files[0])}
              />
            </label>
          </div>
        </div>
      </header>

      {statusMessage && (
        <div className="bg-brand-soft border-b border-brand/20 px-4 py-2 text-sm text-brand text-center">
          {statusMessage}
          <button type="button" className="ml-3 underline" onClick={() => setStatusMessage(null)}>
            dismiss
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 max-w-[1600px] mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-full max-w-sm border-r border-hairline bg-surface flex flex-col shrink-0">
          <div className="p-4 border-b border-hairline space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand" />
              <h1 className="font-display font-bold text-lg">Guide library</h1>
            </div>

            <div className="flex bg-canvas p-1 rounded-[12px] border border-hairline">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('active');
                  setSelectedGuide(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${activeTab === 'active' ? 'bg-brand text-white' : 'text-ink-muted'}`}
              >
                Published ({activeGuides.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('pending');
                  setSelectedGuide(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${activeTab === 'pending' ? 'bg-brand text-white' : 'text-ink-muted'}`}
              >
                Pending ({pending.length})
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guides…"
                className="w-full pl-9 pr-3 py-2 rounded-[12px] border border-hairline bg-canvas text-sm focus:border-brand outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {activeTab === 'active' ? (
                <button
                  type="button"
                  onClick={() => selectGuide(createBlankGuide())}
                  className="btn-pill btn-pill-primary text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> New guide
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={loadingPending}
                    onClick={() => loadPending(false)}
                    className="btn-pill btn-pill-ghost text-xs flex items-center gap-1"
                  >
                    {loadingPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Sync AI queue
                  </button>
                  <button
                    type="button"
                    disabled={loadingPending}
                    onClick={() => loadPending(true)}
                    className="btn-pill btn-pill-ghost text-xs"
                  >
                    + Sample batch
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {filteredList.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => selectGuide(g)}
                className={`w-full text-left p-4 rounded-[14px] border transition ${
                  selectedGuide?.id === g.id
                    ? 'border-brand bg-brand-soft/50'
                    : 'border-hairline bg-canvas hover:border-brand/30'
                }`}
              >
                <p className="font-semibold text-ink truncate">{g.title}</p>
                <p className="text-xs text-ink-muted mt-1 line-clamp-2">{g.problemDescription}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-subtle text-ink-muted">
                    {g.category}
                  </span>
                  <span className="text-[10px] text-ink-muted">{g.steps.length} steps</span>
                  {g.meta.source === 'ai-chat' && (
                    <span className="text-[10px] text-brand flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" /> AI
                    </span>
                  )}
                </div>
              </button>
            ))}
            {filteredList.length === 0 && (
              <p className="text-center text-sm text-ink-muted py-8">No guides here yet.</p>
            )}
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar">
          {!selectedGuide ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <BookOpen className="w-12 h-12 text-brand/40 mb-4" />
              <h2 className="font-display text-2xl font-bold text-ink mb-2">Edit flashcard guides</h2>
              <p className="text-ink-muted max-w-md mb-6">
                Select a guide from the left, or create a new one. Published guides are used when chat matches a question.
              </p>
              <button type="button" onClick={() => selectGuide(createBlankGuide())} className="btn-pill btn-pill-primary">
                Create new guide
              </button>
            </div>
          ) : (
            <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 pb-24">
              <div className="flex flex-wrap items-center justify-between gap-3 sticky top-0 bg-canvas/95 backdrop-blur py-2 z-10 border-b border-hairline">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  {activeTab === 'pending' ? 'Review before publishing' : 'Editing published guide'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setIsPreviewOpen(true)} className="btn-pill btn-pill-ghost text-sm flex items-center gap-1">
                    <Play className="w-4 h-4" /> Preview
                  </button>
                  <button type="button" onClick={handleDelete} className="btn-pill text-sm text-red-600 border border-red-200 hover:bg-red-50 flex items-center gap-1">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                  <button type="button" onClick={handlePublish} className="btn-pill btn-pill-primary text-sm flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    {activeTab === 'pending' ? 'Approve & publish' : 'Save changes'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Title</label>
                  <input
                    value={selectedGuide.title}
                    onChange={(e) => updateSelected({ title: e.target.value })}
                    className="mt-1 w-full rounded-[12px] border border-hairline bg-surface px-4 py-3 text-lg font-display font-bold focus:border-brand outline-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Category</label>
                    <select
                      value={selectedGuide.category}
                      onChange={(e) => updateSelected({ category: e.target.value })}
                      className="mt-1 w-full rounded-[12px] border border-hairline bg-surface px-3 py-2.5 focus:border-brand outline-none"
                    >
                      {GUIDE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Difficulty</label>
                    <select
                      value={selectedGuide.meta.difficulty}
                      onChange={(e) =>
                        updateSelected({
                          meta: {
                            ...selectedGuide.meta,
                            difficulty: e.target.value as TroubleshootingGuide['meta']['difficulty'],
                          },
                        })
                      }
                      className="mt-1 w-full rounded-[12px] border border-hairline bg-surface px-3 py-2.5 focus:border-brand outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Problem description</label>
                  <textarea
                    value={selectedGuide.problemDescription}
                    onChange={(e) => updateSelected({ problemDescription: e.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-[12px] border border-hairline bg-surface px-4 py-3 text-sm focus:border-brand outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Keywords (comma-separated)</label>
                  <input
                    value={selectedGuide.keywords.join(', ')}
                    onChange={(e) =>
                      updateSelected({
                        keywords: e.target.value
                          .split(',')
                          .map((k) => k.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="wifi, iphone, screenshot"
                    className="mt-1 w-full rounded-[12px] border border-hairline bg-surface px-4 py-2.5 text-sm focus:border-brand outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <h2 className="font-display font-bold text-xl">Steps</h2>
                <button
                  type="button"
                  onClick={() =>
                    updateSelected({
                      steps: [
                        ...selectedGuide.steps,
                        {
                          id: `step-${Date.now()}`,
                          title: `Step ${selectedGuide.steps.length + 1}`,
                          content: '',
                          instructions: [''],
                        },
                      ],
                    })
                  }
                  className="text-sm font-medium text-brand flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add step
                </button>
              </div>

              <div className="space-y-4">
                {selectedGuide.steps.map((step, idx) => (
                  <GuideStepEditor
                    key={step.id}
                    step={step}
                    index={idx}
                    total={selectedGuide.steps.length}
                    onChange={(s) => updateStep(idx, s)}
                    onRemove={() =>
                      updateSelected({ steps: selectedGuide.steps.filter((_, i) => i !== idx) })
                    }
                    onMoveUp={() => {
                      if (idx === 0) return;
                      const steps = [...selectedGuide.steps];
                      [steps[idx - 1], steps[idx]] = [steps[idx], steps[idx - 1]];
                      updateSelected({ steps });
                    }}
                    onMoveDown={() => {
                      if (idx >= selectedGuide.steps.length - 1) return;
                      const steps = [...selectedGuide.steps];
                      [steps[idx], steps[idx + 1]] = [steps[idx + 1], steps[idx]];
                      updateSelected({ steps });
                    }}
                    onOpenImageEditor={() => setEditingImageStep(idx)}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {editingImageStep !== null && selectedGuide?.steps[editingImageStep] && (
        <GuideImageEditorModal
          step={selectedGuide.steps[editingImageStep]}
          stepIndex={editingImageStep}
          onClose={() => setEditingImageStep(null)}
          onChange={(s) => updateStep(editingImageStep, s)}
        />
      )}

      {isPreviewOpen && selectedGuide && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-ink/70 backdrop-blur-sm">
          <div className="w-full max-w-3xl mb-3 px-2">
            <DevicePreviewPicker value={previewDevice} onChange={setPreviewDevice} />
          </div>
          <div className="w-full max-w-3xl h-[min(80vh,680px)] bg-canvas rounded-card overflow-hidden shadow-micro border border-hairline">
            <FlashcardPanel
              steps={previewSteps}
              isVisible
              deviceType={previewDevice}
              onDeviceTypeChange={setPreviewDevice}
              showDevicePicker
              onClose={() => setIsPreviewOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideEditorPage;
