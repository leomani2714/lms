import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Trash2, Plus, LineChart, Zap } from 'lucide-react';
import type { Graph, GraphConfig } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

const COLORS = ['#2563eb', '#dc2626', '#059669', '#d97706', '#4f46e5', '#db2777', '#0891b2', '#65a30d'];

function compileExpression(expr: string): ((x: number) => number) | null {
  try {
    const cleaned = expr
      .replace(/\^/g, '**')
      .replace(/(\d)([a-zA-Z(])/g, '$1*$2')
      .replace(/\)\(/g, ')*(')
      .replace(/([a-zA-Z])\(/g, '$1(');
    const fn = new Function('x', `
      const { sin, cos, tan, asin, acos, atan, sinh, cosh, tanh, exp, log, log2, log10, sqrt, abs, floor, ceil, round, pow, PI, E, max, min, sign, atan2 } = Math;
      return ${cleaned};
    `);
    const test = fn(1);
    if (typeof test !== 'number') return null;
    return fn as (x: number) => number;
  } catch {
    return null;
  }
}

type Props = {
  courseId: string | null;
  lessonId: string | null;
  onSaved?: () => void;
};

const DEFAULT_CONFIG: GraphConfig = {
  functions: [{ expression: 'sin(x)', color: '#2563eb', label: 'f(x) = sin(x)' }],
  xRange: [-10, 10],
  yRange: [-10, 10],
  title: 'Graph',
  showGrid: true,
};

export function renderGraphToCanvas(canvas: HTMLCanvasElement, config: GraphConfig): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const [xMin, xMax] = config.xRange;
  const [yMin, yMax] = config.yRange;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const xScale = width / (xMax - xMin);
  const yScale = height / (yMax - yMin);
  const toCanvasX = (x: number) => (x - xMin) * xScale;
  const toCanvasY = (y: number) => height - (y - yMin) * yScale;

  if (config.showGrid) {
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    const xStep = niceStep((xMax - xMin) / 10);
    const yStep = niceStep((yMax - yMin) / 10);
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      ctx.beginPath(); ctx.moveTo(toCanvasX(x), 0); ctx.lineTo(toCanvasX(x), height); ctx.stroke();
    }
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      ctx.beginPath(); ctx.moveTo(0, toCanvasY(y)); ctx.lineTo(width, toCanvasY(y)); ctx.stroke();
    }
  }

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  if (yMin <= 0 && yMax >= 0) { ctx.beginPath(); ctx.moveTo(0, toCanvasY(0)); ctx.lineTo(width, toCanvasY(0)); ctx.stroke(); }
  if (xMin <= 0 && xMax >= 0) { ctx.beginPath(); ctx.moveTo(toCanvasX(0), 0); ctx.lineTo(toCanvasX(0), height); ctx.stroke(); }

  ctx.fillStyle = '#64748b';
  ctx.font = '11px sans-serif';
  const xStep = niceStep((xMax - xMin) / 10);
  const yStep = niceStep((yMax - yMin) / 10);
  const yZero = toCanvasY(0);
  const xZero = toCanvasX(0);
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    if (Math.abs(x) < 1e-10) continue;
    const labelY = Math.min(Math.max(yZero + 14, 14), height - 4);
    ctx.fillText(formatNumber(x), toCanvasX(x) - 8, labelY);
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    if (Math.abs(y) < 1e-10) continue;
    const labelX = Math.min(Math.max(xZero + 4, 4), width - 30);
    ctx.fillText(formatNumber(y), labelX, toCanvasY(y) + 4);
  }

  const steps = Math.max(800, width * 2);
  const dx = (xMax - xMin) / steps;
  let hasError = false;

  config.functions.forEach((fnDef) => {
    const fn = compileExpression(fnDef.expression);
    if (!fn) { hasError = true; return; }
    ctx.strokeStyle = fnDef.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    let prevY: number | null = null;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      let y: number;
      try { y = fn(x); } catch { started = false; continue; }
      if (!isFinite(y)) { started = false; prevY = null; continue; }
      if (prevY !== null && Math.abs(y - prevY) > (yMax - yMin) * 2) { started = false; }
      const cx = toCanvasX(x);
      const cy = toCanvasY(y);
      if (cy < -1000 || cy > height + 1000) { started = false; prevY = y; continue; }
      if (!started) { ctx.moveTo(cx, cy); started = true; } else { ctx.lineTo(cx, cy); }
      prevY = y;
    }
    ctx.stroke();
  });

  return hasError;
}

export default function GraphingTool({ courseId, lessonId, onSaved }: Props) {
  const [config, setConfig] = useState<GraphConfig>(DEFAULT_CONFIG);
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [graphTitle, setGraphTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadGraphs = useCallback(async () => {
    let query = supabase.from('graphs').select('*').order('created_at', { ascending: false });
    if (lessonId) { query = query.eq('lesson_id', lessonId); }
    else if (courseId) { query = query.eq('course_id', courseId).is('lesson_id', null); }
    else { query = query.is('course_id', null).is('lesson_id', null); }
    const { data } = await query;
    if (data) setGraphs(data as Graph[]);
  }, [courseId, lessonId]);

  useEffect(() => { loadGraphs(); }, [loadGraphs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hasError = renderGraphToCanvas(canvas, config);
    setError(hasError ? 'Some functions have syntax errors and were not plotted.' : null);
  }, [config]);

  const handleSave = async () => {
    const payload = {
      title: graphTitle.trim() || config.title || 'Untitled Graph',
      config: config as any,
      lesson_id: lessonId,
      course_id: lessonId ? null : courseId,
    };
    await supabase.from('graphs').insert(payload);
    setGraphTitle('');
    loadGraphs();
    onSaved?.();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('graphs').delete().eq('id', id);
    loadGraphs();
  };

  const handleLoadGraph = (g: Graph) => { setConfig(g.config); setGraphTitle(g.title); };

  const addFunction = () => {
    setConfig((prev) => ({
      ...prev,
      functions: [...prev.functions, { expression: 'x', color: COLORS[prev.functions.length % COLORS.length], label: '' }],
    }));
  };

  const updateFunction = (index: number, field: 'expression' | 'color' | 'label', value: string) => {
    setConfig((prev) => ({
      ...prev,
      functions: prev.functions.map((fn, i) => i === index ? { ...fn, [field]: value } : fn),
    }));
  };

  const removeFunction = (index: number) => {
    setConfig((prev) => ({ ...prev, functions: prev.functions.filter((_, i) => i !== index) }));
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Graph Display */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-transparent px-5 py-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <LineChart className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-slate-900">Interactive Graph</h3>
        </div>
        <div className="p-4">
          <canvas
            ref={canvasRef}
            className="w-full h-[400px] rounded-lg border border-slate-200"
            style={{ width: '100%', height: '400px' }}
          />
          {error && <div className="mt-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{error}</div>}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Functions & Settings</h3>
          <button
            onClick={addFunction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 text-sm font-medium hover:bg-brand-100 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Function
          </button>
        </div>
        <div className="p-5 space-y-4">
          {config.functions.map((fn, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-mono text-slate-500">f{i + 1}(x) =</span>
                <input
                  type="color"
                  value={fn.color}
                  onChange={(e) => updateFunction(i, 'color', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={fn.expression}
                onChange={(e) => updateFunction(i, 'expression', e.target.value)}
                placeholder="e.g. sin(x), x^2, exp(-x^2)"
                className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              />
              <button
                onClick={() => removeFunction(i)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            {(['X Min', 'X Max', 'Y Min', 'Y Max'] as const).map((label, idx) => {
              const rangeIdx = idx % 2;
              const isX = idx < 2;
              return (
                <div key={label}>
                  <label className="text-xs font-medium text-slate-500 block mb-1">{label}</label>
                  <input
                    type="number"
                    value={isX ? config.xRange[rangeIdx] : config.yRange[rangeIdx]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setConfig((prev) => ({
                        ...prev,
                        xRange: isX ? (rangeIdx === 0 ? [val, prev.xRange[1]] : [prev.xRange[0], val]) : prev.xRange,
                        yRange: !isX ? (rangeIdx === 0 ? [val, prev.yRange[1]] : [prev.yRange[0], val]) : prev.yRange,
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-xs font-medium text-slate-500">Quick range:</span>
            {([
              { label: 'Default [-10,10]', x: [-10, 10] as [number, number], y: [-10, 10] as [number, number] },
              { label: '[-π, π]', x: [-Math.PI, Math.PI] as [number, number], y: [-2, 2] as [number, number] },
              { label: '[0, 10]', x: [0, 10] as [number, number], y: [0, 10] as [number, number] },
              { label: '[-5, 5]', x: [-5, 5] as [number, number], y: [-5, 5] as [number, number] },
            ]).map((preset) => (
              <button
                key={preset.label}
                onClick={() => setConfig((prev) => ({ ...prev, xRange: preset.x, yRange: preset.y }))}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <input
              type="text"
              placeholder="Graph title (for saving)"
              value={graphTitle}
              onChange={(e) => setGraphTitle(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <Save className="w-4 h-4" /> Save Graph
            </button>
          </div>
        </div>
      </div>

      {/* Saved Graphs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-slate-900">Saved Graphs ({graphs.length})</h3>
        </div>
        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
          {graphs.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">No graphs saved yet.</div>
          ) : (
            graphs.map((g) => (
              <div key={g.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">{g.title}</div>
                  <div className="text-xs text-slate-400">
                    {g.config.functions.length} function{g.config.functions.length !== 1 ? 's' : ''} · x:[{g.config.xRange[0]}, {g.config.xRange[1]}]
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleLoadGraph(g)} className="text-xs px-3 py-1 rounded bg-brand-50 text-brand-600 hover:bg-brand-100 font-medium transition-colors">Load</button>
                  <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors">
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

function niceStep(rough: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow;
  let step: number;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  return step * pow;
}

function formatNumber(n: number): string {
  if (Math.abs(n) < 1e-10) return '0';
  if (Math.abs(n) >= 1000 || (Math.abs(n) < 0.01 && n !== 0)) return n.toExponential(1);
  return String(Math.round(n * 100) / 100);
}
