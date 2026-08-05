import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, ChevronRight, Wifi, Monitor, Shield } from 'lucide-react';
import { guideLibraryService } from '../../services/GuideLibraryService';
import { TroubleshootingGuide } from '../../types/guides';

export const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [guides, setGuides] = useState<TroubleshootingGuide[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setGuides(guideLibraryService.getAll());
    return guideLibraryService.subscribe(() => setGuides(guideLibraryService.getAll()));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();
  const results = q
    ? guides
        .filter(
          (g) =>
            g.title.toLowerCase().includes(q) ||
            g.problemDescription.toLowerCase().includes(q) ||
            g.keywords.some((k) => k.toLowerCase().includes(q))
        )
        .slice(0, 8)
    : guides.slice(0, 6);

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[18vh] px-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-2xl bg-surface rounded-card border border-hairline shadow-micro overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-hairline">
          <Search className="w-5 h-5 text-ink-muted mr-3" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search published guides…"
            className="flex-1 text-base outline-none bg-transparent text-ink placeholder:text-ink-muted"
          />
          <button type="button" onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-subtle">
            <X className="w-5 h-5 text-ink-muted" />
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 ? (
            <p className="p-8 text-center text-ink-muted text-sm">No guides found.</p>
          ) : (
            <ul>
              {results.map((guide) => (
                <li key={guide.id}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/guide-editor?id=${guide.id}`);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-soft/40 text-left border-l-2 border-transparent hover:border-brand"
                  >
                    <div className="p-2 rounded-lg bg-canvas border border-hairline">
                      {guide.keywords.includes('wifi') ? (
                        <Wifi className="w-4 h-4 text-brand" />
                      ) : guide.category === 'general' ? (
                        <Shield className="w-4 h-4 text-accent-cool" />
                      ) : (
                        <Monitor className="w-4 h-4 text-ink-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink truncate">{guide.title}</p>
                      <p className="text-xs text-ink-muted truncate">{guide.problemDescription}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="px-4 py-2 border-t border-hairline text-xs text-ink-muted flex justify-between">
          <span>{results.length} guide{results.length === 1 ? '' : 's'}</span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Ctrl+K
          </span>
        </div>
      </div>
    </div>
  );
};
