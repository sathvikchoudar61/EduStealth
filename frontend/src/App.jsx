import React, { useState, useEffect } from 'react';
import Chat from './components/Chat.jsx';
import Auth from './components/Auth.jsx';
import ChatDM from './components/ChatDM.jsx';
import { AcademicCapIcon, ClipboardDocumentListIcon, BookOpenIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import courseData from './data.json';
import { Link, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import CoursesPage from './pages/CoursesPage.jsx';
import AssignmentsPage from './pages/AssignmentsPage.jsx';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

// Courses will be loaded from data.json
const fakeAssignments = [
  { id: 1, title: 'Algebra Worksheet', due: '2024-06-10' },
  { id: 2, title: 'Physics Lab Report', due: '2024-06-12' },
];
const fakeNotes = [
  { id: 1, title: 'Calculus Notes', snippet: 'Limits, derivatives, and integrals...' },
  { id: 2, title: 'Thermodynamics', snippet: 'Laws of thermodynamics summarized...' },
];

const navItems = [
  'Home',
  'Courses',
  'Assignments',
];

export default function App() {
  const [search, setSearch] = useState('');
  const [activeNav, setActiveNav] = useState('Home');
  const [showChatIcon, setShowChatIcon] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('edustealth_token');
    return token ? {} : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('edustealth_token') || '');
  const [unreadCount, setUnreadCount] = useState(0);
  const handleUnreadChange = (contactId, count) => {
    setUnreadCount(count);
  };
  const [navOpen, setNavOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notes, setNotes] = useState([]);
  const location = useLocation();
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadMap, setUnreadMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('edustealth_unreadMap') || '{}');
    } catch {
      return {};
    }
  });
  useEffect(() => {
    setCourses(courseData.courses || []);
    setAssignments(courseData.assignments || []);
    setNotes(courseData.notes || []);
  }, []);

  useEffect(() => {
    // On mount, try to load user from localStorage
    const token = localStorage.getItem('edustealth_token');
    const userStr = localStorage.getItem('edustealth_user');
    if (token && userStr) {
      setUser(JSON.parse(userStr));
      setToken(token);
    }
  }, []);

  useEffect(() => {
    // Close course modal on route change
    setSelectedCourse(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!user || !token) return;
    const API_URL = import.meta.env.VITE_API_URL;
    const SOCKET_URL = API_URL;
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.emit('join', user.id);

    socket.on('receive_message', msg => {
      const selfId = user._id || user.id;
      // Only increment unread count if the message is for the current user and not currently viewing that contact
      if (msg.receiverId === selfId) {
        setUnreadMap(prev => ({
          ...prev,
          [msg.senderId]: (prev[msg.senderId] || 0) + 1,
        }));
      }
      if (
        (window.location.pathname !== '/chat' && msg.senderId !== selfId) ||
        (window.location.pathname === '/chat' && document.visibilityState !== 'visible' && msg.senderId !== selfId)
      ) {
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('New course is available!', {
              body: 'Check out the new course now.',
              icon: '/favicon.ico',
            });
          } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification('New course is available!', {
                  body: 'Check out the new course now.',
                  icon: '/favicon.ico',
                });
              }
            });
          }
        }
        setHasUnread(true);
      }
    });

    return () => socket.disconnect();
  }, [user, token]);

  // Persist unreadMap to localStorage
  useEffect(() => {
    localStorage.setItem('edustealth_unreadMap', JSON.stringify(unreadMap));
  }, [unreadMap]);

  // Reset unread when Chat is opened and focused
  useEffect(() => {
    const handleVisibility = () => {
      if (window.location.pathname === '/chat' && document.visibilityState === 'visible') {
        setHasUnread(false);
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    return () => window.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (window.location.pathname === '/chat' && document.visibilityState === 'visible') {
      setHasUnread(false);
    }
  }, [location.pathname]);

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

  // Secret trigger logic
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.toLowerCase().includes('stealth')) {
      setShowChatIcon(true);
    } else {
      setShowChatIcon(false);
    }
  };

  // When opening a chat with a contact, reset unread count for that contact
  const handleSelectContact = (c) => {
    setChatOpen(true);
    if (c && c.id) {
      setUnreadMap(prev => ({ ...prev, [c.id]: 0 }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 pt-16 animate-fadeIn">
      <Toaster position="top-right" />
      {/* Navigation Bar */}
      <header className="fixed top-0 left-0 w-full z-50">
        <nav className="navbar bg-white shadow-sm border-b border-gray-100">
          <div className="navbar-content flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <AcademicCapIcon className="w-7 h-7 text-indigo-500" />
              <span className="nav-logo text-xl font-bold text-indigo-700">EduStealth</span>
            </div>
            {/* Hamburger for mobile */}
            <button className="md:hidden p-2 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300" onClick={() => setNavOpen(v => !v)}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="#6366f1" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div className="hidden md:flex gap-2 md:gap-4 items-center">
              <Link
                to="/"
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-sm border ${location.pathname === '/' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-indigo-700 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300'}`}
              >
                Home
              </Link>
              <Link
                to="/courses"
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-sm border ${location.pathname === '/courses' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-indigo-700 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300'}`}
              >
                Courses
              </Link>
              <Link
                to="/assignments"
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-sm border ${location.pathname === '/assignments' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-indigo-700 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300'}`}
              >
                Assignments
              </Link>
              {showChatIcon && (
                <Link
                  to="/chat"
                  className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500 text-white font-semibold shadow hover:bg-indigo-600 transition-all"
                  onClick={() => handleSelectContact(/* pass selected contact here if needed */)}
                  title="Open Chat"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                  Chat
                  {/* Only show unreadCount badge if not in stealth search mode */}
                  {search.toLowerCase().includes('stealth') ? null : (
                    Object.values(unreadMap).reduce((a, b) => a + b, 0) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full px-1.5 py-0.5">
                        {Object.values(unreadMap).reduce((a, b) => a + b, 0)}
                      </span>
                    )
                  )}
                </Link>
              )}
              <button
                className="ml-2 px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300 transition-all bg-white shadow-sm"
                onClick={handleLogout}
                title="Logout"
              >Logout</button>
            </div>
            {/* Mobile nav drawer */}
            {navOpen && (
              <div className="fixed inset-0 z-40 md:hidden" onClick={() => setNavOpen(false)}>
                <div className="absolute top-0 right-0 w-2/3 max-w-xs h-full bg-white shadow-2xl border-l border-indigo-100 flex flex-col gap-2 p-6 animate-fadeInUp" onClick={e => e.stopPropagation()}>
                  {navItems.map((item) => (
                    <button
                      key={item}
                      className={`w-full text-left px-4 py-3 rounded-lg font-semibold text-base mb-2 transition-all border ${activeNav === item ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-indigo-700 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300'}`}
                      onClick={() => { setActiveNav(item); setNavOpen(false); }}
                    >
                      {item}
                    </button>
                  ))}
                  <Link
                    to="/chat"
                    className="relative flex items-center gap-2 px-4 py-3 rounded-lg bg-indigo-500 text-white font-semibold shadow hover:bg-indigo-600 transition-all mb-2"
                    onClick={() => { setChatOpen(true); setNavOpen(false); }}
                    title="Open Chat"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                    Chat
                    {hasUnread && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                    {Object.values(unreadMap).reduce((a, b) => a + b, 0) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full px-1.5 py-0.5">
                        {Object.values(unreadMap).reduce((a, b) => a + b, 0)}
                      </span>
                    )}
                  </Link>
                  <button
                    className="mt-4 px-4 py-3 rounded-lg text-base font-semibold border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300 transition-all bg-white shadow-sm"
                    onClick={handleLogout}
                    title="Logout"
                  >Logout</button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      <Routes>
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/" element={
          <>
            {/* Fake Search Bar */}
            <div className="max-w-xl mx-auto mt-8 flex items-center gap-2">
              <input
                className="w-full border px-4 py-2 rounded-lg shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                placeholder="Search courses, assignments..."
                value={search}
                onChange={handleSearchChange}
              />
              <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-indigo-600 transition-all">Search</button>
            </div>

            {/* Dashboard Content */}
            <div className="max-w-6xl mx-auto mt-10 px-2 md:px-6">
              {/* CSE Courses */}
              <div className="flex items-center gap-2 mb-2">
                <Link to="/courses" className="flex items-center bg-indigo-50 border-l-4 border-indigo-400 rounded-r-xl px-4 py-2 shadow-sm hover:bg-indigo-100 group transition-all">
                  <AcademicCapIcon className="w-7 h-7 text-indigo-500 mr-2 group-hover:scale-110 transition-transform" />
                  <h2 className="text-2xl font-extrabold text-indigo-800 tracking-tight underline decoration-indigo-400 decoration-2 underline-offset-4">CSE Courses</h2>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {courses.map(course => (
                  <button
                    key={course.id}
                    className={`group w-full relative rounded-2xl border-2 border-indigo-100 bg-white shadow-lg hover:shadow-2xl transition-all flex flex-col items-center p-6 cursor-pointer overflow-hidden ${selectedCourse && selectedCourse.id === course.id ? 'ring-2 ring-indigo-400 border-indigo-300' : ''}`}
                    style={{ backgroundColor: 'white' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'white'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
                    onClick={() => setSelectedCourse(course)}
                    aria-expanded={selectedCourse && selectedCourse.id === course.id}
                    aria-controls={`course-content-${course.id}`}
                  >
                    <div className="flex flex-col items-center gap-2 w-full">
                      <AcademicCapIcon className="w-12 h-12 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                      <h3 className="font-bold text-lg text-indigo-800 text-center mb-1 w-full break-words">{course.title}</h3>
                      <p className="text-gray-500 text-sm text-center line-clamp-2 w-full">{course.desc}</p>
                    </div>
                    <span className="absolute top-3 right-3 bg-indigo-100 text-indigo-500 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">CSE</span>
                  </button>
                ))}
              </div>
              {/* Course Modal Popup */}
              {selectedCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeInUp">
                  <div className="relative bg-white rounded-2xl border border-indigo-200 shadow-2xl max-w-xl w-full mx-2 sm:mx-4 p-0 animate-fadeInUp flex flex-col transition-all duration-200">
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none bg-white bg-opacity-90 rounded-full w-10 h-10 flex items-center justify-center shadow border border-gray-200 z-10 transition-all"
                      onClick={() => setSelectedCourse(null)}
                      aria-label="Close"
                      title="Close"
                      tabIndex={0}
                      style={{lineHeight:'1'}}
                    >
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="16" y2="16"/><line x1="16" y1="6" x2="6" y2="16"/></svg>
                    </button>
                    <div className="px-7 pt-8 pb-7 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-100 scrollbar-track-transparent rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <AcademicCapIcon className="w-7 h-7 text-indigo-500" />
                        <h3 className="text-2xl font-bold text-indigo-800 flex-1">{selectedCourse.title}</h3>
                      </div>
                      <hr className="border-indigo-100 mb-3" />
                      <p className="text-gray-600 text-base mb-3 font-medium">{selectedCourse.desc}</p>
                      <div className="text-gray-700 text-base whitespace-pre-line leading-relaxed" style={{minHeight:'48px'}}>{selectedCourse.content || 'No content yet. Please add details in data.json.'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assignments */}
              <div className="flex items-center gap-2 mt-10 mb-2">
                <Link to="/assignments" className="flex items-center bg-indigo-50 border-l-4 border-indigo-400 rounded-r-xl px-4 py-2 shadow-sm hover:bg-indigo-100 group transition-all">
                  <ClipboardDocumentListIcon className="w-7 h-7 text-indigo-500 mr-2 group-hover:scale-110 transition-transform" />
                  <h2 className="text-2xl font-extrabold text-indigo-800 tracking-tight underline decoration-indigo-400 decoration-2 underline-offset-4">Assignments</h2>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {assignments.map(a => (
                  <div key={a.id} className="rounded-2xl border-2 border-indigo-100 bg-white shadow-lg hover:shadow-2xl transition-all flex flex-col items-start p-6 animate-fadeInUp">
                    <div className="flex items-center gap-3 mb-2">
                      <ClipboardDocumentListIcon className="w-7 h-7 text-indigo-400" />
                      <span className="font-semibold text-lg text-indigo-800">{a.title}</span>
                    </div>
                    <span className="text-gray-500 text-sm mb-1">Due: {a.due}</span>
                    <div className="text-gray-600 text-base">{a.desc}</div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <h2 className="text-xl font-bold mt-10 mb-2 text-indigo-700 flex items-center gap-2"><BookOpenIcon className="w-6 h-6 text-indigo-400" /> Notes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {notes.map(note => (
                  <div key={note.id} className="rounded-2xl border-2 border-indigo-100 bg-white shadow-lg hover:shadow-2xl transition-all flex flex-col items-start p-6 animate-fadeInUp">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpenIcon className="w-7 h-7 text-indigo-400" />
                      <span className="font-semibold text-lg text-indigo-800">{note.title}</span>
                    </div>
                    <div className="text-gray-600 text-base">{note.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        } />
        <Route path="/chat" element={<Navigate to="/" replace />} />
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fadeIn">
            <svg width="96" height="96" fill="none" viewBox="0 0 96 96" className="mb-6">
              <circle cx="48" cy="48" r="46" stroke="#6366f1" strokeWidth="4" fill="#eef2ff" />
              <text x="48" y="60" textAnchor="middle" fontSize="48" fill="#6366f1" fontWeight="bold">404</text>
            </svg>
            <h1 className="text-5xl font-extrabold text-indigo-700 mb-3 drop-shadow">Page Not Found</h1>
            <p className="text-lg text-gray-500 mb-8 max-w-md">Sorry, the page you are looking for does not exist or has been moved. Please check the URL or return to the homepage.</p>
            <a href="/" className="inline-block px-6 py-3 rounded-full bg-indigo-500 text-white font-semibold text-lg shadow hover:bg-indigo-600 transition-all">Go to Home</a>
          </div>
        } />
      </Routes>

      {/* Chat UI */}
      {chatOpen && (
        <ChatDM user={user} token={token} onClose={() => setChatOpen(false)} unreadMap={unreadMap} setUnreadMap={setUnreadMap} />
      )}
      {/* Footer */}
      <footer className="w-full mt-16 py-6 bg-white border-t border-indigo-100 text-center text-gray-500 text-sm shadow-sm">
        © {new Date().getFullYear()} EduStealth. All rights reserved.
      </footer>
    </div>
  );
}
