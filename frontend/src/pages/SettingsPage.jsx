import React, { useState } from 'react';
import { UserCircleIcon, KeyIcon, BellIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState(true);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 py-10 space-y-8"
    >
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-500">Manage your account preferences and security.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <section className="lg:col-span-2 glass-card rounded-2xl p-6 bg-white/80">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <UserCircleIcon className="w-6 h-6 text-indigo-500" /> Profile Information
          </h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <img src={avatarPreview} className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-50" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <UserCircleIcon className="w-12 h-12" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-indigo-500 p-1.5 rounded-full text-white cursor-pointer hover:bg-indigo-600 transition-colors shadow">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Profile Photo</h3>
                <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Display Name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  className="modern-input w-full bg-white" placeholder="John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <input
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="modern-input w-full bg-white" placeholder="john@example.com" type="email"
                />
              </div>
            </div>
            <button className="btn-primary py-2 px-6 rounded-lg text-sm">Save Changes</button>
          </div>
        </section>

        {/* Side Panel */}
        <div className="space-y-8">
          {/* Security */}
          <section className="glass-card rounded-2xl p-6 bg-white/80">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <KeyIcon className="w-6 h-6 text-indigo-500" /> Security
            </h2>
            <div className="space-y-4">
              <input
                type="password" placeholder="Current Password"
                className="modern-input w-full bg-slate-50"
                value={oldPassword} onChange={e => setOldPassword(e.target.value)}
              />
              <input
                type="password" placeholder="New Password"
                className="modern-input w-full bg-slate-50"
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
              />
              <input
                type="password" placeholder="Confirm Password"
                className="modern-input w-full bg-slate-50"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              />
              <button className="w-full py-2 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-900 transition-colors text-sm">
                Update Password
              </button>
            </div>
          </section>

          {/* Notifications */}
          <section className="glass-card rounded-2xl p-6 bg-white/80">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BellIcon className="w-6 h-6 text-indigo-500" /> Notifications
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Push Notifications</span>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-green-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${notifications ? 'left-6.5' : 'left-0.5'}`} style={{ left: notifications ? '26px' : '2px' }} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}