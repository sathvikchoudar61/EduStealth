import { useState, useEffect } from 'react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

function Toast({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white font-semibold transition-all duration-300 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{message}<button className="ml-4 text-white font-bold" onClick={onClose}>×</button></div>
  );
}

export default function AdminPage() {
  const [questions, setQuestions] = useState([
    { questionName: '', question: '', answer: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [isFuture, setIsFuture] = useState(false);
  const [isPast, setIsPast] = useState(false);
  const [dates, setDates] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/questions/dates`)
      .then(res => res.json())
      .then(data => {
        setDates(data.map(d => d.slice(0, 10)));
      });
  }, []);

  useEffect(() => {
    const today = new Date();
    const sel = new Date(selectedDate);
    today.setHours(0, 0, 0, 0);
    sel.setHours(0, 0, 0, 0);
    setIsFuture(sel > today);
    setIsPast(sel < today);
    setToast({ message: '', type: 'success' });
    setLoading(true);
    fetch(`${API_URL}/api/questions?date=${selectedDate}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setQuestions(data.map(q => ({ questionName: q.questionName, question: q.question, answer: q.answer })));
        } else {
          setQuestions([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setQuestions([
          { questionName: '', question: '', answer: '' },
        ]);
        setLoading(false);
      });
  }, [selectedDate]);

  const handleChange = (idx, field, value) => {
    setQuestions(qs =>
      qs.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const handlePasswordSubmit = e => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setToast({ message: '', type: 'success' });
    } else {
      setToast({ message: 'Incorrect password.', type: 'error' });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setToast({ message: '', type: 'success' });
    const today = new Date();
    const sel = new Date(selectedDate);
    today.setHours(0, 0, 0, 0);
    sel.setHours(0, 0, 0, 0);
    try {
      const method = sel < today ? 'PATCH' : 'POST';
      const res = await fetch(`${API_URL}/api/questions`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, date: selectedDate }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: sel < today ? 'Questions updated for this date!' : 'Questions added for this date!', type: 'success' });
      } else {
        setToast({ message: data.message || 'Failed to save questions.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Server error.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/questions?date=${selectedDate}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setQuestions([
          { questionName: '', question: '', answer: '' },
        ]);
        setToast({ message: 'Questions deleted for this date.', type: 'success' });
      } else {
        setToast({ message: 'Failed to delete questions.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Server error.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Helper to get local date string in YYYY-MM-DD
  function getLocalDateString() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  if (!authenticated) {
    return (
      <section className="w-full max-w-md mx-auto mt-8 bg-white border border-[#e5e7eb] rounded-xl px-4 py-8">
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
        <h2 className="text-xl font-bold mb-4 text-gray-900">Admin Login</h2>
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full"
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="showpw" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} />
            <label htmlFor="showpw" className="text-sm text-gray-600">Show password</label>
          </div>
          <button type="submit" className="w-full">Login</button>
        </form>
      </section>
    );
  }

  return (
    <section className="w-full max-w-6xl mx-auto mt-4 sm:mt-8 bg-white border border-[#e5e7eb] rounded-xl px-2 sm:px-4 md:px-8 py-6 sm:py-8">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <h1 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-900 text-center sm:text-left">Admin: Add/Update Questions</h1>
      <div className="mb-6 sm:mb-8 flex flex-col md:flex-row items-center gap-4 sm:gap-6 justify-between">
        <label className="font-medium text-gray-900" htmlFor="date-select">Date:</label>
        <input
          type="date"
          id="date-select"
          className="w-full md:w-auto border border-[#e5e7eb] bg-white text-base sm:text-lg"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          max={getLocalDateString()}
        />
      </div>
      {isFuture ? (
        <p className="text-red-600 font-semibold text-center">Cannot add or update questions for a future date.</p>
      ) : (
        <form onSubmit={handleSubmit} className="divide-y divide-[#e5e7eb]">
          {questions.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No questions. Click 'Add Question' to create one.</div>
          ) : questions.map((q, idx) => (
            <div key={idx} className="py-4 sm:py-6 px-0 sm:px-2 md:px-4 flex flex-col gap-2 border-b border-[#e5e7eb] relative bg-white">
              <div className="flex flex-col md:flex-row gap-3 sm:gap-4 md:items-center mb-2">
                <span className="font-bold text-gray-900 min-w-[90px] sm:min-w-[110px] text-base sm:text-lg">Q{idx + 1}</span>
                <input
                  type="text"
                  className="w-full text-base sm:text-lg"
                  placeholder={`Question Name ${idx + 1}`}
                  value={q.questionName}
                  onChange={e => handleChange(idx, 'questionName', e.target.value)}
                  required
                />
              </div>
              <textarea
                className="w-full text-sm sm:text-base bg-gray-50 border border-gray-200 rounded p-2 sm:p-3 resize-y min-h-[80px]"
                placeholder={`Question ${idx + 1}`}
                value={q.question}
                onChange={e => handleChange(idx, 'question', e.target.value)}
                required
              />
              <textarea
                className="w-full font-mono text-sm sm:text-base bg-gray-50 border border-gray-200 rounded p-2 sm:p-3 resize-y min-h-[80px]"
                placeholder={`Answer ${idx + 1}`}
                value={q.answer}
                onChange={e => handleChange(idx, 'answer', e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-700 bg-white bg-opacity-80 rounded px-2 py-1 border border-red-200 shadow-sm transition"
                onClick={() => setQuestions(qs => qs.filter((_, i) => i !== idx))}
                title="Remove this question"
              >
                Remove
              </button>
            </div>
          ))}
          <div className="flex justify-center mt-4">
            <button
              type="button"
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold shadow-sm transition"
              onClick={() => setQuestions(qs => [...qs, { questionName: '', question: '', answer: '' }])}
            >
              Add Question
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 px-0 sm:px-2 md:px-4">
            <button
              type="submit"
              className="w-full text-base sm:text-lg"
              disabled={loading}
            >
              {loading ? (isPast ? 'Updating...' : 'Submitting...') : isPast ? 'Update Questions' : 'Add Questions'}
            </button>
            <button
              type="button"
              className="w-full bg-red-500 hover:bg-red-600 text-base sm:text-lg"
              disabled={loading}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete All
            </button>
          </div>
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-xl flex flex-col items-center">
                <p className="mb-4 text-lg font-semibold text-gray-800">Are you sure you want to delete all questions for this date?</p>
                <div className="flex gap-4">
                  <button className="bg-red-500 text-white px-4 py-2 rounded font-bold" onClick={handleDelete}>Yes, Delete</button>
                  <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded font-bold" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </form>
      )}
    </section>
  );
} 