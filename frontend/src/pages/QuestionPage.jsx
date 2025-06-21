import { useEffect, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function QuestionPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openIdx, setOpenIdx] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/questions/all`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch questions.');
        return res.json();
      })
      .then(data => {
        setQuestions(shuffle(data));
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch questions.');
        setQuestions([]);
        setLoading(false);
      });
  }, []);

  return (
    <section className="w-full max-w-6xl mx-auto bg-white border border-[#e5e7eb] rounded-xl px-2 sm:px-4 md:px-8 py-6 sm:py-8 mt-4 sm:mt-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-8 text-center">All Previous Questions</h1>
      {loading ? (
        <p className="text-base text-gray-500 text-center py-8">Loading...</p>
      ) : error ? (
        <p className="text-red-500 text-center text-base font-semibold py-8">{error}</p>
      ) : questions.length === 0 ? (
        <p className="text-gray-500 text-center text-base font-semibold py-8">No previous questions found.</p>
      ) : (
        <ul className="divide-y divide-[#e5e7eb]">
          {questions.map((q, idx) => (
            <li key={q._id || idx} className="py-3 sm:py-4 px-0 sm:px-2 md:px-4">
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
                <div className="mt-3 sm:mt-4 transition-all duration-300 ease-in-out animate-fade-in">
                  <span className="text-xs text-gray-400 mb-1 block">Date: {formatDate(q.dateString || q.date)}</span>
                  <pre className="text-gray-800 mb-2 whitespace-pre-line font-sans text-sm sm:text-base bg-gray-50 rounded p-2 sm:p-3 border border-gray-200 overflow-x-auto max-w-full">{q.question}</pre>
                  <div className="relative mt-2">
                    <button
                      className="absolute top-2 right-2 text-xs text-gray-300 hover:text-white bg-black bg-opacity-40 rounded px-2 py-1 border border-gray-700 shadow-sm transition z-10"
                      onClick={() => {
                        navigator.clipboard.writeText(q.answer);
                        setCopiedIdx(idx);
                        setTimeout(() => setCopiedIdx(null), 1200);
                      }}
                      title="Copy to clipboard"
                    >
                      {copiedIdx === idx ? 'Copied!' : 'Copy'}
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
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
} 