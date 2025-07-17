import React, { useRef, useState, useEffect } from 'react';
import { encryptMessage, decryptMessage } from './crypto.js';
import { io } from 'socket.io-client';
import { TrashIcon } from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL;

function formatTime(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function Chat({ onClose, user, token, onUnreadChange }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selfDestructTimers, setSelfDestructTimers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const socketRef = useRef();
  const chatEndRef = useRef();

  const SOCKET_URL = API_URL;

  // Fetch contacts (for demo, just fetch all users except self)
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setContacts(data.filter(u => u.id !== user.id)))
      .catch(() => setError('Failed to load contacts'))
      .finally(() => setLoading(false));
  }, [token, user]);

  // Fetch chat history
  useEffect(() => {
    if (!selectedContact) return;
    setLoading(true);
    fetch(`${API_URL}/api/chat/history?withUserId=${selectedContact.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setMessages(
          data.map(msg => ({
            ...msg,
            content: decryptMessage(msg.content, token),
          }))
        );
      })
      .catch(() => setError('Failed to load messages'))
      .finally(() => setLoading(false));
  }, [selectedContact, token]);

  // Socket.IO setup (connect once)
  useEffect(() => {
    if (!selectedContact) return;
    if (socketRef.current) socketRef.current.disconnect();
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('join', user.id);
    });
    socket.on('receive_message', msg => {
      setMessages(prev => [
        ...prev,
        {
          ...msg,
          content: decryptMessage(msg.content, token),
        },
      ]);
    });
    socket.on('delivered', ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'delivered' } : m));
    });
    socket.on('read', ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'read' } : m));
    });
    socket.on('self_destruct', ({ messageId, expiresAt }) => {
      setSelfDestructTimers(prev => ({ ...prev, [messageId]: expiresAt }));
    });
    socket.on('connect_error', () => setError('Socket connection failed'));
    return () => socket.disconnect();
  }, [selectedContact, token, user.id]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Track and update self-destruct timers
  useEffect(() => {
    const interval = setInterval(() => {
      setSelfDestructTimers((prev) => {
        const now = Date.now();
        const updated = { ...prev };
        Object.keys(updated).forEach((msgId) => {
          if (updated[msgId] <= now) {
            delete updated[msgId];
            setMessages((msgs) => msgs.filter((m) => m._id !== msgId));
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for self_destruct events from backend
  useEffect(() => {
    if (!socketRef.current) return;
    const handler = ({ messageId, expiresAt }) => {
      setSelfDestructTimers((prev) => ({ ...prev, [messageId]: expiresAt }));
    };
    socketRef.current.on('self_destruct', handler);
    return () => socketRef.current.off('self_destruct', handler);
  }, [selectedContact]);

  // Listen for message_deleted events from backend
  useEffect(() => {
    if (!socketRef.current) return;
    const handler = ({ messageId }) => {
      setMessages((msgs) => msgs.filter((m) => m._id !== messageId));
    };
    socketRef.current.on('message_deleted', handler);
    return () => socketRef.current.off('message_deleted', handler);
  }, [selectedContact]);

  // Delete/unsend handler
  const handleDelete = async (msg) => {
    if (!window.confirm('Delete this message for everyone?')) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/message/${msg._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      // Message will be removed by Socket.IO event
    } catch (err) {
      alert(err.message);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!input && !image) return;
    setLoading(true);
    let imageUrl = '';
    try {
      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        const res = await fetch(`${API_URL}/api/chat/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        imageUrl = data.imageUrl;
      }
      const encrypted = encryptMessage(input, token);
      const msg = {
        senderId: user.id,
        receiverId: selectedContact.id,
        content: encrypted,
        type: image ? 'image' : 'text',
        imageUrl,
      };
      socketRef.current.emit('send_message', msg);
      setMessages(prev => [
        ...prev,
        {
          ...msg,
          content: input,
          status: 'pending',
          _id: Date.now(),
          createdAt: Date.now(),
        },
      ]);
      setInput('');
      setImage(null);
    } catch {
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Mark as read when opening chat
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.receiverId === user.id && !msg.readAt) {
        socketRef.current.emit('read_message', { messageId: msg._id, userId: user.id });
      }
    });
  }, [messages, user.id]);

  // Track unread messages
  useEffect(() => {
    if (!selectedContact) return;
    const unread = messages.filter(msg => msg.receiverId === user.id && !msg.readAt).length;
    if (onUnreadChange) onUnreadChange(selectedContact.id, unread);
  }, [messages, selectedContact, user.id, onUnreadChange]);

  if (!selectedContact) {
    return (
      <div className="p-2">
        <h3 className="font-bold mb-2 text-indigo-700">Select a contact to chat:</h3>
        {loading && <div className="text-gray-400">Loading...</div>}
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <ul>
          {contacts.map(c => {
            const unread = messages.filter(msg => msg.senderId === c.id && !msg.readAt).length;
            return (
              <li key={c.id} className="flex items-center gap-2 mb-2">
                <button
                  className="text-indigo-600 hover:underline font-semibold"
                  onClick={() => setSelectedContact(c)}
                >
                  {c.username || c.email}
                </button>
                {unread > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">{unread}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto px-2 pb-2 bg-gradient-to-b from-indigo-50 to-white rounded-xl border border-indigo-100 shadow-inner">
        {messages.map(msg => (
          <div key={msg._id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`rounded-xl px-4 py-2 max-w-xs shadow-sm ${msg.senderId === user.id ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-900 border border-indigo-100'}`} style={{wordBreak:'break-word'}}>
              {msg.type === 'text' && <div>{msg.content}</div>}
              {msg.type === 'image' && (
                <img src={msg.imageUrl} alt="sent" className="rounded-lg max-w-[150px] max-h-[150px] border border-indigo-200" />
              )}
              <div className="flex items-center gap-2 mt-1 text-xs text-indigo-200">
                {msg.status === 'delivered' && <span className="text-green-200">Delivered</span>}
                {msg.status === 'read' && <span className="text-green-300">Read</span>}
                {selfDestructTimers[msg._id] && (
                  <span className="text-red-200 font-semibold">
                    Message will delete in {formatTime(selfDestructTimers[msg._id] - Date.now())}
                  </span>
                )}
                {/* Delete/unsend button for own messages (not read/self-destructed) */}
                {msg.senderId === user.id && !msg.readAt && !selfDestructTimers[msg._id] && (
                  <button
                    className="ml-2 text-red-400 hover:text-red-600"
                    title="Delete/Unsend"
                    onClick={() => handleDelete(msg)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <input
          className="flex-1 border px-3 py-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={e => setImage(e.target.files[0])}
        />
        <button
          className="bg-gray-200 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-300 transition-all"
          onClick={() => fileRef.current.click()}
          title="Send image"
          disabled={loading}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="#6366f1" strokeWidth="2" d="M4 17V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10M4 17l4-4a2 2 0 0 1 2.8 0l2.4 2.4a2 2 0 0 0 2.8 0l2-2M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
        </button>
        <button
          className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-600 transition-all"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
      {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
    </div>
  );
} 