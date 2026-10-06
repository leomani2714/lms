import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Trash2, Plus, Eye, Edit3 } from 'lucide-react';
import type { Lesson } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { renderMarkdownWithLatex } from '@/lib/mathParser';

type Props = {
  lesson: Lesson;
  onSaved?: () => void;
};

export default function LessonEditor({ lesson, onSaved }: Props) {
  const [title, setTitle] = useState(lesson.title);
  const [content, setContent] = useState(lesson.content);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(lesson.title);
    setContent(lesson.content);
  }, [lesson.id, lesson.title, lesson.content]);

  const handleSave = useCallback(async (t: string, c: string) => {
    setSaving(true);
    await supabase.from('lessons').update({
      title: t, content: c, updated_at: new Date().toISOString(),
    }).eq('id', lesson.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved?.();
  }, [lesson.id, onSaved]);

  useEffect(() => {
    if (title === lesson.title && content === lesson.content) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { handleSave(title, content); }, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [title, content, lesson.title, lesson.content, handleSave]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold text-slate-900 bg-transparent border-none outline-none flex-1 focus:ring-0"
          placeholder="Lesson title"
        />
        <div className="flex items-center gap-2 ml-3">
          {saved && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Saved
            </span>
          )}
          {saving && <span className="text-xs text-slate-400">Saving…</span>}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${mode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${mode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
        </div>
      </div>

      {mode === 'edit' ? (
        <div className="p-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Write your lesson content here...\n\nUse $...$ for inline math: The area of a circle is $\\pi r^2$.\nUse $$...$$ for display math: $$\\int_0^1 x^2 dx = \\frac{1}{3}$$\n\n# Headers, **bold**, *italic*, and lists are supported.`}
            rows={20}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-y transition-all"
          />
        </div>
      ) : (
        <div className="p-8 max-w-3xl mx-auto">
          {content.trim() ? (
            <div className="prose-math max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: renderMarkdownWithLatex(content) }} />
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">Nothing to preview yet. Switch to Edit mode to write content.</div>
          )}
        </div>
      )}
    </div>
  );
}
