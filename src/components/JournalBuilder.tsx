import { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Download, Trash2, Plus, Eye, Edit3, Save, BookOpen, X, GripVertical } from 'lucide-react';
import type { Journal, Course, Lesson, Equation, Graph, GraphConfig } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { renderMarkdownWithLatex } from '@/lib/mathParser';
import { renderGraphToCanvas } from '@/components/GraphingTool';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type Props = {
  courseId: string | null;
  lessonId: string | null;
  courses: Course[];
  lessons: Lesson[];
};

type JournalEntry = {
  id: string;
  type: 'text' | 'equation' | 'graph' | 'heading';
  content: string;
  latex?: string;
  graphConfig?: GraphConfig;
};

function GraphEntry({ config }: { config: GraphConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderGraphToCanvas(canvas, config);
  }, [config]);
  return <canvas ref={canvasRef} className="w-full h-64 rounded-lg border border-slate-100" style={{ width: '100%', height: '256px' }} />;
}

export default function JournalBuilder({ courseId, lessonId }: Props) {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [currentJournalId, setCurrentJournalId] = useState<string | null>(null);
  const [title, setTitle] = useState('Untitled Journal');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showEquationPicker, setShowEquationPicker] = useState(false);
  const [showGraphPicker, setShowGraphPicker] = useState(false);
  const [availableEquations, setAvailableEquations] = useState<Equation[]>([]);
  const [availableGraphs, setAvailableGraphs] = useState<Graph[]>([]);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const loadJournals = useCallback(async () => {
    let query = supabase.from('journals').select('*').order('updated_at', { ascending: false });
    if (courseId) query = query.eq('course_id', courseId);
    const { data } = await query;
    if (data) setJournals(data as Journal[]);
  }, [courseId]);

  const loadAvailableEquations = useCallback(async () => {
    let query = supabase.from('equations').select('*').order('created_at', { ascending: false });
    if (lessonId) { query = query.eq('lesson_id', lessonId); }
    else if (courseId) { query = query.eq('course_id', courseId); }
    const { data } = await query;
    if (data) setAvailableEquations(data as Equation[]);
  }, [courseId, lessonId]);

  const loadAvailableGraphs = useCallback(async () => {
    let query = supabase.from('graphs').select('*').order('created_at', { ascending: false });
    if (lessonId) { query = query.eq('lesson_id', lessonId); }
    else if (courseId) { query = query.eq('course_id', courseId); }
    const { data } = await query;
    if (data) setAvailableGraphs(data as Graph[]);
  }, [courseId, lessonId]);

  useEffect(() => {
    loadJournals(); loadAvailableEquations(); loadAvailableGraphs();
  }, [loadJournals, loadAvailableEquations, loadAvailableGraphs]);

  const generateHtml = (): string => {
    let html = `<div style="font-family: 'Lora', Georgia, serif; max-width: 700px; margin: 0 auto; color: #1e293b;">`;
    html += `<h1 style="font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 8px; border-bottom: 2px solid #2563eb; padding-bottom: 12px;">${escapeHtmlSafe(title)}</h1>`;
    html += `<p style="text-align: center; color: #64748b; font-size: 13px; margin-bottom: 24px;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>`;

    entries.forEach((entry) => {
      if (entry.type === 'heading') {
        html += `<h2 style="font-size: 20px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; color: #1e293b;">${escapeHtmlSafe(entry.content)}</h2>`;
      } else if (entry.type === 'text') {
        html += `<div style="margin: 12px 0; line-height: 1.7;">${renderMarkdownWithLatex(entry.content)}</div>`;
      } else if (entry.type === 'equation' && entry.latex) {
        html += `<div style="text-align: center; margin: 16px 0; padding: 12px; background: #f8fafc; border-radius: 8px;">`;
        if (entry.content) html += `<div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">${escapeHtmlSafe(entry.content)}</div>`;
        html += `<div style="font-size: 18px;">${renderMarkdownWithLatex('$$' + entry.latex + '$$')}</div>`;
        html += `</div>`;
      } else if (entry.type === 'graph' && entry.graphConfig) {
        html += `<div style="margin: 16px 0; text-align: center;">`;
        if (entry.content) html += `<div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">${escapeHtmlSafe(entry.content)}</div>`;
        const fns = entry.graphConfig.functions?.map((f: any) => f.expression).join(', ') || '';
        html += `<div style="font-size: 12px; color: #94a3b8; font-family: monospace; padding: 8px; background: #f8fafc; border-radius: 8px;">${escapeHtmlSafe(fns)}</div>`;
        html += `</div>`;
      }
    });

    html += `</div>`;
    return html;
  };

  const handleSave = async () => {
    setSaving(true);
    const html = generateHtml();
    if (currentJournalId) {
      await supabase.from('journals').update({
        title: title.trim(), content: html, course_id: courseId, updated_at: new Date().toISOString(),
      }).eq('id', currentJournalId);
    } else {
      const { data } = await supabase.from('journals').insert({
        title: title.trim(), content: html, course_id: courseId,
      }).select().single();
      if (data) setCurrentJournalId(data.id);
    }
    setSaving(false);
    loadJournals();
  };

  const handleExportPDF = async () => {
    if (entries.length === 0) return;
    setExporting(true);

    // Use the preview element if visible, otherwise create a temporary one
    let container: HTMLElement;
    let tempContainer: HTMLElement | null = null;

    if (previewRef.current && viewMode === 'preview') {
      container = previewRef.current;
    } else {
      tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '800px';
      tempContainer.innerHTML = generateHtml();
      document.body.appendChild(tempContainer);
      container = tempContainer;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`${title.trim() || 'journal'}.pdf`);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      if (tempContainer) document.body.removeChild(tempContainer);
      setExporting(false);
    }
  };

  const handleExportHTML = () => {
    const html = generateHtml();
    const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>${escapeHtmlSafe(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]});"><\/script>
<style>body{font-family:'Lora',Georgia,serif;max-width:700px;margin:40px auto;padding:20px;color:#1e293b;line-height:1.7;}</style>
</head><body>${html}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.trim() || 'journal'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addTextEntry = () => {
    const id = crypto.randomUUID();
    setEntries((prev) => [...prev, { id, type: 'text', content: '' }]);
    setEditingEntryId(id); setEditText('');
  };
  const addHeading = () => {
    const id = crypto.randomUUID();
    setEntries((prev) => [...prev, { id, type: 'heading', content: 'New Section' }]);
  };
  const addEquation = (eq: Equation) => {
    const id = crypto.randomUUID();
    setEntries((prev) => [...prev, { id, type: 'equation', content: eq.title, latex: eq.latex }]);
    setShowEquationPicker(false);
  };
  const addGraph = (g: Graph) => {
    const id = crypto.randomUUID();
    setEntries((prev) => [...prev, { id, type: 'graph', content: g.title, graphConfig: g.config }]);
    setShowGraphPicker(false);
  };
  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const updateEntry = (id: string, content: string) => setEntries((prev) => prev.map((e) => e.id === id ? { ...e, content } : e));
  const saveEditing = () => { if (editingEntryId) { updateEntry(editingEntryId, editText); setEditingEntryId(null); setEditText(''); } };

  const loadJournal = (j: Journal) => { setCurrentJournalId(j.id); setTitle(j.title); setEntries([]); };
  const newJournal = () => { setCurrentJournalId(null); setTitle('Untitled Journal'); setEntries([]); };
  const deleteJournal = async (id: string) => {
    await supabase.from('journals').delete().eq('id', id);
    if (currentJournalId === id) newJournal();
    loadJournals();
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Journal title"
            className="flex-1 text-lg font-semibold px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={addTextEntry} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">
            <Plus className="w-4 h-4" /> Text
          </button>
          <button onClick={addHeading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">
            <Plus className="w-4 h-4" /> Heading
          </button>
          <button onClick={() => setShowEquationPicker(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 text-sm font-medium hover:bg-brand-100 transition-colors">
            <Plus className="w-4 h-4" /> Equation
          </button>
          <button onClick={() => setShowGraphPicker(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-medium hover:bg-emerald-100 transition-colors">
            <Plus className="w-4 h-4" /> Graph
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('edit')} className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => setViewMode('preview')} className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={handleExportPDF} disabled={exporting || entries.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'PDF'}
          </button>
          <button onClick={handleExportHTML} disabled={entries.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 disabled:opacity-50 transition-colors">
            <FileText className="w-4 h-4" /> HTML
          </button>
        </div>
      </div>

      {/* Journal Content */}
      {viewMode === 'edit' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[400px]">
          {entries.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Start building your journal by adding text, equations, or graphs above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="group relative border border-slate-100 rounded-lg p-4 hover:border-slate-200 transition-colors">
                  <div className="absolute left-1.5 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <button onClick={() => removeEntry(entry.id)} className="absolute top-2 right-2 p-1.5 rounded text-red-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {entry.type === 'heading' && (
                    <input type="text" value={entry.content} onChange={(e) => updateEntry(entry.id, e.target.value)}
                      className="text-xl font-bold text-slate-900 w-full bg-transparent border-none outline-none focus:ring-0 pl-5" />
                  )}

                  {entry.type === 'text' && (
                    editingEntryId === entry.id ? (
                      <div className="pl-5">
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus rows={4}
                          placeholder="Write your content here. Use $...$ for inline math and $$...$$ for display math."
                          className="w-full px-3 py-2 rounded-lg border border-brand-300 font-mono text-sm focus:ring-2 focus:ring-brand-400 outline-none resize-y" />
                        <div className="flex gap-2 mt-2">
                          <button onClick={saveEditing} className="px-3 py-1 rounded bg-brand-600 text-white text-sm hover:bg-brand-700 transition-colors">Done</button>
                          <button onClick={() => { setEditingEntryId(null); setEditText(''); }} className="px-3 py-1 rounded bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => { setEditingEntryId(entry.id); setEditText(entry.content); }}
                        className="cursor-text text-slate-700 leading-relaxed pl-5 prose-math">
                        {entry.content ? (
                          <div dangerouslySetInnerHTML={{ __html: renderMarkdownWithLatex(entry.content) }} />
                        ) : (
                          <span className="text-slate-400 italic">Click to write…</span>
                        )}
                      </div>
                    )
                  )}

                  {entry.type === 'equation' && (
                    <div className="text-center bg-slate-50 rounded-lg py-4 px-3 ml-5">
                      {entry.content && <div className="text-sm text-slate-500 mb-2">{entry.content}</div>}
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdownWithLatex('$$' + entry.latex + '$$') }} />
                    </div>
                  )}

                  {entry.type === 'graph' && entry.graphConfig && (
                    <div className="ml-5">
                      {entry.content && <div className="text-sm text-slate-500 mb-2 text-center">{entry.content}</div>}
                      <GraphEntry config={entry.graphConfig} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 min-h-[400px]">
          <div ref={previewRef} className="max-w-[700px] mx-auto">
            <h1 className="text-3xl font-bold text-center text-slate-900 mb-2 pb-3 border-b-2 border-brand-600 font-serif">{title}</h1>
            <p className="text-center text-slate-500 text-sm mb-6">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            {entries.map((entry) => {
              if (entry.type === 'heading') return <h2 key={entry.id} className="text-xl font-bold mt-6 mb-3 text-slate-900 font-serif">{entry.content}</h2>;
              if (entry.type === 'text') return <div key={entry.id} className="my-3 leading-relaxed text-slate-700 prose-math font-serif" dangerouslySetInnerHTML={{ __html: renderMarkdownWithLatex(entry.content) }} />;
              if (entry.type === 'equation') return (
                <div key={entry.id} className="text-center my-4 py-3 bg-slate-50 rounded-lg">
                  {entry.content && <div className="text-sm text-slate-500 mb-2">{entry.content}</div>}
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdownWithLatex('$$' + entry.latex + '$$') }} />
                </div>
              );
              if (entry.type === 'graph' && entry.graphConfig) return (
                <div key={entry.id} className="my-4">
                  {entry.content && <div className="text-sm text-slate-500 mb-2 text-center">{entry.content}</div>}
                  <GraphEntry config={entry.graphConfig} />
                </div>
              );
              return null;
            })}
          </div>
        </div>
      )}

      {/* Equation Picker Modal */}
      {showEquationPicker && (
        <PickerModal title="Select an Equation" onClose={() => setShowEquationPicker(false)}>
          {availableEquations.length === 0 ? (
            <EmptyState message="No equations available. Save some in the Equations tab first." />
          ) : (
            availableEquations.map((eq) => (
              <button key={eq.id} onClick={() => addEquation(eq)} className="w-full px-5 py-3 text-left hover:bg-brand-50 transition-colors flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">{eq.title}</div>
                  <div className="text-xs text-slate-400 font-mono">{eq.latex}</div>
                </div>
              </button>
            ))
          )}
        </PickerModal>
      )}

      {/* Graph Picker Modal */}
      {showGraphPicker && (
        <PickerModal title="Select a Graph" onClose={() => setShowGraphPicker(false)}>
          {availableGraphs.length === 0 ? (
            <EmptyState message="No graphs available. Save some in the Graphing tab first." />
          ) : (
            availableGraphs.map((g) => (
              <button key={g.id} onClick={() => addGraph(g)} className="w-full px-5 py-3 text-left hover:bg-emerald-50 transition-colors">
                <div className="text-sm font-medium text-slate-900">{g.title}</div>
                <div className="text-xs text-slate-400">{g.config.functions.length} function(s) · x:[{g.config.xRange[0]}, {g.config.xRange[1]}]</div>
              </button>
            ))
          )}
        </PickerModal>
      )}

      {/* Saved Journals */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Saved Journals ({journals.length})</h3>
          <button onClick={newJournal} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 text-sm font-medium hover:bg-brand-100 transition-colors">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
          {journals.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">No journals saved yet.</div>
          ) : (
            journals.map((j) => (
              <div key={j.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 group">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{j.title}</div>
                  <div className="text-xs text-slate-400">Updated {new Date(j.updated_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => loadJournal(j)} className="text-xs px-3 py-1 rounded bg-brand-50 text-brand-600 hover:bg-brand-100 font-medium transition-colors">Open</button>
                  <button onClick={() => deleteJournal(j.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PickerModal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[70vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="px-5 py-10 text-center text-slate-400 text-sm">{message}</div>;
}

function escapeHtmlSafe(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
