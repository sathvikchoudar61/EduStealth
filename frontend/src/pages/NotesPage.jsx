import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function NotesPage() {
    const [notes, setNotes] = useState(() => {
        return JSON.parse(localStorage.getItem('decoy_notes') || '[]');
    });
    const [activeNote, setActiveNote] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        localStorage.setItem('decoy_notes', JSON.stringify(notes));
    }, [notes]);

    const addNote = () => {
        const newNote = {
            id: Date.now(),
            title: 'New Note',
            content: '',
            date: new Date().toLocaleDateString()
        };
        setNotes([newNote, ...notes]);
        setActiveNote(newNote);
    };

    const updateNote = (key, value) => {
        if (!activeNote) return;
        const updated = { ...activeNote, [key]: value };
        setActiveNote(updated);
        setNotes(notes.map(n => n.id === activeNote.id ? updated : n));
    };

    const deleteNote = (id, e) => {
        e.stopPropagation();
        setNotes(notes.filter(n => n.id !== id));
        if (activeNote?.id === id) setActiveNote(null);
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-white text-slate-800 font-sans">
            {/* Sidebar */}
            <aside className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
                <div className="p-4 border-b border-slate-200">
                    <h1 className="text-xl font-bold flex items-center gap-2 mb-4">
                        📒 My Notes
                    </h1>
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredNotes.map(note => (
                        <div
                            key={note.id}
                            onClick={() => setActiveNote(note)}
                            className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors ${activeNote?.id === note.id ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''}`}
                        >
                            <h3 className="font-semibold text-slate-900 truncate">{note.title || 'Untitled'}</h3>
                            <p className="text-xs text-slate-500 mt-1 truncate">{note.content || 'No content'}</p>
                            <span className="text-[10px] text-slate-400 mt-2 block">{note.date}</span>
                        </div>
                    ))}
                    {filteredNotes.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            No notes found.
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={addNote}
                        className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 flex items-center justify-center gap-2"
                    >
                        <PlusIcon className="w-4 h-4" /> New Note
                    </button>
                </div>
            </aside>

            {/* Editor */}
            <main className="flex-1 flex flex-col h-full bg-white relative">
                {activeNote ? (
                    <>
                        <div className="p-6 pb-2">
                            <input
                                value={activeNote.title}
                                onChange={e => updateNote('title', e.target.value)}
                                className="text-3xl font-bold w-full outline-none placeholder:text-slate-300 border-none bg-transparent"
                                placeholder="Note Title"
                            />
                            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                                <span>{activeNote.date}</span>
                                <button onClick={(e) => deleteNote(activeNote.id, e)} className="text-red-400 hover:text-red-600 flex items-center gap-1">
                                    <TrashIcon className="w-3 h-3" /> Delete
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-6 pt-0">
                            <textarea
                                value={activeNote.content}
                                onChange={e => updateNote('content', e.target.value)}
                                className="w-full h-full resize-none outline-none leading-relaxed text-slate-700 placeholder:text-slate-300 text-lg border-none bg-transparent"
                                placeholder="Start typing..."
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-300 flex-col gap-4">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                            <span className="text-4xl">📝</span>
                        </div>
                        <p>Select a note or create a new one</p>
                    </div>
                )}
            </main>
        </div>
    );
}
