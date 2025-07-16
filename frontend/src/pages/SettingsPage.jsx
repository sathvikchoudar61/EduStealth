import React, { useState } from 'react';

export default function SettingsPage() {
  // Profile info state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Notification toggle
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 pt-16 px-2 md:px-6 flex flex-col items-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 mt-8 mb-16">
        <h1 className="text-3xl font-extrabold text-indigo-800 mb-8">Settings</h1>
        {/* Profile Info */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-indigo-700 mb-4">Update Profile Info</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block font-semibold mb-1">Name</label>
              <input
                className="w-full border px-4 py-2 rounded-lg shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Email</label>
              <input
                className="w-full border px-4 py-2 rounded-lg shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email"
                type="email"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Avatar</label>
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
              {avatarPreview && (
                <img src={avatarPreview} alt="avatar preview" className="mt-2 rounded-full w-20 h-20 object-cover border border-indigo-200" />
              )}
            </div>
            <button className="mt-2 px-4 py-2 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-all self-start">Save Profile</button>
          </div>
        </section>
        {/* Change Password */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-indigo-700 mb-4">Change Password</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block font-semibold mb-1">Old Password</label>
              <input
                className="w-full border px-4 py-2 rounded-lg shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Old password"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">New Password</label>
              <input
                className="w-full border px-4 py-2 rounded-lg shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Confirm New Password</label>
              <input
                className="w-full border px-4 py-2 rounded-lg shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <button className="mt-2 px-4 py-2 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-all self-start">Change Password</button>
          </div>
        </section>
        {/* Notifications */}
        <section>
          <h2 className="text-xl font-bold text-indigo-700 mb-4">Notifications</h2>
          <div className="flex items-center gap-4">
            <span className="font-semibold">Enable Notifications</span>
            <button
              className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-200 ${notifications ? 'bg-indigo-500' : 'bg-gray-300'}`}
              onClick={() => setNotifications(v => !v)}
              aria-pressed={notifications}
              aria-label="Toggle notifications"
              type="button"
            >
              <span
                className={`h-5 w-5 bg-white rounded-full shadow transition-transform duration-200 ${notifications ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
} 