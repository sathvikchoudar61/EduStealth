import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { encryptMessage, decryptMessage, isBase64 } from './crypto.js';
import dayjs from 'dayjs';
import Picker from '@emoji-mart/react';
import { TrashIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const API_URL = '/api';

function getInitials(name, email) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return email ? email[0].toUpperCase() : '?';
}

function Avatar({ user, size = 40 }) {
  if (user.profile && user.profile.avatar) {
    return <img src={user.profile.avatar} alt="avatar" className={`rounded-full object-cover`} style={{ width: size, height: size }} />;
  }
  const initials = getInitials(user.username, user.email);
  return <div className="rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold" style={{ width: size, height: size, fontSize: size / 2 }}>{initials}</div>;
}

function isScrolledToBottom(container, threshold = 100) {
  if (!container) return true;
  return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
}

export default function ChatDM({ user, token, onClose, unreadMap, setUnreadMap }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef();
  const chatEndRef = useRef();
  const scrollContainerRef = useRef();
  const [typingUsers, setTypingUsers] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [modalImage, setModalImage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selfDestructTimers, setSelfDestructTimers] = useState({});
  const inputRef = useRef();

  // Fetch contacts
  useEffect(() => {
    fetch(`${API_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setContacts(data.filter(u => u.id !== user.id)))
      .catch(() => setError('Failed to load contacts'));
  }, [token, user]);

  // Fetch chat history
  useEffect(() => {
    if (!selectedContact) return;
    setLoading(true);
    fetch(`${API_URL}/chat/history?withUserId=${selectedContact.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setMessages(
          data.map(msg => ({
            ...msg,
            content: isBase64(msg.content) ? decryptMessage(msg.content, token) : msg.content,
          }))
        );
      })
      .catch(() => setError('Failed to load messages'))
      .finally(() => setLoading(false));
  }, [selectedContact, token]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Socket.IO setup
  useEffect(() => {
    if (!selectedContact) return;
    if (socketRef.current) socketRef.current.disconnect();
    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('join', user.id);
    });
    socket.on('receive_message', msg => {
      const senderId = msg.senderId;
      const selfId = user._id || user.id;
      const senderName = msg.senderName || msg.sender || 'Someone';
      setMessages(prev => [
        // Remove local optimistic message with same content, sender, and type
        ...prev.filter(m => !(m.local && m.content === (msg.type === 'text' && isBase64(msg.content) ? decryptMessage(msg.content) : msg.content) && m.senderId === msg.senderId && m.type === msg.type)),
        {
          ...msg,
          content: msg.type === 'text' && isBase64(msg.content) ? decryptMessage(msg.content) : msg.content,
        },
      ]);
      // Debug log for unread indicator
      console.log('Updating unreadMap:', {
        msg,
        selectedContact,
        userId: user._id || user.id,
        unreadMap
      });
      // Only increment unread count if the message is for the current user and not currently viewing that contact
      if (msg.receiverId === (user._id || user.id) && (!selectedContact || selectedContact.id !== msg.senderId || document.visibilityState !== 'visible')) {
        setUnreadMap(prev => ({
          ...prev,
          [msg.senderId]: (prev[msg.senderId] || 0) + 1,
        }));
      }
      // Debug log
      const decryptedContent = (msg.type === 'text'
        ? (isBase64(msg.content) ? decryptMessage(msg.content) : msg.content)
        : msg.content);
      console.log('Notification logic:', {
        senderId,
        selfId,
        visibility: document.visibilityState,
        permission: Notification.permission,
        decryptedContent
      });
      // If message is from another user and chat is not focused, show only browser notification (remove in-app toast)
      if (senderId !== selfId && document.visibilityState !== 'visible') {
        // Browser notification (generic message)
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('New course is available!', {
              body: 'Check out the new course now.',
              icon: '/favicon.ico',
            });
          } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification('New course is available!', {
                  body: 'Check out the new course now.',
                  icon: '/favicon.ico',
                });
              }
            });
          }
        }
      }
      // Remove in-app toast for chat focused as well
      // else if (senderId !== selfId && document.visibilityState === 'visible') {
      //   // Only show in-app toast if chat is focused
      //   toast(
      //     <div>
      //       <span className="font-semibold text-indigo-700">{senderName}</span>
      //       <span className="ml-2 text-gray-700">{decryptedContent}</span>
      //     </div>,
      //     { icon: '\ud83d\udcac', duration: 5000 }
      //   );
      // }
    });
    socket.on('delivered', ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'delivered' } : m));
    });
    socket.on('read', ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'read' } : m));
    });
    return () => socket.disconnect();
  }, [selectedContact, token, user.id]);

  // Typing indicator logic
  useEffect(() => {
    if (!selectedContact || !socketRef.current) return;
    const handleTyping = (data) => {
      if (data.senderId === selectedContact._id || data.senderId === selectedContact.id) {
        setTypingUsers((prev) => ({ ...prev, [data.senderId]: true }));
        setTimeout(() => {
          setTypingUsers((prev) => ({ ...prev, [data.senderId]: false }));
        }, 2000);
      }
    };
    socketRef.current.on('typing', handleTyping);
    return () => {
      socketRef.current.off('typing', handleTyping);
    };
  }, [selectedContact]);

  // Track and update self-destruct timers
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((msgs) =>
        msgs.filter((m) => !m.expiresAt || new Date(m.expiresAt) > new Date())
      );
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

  // Auto-scroll to latest message (robust)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (isScrolledToBottom(container)) {
      setTimeout(() => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        container.scrollTop = container.scrollHeight;
      }, 0);
    }
  }, [messages]);

  // Scroll to bottom after loading history
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [loading]);

  // Scroll to bottom on mount (chat open)
  useEffect(() => {
    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 0);
  }, []);

  // Mark as read
  useEffect(() => {
    if (document.visibilityState !== 'visible') return;
    messages.forEach(msg => {
      if (msg.receiverId === user.id && !msg.readAt) {
        socketRef.current.emit('read_message', { messageId: msg._id, userId: user.id });
        setUnreadMap(prev => ({ ...prev, [msg.senderId]: 0 }));
      }
    });
  }, [messages, user.id]);

  // Emit typing event
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (socketRef.current && selectedContact) {
      socketRef.current.emit('typing', {
        senderId: user._id || user.id,
        receiverId: selectedContact._id || selectedContact.id,
      });
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
        const res = await fetch(`${API_URL}/chat/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        imageUrl = data.imageUrl;
      }
      const msg = {
        senderId: user._id || user.id,
        receiverId: selectedContact.id,
        content: image ? input : encryptMessage(input), // Always encrypt outgoing text
        type: image ? 'image' : 'text',
        imageUrl,
      };
      console.log('Sending message:', msg);
      socketRef.current.emit('send_message', msg);
      // Optimistically add the message locally
      setMessages(prev => [
        ...prev,
        {
          ...msg,
          local: true,
          createdAt: new Date().toISOString(),
          _id: Math.random().toString(36).slice(2),
          status: 'sending',
          content: msg.type === 'text' ? input : msg.content,
        }
      ]);
      setInput('');
      setImage(null);
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Avatar upload handler (demo, can be moved to settings/profile page)
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', user._id || user.id);
    const res = await fetch('/api/auth/avatar', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.user) {
      // Update user avatar in localStorage and state
      localStorage.setItem('edustealth_user', JSON.stringify(data.user));
      window.location.reload();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setInput(input + emoji.native);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 0);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Delete/unsend handler
  const handleDelete = async (msg) => {
    if (!window.confirm('Delete this message for everyone?')) return;
    try {
      const res = await fetch(`/api/chat/message/${msg._id}`, {
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

  // When opening a chat with a contact, reset unread count for that contact
  const handleSelectContact = (c) => {
    setSelectedContact(c);
    setUnreadMap(prev => ({ ...prev, [c.id]: 0 }));
  };

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40">
        <div className="flex flex-row h-[90vh] w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-indigo-100 animate-fadeInUp">
          {/* Sidebar */}
          <aside className="bg-gradient-to-b from-indigo-50 to-white border-r border-indigo-100 flex flex-col w-64 h-full">
            <div className="p-4 font-bold text-indigo-700 text-lg text-center border-b border-indigo-100 flex flex-col items-center gap-2">
              Chats
              <Avatar user={user} size={48} />
            </div>
            <div className="flex-1 overflow-y-auto">
              {contacts.map(c => (
                <button
                  key={c.id}
                  className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-indigo-100 transition text-left ${selectedContact && selectedContact.id === c.id ? 'bg-indigo-100' : ''}`}
                  onClick={() => handleSelectContact(c)}
                >
                  <Avatar user={c} size={40} />
                  <div className="flex-1">
                    <div className="font-semibold text-indigo-800 truncate">{c.username || c.email}</div>
                  </div>
                  {/* Show red dot if there are unread messages from this contact */}
                  {unreadMap[c.id] > 0 && (
                    <span className="ml-2 w-3 h-3 bg-red-500 rounded-full inline-block border-2 border-white"></span>
                  )}
                </button>
              ))}
            </div>
          </aside>
          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col min-w-0 min-h-0 w-full">
            {/* Top bar */}
            <div className="flex items-center h-16 px-6 border-b border-indigo-100 bg-indigo-500 text-white sticky top-0 z-30 relative">
              {onClose && (
                <button
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 shadow hover:bg-indigo-100 transition mr-2 text-green-500"
                  onClick={onClose}
                  style={{ minWidth: 48 }}
                  aria-label="Go back"
                  title="Go back"
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="block mx-auto" stroke="currentColor">
                    <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="sr-only">⬅️</span>
                </button>
              )}
              <div className="flex-1 flex flex-col items-center justify-center">
                {selectedContact && (
                  <div className="flex items-center gap-2">
                    <Avatar user={selectedContact} size={32} />
                    <span className="font-semibold text-lg truncate">{selectedContact.username || selectedContact.email}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Chat messages */}
            <div ref={scrollContainerRef} className="flex-1 min-h-0 max-h-none overflow-y-auto overflow-x-hidden px-4 py-4 bg-gradient-to-b from-white to-indigo-50">
              {loading && <div className="text-gray-400 text-center">Loading...</div>}
              {error && <div className="text-red-500 text-center mb-2">{error}</div>}
              {messages.map(msg => (
                <div key={msg._id} className={`flex ${msg.senderId === (user._id || user.id) ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div className={`rounded-2xl px-4 py-2 max-w-md shadow ${msg.senderId === (user._id || user.id) ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-900 border border-indigo-100'} relative break-words whitespace-pre-line`}>
                    {msg.type === 'text' && <div>{msg.local ? msg.content : (isBase64(msg.content) ? decryptMessage(msg.content) : msg.content)}</div>}
                    {msg.type === 'image' && (
                      <img src={msg.imageUrl} alt="sent" className="rounded-lg max-w-[300px] max-h-[200px] border border-indigo-200 cursor-pointer" onClick={() => setModalImage(msg.imageUrl)} />
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-indigo-200">
                      <span className="text-gray-200">{dayjs(msg.createdAt).format('h:mm A')}</span>
                      {msg.status === 'delivered' && <span className="text-green-200">✓</span>}
                      {msg.status === 'read' && <span className="text-green-300">✓✓</span>}
                      {msg.expiresAt && new Date(msg.expiresAt) > new Date() && (
                        <span className="text-red-200 font-semibold">
                          Deletes in {Math.max(0, Math.floor((new Date(msg.expiresAt) - Date.now()) / 1000))}s
                        </span>
                      )}
                      {msg.senderId === (user._id || user.id) && !msg.readAt && !msg.expiresAt && (
                        <button
                          className="ml-2 text-red-200 hover:text-red-400"
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
              {typingUsers[selectedContact?._id || selectedContact?.id] && (
                <div className="text-xs text-indigo-400 italic mb-2">{selectedContact.username || selectedContact.email} is typing...</div>
              )}
              <div ref={chatEndRef} />
            </div>
            {modalImage && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setModalImage(null)}>
                <img src={modalImage} alt="enlarged" className="max-h-[80vh] max-w-[98vw] rounded-xl shadow-2xl border-4 border-white" />
              </div>
            )}
            {selectedContact && (
              <div className="flex items-center gap-2 p-4 border-t border-indigo-100 bg-white/95 relative sticky bottom-0 z-10">
                {imagePreview && (
                  <div className="mb-2 flex items-center gap-2">
                    <img src={imagePreview} alt="preview" className="max-h-16 rounded-lg border border-indigo-200" />
                    <button className="text-xs text-red-500 hover:underline" onClick={() => { setImage(null); setImagePreview(null); }}>Remove</button>
                  </div>
                )}
                <input
                  ref={inputRef}
                  className="flex-1 border px-4 py-3 rounded-full focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-base bg-white shadow-sm"
                  placeholder="Type a message..."
                  value={input}
                  onChange={handleInputChange}
                  disabled={loading}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  className="bg-gray-200 px-4 py-3 rounded-full text-gray-700 hover:bg-gray-300 transition-all"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  title="Add emoji"
                  type="button"
                  disabled={loading}
                >
                  <span role="img" aria-label="emoji">😊</span>
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-16 left-0 z-50">
                    <Picker onEmojiSelect={handleEmojiSelect} theme="light" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                <button
                  className="bg-indigo-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-indigo-600 transition-all text-base shadow"
                  onClick={handleSend}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
      {/* Mobile layout */}
      <div className="flex md:hidden fixed inset-0 z-50 flex-col h-full w-full bg-white animate-fadeInUp">
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)}></div>
        )}
        {/* Sidebar */}
        <aside className={`bg-gradient-to-b from-indigo-50 to-white border-r border-indigo-100 flex flex-col fixed top-0 left-0 h-full transition-transform duration-300 z-50 w-4/5 max-w-xs ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{minWidth:0}}>
          <div className="p-4 font-bold text-indigo-700 text-lg text-center border-b border-indigo-100 flex flex-col items-center gap-2">
            Chats
            <Avatar user={user} size={48} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map(c => (
              <button
                key={c.id}
                className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-indigo-100 transition text-left ${selectedContact && selectedContact.id === c.id ? 'bg-indigo-100' : ''}`}
                onClick={() => handleSelectContact(c)}
              >
                <Avatar user={c} size={40} />
                <div className="flex-1">
                  <div className="font-semibold text-indigo-800 truncate">{c.username || c.email}</div>
                </div>
                {/* Show red dot if there are unread messages from this contact */}
                {unreadMap[c.id] > 0 && (
                  <span className="ml-2 w-3 h-3 bg-red-500 rounded-full inline-block border-2 border-white"></span>
                )}
              </button>
            ))}
          </div>
        </aside>
        {/* Top bar for mobile */}
        <div className="flex items-center h-14 px-2 border-b border-indigo-100 bg-indigo-500 text-white sticky top-0 z-30 relative">
          {onClose && (
            <button
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 shadow hover:bg-indigo-100 transition mr-2 text-green-500"
              onClick={onClose}
              style={{ minWidth: 48 }}
              aria-label="Go back"
              title="Go back"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="block mx-auto" stroke="currentColor">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="sr-only">⬅️</span>
            </button>
          )}
          <div className="flex-1 flex flex-col items-center justify-center">
            {selectedContact && (
              <div className="flex items-center gap-2">
                <Avatar user={selectedContact} size={28} />
                <span className="font-semibold text-base truncate">{selectedContact.username || selectedContact.email}</span>
              </div>
            )}
          </div>
          <button
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 shadow hover:bg-indigo-100 transition ml-2 text-green-500"
            onClick={() => setSidebarOpen(v => !v)}
            style={{ minWidth: 48 }}
            aria-label="Open chats"
            title="Open chats"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="block mx-auto" stroke="currentColor">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {/* fallback emoji if SVG fails */}
            <span className="sr-only">☰</span>
          </button>
        </div>
        {/* Chat messages */}
        <div className="flex-1 flex flex-col min-h-0 w-full">
          {loading && <div className="text-gray-400 text-center">Loading...</div>}
          {error && <div className="text-red-500 text-center mb-2">{error}</div>}
          {messages.map(msg => (
            <div key={msg._id} className={`flex ${msg.senderId === (user._id || user.id) ? 'justify-end' : 'justify-start'} mb-2`}>
              <div className={`rounded-2xl px-4 py-2 max-w-[90vw] shadow ${msg.senderId === (user._id || user.id) ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-900 border border-indigo-100'} relative break-words whitespace-pre-line`}>
                {msg.type === 'text' && <div>{msg.local ? msg.content : (isBase64(msg.content) ? decryptMessage(msg.content) : msg.content)}</div>}
                {msg.type === 'image' && (
                  <img src={msg.imageUrl} alt="sent" className="rounded-lg max-w-[90vw] max-h-[200px] border border-indigo-200 cursor-pointer" onClick={() => setModalImage(msg.imageUrl)} />
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-indigo-200">
                  <span className="text-gray-200">{dayjs(msg.createdAt).format('h:mm A')}</span>
                  {msg.status === 'delivered' && <span className="text-green-200">✓</span>}
                  {msg.status === 'read' && <span className="text-green-300">✓✓</span>}
                  {msg.expiresAt && new Date(msg.expiresAt) > new Date() && (
                    <span className="text-red-200 font-semibold">
                      Deletes in {Math.max(0, Math.floor((new Date(msg.expiresAt) - Date.now()) / 1000))}s
                    </span>
                  )}
                  {msg.senderId === (user._id || user.id) && !msg.readAt && !msg.expiresAt && (
                    <button
                      className="ml-2 text-red-200 hover:text-red-400"
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
          {typingUsers[selectedContact?._id || selectedContact?.id] && (
            <div className="text-xs text-indigo-400 italic mb-2">{selectedContact.username || selectedContact.email} is typing...</div>
          )}
          <div ref={chatEndRef} />
        </div>
        {modalImage && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setModalImage(null)}>
            <img src={modalImage} alt="enlarged" className="max-h-[80vh] max-w-[98vw] rounded-xl shadow-2xl border-4 border-white" />
          </div>
        )}
        {selectedContact && (
          <div className="flex items-center gap-2 p-2 border-t border-indigo-100 bg-white/95 relative sticky bottom-0 z-10">
            {imagePreview && (
              <div className="mb-2 flex items-center gap-2">
                <img src={imagePreview} alt="preview" className="max-h-12 rounded-lg border border-indigo-200" />
                <button className="text-xs text-red-500 hover:underline" onClick={() => { setImage(null); setImagePreview(null); }}>Remove</button>
              </div>
            )}
            <input
              ref={inputRef}
              className="flex-1 border px-3 py-3 rounded-full focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-base bg-white shadow-sm"
              placeholder="Type a message..."
              value={input}
              onChange={handleInputChange}
              disabled={loading}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              className="bg-gray-200 px-3 py-3 rounded-full text-gray-700 hover:bg-gray-300 transition-all"
              onClick={() => setShowEmojiPicker((v) => !v)}
              title="Add emoji"
              type="button"
              disabled={loading}
            >
              <span role="img" aria-label="emoji">😊</span>
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-0 z-50">
                <Picker onEmojiSelect={handleEmojiSelect} theme="light" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            <button
              className="bg-indigo-500 text-white px-5 py-3 rounded-full font-semibold hover:bg-indigo-600 transition-all text-base shadow"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        )}
      </div>
    </>
  );
} 