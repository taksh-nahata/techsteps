import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Search,
  ThumbsUp,
  Clock,
  X,
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import Logo from '../components/layout/Logo';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
  replies: PostReply[];
  category: string;
}

interface PostReply {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
}

const STORAGE_KEY = 'communityPosts';

const Community: React.FC = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' });

  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved).map((post: Post) => ({
        ...post,
        timestamp: new Date(post.timestamp),
        replies: (post.replies || []).map((r: PostReply) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        })),
      }));
      setPosts(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (posts.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  const categories = [
    { id: 'all', name: t('community.sidebar.topics.all', 'All topics'), icon: '📋' },
    { id: 'general', name: t('community.sidebar.topics.general', 'General'), icon: '💬' },
    { id: 'mobile', name: t('community.sidebar.topics.mobile', 'Phones & tablets'), icon: '📱' },
    { id: 'computer', name: t('community.sidebar.topics.computer', 'Computers'), icon: '💻' },
    { id: 'apps', name: t('community.sidebar.topics.apps', 'Apps'), icon: '🧩' },
    { id: 'internet', name: t('community.sidebar.topics.internet', 'Internet'), icon: '🌐' },
    { id: 'safety', name: t('community.sidebar.topics.safety', 'Safety'), icon: '🔒' },
  ];

  const handleNewPost = (e: React.FormEvent) => {
    e.preventDefault();
    const post: Post = {
      id: Date.now().toString(),
      title: newPost.title.trim(),
      content: newPost.content.trim(),
      author: 'You',
      timestamp: new Date(),
      likes: 0,
      replies: [],
      category: newPost.category,
    };
    setPosts((prev) => [post, ...prev]);
    setNewPost({ title: '', content: '', category: 'general' });
    setShowNewPostForm(false);
  };

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  const filteredPosts = posts.filter((post) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      post.title.toLowerCase().includes(q) || post.content.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatTimeAgo = (date: Date) => {
    const diffH = Math.floor((Date.now() - date.getTime()) / 3_600_000);
    if (diffH < 1) return t('community.posts.timeAgo.justNow', 'Just now');
    if (diffH < 24) return t('community.posts.timeAgo.hours', { count: diffH });
    const diffD = Math.floor(diffH / 24);
    return t('community.posts.timeAgo.days', { count: diffD });
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-hairline bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-8">
          <Link to="/" className="focus-ring rounded-lg">
            <Logo size="sm" showText responsiveText />
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn-pill btn-pill-ghost text-sm py-2 min-h-0 hidden sm:inline-flex">
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('community.header.backToHome', 'Home')}
            </Link>
            <button
              type="button"
              onClick={() => setShowNewPostForm(true)}
              className="btn-pill btn-pill-primary text-sm py-2 min-h-0 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t('community.header.newPost', 'New post')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-8 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center sm:text-left"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted mb-2">
            Community
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.03em]">
            {t('community.header.title', 'Community Forum')}
          </h1>
          <p className="mt-3 text-ink-muted max-w-2xl mx-auto sm:mx-0">
            {t('community.header.subtitle', 'Ask questions, share tips, and learn from others.')}
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-4">
            <div className="surface-card rounded-card p-4 border border-hairline">
              <h2 className="text-sm font-bold text-ink mb-3">
                {t('community.sidebar.categories', 'Categories')}
              </h2>
              <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors focus-ring ${
                      selectedCategory === cat.id
                        ? 'bg-brand-soft text-brand'
                        : 'text-ink-muted hover:bg-subtle hover:text-ink'
                    }`}
                  >
                    <span className="mr-2">{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="surface-card rounded-card p-4 border border-hairline bg-brand-soft/30">
              <h3 className="text-sm font-bold text-ink mb-2">
                {t('community.sidebar.guidelines.title', 'Guidelines')}
              </h3>
              <ul className="text-xs text-ink-muted space-y-1.5">
                {(t('community.sidebar.guidelines.items', {
                  returnObjects: true,
                  defaultValue: ['Be kind and patient', 'No spam', 'Share what worked for you'],
                }) as string[]).map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('community.search.placeholder', 'Search posts…')}
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl focus-ring"
              />
            </div>

            {showNewPostForm && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface-card rounded-card p-5 border border-hairline"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-ink">
                    {t('community.createPost.title', 'Create a post')}
                  </h3>
                  <button type="button" onClick={() => setShowNewPostForm(false)} className="p-2 rounded-full hover:bg-subtle focus-ring">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleNewPost} className="space-y-4">
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2.5 focus-ring"
                  >
                    {categories.slice(1).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <input
                    required
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder={t('community.createPost.titlePlaceholder', 'Post title')}
                    className="w-full glass-input rounded-xl px-3 py-2.5 focus-ring"
                  />
                  <textarea
                    required
                    rows={4}
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder={t('community.createPost.contentPlaceholder', 'What would you like to ask or share?')}
                    className="w-full glass-input rounded-xl px-3 py-2.5 focus-ring resize-y"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-pill btn-pill-primary text-sm">
                      {t('community.createPost.submit', 'Post')}
                    </button>
                    <button type="button" onClick={() => setShowNewPostForm(false)} className="btn-pill btn-pill-ghost text-sm">
                      {t('community.createPost.cancel', 'Cancel')}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {filteredPosts.length === 0 ? (
              <div className="surface-card rounded-card p-12 text-center border border-hairline">
                <MessageSquare className="w-10 h-10 text-ink-muted mx-auto mb-3" />
                <p className="text-ink-muted">{t('community.posts.empty', 'No posts yet — be the first!')}</p>
              </div>
            ) : (
              filteredPosts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -12 : 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4 }}
                  className="surface-card rounded-card p-5 sm:p-6 border border-hairline hover:border-brand/25 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-lg text-ink truncate">{post.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-ink-muted">
                        <span>{post.author}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(post.timestamp)}</span>
                        <span className="rounded-full bg-subtle px-2 py-0.5 text-ink">
                          {categories.find((c) => c.id === post.category)?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-ink-muted leading-relaxed mb-4">{post.content}</p>
                  <button
                    type="button"
                    onClick={() => handleLike(post.id)}
                    className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-brand transition-colors focus-ring rounded-full px-2 py-1"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {post.likes}
                  </button>
                </motion.article>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Community;
