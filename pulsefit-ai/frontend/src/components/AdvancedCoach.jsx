import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import './advanced-coach.css';
const SUGGESTIONS = ['Build a 4-day workout plan', 'Vegetarian high-protein foods', 'How to improve my recovery?', 'What should I train today?'];
const WELCOME = {
  role: 'model',
  text: 'Hi! 👋 Main PulseFit AI Coach hoon. Workout, diet, recovery ya progress ke baare mein poochho!'
};
export default function AdvancedCoach() {
  const [chats, setChats] = useState([]),
    [active, setActive] = useState(null),
    [messages, setMessages] = useState([]),
    [input, setInput] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [search, setSearch] = useState('');
  const bottom = useRef(null);
  const activeRef = useRef(null);
  useEffect(() => {
    api.get('/coach/conversations').then(r => setChats(r.data)).catch(() => setError('Could not load previous chats.'));
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages, busy]);
  const open = async id => {
    if (busy) return;
    setError('');
    activeRef.current = id;
    setActive(id);
    try {
      const {
        data
      } = await api.get('/coach/conversations/' + id);
      if (activeRef.current === id) setMessages(data.messages || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Unable to load chat');
    }
  };
  const newChat = () => {
    if (busy) return;
    activeRef.current = null;
    setActive(null);
    setMessages([]);
    setError('');
    setInput('');
  };
  const refresh = async () => {
    try {
      const {
        data
      } = await api.get('/coach/conversations');
      setChats(data);
    } catch {}
  };
  const remove = async (id, e) => {
    e.stopPropagation();
    if (busy || !window.confirm('Delete this AI conversation?')) return;
    try {
      await api.delete('/coach/conversations/' + id);
      if (active === id) newChat();
      await refresh();
    } catch (x) {
      setError(x.response?.data?.error || 'Delete failed');
    }
  };
  const send = async (value = input) => {
    const message = String(value).trim();
    if (!message || busy || message.length > 2000) return;
    setBusy(true);
    setError('');
    setInput('');
    setMessages(m => [...m, {
      role: 'user',
      text: message
    }]);
    try {
      const {
        data
      } = await api.post('/coach/chat', {
        message,
        conversationId: activeRef.current
      });
      const id = data.conversationId;
      activeRef.current = id;
      setActive(id);
      setMessages(m => [...m, {
        role: 'model',
        text: data.reply
      }]);
      await refresh();
    } catch (e) {
      setError(e.response?.data?.error || 'AI request failed. Try again.');
      setMessages(m => m.slice(0, -1));
      setInput(message);
    } finally {
      setBusy(false);
    }
  };
  return <div className="pf-ai"><header className="pf-ai-heading"><div><span className="pf-ai-eyebrow">YOUR PERSONAL FITNESS ASSISTANT</span><h1>✳ PulseFit AI Coach</h1><p>Powered by Gemini · Workout, nutrition & recovery guidance</p></div><span className="pf-ai-status">● AI Coach</span></header><div className="pf-ai-layout"><aside className="pf-ai-side"><button className="pf-ai-new" onClick={newChat} disabled={busy}>＋ New chat</button><input className="pf-ai-search" placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} /><div className="pf-ai-side-title">RECENT CHATS</div><div className="pf-ai-list">{chats.filter(c => c.title.toLowerCase().includes(search.toLowerCase())).map(c => <div key={c._id} className={'pf-ai-chat ' + (active === c._id ? 'selected' : '')}><button className="pf-ai-chat-open" onClick={() => open(c._id)}>▤ <span>{c.title}</span></button><button className="pf-ai-delete" title="Delete chat" onClick={e => remove(c._id, e)}>×</button></div>)}{!chats.length && <p className="pf-ai-empty-list">Your conversations will appear here.</p>}</div></aside><section className="pf-ai-main"><div className="pf-ai-main-top"><div className="pf-ai-avatar">✳</div><div><strong>PulseFit AI</strong><small>Your smart fitness companion</small></div><span className="pf-ai-gemini">✦ Gemini</span></div><div className="pf-ai-messages" aria-live="polite">{!messages.length && <div className="pf-ai-intro"><div className="pf-ai-intro-icon">✳</div><h2>How can I help you today?</h2><p>Ask about your workouts, nutrition, recovery, or fitness goals.</p><div className="pf-ai-suggestions">{SUGGESTIONS.map(s => <button key={s} onClick={() => send(s)} disabled={busy}>{s} ↗</button>)}</div></div>}{messages.map((m, i) => <div className={'pf-ai-message ' + (m.role === 'user' ? 'user' : 'model')} key={i}>{m.role === 'model' && <span className="pf-ai-msg-icon">✳</span>}<div className="pf-ai-bubble">{m.text}</div></div>)}{busy && <div className="pf-ai-message model"><span className="pf-ai-msg-icon">✳</span><div className="pf-ai-bubble pf-ai-thinking">Thinking <span>● ● ●</span></div></div>}<div ref={bottom} /></div>{error && <div className="pf-ai-error" role="alert">{error}</div>}<div className="pf-ai-composer"><textarea rows="2" value={input} maxLength={2000} disabled={busy} placeholder="Ask anything about fitness..." onChange={e => setInput(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }} /><button onClick={() => send()} disabled={busy || !input.trim()} aria-label="Send message">➤</button></div><div className="pf-ai-disclaimer">AI can make mistakes. For medical concerns, consult a professional. · Enter to send, Shift+Enter for newline</div></section></div></div>;
}
