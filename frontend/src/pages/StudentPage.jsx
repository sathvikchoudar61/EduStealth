import { useEffect, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
// If Prism.js is available, import it for syntax highlighting
// import Prism from 'prismjs';
// import 'prismjs/themes/prism.css';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

function isAnswerUnlocked(questionDate) {
  const today = new Date();
  const qDate = new Date(questionDate);
  today.setHours(0, 0, 0, 0);
  qDate.setHours(0, 0, 0, 0);
  return today > qDate;
}

export default function StudentPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [openIdx, setOpenIdx] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  useEffect(() => {
    const getTodayString = () => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const todayStr = getTodayString();

    fetch(`${API_URL}/api/questions/dates`)
      .then(res => res.ok ? res.json() : [])
      .then(apiDates => {
        const uniqueDates = new Set(apiDates.map(d => d.slice(0, 10)));
        uniqueDates.add(todayStr);
        const sortedDates = Array.from(uniqueDates).sort((a, b) => new Date(b) - new Date(a));
        setDates(sortedDates);
      })
      .catch(() => {
        setDates([todayStr]);
      });
  }, [API_URL]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/questions?date=${selectedDate}`)
      .then(res => {
        if (!res.ok) throw new Error('No questions for this date.');
        return res.json();
      })
      .then(data => {
        setQuestions(data);
        setOpenIdx(null);
        setLoading(false);
      })
      .catch(err => {
        setError('No questions for this date.');
        setQuestions([]);
        setLoading(false);
      });
  }, [selectedDate]);

  return (
    <section className="w-full max-w-6xl mx-auto bg-white border border-[#e5e7eb] rounded-xl px-2 sm:px-4 md:px-8 py-6 sm:py-8 mt-4 sm:mt-8">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-between w-full mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight text-center sm:text-left w-full sm:w-auto">Java DSA Questions</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="font-medium text-gray-900 text-base sm:text-lg" htmlFor="date-select">Date:</label>
          <select
            id="date-select"
            className="w-full sm:w-auto border border-[#e5e7eb] bg-white text-base sm:text-lg"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          >
            {dates.map(date => (
              <option key={date} value={date}>{formatDate(date)}</option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <p className="text-base text-gray-500 text-center py-8">Loading...</p>
      ) : error ? (
        <p className="text-red-500 text-center text-base font-semibold py-8">{error}</p>
      ) : questions.length === 0 ? (
        <p className="text-gray-500 text-center text-base font-semibold py-8">No question uploaded as per now</p>
      ) : (
        <ul className="divide-y divide-[#e5e7eb]">
          {questions.map((q, idx) => (
            <li key={q._id} className="py-3 sm:py-4 px-0 sm:px-2 md:px-4">
              <button
                className={`flex items-center justify-between w-full text-left focus:outline-none rounded-lg transition bg-gray-100 text-gray-900 font-semibold text-base px-3 sm:px-4 py-2 sm:py-3 ${openIdx === idx ? 'ring-2 ring-neutral-400' : 'hover:bg-gray-200'}`}
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                aria-expanded={openIdx === idx}
              >
                <span className="truncate max-w-[80vw] sm:max-w-none">Q{idx + 1}: {q.questionName}</span>
                <svg
                  className={`h-5 w-5 ml-2 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIdx === idx && (
                <div className="mt-3 sm:mt-4">
                  <pre className="text-gray-800 mb-2 whitespace-pre-line font-sans text-sm sm:text-base bg-gray-50 rounded p-2 sm:p-3 border border-gray-200 overflow-x-auto max-w-full">{q.question}</pre>
                  {isAnswerUnlocked(selectedDate) ? (
                    <div className="relative mt-2">
                      <button
                        className="absolute top-2 right-2 text-xs text-gray-300 hover:text-white bg-black bg-opacity-40 rounded px-2 py-1 border border-gray-700 shadow-sm transition z-10"
                        onClick={() => {
                          navigator.clipboard.writeText(q.answer);
                        }}
                        title="Copy to clipboard"
                      >
                        Copy
                      </button>
                      <div className="bg-gradient-to-br from-[#232946] to-[#3a3a5d] rounded-xl shadow-lg overflow-x-auto my-4">
                        <SyntaxHighlighter
                          language="java"
                          style={atomOneDark}
                          customStyle={{ background: 'transparent', fontSize: '1rem', padding: '1.5em 1em 1em 1em', borderRadius: '0.75rem', minWidth: 0 }}
                          showLineNumbers={false}
                        >
                          {q.answer}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 italic flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6v2m-6 4v-2a6 6 0 1112 0v2M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Answer will be unlocked tomorrow!
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
} 