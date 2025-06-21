import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import StudentPage from './pages/StudentPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import QuestionPage from './pages/QuestionPage.jsx';
import NotFound from './pages/NotFound.jsx';
import AboutUs from './pages/AboutUs.jsx';
import ContactUs from './pages/ContactUs.jsx';
import Footer from './components/Footer.jsx';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-full font-medium transition duration-200 text-sm
        ${isActive ? 'bg-indigo-600 text-white shadow' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}
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
    <div className="min-h-screen flex flex-col bg-[#f6f7fb]">
      <header className="sticky top-0 z-30 bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-2 h-8 bg-indigo-600 rounded-full hidden sm:inline-block"></span>
            <span className="text-2xl font-bold tracking-tight text-gray-900">Java Daily</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4">
            <NavLink to="/">Student</NavLink>
            <NavLink to="/questions">Question</NavLink>
            <NavLink to="/about">About Us</NavLink>
            <NavLink to="/contact">Contact Us</NavLink>
          </nav>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <svg className="w-6 h-6 text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" strokeWidth="2" />
                <line x1="6" y1="18" x2="18" y2="6" strokeLinecap="round" strokeWidth="2" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="4" y1="7" x2="20" y2="7" strokeLinecap="round" strokeWidth="2" />
                <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" strokeWidth="2" />
                <line x1="4" y1="17" x2="20" y2="17" strokeLinecap="round" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Slide-in Menu */}
        <div className={`fixed inset-0 z-40 transition ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black bg-opacity-30 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setMenuOpen(false)}
          />
          {/* Menu */}
          <nav
            className={`absolute top-0 right-0 w-64 h-full bg-white border-l border-gray-200 transform transition-transform ${
              menuOpen ? 'translate-x-0' : 'translate-x-full'
            } flex flex-col pt-20 px-6 gap-3`}
          >
            <NavLink to="/">Student</NavLink>
            <NavLink to="/questions">Question</NavLink>
            <NavLink to="/about">About Us</NavLink>
            <NavLink to="/contact">Contact Us</NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-grow w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<StudentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/questions" element={<QuestionPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
