import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, BookOpenIcon, ClockIcon, UserIcon, TagIcon } from '@heroicons/react/24/outline';
import { fetchBookDetails } from '../services/api';

export default function BookDetailsModal({ bookId, onClose }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadDetails = async () => {
            setLoading(true);
            // The bookId is likely something like "/works/OL12345W". fetchBookDetails expects that.
            // If bookId passed is just the ID (OL...), we might need to prepend.
            // Based on previous api.js, course.id is "doc.key" which is "/works/..."
            const data = await fetchBookDetails(bookId);
            if (isMounted) {
                setDetails(data);
                setLoading(false);
            }
        };

        if (bookId) loadDetails();
        return () => { isMounted = false; };
    }, [bookId]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white z-10 transition-colors"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {loading ? (
                    <div className="w-full h-96 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                ) : !details ? (
                    <div className="w-full h-64 flex items-center justify-center text-white">
                        <p>Failed to load book details.</p>
                    </div>
                ) : (
                    <>
                        {/* Left: Image & Main Action */}
                        <div className="w-full md:w-1/3 bg-slate-800/50 p-4 md:p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-white/10 shrink-0">
                            <div className="relative shadow-2xl rounded-lg overflow-hidden w-32 md:w-48 aspect-[2/3] mb-4 md:mb-6 transform hover:scale-105 transition-transform duration-500">
                                {details.covers?.length > 0 ? (
                                    <img
                                        src={`https://covers.openlibrary.org/b/id/${details.covers[0]}-L.jpg`}
                                        alt={details.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-400">
                                        No Cover
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Right: Info */}
                        <div className="w-full md:w-2/3 p-5 md:p-8 overflow-y-auto custom-scrollbar bg-slate-900/40 text-white">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">
                                {details.title}
                            </h2>

                            <div className="flex flex-wrap gap-4 mb-6 text-sm text-slate-300">
                                <div className="flex items-center gap-1">
                                    <UserIcon className="w-4 h-4 text-indigo-400" />
                                    <span>{details.author}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <ClockIcon className="w-4 h-4 text-indigo-400" />
                                    <span>Published: {details.publishDate}</span>
                                </div>
                            </div>

                            <div className="prose prose-invert max-w-none mb-8">
                                <h3 className="text-lg font-semibold text-indigo-300 mb-2">About this Book</h3>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                                    {details.description}
                                </p>
                            </div>

                            {details.subjects?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <TagIcon className="w-4 h-4" />
                                        Topics
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {details.subjects.slice(0, 10).map((subject, idx) => (
                                            <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors">
                                                {subject}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </div >
    );
}
