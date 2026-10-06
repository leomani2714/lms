import { useState, useEffect, useRef, useCallback } from 'react';
import { renderLatex } from '@/lib/mathParser';
import { Plus, Save, Trash2, Copy, ChevronDown, ChevronRight, Search, Sigma, Edit2, X } from 'lucide-react';
import type { Equation } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

const SYMBOL_CATEGORIES = {
  'Greek Letters': [
    { label: 'alpha', insert: '\\alpha' }, { label: 'beta', insert: '\\beta' },
    { label: 'gamma', insert: '\\gamma' }, { label: 'delta', insert: '\\delta' },
    { label: 'epsilon', insert: '\\epsilon' }, { label: 'theta', insert: '\\theta' },
    { label: 'lambda', insert: '\\lambda' }, { label: 'mu', insert: '\\mu' },
    { label: 'pi', insert: '\\pi' }, { label: 'sigma', insert: '\\sigma' },
    { label: 'phi', insert: '\\phi' }, { label: 'omega', insert: '\\omega' },
    { label: 'Delta', insert: '\\Delta' }, { label: 'Sigma', insert: '\\Sigma' },
    { label: 'Omega', insert: '\\Omega' }, { label: 'Pi', insert: '\\Pi' },
  ],
  'Operators': [
    { label: '±', insert: '\\pm' }, { label: '×', insert: '\\times' },
    { label: '÷', insert: '\\div' }, { label: '·', insert: '\\cdot' },
    { label: '≠', insert: '\\neq' }, { label: '≤', insert: '\\leq' },
    { label: '≥', insert: '\\geq' }, { label: '≈', insert: '\\approx' },
    { label: '≡', insert: '\\equiv' }, { label: '∝', insert: '\\propto' },
  ],
  'Calculus': [
    { label: '∫', insert: '\\int' }, { label: '∫∫', insert: '\\iint' },
    { label: '∮', insert: '\\oint' }, { label: 'd/dx', insert: '\\frac{d}{dx}' },
    { label: '∂', insert: '\\partial' }, { label: 'lim', insert: '\\lim' },
    { label: '∑', insert: '\\sum' }, { label: '∏', insert: '\\prod' },
    { label: '→', insert: '\\to' }, { label: '∞', insert: '\\infty' },
  ],
  'Fractions & Roots': [
    { label: 'frac', insert: '\\frac{}{}' }, { label: '√', insert: '\\sqrt{}' },
    { label: '∛', insert: '\\sqrt[3]{}' }, { label: 'x^n', insert: '^{}' },
    { label: 'x_n', insert: '_{}' }, { label: 'binom', insert: '\\binom{}{}' },
  ],
  'Brackets & Sets': [
    { label: '( )', insert: '\\left( \\right)' }, { label: '[ ]', insert: '\\left[ \\right]' },
    { label: '{ }', insert: '\\left\\{ \\right\\}' }, { label: '⟨ ⟩', insert: '\\langle \\rangle' },
    { label: '∈', insert: '\\in' }, { label: '∉', insert: '\\notin' },
    { label: '⊂', insert: '\\subset' }, { label: '∪', insert: '\\cup' },
    { label: '∩', insert: '\\cap' }, { label: '∅', insert: '\\emptyset' },
  ],
  'Accents': [
    { label: 'x̄', insert: '\\bar{}' }, { label: 'x̂', insert: '\\hat{}' },
    { label: 'x→', insert: '\\vec{}' }, { label: 'x̃', insert: '\\tilde{}' },
    { label: 'ẋ', insert: '\\dot{}' },
  ],
};

const TEMPLATES = [
  { label: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { label: 'Pythagorean Theorem', latex: 'a^2 + b^2 = c^2' },
  { label: "Euler's Identity", latex: 'e^{i\\pi} + 1 = 0' },
  { label: 'Derivative Definition', latex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}" },
  { label: 'Integral', latex: '\\int_a^b f(x)\\, dx = F(b) - F(a)' },
  { label: 'Taylor Series', latex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n' },
  { label: 'Matrix', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { label: 'Summation', latex: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}' },
];

type Props = {
  courseId: string | null;
  lessonId: string | null;
  onSaved?: () => void;
};

export default function EquationEditor({ courseId, lessonId, onSaved }: Props) {
  const [latex, setLatex] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [equations, setEquations] = useState<Equation[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Greek Letters']));
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadEquations = useCallback(async () => {
    let query = supabase.from('equations').select('*').order('created_at', { ascending: false });
    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    } else if (courseId) {
      query = query.eq('course_id', courseId).is('lesson_id', null);
    } else {
      query = query.is('course_id', null).is('lesson_id', null);
    }
    const { data } = await query;
    if (data) setEquations(data as Equation[]);
  }, [courseId, lessonId]);

  useEffect(() => {
    loadEquations();
  }, [loadEquations]);

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setLatex((prev) => prev + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = latex.substring(0, start) + text + latex.substring(end);
    setLatex(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + text.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const handleSave = async () => {
    if (!latex.trim()) return;
    const payload = {
      title: title.trim() || 'Untitled Equation',
      latex: latex.trim(),
      description: description.trim(),
      lesson_id: lessonId,
      course_id: lessonId ? null : courseId,
    };
    if (editingId) {
      await supabase.from('equations').update({
        title: payload.title, latex: payload.latex, description: payload.description,
      }).eq('id', editingId);
    } else {
      await supabase.from('equations').insert(payload);
    }
    setLatex(''); setTitle(''); setDescription(''); setEditingId(null);
    loadEquations();
    onSaved?.();
  };

  const handleEdit = (eq: Equation) => {
    setLatex(eq.latex); setTitle(eq.title); setDescription(eq.description); setEditingId(eq.id);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('equations').delete().eq('id', id);
    loadEquations();
  };

  const handleCopy = (latexText: string, id: string) => {
    navigator.clipboard.writeText(latexText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const filteredCategories = Object.entries(SYMBOL_CATEGORIES).filter(([name, symbols]) =>
    symbols.some((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase())) || name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Editor Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-gradient-to-r from-brand-50 to-transparent px-5 py-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Sigma className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-slate-900">{editingId ? 'Edit Equation' : 'New Equation'}</h3>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Equation title (e.g. Quadratic Formula)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">LaTeX Input</label>
            <textarea
              ref={textareaRef}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="Enter LaTeX here, e.g. \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-y transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Live Preview</label>
            <div className="min-h-[60px] rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 overflow-x-auto transition-all">
              {latex.trim() ? (
                <div dangerouslySetInnerHTML={{ __html: renderLatex(latex, true) }} />
              ) : (
                <span className="text-slate-400 text-sm italic">Preview will appear here as you type…</span>
              )}
            </div>
          </div>

          {/* Symbol Palette */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search symbols…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-sm px-2 py-1 rounded border border-slate-200 focus:ring-1 focus:ring-brand-400 outline-none"
                />
                <button
                  onClick={() => setShowTemplates((v) => !v)}
                  className={`text-sm px-3 py-1 rounded font-medium transition-colors ${showTemplates ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600 hover:bg-brand-100'}`}
                >
                  Templates
                </button>
              </div>
            </div>

            {showTemplates && (
              <div className="px-3 py-3 border-b border-slate-200 bg-brand-50/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => { setLatex(t.latex); setShowTemplates(false); }}
                      className="text-left px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-brand-400 hover:shadow-sm transition-all text-xs font-medium text-slate-700"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto">
              {filteredCategories.map(([category, symbols]) => (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                  >
                    {expandedCategories.has(category) ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-sm font-medium text-slate-600">{category}</span>
                  </button>
                  {expandedCategories.has(category) && (
                    <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                      {symbols.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => insertAtCursor(s.insert)}
                          className="min-w-[36px] px-2 py-1.5 rounded bg-slate-50 border border-slate-200 hover:bg-brand-50 hover:border-brand-300 transition-all text-sm font-mono"
                          title={s.insert}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!latex.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update' : 'Save Equation'}
            </button>
            {editingId && (
              <button
                onClick={() => { setLatex(''); setTitle(''); setDescription(''); setEditingId(null); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Saved Equations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <h3 className="font-semibold text-slate-900">Saved Equations ({equations.length})</h3>
        </div>
        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {equations.length === 0 ? (
            <div className="px-5 py-12 text-center text-slate-400 text-sm">
              No equations saved yet. Create one above.
            </div>
          ) : (
            equations.map((eq) => (
              <div key={eq.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 mb-1">{eq.title}</div>
                    {eq.description && <div className="text-xs text-slate-500 mb-2">{eq.description}</div>}
                    <div className="overflow-x-auto bg-slate-50 rounded-lg px-3 py-2 border border-slate-100" dangerouslySetInnerHTML={{ __html: renderLatex(eq.latex, true) }} />
                    <div className="text-xs text-slate-400 font-mono mt-1.5 truncate">{eq.latex}</div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(eq.latex, eq.id)}
                      className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors relative"
                      title="Copy LaTeX"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedId === eq.id && (
                        <span className="absolute -top-7 right-0 text-xs bg-slate-800 text-white px-2 py-0.5 rounded">Copied!</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(eq)}
                      className="p-1.5 rounded hover:bg-brand-100 text-brand-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(eq.id)}
                      className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
