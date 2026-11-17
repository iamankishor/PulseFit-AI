import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import NotificationsBell from './NotificationsBell';
import { Activity, House, Dumbbell, History, ChartNoAxesColumnIncreasing, Apple, Bot, Trophy, Users, MessageCircle, Layers, BadgeCheck, Ruler, Images, Camera, UserRound, LogOut, Search, Plus } from 'lucide-react';
const links = [['/', 'Dashboard', House], ['/workouts', 'Workouts', Dumbbell], ['/progress', 'Progress', ChartNoAxesColumnIncreasing], ['/food', 'Food Tracker', Apple], ['/coach', 'AI Coach', Bot], ['/chat', 'Chat', MessageCircle], ['/buddies', 'Gym Buddies', Users], ['/profile', 'Profile', UserRound]];
export default function Navbar() {
  const {
    user,
    logout
  } = useAuth();
  const navigate = useNavigate(),
    location = useLocation();
  const [query, setQuery] = useState(''),
    [results, setResults] = useState([]),
    [open, setOpen] = useState(false),
    [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  useEffect(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
  }, [location.pathname]);
  useEffect(() => {
    const close = e => {
      if (!searchRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const responses = await Promise.allSettled([api.get('/workouts', {
        params: {
          exercise: q,
          limit: 8
        }
      }), api.get('/foods/search', {
        params: {
          q
        }
      }), api.get('/buddies/nearby', {
        params: {
          search: q,
          limit: 8
        }
      })]);
      if (cancelled) return;
      const data = (i, fallback) => responses[i].status === 'fulfilled' ? responses[i].value.data : fallback;
      const workouts = data(0, {
        items: []
      }).items || [];
      const foods = data(1, []) || [];
      const buddies = data(2, {
        items: []
      }).items || [];
      setResults([...workouts.slice(0, 5).map(w => ({
        id: 'w' + w._id,
        category: 'Workout',
        label: (w.exercises || []).map(e => e.name).join(', '),
        detail: new Date(w.date).toLocaleDateString(),
        to: '/workouts'
      })), ...foods.slice(0, 5).map(f => ({
        id: 'f' + f.id,
        category: 'Food',
        label: f.name,
        detail: `${f.calories} kcal`,
        to: '/food'
      })), ...buddies.slice(0, 5).map(b => ({
        id: 'b' + b._id,
        category: 'Buddy',
        label: b.displayName,
        detail: (b.goals || []).join(', '),
        to: '/buddies'
      }))]);
      setLoading(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);
  const go = to => {
    setOpen(false);
    navigate(to);
  };
  return <><aside className="sidebar"><Link to="/" className="brand"><span className="brand-mark">
  <img src="/pulsefit-logo.png" alt="PulseFit AI" className="brand-logo-img" />
</span><span>PulseFit <em>AI</em><small>Your fitness companion</small></span></Link><nav>{links.map(([p, t, Icon]) => <NavLink key={p} to={p} end={p === '/'}><Icon size={19} /><span>{t}</span></NavLink>)}<details className='sidebar-submenu'><summary>More features</summary>{[['/log', 'Log Workout'], ['/challenges', 'Challenges'], ['/programs', 'Programs'], ['/diet', 'Diet Plan'], ['/measure', 'Measurements'], ['/transform', 'Transformation Photos'], ['/formcheck', 'Form Check']].map(([url, title]) => <NavLink key={url} to={url}>{title}</NavLink>)}</details>{user?.role === 'admin' && <NavLink to="/admin"><BadgeCheck size={19} /> Admin</NavLink>}</nav><button className="sidebar-logout" onClick={logout}><LogOut size={18} /> Logout</button></aside><header className="topbar"><div className="global-search" ref={searchRef}>
 <div className="top-search"><Search size={19} /><input aria-label="Global search" placeholder="Search workouts, foods, buddies..." value={query} onFocus={() => setOpen(true)} onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }} onKeyDown={e => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter' && results[0]) go(results[0].to);
          }} /></div>
 {open && query.trim().length >= 2 && <div className="global-search-results" role="listbox">
  {loading ? <div className="search-status">Searching...</div> : results.length ? results.map(r => <button type="button" key={r.id} className="search-result" onClick={() => go(r.to)}><span className="search-result-type">{r.category}</span><span className="search-result-name">{r.label}</span><small>{r.detail}</small></button>) : <div className="search-status">No matching results found</div>}
 </div>}
 </div><div className="top-actions"><NotificationsBell /><Link to="/profile" className="avatar">{user?.avatarUrl ? <img src={(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '') + user.avatarUrl} alt='Profile' style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%'
          }} /> : user?.name?.slice(0, 1)?.toUpperCase() || 'U'}</Link><span className="top-username">{user?.name}</span><button className="mobile-logout" onClick={logout}><LogOut size={18} /></button></div></header><nav className="bottomnav">{[['/', House, 'Home'], ['/log', Dumbbell, 'Log'], ['/progress', ChartNoAxesColumnIncreasing, 'Progress'], ['/food', Apple, 'Food'], ['/profile', UserRound, 'Profile']].map(([p, Icon, t]) => <NavLink key={p} to={p} end={p === '/'}><Icon size={22} /><span>{t}</span></NavLink>)}</nav></>;
}
