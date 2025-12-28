import React, { useState, useEffect } from 'react';
import { fetchAssignments } from '../services/api';
import { motion } from 'framer-motion';
import { ClipboardDocumentListIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchAssignments();
      setAssignments(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="animate-fadeIn">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight flex items-center gap-3">
            <span className="bg-purple-100 p-2 rounded-xl text-purple-600"><ClipboardDocumentListIcon className="w-8 h-8" /></span>
            Your Assignments
          </h1>
          <p className="text-slate-500 text-lg">Track your progress and upcoming deadlines.</p>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assign, i) => (
              <motion.div
                key={assign.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6"
              >
                <div className={`p-4 rounded-full ${assign.status === 'Pending' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>
                  {assign.status === 'Pending' ? <ClockIcon className="w-6 h-6" /> : <CheckCircleIcon className="w-6 h-6" />}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{assign.title}</h3>
                  <p className="text-slate-500">{assign.desc}</p>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <div className="text-sm font-medium text-slate-400 flex items-center gap-1">
                    <span>Due:</span>
                    <span className={`text-slate-700 ${assign.status === 'Pending' ? 'text-red-500' : ''}`}>{assign.due}</span>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${assign.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {assign.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}