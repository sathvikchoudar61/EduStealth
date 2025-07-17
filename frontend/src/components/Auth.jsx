import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = mode === 'login'
        ? `${API_URL}/api/auth/login`
        : `${API_URL}/api/auth/register`;
      const body = mode === 'login'
        ? { email, password }
        : { username, email, password };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Auth failed');
      if (mode === 'login') {
        localStorage.setItem('edustealth_token', data.token);
        onAuth(data.user, data.token);
      } else {
        setMode('login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <form className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6 text-center">{mode === 'login' ? 'Login' : 'Register'}</h2>
        {mode === 'register' && (
          <input
            className="w-full mb-3 border px-4 py-2 rounded-lg"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        )}
        <input
          className="w-full mb-3 border px-4 py-2 rounded-lg"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full mb-4 border px-4 py-2 rounded-lg"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 mb-3 text-center">{error}</div>}
        <button
          className="w-full bg-indigo-500 text-white py-2 rounded-lg font-semibold mb-2"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
        </button>
        <div className="text-center mt-2">
          {mode === 'login' ? (
            <span>Don&apos;t have an account?{' '}
              <button type="button" className="text-indigo-600 hover:underline" onClick={() => setMode('register')}>Register</button>
            </span>
          ) : (
            <span>Already have an account?{' '}
              <button type="button" className="text-indigo-600 hover:underline" onClick={() => setMode('login')}>Login</button>
            </span>
          )}
        </div>
      </form>
    </div>
  );
} 