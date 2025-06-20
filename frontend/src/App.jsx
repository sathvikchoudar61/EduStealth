import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import StudentPage from './pages/StudentPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import QuestionPage from './pages/QuestionPage.jsx';
import NotFound from './pages/NotFound.jsx';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 text-base
        ${isActive ? 'bg-[#5b5be6] text-white shadow' : 'text-gray-900 hover:bg-[#ececff] hover:text-[#5b5be6]'}
      `}
    >
      {children}
    </Link>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full bg-[#f6f7fb]">
      <header className="sticky top-0 z-30 bg-white shadow-md border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 select-none">
            <span className="w-2 h-8 bg-[#5b5be6] rounded-full mr-2 hidden sm:inline-block"></span>
            <span className="font-extrabold text-2xl tracking-tight text-[#22223b]">Java Daily</span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex gap-4 items-center">
            <NavLink to="/">Student</NavLink>
            <NavLink to="/questions">Question</NavLink>
          </nav>
          {/* Hamburger for mobile */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded hover:bg-gray-100 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <svg className="w-8 h-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                <line x1="6" y1="18" x2="18" y2="6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="7" x2="20" y2="7" strokeLinecap="round" strokeWidth="3" />
                <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" strokeWidth="3" />
                <line x1="4" y1="17" x2="20" y2="17" strokeLinecap="round" strokeWidth="3" />
              </svg>
            )}
          </button>
        </div>
        {/* Mobile menu slide-in */}
        <div className={`fixed inset-0 z-40 transition-all duration-300 ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black bg-opacity-20 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setMenuOpen(false)}
          />
          {/* Slide-in menu */}
          <nav
            className={`absolute top-0 right-0 h-full w-64 bg-white shadow-lg border-l border-[#e5e7eb] flex flex-col gap-2 pt-20 px-6 transition-transform duration-300 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <NavLink to="/">Student</NavLink>
            <NavLink to="/questions">Question</NavLink>
          </nav>
        </div>
      </header>
      <main className="flex flex-col items-center justify-center w-full px-2">
        <Routes>
          <Route path="/" element={<StudentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/questions" element={<QuestionPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
