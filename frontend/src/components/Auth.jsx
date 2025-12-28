import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AcademicCapIcon, UserIcon, EnvelopeIcon, LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { generateKeyPair, exportKey } from '../utils/crypto';

const Auth = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const validate = () => {
    const newErrors = {};
    if (!isLogin && !formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/api/auth/login`, { email: formData.email, password: formData.password });
        const userObj = { ...res.data.user, isDecoy: res.data.isDecoy };

        // E2E Key Gen (if not decoy)
        if (!userObj.isDecoy && !localStorage.getItem('edustealth_privateKey')) {
          try {
            const keys = await generateKeyPair();
            const priv = await exportKey(keys.privateKey);
            const pub = await exportKey(keys.publicKey);
            localStorage.setItem('edustealth_privateKey', priv);
            await axios.post(`${API_URL}/api/auth/public-key`, { publicKey: pub }, {
              headers: { Authorization: `Bearer ${res.data.token}` }
            });
          } catch (e) { console.error("Crypto Setup Failed", e); }
        }

        toast.success(`Welcome back!`);
        onAuth(userObj, res.data.token);
      } else {
        const payload = { ...formData };
        await axios.post(`${API_URL}/api/auth/register`, payload);
        const res = await axios.post(`${API_URL}/api/auth/login`, { email: formData.email, password: formData.password });

        if (file) {
          const uploadData = new FormData();
          uploadData.append('avatar', file);
          uploadData.append('userId', res.data.user.id);
          await axios.post(`${API_URL}/api/auth/avatar`, uploadData);
        }

        toast.success(`Account created! Your ID: ${res.data.user.eduId}`);

        // E2E Key Gen
        if (!res.data.isDecoy && !localStorage.getItem('edustealth_privateKey')) {
          try {
            const keys = await generateKeyPair();
            const priv = await exportKey(keys.privateKey);
            const pub = await exportKey(keys.publicKey);
            localStorage.setItem('edustealth_privateKey', priv);
            await axios.post(`${API_URL}/api/auth/public-key`, { publicKey: pub }, {
              headers: { Authorization: `Bearer ${res.data.token}` }
            });
          } catch (e) { console.error("Crypto Setup Failed", e); }
        }

        onAuth(res.data.user, res.data.token);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-6 font-outfit relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-xl w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden relative z-10"
      >
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="inline-flex bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg shadow-indigo-200 mb-6"
            >
              <AcademicCapIcon className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">EduStealth</h1>
            <p className="text-slate-500 font-medium">Your gateway to advanced learning.</p>
          </div>

          {/* Toggle */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl mb-8 relative">
            <motion.div
              className="absolute top-1.5 bottom-1.5 bg-white rounded-xl shadow-sm z-0"
              initial={false}
              animate={{
                left: isLogin ? '6px' : '50%',
                width: 'calc(50% - 9px)',
                x: isLogin ? 0 : 3
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl relative z-10 transition-colors ${isLogin ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >Login</button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl relative z-10 transition-colors ${!isLogin ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >Sign Up</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode='wait'>
              {!isLogin && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-5 overflow-hidden">
                  <div className="space-y-1">
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Username"
                        className={`modern-input w-full ${errors.username ? 'border-red-300 focus:border-red-500 bg-red-50/50' : ''}`}
                        style={{ paddingLeft: '3rem' }}
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>
                    {errors.username && <p className="text-xs text-red-500 font-medium pl-2">{errors.username}</p>}
                  </div>

                  <div className="relative group">
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    <label htmlFor="avatar-upload" className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-300 cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                        {file ? <span className="text-xs font-bold">✓</span> : <span className="text-xl">+</span>}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-700">{file ? file.name : 'Upload Avatar'}</p>
                        <p className="text-xs text-slate-400">Optional • Max 5MB</p>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email Address"
                  className={`modern-input w-full ${errors.email ? 'border-red-300 focus:border-red-500 bg-red-50/50' : ''}`}
                  style={{ paddingLeft: '3rem' }}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 font-medium pl-2">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="Password"
                  className={`modern-input w-full ${errors.password ? 'border-red-300 focus:border-red-500 bg-red-50/50' : ''}`}
                  style={{ paddingLeft: '3rem' }}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              {errors.password && <p className="text-xs text-red-500 font-medium pl-2">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 mt-4 flex justify-center items-center gap-2 group shadow-xl shadow-indigo-200"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="font-bold text-lg">{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;