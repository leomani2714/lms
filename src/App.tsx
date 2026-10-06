import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Sigma, LineChart, FileText, Plus, Trash2, ChevronRight,
  GraduationCap, Menu, X, FolderOpen, ArrowLeft, Sparkles, LogOut, User as UserIcon,
  Settings,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Course, Lesson } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import EquationEditor from '@/components/EquationEditor';
import GraphingTool from '@/components/GraphingTool';
import JournalBuilder from '@/components/JournalBuilder';
import LessonEditor from '@/components/LessonEditor';
import LandingPage from '@/components/LandingPage';
import AuthPage from '@/components/AuthPage';
import ProfileModal from '@/components/ProfileModal';

type Tab = 'lessons' | 'equations' | 'graphing' | 'journal';
type View = 'landing' | 'auth' | 'dashboard' | 'course';

const COURSE_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#65a30d', '#4f46e5'];

export default function App() {
  const { user, profile, loading: authLoading, signUp, signIn, signOut, updateProfile } = useAuth();
  const [view, setView] = useState<View>('landing');
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('lessons');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  const loadCourses = useCallback(async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) setCourses(data as Course[]);
    setLoading(false);
  }, []);

  const loadLessons = useCallback(async (courseId: string) => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('position', { ascending: true });
    if (data) setLessons(data as Lesson[]);
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const enterApp = () => {
    if (user) {
      setView('dashboard');
      loadCourses();
    } else {
      setView('auth');
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    await signIn(email, password);
    setView('dashboard');
    loadCourses();
  };

  const handleSignUp = async (email: string, password: string) => {
    await signUp(email, password);
    setView('dashboard');
    loadCourses();
  };

  const handleSignOut = async () => {
    await signOut();
    setView('landing');
    setSelectedCourse(null);
    setSelectedLesson(null);
    setCourses([]);
    setLessons([]);
  };

  const openCourse = (course: Course) => {
    setSelectedCourse(course);
    setView('course');
    setSelectedLesson(null);
    setActiveTab('lessons');
    loadLessons(course.id);
    setSidebarOpen(false);
  };

  const goHome = () => {
    setView('dashboard');
    setSelectedCourse(null);
    setSelectedLesson(null);
    setSidebarOpen(false);
  };

  const goLanding = () => {
    setView('landing');
    setSelectedCourse(null);
    setSelectedLesson(null);
  };

  const handleCreateCourse = async () => {
    if (!newCourseTitle.trim()) return;
    const { data } = await supabase.from('courses').insert({
      title: newCourseTitle.trim(),
      description: newCourseDesc.trim(),
      color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
    }).select().single();
    if (data) {
      setShowNewCourse(false);
      setNewCourseTitle('');
      setNewCourseDesc('');
      loadCourses();
      openCourse(data as Course);
    }
  };

  const handleDeleteCourse = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('courses').delete().eq('id', id);
    if (selectedCourse?.id === id) goHome();
    loadCourses();
  };

  const handleCreateLesson = async () => {
    if (!newLessonTitle.trim() || !selectedCourse) return;
    const { data } = await supabase.from('lessons').insert({
      title: newLessonTitle.trim(),
      course_id: selectedCourse.id,
      position: lessons.length,
    }).select().single();
    if (data) {
      setShowNewLesson(false);
      setNewLessonTitle('');
      loadLessons(selectedCourse.id);
      setSelectedLesson(data as Lesson);
    }
  };

  const handleDeleteLesson = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('lessons').delete().eq('id', id);
    if (selectedLesson?.id === id) setSelectedLesson(null);
    if (selectedCourse) loadLessons(selectedCourse.id);
  };

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: 'lessons', label: 'Lessons', icon: BookOpen },
    { id: 'equations', label: 'Equations', icon: Sigma },
    { id: 'graphing', label: 'Graphing', icon: LineChart },
    { id: 'journal', label: 'Journal', icon: FileText },
  ];

  if (view === 'landing') {
    return <LandingPage onEnterApp={enterApp} />;
  }

  if (view === 'auth' || (!authLoading && !user)) {
    return (
      <AuthPage
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onBack={() => setView('landing')}
      />
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2.5">
          <button onClick={goLanding} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Sigma className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-900 text-sm leading-tight">Theorem</div>
              <div className="text-xs text-slate-400">Math Learning Platform</div>
            </div>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1 rounded hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Home button */}
        <div className="px-3 pt-3">
          <button
            onClick={goHome}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'dashboard' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-4.5 h-4.5" />
            Dashboard
          </button>
        </div>

        {/* Courses list */}
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-3">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Courses</span>
            <button
              onClick={() => setShowNewCourse(true)}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="px-3 py-4 space-y-2">
              {[1,2,3].map((i) => (
                <div key={i} className="h-8 rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="px-3 py-4 text-xs text-slate-400">No courses yet. Click + to create one.</div>
          ) : (
            <div className="space-y-0.5">
              {courses.map((course) => (
                <div key={course.id}>
                  <button
                    onClick={() => openCourse(course)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors group ${
                      selectedCourse?.id === course.id ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: course.color }} />
                    <span className="flex-1 text-left truncate">{course.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {selectedCourse?.id === course.id && view === 'course' && (
                    <div className="ml-4 mt-0.5 mb-1 space-y-0.5 border-l border-slate-200 pl-3">
                      {lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => { setSelectedLesson(lesson); setActiveTab('lessons'); }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors group ${
                            selectedLesson?.id === lesson.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="flex-1 text-left truncate">{lesson.title}</span>
                          <button
                            onClick={(e) => handleDeleteLesson(lesson.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-red-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </button>
                      ))}
                      <button
                        onClick={() => setShowNewLesson(true)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        New Lesson
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-slate-200 space-y-1">
          {selectedCourse && view === 'course' && (
            <button
              onClick={(e) => handleDeleteCourse(selectedCourse.id, e)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete "{selectedCourse.title}"
            </button>
          )}
          {/* User profile */}
          {user && (
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-slate-50">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {(profile?.display_name || user.email || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowProfile(true)}>
                <div className="text-xs font-medium text-slate-700 truncate">
                  {profile?.display_name || user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              </div>
              <button
                onClick={() => setShowProfile(true)}
                className="p-1.5 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors flex-shrink-0"
                title="Profile settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button
            onClick={goLanding}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to homepage
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-20">
          <div className="px-4 lg:px-8 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            {view === 'course' && selectedCourse ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedCourse.color }} />
                <h1 className="text-lg font-semibold text-slate-900 truncate">{selectedCourse.title}</h1>
                {selectedCourse.description && (
                  <span className="hidden md:block text-sm text-slate-400 truncate">— {selectedCourse.description}</span>
                )}
              </>
            ) : (
              <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
            )}

            <div className="flex-1" />

            {view === 'course' && (
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-4 lg:p-8 max-w-5xl w-full mx-auto animate-fade-in">
          {view === 'dashboard' ? (
            <DashboardView courses={courses} onOpenCourse={openCourse} onCreateCourse={() => setShowNewCourse(true)} loading={loading} />
          ) : view === 'course' && selectedCourse ? (
            <>
              {activeTab === 'lessons' && (
                selectedLesson ? (
                  <LessonEditor
                    key={selectedLesson.id}
                    lesson={selectedLesson}
                    onSaved={() => loadLessons(selectedCourse.id)}
                  />
                ) : (
                  <LessonList
                    lessons={lessons}
                    onSelect={setSelectedLesson}
                    onNew={() => setShowNewLesson(true)}
                    courseColor={selectedCourse.color}
                  />
                )
              )}
              {activeTab === 'equations' && (
                <EquationEditor courseId={selectedCourse.id} lessonId={selectedLesson?.id ?? null} />
              )}
              {activeTab === 'graphing' && (
                <GraphingTool courseId={selectedCourse.id} lessonId={selectedLesson?.id ?? null} />
              )}
              {activeTab === 'journal' && (
                <JournalBuilder
                  courseId={selectedCourse.id}
                  lessonId={selectedLesson?.id ?? null}
                  courses={courses}
                  lessons={lessons}
                />
              )}
            </>
          ) : null}
        </main>
      </div>

      {/* Profile Modal */}
      {showProfile && user && (
        <ProfileModal
          profile={profile}
          email={user.email ?? ''}
          onClose={() => setShowProfile(false)}
          onSave={updateProfile}
        />
      )}

      {/* New Course Modal */}
      {showNewCourse && (
        <Modal onClose={() => setShowNewCourse(false)} title="Create New Course">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Course Title</label>
              <input
                type="text"
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                placeholder="e.g. Calculus I, Linear Algebra, Differential Equations"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCourse()}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Description (optional)</label>
              <textarea
                value={newCourseDesc}
                onChange={(e) => setNewCourseDesc(e.target.value)}
                placeholder="A brief description of the course"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-y"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowNewCourse(false)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors">Cancel</button>
              <button
                onClick={handleCreateCourse}
                disabled={!newCourseTitle.trim()}
                className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                Create Course
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Lesson Modal */}
      {showNewLesson && selectedCourse && (
        <Modal onClose={() => setShowNewLesson(false)} title="Create New Lesson">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Lesson Title</label>
              <input
                type="text"
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
                placeholder="e.g. Introduction to Limits, The Chain Rule"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateLesson()}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowNewLesson(false)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors">Cancel</button>
              <button
                onClick={handleCreateLesson}
                disabled={!newLessonTitle.trim()}
                className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                Create Lesson
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DashboardView({
  courses, onOpenCourse, onCreateCourse, loading,
}: {
  courses: Course[];
  onOpenCourse: (c: Course) => void;
  onCreateCourse: () => void;
  loading: boolean;
}) {
  const features = [
    { icon: Sigma, title: 'LaTeX Equations', desc: 'Write and render mathematical equations with a full symbol palette and live preview.', color: 'bg-brand-50 text-brand-600' },
    { icon: LineChart, title: 'Interactive Graphing', desc: 'Plot functions, adjust ranges, and visualize mathematical concepts in real time.', color: 'bg-emerald-50 text-emerald-600' },
    { icon: FileText, title: 'Journal Export', desc: 'Compile lessons, equations, and graphs into exportable PDF or HTML journals.', color: 'bg-amber-50 text-amber-600' },
    { icon: BookOpen, title: 'Course Management', desc: 'Organize learning into courses and lessons with rich text and math support.', color: 'bg-cyan-50 text-cyan-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-8 lg:p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Welcome to Theorem
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3 max-w-2xl leading-tight">
            Learn, derive, and publish mathematics
          </h1>
          <p className="text-brand-100 text-base max-w-xl leading-relaxed mb-6">
            A complete learning management system for math students — write LaTeX equations, plot functions, and export your work as academic journals.
          </p>
          <button
            onClick={onCreateCourse}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-brand-700 font-semibold text-sm hover:bg-brand-50 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Create Your First Course
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${f.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Your Courses</h2>
          <button
            onClick={onCreateCourse}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Course
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-32 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-slate-100 mb-3" />
                <div className="h-4 w-2/3 bg-slate-100 rounded mb-2" />
                <div className="h-3 w-full bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 text-sm mb-4">You haven't created any courses yet.</p>
            <button
              onClick={onCreateCourse}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => onOpenCourse(course)}
                className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:shadow-md hover:border-slate-300 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${course.color}15` }}>
                  <BookOpen className="w-5 h-5" style={{ color: course.color }} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">{course.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{course.description || 'No description'}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LessonList({
  lessons, onSelect, onNew, courseColor,
}: {
  lessons: Lesson[];
  onSelect: (l: Lesson) => void;
  onNew: () => void;
  courseColor: string;
}) {
  if (lessons.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 text-sm mb-4">No lessons in this course yet.</p>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: courseColor }}
        >
          <Plus className="w-4 h-4" /> Create Lesson
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-slate-900">Lessons ({lessons.length})</h2>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Lesson
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {lessons.map((lesson, i) => (
          <button
            key={lesson.id}
            onClick={() => onSelect(lesson)}
            className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:shadow-md hover:border-slate-300 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: `${courseColor}15`, color: courseColor }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">{lesson.title}</h3>
                <p className="text-sm text-slate-400 line-clamp-2">{lesson.content ? lesson.content.substring(0, 100) + '…' : 'Empty lesson — click to start writing'}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
