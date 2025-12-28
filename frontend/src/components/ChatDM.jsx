import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { encryptMessage, decryptMessage, isEncrypted, importKey } from '../utils/crypto.js';
import dayjs from 'dayjs';
import Picker from '@emoji-mart/react';
import { TrashIcon, PaperAirplaneIcon, PhotoIcon, FaceSmileIcon, XMarkIcon, ArrowLeftIcon, UserPlusIcon, LockClosedIcon, CheckBadgeIcon, EllipsisVerticalIcon, BellSlashIcon, BellIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = API_URL;

function getInitials(name, email) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return email ? email[0].toUpperCase() : '?';
}

function Avatar({ user, size = 40 }) {
  if (user.profile && user.profile.avatar) {
    return <img src={user.profile.avatar} alt="avatar" className={`rounded-full object-cover border-2 border-white shadow-sm`} style={{ width: size, height: size }} />;
  }
  const initials = getInitials(user.username, user.email);
  return <div className="rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm" style={{ width: size, height: size, fontSize: size / 2.5 }}>{initials}</div>;
}

function CountdownTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) {
        setTimeLeft('Deleted');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      if (h > 0) {
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <span className="text-red-500 font-mono text-[10px] ml-1 flex items-center">💣 {timeLeft}</span>;
}

export default function ChatDM({ user, token, onClose, unreadMap, setUnreadMap }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef();
  const chatEndRef = useRef();
  const [typingUsers, setTypingUsers] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const inputRef = useRef();

  // Crypto State
  // Crypto State
  const [myPrivateKey, setMyPrivateKey] = useState(null);
  const [myPublicKey, setMyPublicKey] = useState(null); // Added for self-encryption
  const [recipientPublicKey, setRecipientPublicKey] = useState(null);

  // Initialize Keys
  useEffect(() => {
    const loadKey = async () => {
      const priv = localStorage.getItem('edustealth_privateKey');
      if (priv) {
        const key = await importKey(priv, 'private');
        setMyPrivateKey(key);
      }

      // Fetch my public key from server (to ensure we have the latest)
      try {
        console.log("Attempting to load my public key...");
        let pubKeyStr = user.publicKey;

        if (!pubKeyStr) {
          // Fallback fetch if not in user object
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          pubKeyStr = data.user?.publicKey;
        }

        if (pubKeyStr) {
          console.log("Found Public Key string, importing...");
          const key = await importKey(pubKeyStr, 'public');
          setMyPublicKey(key);
          console.log("My Public Key set successfully.");
        } else {
          console.warn("No public key found for me.");
        }
      } catch (e) {
        console.error("Failed to load my public key", e);
      }
    };
    loadKey();
  }, [user, token]);

  // Initialize Recipient Public Key
  useEffect(() => {
    const loadRecipientKey = async () => {
      if (selectedContact?.publicKey) {
        const key = await importKey(selectedContact.publicKey, 'public');
        setRecipientPublicKey(key);
      } else {
        setRecipientPublicKey(null);
      }
    };
    loadRecipientKey();
  }, [selectedContact]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addEduId, setAddEduId] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [menuOpen, setMenuOpen] = useState(false); // Header menu state

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null, isDestructive: false });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch connections (instead of all users)
  const fetchConnections = () => {
    fetch(`${API_URL}/api/connections`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        // Only show accepted connections or pending requests
        setContacts(data);
      });
  };

  useEffect(() => {
    fetchConnections();
    // Poll for updates (simplified for now)
    const interval = setInterval(fetchConnections, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const sendConnectionRequest = async () => {
    if (!addEduId) return;
    try {
      const res = await fetch(`${API_URL}/api/connections/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetEduId: addEduId })
      });
      const data = await res.json();
      if (res.ok) {
        setRequestStatus('success');
        setTimeout(() => { setShowAddModal(false); setAddEduId(''); setRequestStatus(''); fetchConnections(); }, 1500);
      } else {
        setRequestStatus(data.message || 'Failed to send request');
      }
    } catch (e) {
      setRequestStatus('Error sending request');
    }
  };

  const acceptConnection = async (requesterId) => {
    try {
      await fetch(`${API_URL}/api/connections/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requesterId })
      });
      fetchConnections();
    } catch (e) { console.error(e); }
  };

  // Fetch chat history with Async Decryption
  useEffect(() => {
    if (!selectedContact || !myPrivateKey) return;
    setLoading(true);
    fetch(`${API_URL}/api/chat/history?withUserId=${selectedContact.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(async (data) => {
        const decrypted = await Promise.all(data.map(async (msg) => {
          let content = msg.content;
          const isMe = msg.senderId === (user._id || user.id);
          const payloadToDecrypt = isMe ? msg.senderContent : msg.content;

          if (isEncrypted(payloadToDecrypt)) {
            // Try decrypting
            const decryptedText = await decryptMessage(payloadToDecrypt, myPrivateKey);
            content = decryptedText;
          } else if (isMe && !payloadToDecrypt && isEncrypted(msg.content)) {
            content = "🚫 Encrypted (Old Message)";
          } else if (isEncrypted(msg.content) && !isMe) {
            const decryptedText = await decryptMessage(msg.content, myPrivateKey);
            content = decryptedText;
          }
          return { ...msg, content };
        }));
        setMessages(decrypted);
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      });
  }, [selectedContact, token, myPrivateKey]);

  // Socket Setup
  useEffect(() => {
    if (!selectedContact) return;
    if (socketRef.current) socketRef.current.disconnect();

    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('join', user.id));

    socket.on('receive_message', async (msg) => {
      if (msg.receiverId === (user._id || user.id) && (!selectedContact || selectedContact.id !== msg.senderId)) {
        setUnreadMap(prev => ({ ...prev, [msg.senderId]: (prev[msg.senderId] || 0) + 1 }));
      }

      let content = msg.content;
      const isMe = msg.senderId === (user._id || user.id);
      const payloadToDecrypt = isMe ? msg.senderContent : msg.content;

      if (msg.type === 'text' && isEncrypted(payloadToDecrypt) && myPrivateKey) {
        content = await decryptMessage(payloadToDecrypt, myPrivateKey);
      } else if (msg.type === 'text' && !isMe && isEncrypted(msg.content) && myPrivateKey) {
        content = await decryptMessage(msg.content, myPrivateKey);
      }

      setMessages(prev => [
        ...prev.filter(m => !(m.local && m.content === content)), // simplified filter
        { ...msg, content }
      ]);
    });

    socket.on('typing', (data) => {
      if (data.senderId === selectedContact.id) {
        setTypingUsers(prev => ({ ...prev, [data.senderId]: true }));
        setTimeout(() => setTypingUsers(prev => ({ ...prev, [data.senderId]: false })), 2000);
      }
    });

    socket.on('self_destruct', ({ messageId, expiresAt }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, expiresAt, readAt: new Date().toISOString() } : m));
    });

    socket.on('read', ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'read' } : m));
    });

    socket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    return () => socket.disconnect();
  }, [selectedContact, token, user]);


  // Track Page Visibility
  const [isPageVisible, setIsPageVisible] = useState(document.visibilityState === 'visible');

  useEffect(() => {
    const handleVisibilityChange = () => setIsPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => setIsPageVisible(true));
    window.addEventListener('blur', () => setIsPageVisible(false));
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => setIsPageVisible(true));
      window.removeEventListener('blur', () => setIsPageVisible(false));
    };
  }, []);

  // Mark messages as read when viewing
  useEffect(() => {
    if (!selectedContact || messages.length === 0 || !isPageVisible) return;

    // Find ALL unread messages from contact
    const unreadMsgs = messages.filter(m => m.senderId === selectedContact.id && !m.readAt);

    unreadMsgs.forEach(msg => {
      socketRef.current.emit('read_message', { messageId: msg._id, userId: user.id });
      // Optimistically mark as read locally to prevent double-firing before server response
      // proper update comes via self_destruct event
    });
  }, [messages, selectedContact, user.id, isPageVisible]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

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
          body: formData
        });
        imageUrl = (await res.json()).imageUrl;
      }

      let contentToSend = input;
      let senderContentToSend = null;

      if (!image && input) {
        // 1. Encrypt for Recipient
        if (recipientPublicKey) {
          console.log("Encrypting for recipient...");
          contentToSend = await encryptMessage(input, recipientPublicKey);
        } else {
          console.warn("No recipient public key!");
        }

        // 2. Encrypt for Self (so I can read it later)
        if (myPublicKey) {
          console.log("Encrypting for self...");
          senderContentToSend = await encryptMessage(input, myPublicKey);
        } else {
          console.warn("No self public key! senderContent will be null.");
        }
      }

      const msg = {
        senderId: user._id || user.id,
        receiverId: selectedContact.id,
        content: image ? input : contentToSend,
        senderContent: senderContentToSend, // New field
        type: image ? 'image' : 'text',
        imageUrl
      };

      socketRef.current.emit('send_message', msg);

      setMessages(prev => [...prev, {
        ...msg,
        local: true,
        createdAt: new Date().toISOString(),
        _id: Math.random().toString(36),
        status: 'sending',
        content: input, // DISPLAY PLAINTEXT IMMEDIATELY to avoid flash of encrypted content
        senderContent: senderContentToSend
      }]);

      setInput('');
      setImage(null);
      setImagePreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setInput(input + emoji.native);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 md:p-4 animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full h-[100dvh] md:h-[85vh] md:max-w-5xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row ring-1 ring-slate-200"
      >
        {/* Sidebar */}
        <aside className={`w-full md:w-80 bg-slate-50 border-r border-slate-200 flex-col ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <span className="text-2xl">💬</span> Messages
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAddModal(true)} className="p-2 hover:bg-slate-100 rounded-full text-indigo-600 transition-colors" title="Add Connection">
                <UserPlusIcon className="w-6 h-6" />
              </button>
              {/* Mobile Close Button (only visible when in list view on mobile) */}
              <button onClick={onClose} className="md:hidden p-2 hover:bg-slate-100 rounded-full">
                <XMarkIcon className="w-6 h-6 text-slate-500" />
              </button>
            </div>
          </div>
          <div className="p-4 bg-white border-b border-slate-100 md:hidden">
            <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl">
              <Avatar user={user} size={40} />
              <div className="overflow-hidden">
                <p className="font-bold text-slate-700 truncate">{user.username}</p>
                <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                </p>
              </div>
            </div>
          </div>

          {/* Desktop User Info (Hidden on Mobile List Header to save space, or kept if preferred. Let's keep consistent) */}
          <div className="hidden md:block px-6 pb-6 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl">
              <Avatar user={user} size={40} />
              <div className="overflow-hidden">
                <p className="font-bold text-slate-700 truncate">{user.username}</p>
                <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  setUnreadMap(prev => ({ ...prev, [contact.id]: 0 }));
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${selectedContact?.id === contact.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-white hover:shadow-md text-slate-600'}`}
              >
                <div className="relative">
                  <Avatar user={contact} size={42} />
                  {unreadMap[contact.id] > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full border-2 border-white">{unreadMap[contact.id]}</span>
                  )}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className={`font-semibold truncate ${selectedContact?.id === contact.id ? 'text-white' : 'text-slate-800'}`}>{contact.username}</p>
                    {contact.status === 'pending' && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Pending</span>}
                  </div>
                  <p className={`text-xs truncate ${selectedContact?.id === contact.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {contact.status === 'accepted' ? 'Encrypted Connection' : 'Waiting for approval...'}
                  </p>
                  {contact.status === 'pending' && !contact.initiator && (
                    <button
                      onClick={(e) => { e.stopPropagation(); acceptConnection(contact.id); }}
                      className="mt-2 text-xs bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors"
                    >
                      Accept Request
                    </button>
                  )}
                  {contact.status === 'pending' && contact.initiator && (
                    <span className="mt-2 inline-block text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
                      Request Sent
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <main className={`flex-1 flex-col bg-[#f8fafc] relative ${selectedContact ? 'flex' : 'hidden md:flex'}`}>
          {selectedContact ? (
            <>
              {/* Header */}
              <div className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedContact(null)} className="md:hidden p-1 -ml-2 text-slate-500">
                    <ArrowLeftIcon className="w-6 h-6" />
                  </button>
                  <Avatar user={selectedContact} size={40} />
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{selectedContact.username}</h3>
                    <p className="text-xs text-slate-400">Encrypted • Self-Destructing</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.href = '/courses'}
                    className="p-2 bg-red-100 hover:bg-red-600 hover:text-white rounded-full text-red-600 transition-colors mr-1"
                    title="Panic Mode (Esc x2)"
                  >
                    <ExclamationTriangleIcon className="w-6 h-6" />
                  </button>

                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                      <EllipsisVerticalIcon className="w-6 h-6" />
                    </button>
                    <AnimatePresence>
                      {menuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50"
                        >
                          <button
                            onClick={async () => {
                              setMenuOpen(false);
                              const res = await fetch(`${API_URL}/api/connections/mute`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ targetId: selectedContact.id })
                              });
                              fetchConnections();
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700"
                          >
                            <BellSlashIcon className="w-4 h-4" />
                            {contacts.find(c => c.id === selectedContact.id)?.muted ? 'Unmute' : 'Mute Notifications'}
                          </button>

                          {/* Timer Menu Item with Submenu */}
                          <div className="relative group/timer">
                            <button className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-2 text-sm text-slate-700">
                              <div className="flex items-center gap-2">
                                <ClockIcon className="w-4 h-4" /> Message Timer
                              </div>
                              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                                {(() => {
                                  const seconds = contacts.find(c => c.id === selectedContact.id)?.messageTimer || 180;
                                  if (seconds < 60) return `${seconds}s`;
                                  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
                                  return `${Math.floor(seconds / 3600)}h`;
                                })()}
                              </span>
                            </button>

                            {/* Submenu on Hover/Right */}
                            <div className="absolute top-0 right-full w-32 bg-white rounded-xl shadow-xl border border-slate-100 hidden group-hover/timer:block overflow-hidden z-50">
                              {[
                                { l: '3 Min', v: 180 }, { l: '10 Min', v: 600 }, { l: '20 Min', v: 1200 }, { l: '30 Min', v: 1800 },
                                { l: '1 Hour', v: 3600 }, { l: '2 Hours', v: 7200 }, { l: '4 Hours', v: 14400 },
                                { l: '8 Hours', v: 28800 }, { l: '12 Hours', v: 43200 }, { l: '24 Hours', v: 86400 }
                              ].map(opt => (
                                <button
                                  key={opt.v}
                                  onClick={() => {
                                    fetch(`${API_URL}/api/connections/timer`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({ targetId: selectedContact.id, timer: opt.v })
                                    }).then(() => { setMenuOpen(false); fetchConnections(); });
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-xs text-slate-600 hover:text-indigo-600 transition-colors"
                                >
                                  {opt.l}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => { setMenuOpen(false); setMessages([]); }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700"
                          >
                            <TrashIcon className="w-4 h-4" /> Clear Chat
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              setConfirmModal({
                                show: true,
                                title: 'Disconnect User?',
                                message: 'Are you sure you want to remove this connection? This action cannot be undone.',
                                isDestructive: true,
                                onConfirm: () => {
                                  fetch(`${API_URL}/api/connections/remove`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                    body: JSON.stringify({ targetId: selectedContact.id })
                                  }).then(() => {
                                    setSelectedContact(null);
                                    fetchConnections();
                                  });
                                }
                              });
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600 font-medium"
                          >
                            <XMarkIcon className="w-4 h-4" /> Remove Connection
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <XMarkIcon className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === (user._id || user.id);
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg._id || idx}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm relative group break-words overflow-hidden ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none'}`}>
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} className="rounded-lg mb-2 max-w-full" alt="Shared" />
                        )}
                        {/* 
                            Logic to prevent showing Raw JSON:
                            If content starts with { and includes "iv", it's likely raw JSON that failed to decrypt.
                            Hide it.
                        */}
                        <p className="text-sm leading-relaxed">
                          {isEncrypted(msg.content) ?
                            (isMe ? "🔒 Encrypted (Copy missing)" : "🔒 Encrypted Message")
                            : msg.content}
                        </p>
                        <div className="mt-1 flex items-center justify-end gap-1 opacity-70 text-[10px]">
                          {dayjs(msg.createdAt).format('h:mm A')}
                          {isMe && <span>{msg.status === 'read' ? '✓✓' : '✓'}</span>}
                          {msg.expiresAt && <CountdownTimer expiresAt={msg.expiresAt} />}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {typingUsers[selectedContact.id] && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs ml-4">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                    Typing...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-slate-200">
                {imagePreview && (
                  <div className="mb-2 inline-flex items-center gap-2 bg-slate-100 p-2 rounded-lg">
                    <img src={imagePreview} className="h-12 w-12 rounded object-cover" />
                    <button onClick={() => { setImage(null); setImagePreview(null); }} className="text-xs text-red-500 font-bold">Remove</button>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
                    <FaceSmileIcon className="w-6 h-6" />
                  </button>

                  <label className="p-2 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer">
                    <PhotoIcon className="w-6 h-6" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>

                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => {
                      setInput(e.target.value);
                      socketRef.current?.emit('typing', { senderId: user.id, receiverId: selectedContact.id });
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a secret message..."
                    className="flex-1 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                  />

                  <button
                    onClick={handleSend}
                    disabled={loading || (!input && !image)}
                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200"
                  >
                    <PaperAirplaneIcon className="w-5 h-5 -rotate-45 translate-x-px -translate-y-px" />
                  </button>
                </div>
                {showEmojiPicker && (
                  <div className="absolute bottom-24 left-4 z-50 shadow-2xl rounded-2xl overflow-hidden">
                    <Picker onEmojiSelect={handleEmojiSelect} theme="light" />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">👋</span>
              </div>
              <p className="text-lg font-medium text-slate-400">Select a contact to start chatting</p>
              <div className="mt-8 flex gap-2">
                <button onClick={onClose} className="px-6 py-2 rounded-full border border-slate-300 text-slate-500 hover:bg-slate-50 transition-colors">Close</button>
              </div>
            </div>
          )}
        </main>
      </motion.div>

      {/* Add Connection Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Add Connection</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-full"><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
              </div>

              <p className="text-sm text-slate-500 mb-4">Enter a unique <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">EDU-ID</span> to connect securely.</p>

              <div className="relative mb-4">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  value={addEduId}
                  onChange={(e) => setAddEduId(e.target.value.toUpperCase())}
                  placeholder="EDU-XXXXXX"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-lg uppercase tracking-wider"
                />
              </div>

              {requestStatus && (
                <p className={`text-sm mb-4 font-medium ${requestStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {requestStatus === 'success' ? 'Request Sent Successfully!' : requestStatus}
                </p>
              )}

              <button
                onClick={sendConnectionRequest}
                disabled={!addEduId}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestStatus === 'success' ? <CheckBadgeIcon className="w-5 h-5" /> : <PaperAirplaneIcon className="w-5 h-5" />}
                Send Request
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
              <p className="text-slate-500 mb-6">{confirmModal.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, show: false }));
                  }}
                  className={`px-4 py-2 rounded-xl text-white font-bold shadow-md transition-colors ${confirmModal.isDestructive ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}