import React, { useState, useEffect } from 'react';
import { UserCircleIcon, KeyIcon, BellIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

function DecoyPasswordInput({ isVerified }) {
    const [decoy, setDecoy] = useState('');

    const handleUpdate = async () => {
        if (!decoy || decoy.length < 6) {
            return toast.error("Must be at least 6 chars");
        }
        try {
            const token = localStorage.getItem('edustealth_token');
            const res = await fetch(`${API_URL}/api/auth/decoy-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ decoyPassword: decoy })
            });
            if (res.ok) {
                toast.success("Decoy Password Set! 🎭");
                setDecoy('');
            } else {
                toast.error("Failed to update");
            }
        } catch (e) { toast.error("Error updating decoy"); }
    };

    return (
        <div className="flex gap-2">
            <input
                type="password"
                value={isVerified ? decoy : '••••••'}
                onChange={e => setDecoy(e.target.value)}
                readOnly={!isVerified}
                placeholder={isVerified ? "Set new decoy..." : "Locked"}
                className="modern-input flex-1 bg-white text-sm"
            />
            <button
                onClick={handleUpdate}
                disabled={!isVerified || !decoy}
                className="px-3 py-1 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 disabled:opacity-50"
            >
                Set
            </button>
        </div>
    );
}

export default function ProfilePage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [eduId, setEduId] = useState('');
    const [stealthCode, setStealthCode] = useState(() => localStorage.getItem('edustealth_trigger') || 'stealth');
    const [notifications, setNotifications] = useState(true);

    // Verification State
    const [isVerified, setIsVerified] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [verifyError, setVerifyError] = useState('');

    useEffect(() => {
        // Load user data
        const user = JSON.parse(localStorage.getItem('edustealth_user') || '{}');
        if (user.username) setName(user.username);
        if (user.email) setEmail(user.email);
        if (user.eduId) setEduId(user.eduId);
    }, []);

    const handleVerify = async () => {
        try {
            const token = localStorage.getItem('edustealth_token');
            const res = await fetch(`${API_URL}/api/auth/verify-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ password: passwordInput })
            });
            const data = await res.json();
            if (res.ok) {
                setIsVerified(true);
                setShowVerifyModal(false);
                setPasswordInput('');
                toast.success("Identity Verified!");
            } else {
                setVerifyError(data.message || 'Incorrect password');
            }
        } catch (e) {
            setVerifyError('Verification failed');
        }
    };

    const handleSaveStealth = () => {
        if (!stealthCode.trim()) {
            toast.error("Stealth code cannot be empty");
            return;
        }
        localStorage.setItem('edustealth_trigger', stealthCode.toLowerCase().trim());
        toast.success("Stealth code updated! 🤫");
    };

    const copyEduId = () => {
        navigator.clipboard.writeText(eduId);
        toast.success("ID Copied to clipboard!");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8 relative"
        >
            <header>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">My Profile</h1>
                <p className="text-slate-500">Manage your account and secret settings.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Section */}
                <section className="lg:col-span-2 glass-card rounded-2xl p-6 bg-white/80">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <UserCircleIcon className="w-6 h-6 text-indigo-500" /> Personal Info
                    </h2>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 ring-4 ring-indigo-50">
                                <UserCircleIcon className="w-12 h-12" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">{name || 'User'}</h3>
                                <p className="text-xs text-slate-500">Student Account</p>
                                {eduId && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md font-mono">{eduId}</span>
                                        <button onClick={copyEduId} className="text-xs text-slate-400 hover:text-indigo-600 font-medium transition-colors">
                                            Copy ID
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Display Name</label>
                                <input
                                    value={name} readOnly
                                    className="modern-input w-full bg-slate-50 text-slate-500 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                                <input
                                    value={email} readOnly
                                    className="modern-input w-full bg-slate-50 text-slate-500 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Side Panel */}
                <div className="space-y-8">
                    {/* Stealth Settings */}
                    <section className="glass-card rounded-2xl p-6 bg-white/80 border-2 border-indigo-50 relative overflow-hidden">
                        {!isVerified && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-6">
                                <ShieldCheckIcon className="w-12 h-12 text-slate-400 mb-2" />
                                <p className="text-slate-600 font-bold mb-3">Protected Settings</p>
                                <button
                                    onClick={() => setShowVerifyModal(true)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-200 font-bold text-sm hover:bg-indigo-700 transition-transform active:scale-95"
                                >
                                    Unlock to View
                                </button>
                            </div>
                        )}

                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <ShieldCheckIcon className="w-6 h-6 text-indigo-500" /> Privacy & Security
                        </h2>

                        {/* Stealth Trigger */}
                        <div className="mb-6">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Stealth Trigger Word</p>
                            <div className="space-y-2">
                                <input
                                    value={isVerified ? stealthCode : '••••••••'}
                                    onChange={e => isVerified && setStealthCode(e.target.value)}
                                    readOnly={!isVerified}
                                    placeholder="e.g. stealth"
                                    className="modern-input w-full bg-white font-mono text-center font-bold text-indigo-600"
                                />
                                <button
                                    onClick={handleSaveStealth}
                                    disabled={!isVerified}
                                    className="w-full py-2 rounded-lg bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition-colors text-xs disabled:opacity-50"
                                >
                                    Update Trigger
                                </button>
                            </div>
                        </div>

                        {/* Decoy Password */}
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Decoy Password</p>
                            <p className="text-[10px] text-slate-400 mb-2">Login with this to open the fake Notes app.</p>
                            <div className="space-y-2">
                                <DecoyPasswordInput isVerified={isVerified} />
                            </div>
                        </div>
                    </section>

                    {/* Notifications */}
                    <section className="glass-card rounded-2xl p-6 bg-white/80">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <BellIcon className="w-6 h-6 text-indigo-500" /> Preferences
                        </h2>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Push Notifications</span>
                            <button
                                onClick={() => setNotifications(!notifications)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-green-500' : 'bg-slate-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all`} style={{ left: notifications ? '26px' : '2px' }} />
                            </button>
                        </div>
                    </section>
                </div>
            </div>

            {/* Verify Modal */}
            {showVerifyModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Verify Identity</h3>
                        <p className="text-slate-500 text-sm mb-4">Enter your current password to unlock secret settings.</p>

                        <input
                            type="password"
                            autoFocus
                            value={passwordInput}
                            onChange={(e) => { setPasswordInput(e.target.value); setVerifyError(''); }}
                            placeholder="Current Password"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                        />
                        {verifyError && <p className="text-red-500 text-xs font-bold mb-4">{verifyError}</p>}

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => { setShowVerifyModal(false); setVerifyError(''); setPasswordInput(''); }}
                                className="text-slate-500 hover:text-slate-700 font-medium text-sm px-3 py-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerify}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-indigo-200 shadow-lg"
                            >
                                Verify
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
