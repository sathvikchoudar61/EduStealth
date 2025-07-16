import React, { useState } from 'react';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import courseData from '../data.json';
import { Link } from 'react-router-dom';

export default function AssignmentsPage() {
  const assignments = courseData.assignments || [];
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 pt-16 px-2 md:px-6">
      <Link
        className="mb-6 mt-2 inline-block px-4 py-2 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-all shadow"
        to="/"
      >
        ← Back
      </Link>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center bg-indigo-50 border-l-4 border-indigo-400 rounded-r-xl px-4 py-2 shadow-sm">
            <ClipboardDocumentListIcon className="w-8 h-8 text-indigo-500 mr-2" />
            <h1 className="text-3xl font-extrabold text-indigo-800 tracking-tight">All Assignments</h1>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {assignments.map(a => (
            <button
              key={a.id}
              className="rounded-2xl border-2 border-indigo-100 bg-white shadow-lg flex flex-col items-start p-6 animate-fadeInUp hover:shadow-2xl transition-all group"
              onClick={() => setSelectedAssignment(a)}
              aria-label={`View details for ${a.title}`}
            >
              <span className="font-bold text-xl text-indigo-700 mb-1 group-hover:underline group-hover:text-indigo-900 transition-all text-left w-full">{a.title}</span>
              <span className="text-gray-500 text-sm mb-1 text-left w-full">Due: {a.due}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Assignment Modal Popup */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeInUp">
          <div className="relative bg-white rounded-2xl border border-indigo-200 shadow-2xl max-w-xl w-full mx-2 sm:mx-4 p-0 animate-fadeInUp flex flex-col transition-all duration-200">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none bg-white bg-opacity-90 rounded-full w-10 h-10 flex items-center justify-center shadow border border-gray-200 z-10 transition-all"
              onClick={() => setSelectedAssignment(null)}
              aria-label="Close"
              title="Close"
              tabIndex={0}
              style={{lineHeight:'1'}}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="16" y2="16"/><line x1="16" y1="6" x2="6" y2="16"/></svg>
            </button>
            <div className="px-7 pt-8 pb-7 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-100 scrollbar-track-transparent rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <ClipboardDocumentListIcon className="w-7 h-7 text-indigo-500" />
                <button
                  className="text-2xl font-bold text-indigo-800 flex-1 text-left hover:underline focus:underline"
                  style={{background:'none',border:'none',padding:0,margin:0,cursor:'pointer'}}
                  aria-label={`Assignment: ${selectedAssignment.title}`}
                  tabIndex={0}
                  onClick={() => {}}
                >
                  {selectedAssignment.title}
                </button>
              </div>
              <hr className="border-indigo-100 mb-3" />
              <span className="text-gray-500 text-sm mb-3 block">Due: {selectedAssignment.due}</span>
              <div className="text-gray-700 text-base whitespace-pre-line leading-relaxed" style={{minHeight:'48px'}}>{selectedAssignment.desc || 'No description.'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 