import { useState, useEffect, useRef } from 'react';
import {
  Sigma, LineChart, FileText, BookOpen, ArrowRight, Check, Menu, X,
  FunctionSquare, PenTool, Share2, Zap, Sparkles, ChevronDown,
} from 'lucide-react';
import { renderLatex } from '@/lib/mathParser';

type Props = {
  onEnterApp: () => void;
};

export default function LandingPage({ onEnterApp }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-lg border-b border-slate-200/80 shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className={`font-bold text-lg ${scrolled ? 'text-slate-900' : 'text-white'}`}>Theorem</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollTo('features')} className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-brand-600' : 'text-white/80 hover:text-white'}`}>Features</button>
              <button onClick={() => scrollTo('equations')} className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-brand-600' : 'text-white/80 hover:text-white'}`}>Equations</button>
              <button onClick={() => scrollTo('graphing')} className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-brand-600' : 'text-white/80 hover:text-white'}`}>Graphing</button>
              <button onClick={() => scrollTo('journals')} className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-brand-600' : 'text-white/80 hover:text-white'}`}>Journals</button>
              <button onClick={() => scrollTo('pricing')} className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-brand-600' : 'text-white/80 hover:text-white'}`}>Pricing</button>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={onEnterApp}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-sm hover:shadow-md"
              >
                Launch App
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 ${scrolled ? 'text-slate-700' : 'text-white'}`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3">
            <button onClick={() => scrollTo('features')} className="block w-full text-left text-slate-700 font-medium py-2">Features</button>
            <button onClick={() => scrollTo('equations')} className="block w-full text-left text-slate-700 font-medium py-2">Equations</button>
            <button onClick={() => scrollTo('graphing')} className="block w-full text-left text-slate-700 font-medium py-2">Graphing</button>
            <button onClick={() => scrollTo('journals')} className="block w-full text-left text-slate-700 font-medium py-2">Journals</button>
            <button onClick={onEnterApp} className="block w-full text-center py-2.5 rounded-lg bg-brand-600 text-white font-semibold">Launch App</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative mesh-gradient overflow-hidden pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-white/90 text-xs font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5 text-brand-300" />
                The complete math learning platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6 text-balance">
                Write, derive, and
                <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent"> publish </span>
                mathematics.
              </h1>

              <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-xl">
                Theorem is a learning management system built for math students. Compose LaTeX equations, plot functions interactively, and export your work as professional academic journals.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onEnterApp}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-900 font-semibold text-base hover:bg-slate-100 transition-all shadow-xl hover:shadow-2xl group"
                >
                  Get Started Free
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => scrollTo('features')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl glass text-white font-semibold text-base hover:bg-white/10 transition-all"
                >
                  Explore Features
                </button>
              </div>

              <div className="flex items-center gap-6 mt-10 text-slate-400 text-sm">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-brand-400" />
                  No installation
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-brand-400" />
                  Works in browser
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-brand-400" />
                  Export to PDF
                </div>
              </div>
            </div>

            {/* Right: Visual showcase */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <HeroShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-slate-200 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '6+', label: 'Symbol categories' },
              { value: '8+', label: 'Equation templates' },
              { value: '∞', label: 'Functions to plot' },
              { value: '2', label: 'Export formats' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">Features</div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Everything you need to learn and publish math</h2>
            <p className="text-lg text-slate-500">Four powerful tools in one cohesive platform, designed for how mathematics is actually studied.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <FeatureCard
              icon={BookOpen}
              title="Course Management"
              description="Organize your studies into courses and lessons. Write rich content with markdown, LaTeX math, and automatic saving."
              points={['Unlimited courses & lessons', 'Auto-save as you type', 'Live preview mode']}
              color="brand"
            />
            <FeatureCard
              icon={Sigma}
              title="LaTeX Equation Editor"
              description="Write beautiful equations with a searchable symbol palette, live KaTeX preview, and ready-made templates."
              points={['100+ math symbols', '8 equation templates', 'Copy LaTeX to clipboard']}
              color="cyan"
            />
            <FeatureCard
              icon={LineChart}
              title="Interactive Graphing"
              description="Plot multiple functions simultaneously on a clean canvas. Adjust ranges, use presets, and save configurations."
              points={['Multi-function plotting', 'Adjustable X/Y ranges', 'Discontinuity detection']}
              color="emerald"
            />
            <FeatureCard
              icon={FileText}
              title="Journal Export"
              description="Compile lessons, equations, and graphs into formatted academic journals. Export to PDF or HTML."
              points={['PDF with math rendering', 'Standalone HTML export', 'Mix text, equations & graphs']}
              color="amber"
            />
          </div>
        </div>
      </section>

      {/* Equation showcase */}
      <section id="equations" className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">Equations</div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">A symbol palette that thinks like a mathematician</h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Browse Greek letters, calculus operators, set theory notation, and more. Search by name, click to insert, and see your equation rendered instantly with KaTeX.
              </p>
              <div className="space-y-3">
                {[
                  { icon: FunctionSquare, text: 'Live rendering as you type' },
                  { icon: PenTool, text: '8 pre-built templates for common equations' },
                  { icon: Share2, text: 'Copy LaTeX source to use anywhere' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4.5 h-4.5 text-brand-600" />
                    </div>
                    <span className="text-slate-700 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equation preview card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs text-slate-400 ml-2 font-mono">equation-editor.tex</span>
              </div>
              <div className="space-y-4">
                {[
                  'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
                  'e^{i\\pi} + 1 = 0',
                  '\\int_a^b f(x)\\, dx = F(b) - F(a)',
                  '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
                ].map((latex) => (
                  <div key={latex} className="text-center py-3 bg-slate-50 rounded-xl border border-slate-100" dangerouslySetInnerHTML={{ __html: renderLatex(latex, true) }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Graphing showcase */}
      <section id="graphing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Graph visual */}
            <div className="order-2 lg:order-1">
              <GraphPreview />
            </div>

            <div className="order-1 lg:order-2">
              <div className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">Graphing</div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Visualize functions the moment you write them</h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Plot sine waves, polynomials, exponentials, and more on an interactive canvas. Overlay multiple functions with distinct colors, tune the viewport, and save configurations for later.
              </p>
              <div className="space-y-3">
                {[
                  { icon: LineChart, text: 'Plot unlimited functions simultaneously' },
                  { icon: Zap, text: 'Smart discontinuity detection for clean renders' },
                  { icon: Check, text: 'Quick range presets including [-π, π]' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4.5 h-4.5 text-emerald-600" />
                    </div>
                    <span className="text-slate-700 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journal showcase */}
      <section id="journals" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-sm font-semibold text-brand-400 uppercase tracking-wide mb-3">Journals</div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Publish your work as professional journals</h2>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                Combine your lesson notes, saved equations, and graph configurations into a single formatted document. Export to print-ready PDF or standalone HTML.
              </p>
              <div className="space-y-3">
                {[
                  'WYSIWYG journal builder with block-based editing',
                  'PDF export with properly rendered mathematics',
                  'HTML export with KaTeX for standalone viewing',
                  'Mix text, equations, graphs, and headings freely',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-brand-400 flex-shrink-0" />
                    <span className="text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Journal preview card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
              <div className="text-center pb-4 mb-6 border-b-2 border-brand-600">
                <h3 className="text-2xl font-bold text-slate-900 font-serif">On the Fundamental Theorem</h3>
                <p className="text-xs text-slate-400 mt-1">October 2026</p>
              </div>
              <div className="space-y-4 text-slate-700">
                <p className="text-sm leading-relaxed font-serif">The fundamental theorem connects differentiation and integration:</p>
                <div className="text-center py-3 bg-slate-50 rounded-lg" dangerouslySetInnerHTML={{ __html: renderLatex('\\int_a^b f(x)\\, dx = F(b) - F(a)', true) }} />
                <p className="text-sm leading-relaxed font-serif">This elegant result unifies two seemingly distinct operations…</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">Pricing</div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-slate-500">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Student</h3>
              <p className="text-sm text-slate-500 mb-6">For individual learners</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$0</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited courses & lessons', 'LaTeX equation editor', 'Interactive graphing', 'Journal export (HTML)', 'Auto-save'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Check className="w-4.5 h-4.5 text-brand-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onEnterApp}
                className="w-full py-3 rounded-xl bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Pro plan */}
            <div className="bg-slate-900 rounded-2xl p-8 relative shadow-xl">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-semibold">Popular</div>
              <h3 className="text-lg font-bold text-white mb-1">Scholar</h3>
              <p className="text-sm text-slate-400 mb-6">For serious students & educators</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$9</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Everything in Student', 'PDF journal export', 'Saved graph configurations', 'Equation library across courses', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-200">
                    <Check className="w-4.5 h-4.5 text-brand-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onEnterApp}
                className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Ready to elevate your mathematics?</h2>
          <p className="text-lg text-slate-500 mb-8">Join students using Theorem to learn, derive, and publish.</p>
          <button
            onClick={onEnterApp}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-600 text-white font-semibold text-lg hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl group"
          >
            Launch Theorem
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Logo light />
              <span className="font-bold text-white text-lg">Theorem</span>
            </div>
            <div className="text-sm">
              &copy; 2026 Theorem. Built for mathematics students.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`w-9 h-9 rounded-lg ${light ? 'bg-brand-600' : 'bg-brand-600'} flex items-center justify-center shadow-md`}>
      <Sigma className="w-5 h-5 text-white" />
    </div>
  );
}

function FeatureCard({
  icon: Icon, title, description, points, color,
}: {
  icon: typeof BookOpen; title: string; description: string; points: string[]; color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    brand: { bg: 'bg-brand-50', text: 'text-brand-600', border: 'hover:border-brand-300' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'hover:border-cyan-300' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'hover:border-emerald-300' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'hover:border-amber-300' },
  };
  const c = colorMap[color] || colorMap.brand;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow-lg transition-all ${c.border}`}>
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center mb-5`}>
        <Icon className={`w-6 h-6 ${c.text}`} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 leading-relaxed mb-4">{description}</p>
      <ul className="space-y-2">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2 text-sm text-slate-600">
            <Check className={`w-4 h-4 ${c.text} flex-shrink-0`} />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroShowcase() {
  return (
    <div className="relative">
      {/* Main card: Equation preview */}
      <div className="bg-white rounded-2xl shadow-2xl p-6 relative z-20 animate-scale-in">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-xs text-slate-400 ml-2 font-mono">theorem.app</span>
        </div>
        <div className="space-y-3">
          <div className="text-center py-4 bg-slate-50 rounded-xl" dangerouslySetInnerHTML={{ __html: renderLatex('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', true) }} />
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sigma className="w-3.5 h-3.5" />
            <span className="font-mono">Quadratic Formula</span>
          </div>
        </div>
      </div>

      {/* Floating card: Graph snippet */}
      <div className="absolute -bottom-8 -left-8 bg-white rounded-xl shadow-2xl p-4 z-30 hidden sm:block animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-1.5 mb-2">
          <LineChart className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-700">sin(x) & cos(x)</span>
        </div>
        <svg viewBox="0 0 120 60" className="w-32 h-16">
          <path d="M0,30 Q15,5 30,30 T60,30 T90,30 T120,30" fill="none" stroke="#2563eb" strokeWidth="2" />
          <path d="M0,30 Q15,55 30,30 T60,30 T90,30 T120,30" fill="none" stroke="#dc2626" strokeWidth="2" />
        </svg>
      </div>

      {/* Floating card: Journal */}
      <div className="absolute -top-6 -right-4 bg-white rounded-xl shadow-2xl p-3 z-30 hidden sm:block animate-fade-in" style={{ animationDelay: '0.45s' }}>
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold text-slate-700">Journal.pdf</span>
        </div>
      </div>
    </div>
  );
}

function GraphPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const xMin = -6.28, xMax = 6.28, yMin = -2.5, yMax = 2.5;
    const xScale = w / (xMax - xMin);
    const yScale = h / (yMax - yMin);
    const cx = (x: number) => (x - xMin) * xScale;
    const cy = (y: number) => h - (y - yMin) * yScale;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = -6; x <= 6; x++) {
      ctx.beginPath(); ctx.moveTo(cx(x), 0); ctx.lineTo(cx(x), h); ctx.stroke();
    }
    for (let y = -2; y <= 2; y++) {
      ctx.beginPath(); ctx.moveTo(0, cy(y)); ctx.lineTo(w, cy(y)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy(0)); ctx.lineTo(w, cy(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx(0), 0); ctx.lineTo(cx(0), h); ctx.stroke();

    // sin(x) - blue
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 300; i++) {
      const x = xMin + (i / 300) * (xMax - xMin);
      const y = Math.sin(x);
      if (i === 0) ctx.moveTo(cx(x), cy(y)); else ctx.lineTo(cx(x), cy(y));
    }
    ctx.stroke();

    // cos(x) - red
    ctx.strokeStyle = '#dc2626';
    ctx.beginPath();
    for (let i = 0; i <= 300; i++) {
      const x = xMin + (i / 300) * (xMax - xMin);
      const y = Math.cos(x);
      if (i === 0) ctx.moveTo(cx(x), cy(y)); else ctx.lineTo(cx(x), cy(y));
    }
    ctx.stroke();

    // x²/4 - green
    ctx.strokeStyle = '#059669';
    ctx.beginPath();
    for (let i = 0; i <= 300; i++) {
      const x = xMin + (i / 300) * (xMax - xMin);
      const y = (x * x) / 8;
      if (Math.abs(y) > yMax) continue;
      if (i === 0) ctx.moveTo(cx(x), cy(y)); else ctx.lineTo(cx(x), cy(y));
    }
    ctx.stroke();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LineChart className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold text-slate-800 text-sm">Interactive Graph</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-brand-600" /> sin(x)</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-red-600" /> cos(x)</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-emerald-600" /> x²/8</span>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-64 rounded-lg border border-slate-100" style={{ width: '100%', height: '256px' }} />
    </div>
  );
}
