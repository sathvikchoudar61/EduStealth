import React, { useState, useEffect } from 'react';
import Chat from './components/Chat.jsx';
import Auth from './components/Auth.jsx';
import ChatDM from './components/ChatDM.jsx';
import BookDetailsModal from './components/BookDetailsModal.jsx';
import NotesPage from './pages/NotesPage.jsx';
import { AcademicCapIcon, ClipboardDocumentListIcon, BookOpenIcon, ChatBubbleLeftRightIcon, MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import CoursesPage from './pages/CoursesPage.jsx';
import AssignmentsPage from './pages/AssignmentsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { fetchCourses, fetchAssignments } from './services/api';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = ['Home', 'Courses', 'Assignments'];

export default function App() {
  const [search, setSearch] = useState('');
  const [activeNav, setActiveNav] = useState('Home');
  const [showChatIcon, setShowChatIcon] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('edustealth_token');
    return token ? JSON.parse(localStorage.getItem('edustealth_user') || '{}') : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('edustealth_token') || '');
  const [unreadCount, setUnreadCount] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState(null);

  // Global Panic Hook (Esc x2)
  useEffect(() => {
    let lastEsc = 0;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEsc < 300) { // Double tap within 300ms
          // Panic Action
          setChatOpen(false);
          window.location.href = '/courses';
        }
        lastEsc = now;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Decoy State Check
  const isDecoy = user?.isDecoy;

  // Data State
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const [unreadMap, setUnreadMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem('edustealth_unreadMap') || '{}'); } catch { return {}; }
  });

  // Fetch Data
  useEffect(() => {
    if (isDecoy) return; // Don't fetch real data in decoy mode
    const loadData = async () => {
      setLoading(true);
      const [coursesData, assignmentsData] = await Promise.all([
        fetchCourses(),
        fetchAssignments()
      ]);
      setCourses(coursesData);
      setAssignments(assignmentsData);
      setLoading(false);
    };
    loadData();
  }, [isDecoy]);

  // Update Active Nav based on path
  useEffect(() => {
    if (location.pathname === '/') setActiveNav('Home');
    else if (location.pathname.includes('courses')) setActiveNav('Courses');
    else if (location.pathname.includes('assignments')) setActiveNav('Assignments');
    else if (location.pathname.includes('profile')) setActiveNav('Profile');
  }, [location.pathname]);

  useEffect(() => {
    // Close course modal on route change
    setSelectedCourse(null);
  }, [location.pathname]);

  // Socket Logic
  useEffect(() => {
    if (!user || !token || isDecoy) return;
    const API_URL = import.meta.env.VITE_API_URL;
    const socket = io(API_URL, { auth: { token }, transports: ['websocket'] });

    socket.emit('join', user.id || user._id);

    socket.on('receive_message', msg => {
      const selfId = user._id || user.id;
      if (msg.receiverId === selfId) {
        setUnreadMap(prev => ({ ...prev, [msg.senderId]: (prev[msg.senderId] || 0) + 1 }));
      }
    });

    return () => socket.disconnect();
  }, [user, token, isDecoy]);

  useEffect(() => {
    localStorage.setItem('edustealth_unreadMap', JSON.stringify(unreadMap));
  }, [unreadMap]);

  const handleAuth = (userObj, token) => {
    setUser(userObj);
    setToken(token);
    localStorage.setItem('edustealth_token', token);
    localStorage.setItem('edustealth_user', JSON.stringify(userObj));
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('edustealth_token');
    localStorage.removeItem('edustealth_user');
  };

  if (!user || !token) {
    return <Auth onAuth={handleAuth} />;
  }

  // DECOY MODE: Render ONLY Notes App
  if (isDecoy) {
    return (
      <React.Fragment>
        <Toaster position="top-right" />
        <div className="fixed top-4 right-4 z-50">
          <button onClick={handleLogout} className="text-xs text-slate-300 hover:text-red-400 transition-colors">Sign Out</button>
        </div>
        <NotesPage />
      </React.Fragment>
    );
  }

  // Secret Search Trigger
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    const trigger = localStorage.getItem('edustealth_trigger') || 'stealth';
    const isStealth = value.toLowerCase().trim() === trigger.toLowerCase();

    if (isStealth !== showChatIcon) {
      setShowChatIcon(isStealth);
      if (isStealth) {
        toast.success("Stealth Mode Activated 🥷", { icon: '🤫' });
      }
    }
  };


  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-outfit">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-panel px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <AcademicCapIcon className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">EduStealth</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 bg-white/50 px-6 py-2 rounded-full border border-white/60 shadow-sm backdrop-blur-md">
          {navItems.map(item => (
            <Link
              key={item}
              to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
              className={`font-medium text-sm transition-all duration-200 ${activeNav === item ? 'text-indigo-600 font-bold scale-105' : 'text-slate-500 hover:text-indigo-500'}`}
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {showChatIcon && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChatOpen(true)}
              className="relative p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-colors"
            >
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
              {Object.values(unreadMap).reduce((a, b) => a + b, 0) > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </motion.button>
          )}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <Link to="/profile" className="text-right hidden lg:block hover:opacity-80 transition-opacity">
              <p className="text-sm font-bold text-slate-900">{user.username}</p>
              <p className="text-xs text-slate-500">Student</p>
            </Link>
            <button onClick={handleLogout} className="text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors">
              LOGOUT
            </button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-slate-600" onClick={() => setNavOpen(!navOpen)}>
          {navOpen ? <XMarkIcon className="w-7 h-7" /> : <Bars3Icon className="w-7 h-7" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-20 z-40 bg-white/95 backdrop-blur-xl p-6 md:hidden flex flex-col gap-6"
          >
            {navItems.map(item => (
              <Link
                key={item}
                to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                onClick={() => setNavOpen(false)}
                className="text-2xl font-bold text-slate-800"
              >
                {item}
              </Link>
            ))}
            <Link to="/profile" onClick={() => setNavOpen(false)} className="text-2xl font-bold text-slate-800">Profile</Link>
            {showChatIcon && (
              <button onClick={() => { setChatOpen(true); setNavOpen(false); }} className="flex items-center gap-2 text-xl font-bold text-indigo-600">
                <ChatBubbleLeftRightIcon className="w-6 h-6" /> Chat
              </button>
            )}
            <button onClick={handleLogout} className="mt-auto btn-primary py-3 w-full">Logout</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto">
        <Routes>
          <Route path="/courses" element={<CoursesPage onRead={url => {
            const match = url.match(/\/works\/OL\w+/);
            if (match) setSelectedBookId(match[0]);
          }} />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/" element={
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">

              {/* Hero Search */}
              <div className="text-center max-w-2xl mx-auto space-y-6">
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                  Find your next <span className="text-indigo-600">adventure</span>
                </h1>
                <p className="text-slate-500 text-lg">Access study materials, track assignments, and collaborate in real-time.</p>
                <div className="relative group max-w-lg mx-auto">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search for stealth trigger..."
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-lg"
                  />
                </div>
              </div>

              {/* Courses Grid */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <BookOpenIcon className="w-6 h-6 text-indigo-500" /> Recent Courses
                  </h2>
                  <Link to="/courses" className="text-indigo-600 font-semibold hover:underline">View All</Link>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {courses.slice(0, 4).map((course, i) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => setSelectedCourse(course)}
                        className="glass-card p-4 rounded-2xl cursor-pointer group flex flex-col h-full"
                      >
                        <div className="relative overflow-hidden rounded-xl mb-4 aspect-[3/4]">
                          <img src={course.image} alt={course.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-white text-sm font-medium">View Details</span>
                          </div>
                        </div>
                        <h3 className="font-bold text-slate-900 line-clamp-1 mb-1">{course.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3 flex-1">{course.desc}</p>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mt-auto">
                          <span>{course.author}</span>
                          <span>{course.year}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              {/* Assignments Section */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardDocumentListIcon className="w-6 h-6 text-indigo-500" /> Pending Assignments
                  </h2>
                  <Link to="/assignments" className="text-indigo-600 font-semibold hover:underline">View All</Link>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse"></div>)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {assignments.slice(0, 4).map((assign, i) => (
                      <motion.div
                        key={assign.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                      >
                        <div className={`p-3 rounded-full ${assign.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                          <ClipboardDocumentListIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900">{assign.title}</h3>
                          <p className="text-sm text-slate-500">Due: {assign.due}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${assign.status === 'Pending' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                          {assign.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

            </motion.div>
          } />

          <Route path="/chat" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Course Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setSelectedCourse(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[80vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="md:w-2/5 bg-slate-100 relative">
                <img src={selectedCourse.image} className="w-full h-48 md:h-full object-cover" alt="Course" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:hidden" />
              </div>
              <div className="p-5 md:p-8 md:w-3/5 overflow-y-auto max-h-[60vh] md:max-h-[80vh]">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedCourse.title}</h2>
                <p className="text-indigo-600 font-medium text-sm mb-6">{selectedCourse.author} • {selectedCourse.year}</p>
                <div className="prose prose-slate prose-sm text-slate-600">
                  <p>{selectedCourse.desc}</p>
                  <p className="mt-4">This course covers fundamental concepts and advanced topics suitable for students at all levels. Access full materials in the library section.</p>
                </div>
                <div className="mt-8 flex flex-col gap-3">
                  <button
                    onClick={() => {
                      const link = selectedCourse.link;
                      const match = link.match(/\/works\/OL\w+/);
                      if (match) {
                        setSelectedBookId(match[0]);
                      }
                      setSelectedCourse(null);
                    }}
                    className="w-full py-3 text-center rounded-xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
                  >
                    View Details 📖
                  </button>
                  <button className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors" onClick={() => setSelectedCourse(null)}>Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Details Modal */}
      <AnimatePresence>
        {selectedBookId && (
          <BookDetailsModal
            bookId={selectedBookId}
            onClose={() => setSelectedBookId(null)}
          />
        )}
      </AnimatePresence>

      {/* Chat Interface */}
      {chatOpen && (
        <ChatDM user={user} token={token} onClose={() => setChatOpen(false)} unreadMap={unreadMap} setUnreadMap={setUnreadMap} />
      )}
    </div>
  );
}
