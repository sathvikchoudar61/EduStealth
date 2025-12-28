import React, { useState, useEffect } from 'react';
import { fetchCourses } from '../services/api';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export default function CoursesPage({ onRead }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchCourses();
      setCourses(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className=" animate-fadeIn">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight flex items-center gap-3 justify-center md:justify-start">
            <span className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><BookOpenIcon className="w-8 h-8" /></span>
            Full Course Catalog
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">Browse our extensive library of computer science materials sourced directly from the Open Library.</p>
        </header>

        <div className="mb-10 relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter courses..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-slate-200 h-80 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filtered.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all border border-slate-100 group flex flex-col"
              >
                <div className="relative overflow-hidden rounded-xl mb-5 aspect-[3/4] shadow-inner bg-slate-100">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 mb-1 leading-tight">{course.title}</h3>
                  <p className="text-xs text-indigo-600 font-medium mb-3">{course.author}</p>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{course.desc}</p>
                  <button
                    onClick={() => onRead(course.link)}
                    className="block w-full py-2 rounded-lg bg-slate-50 text-indigo-600 font-semibold text-sm hover:bg-indigo-100 hover:text-indigo-700 transition-colors text-center"
                  >
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}