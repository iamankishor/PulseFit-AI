import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, Send, Users, MessageCircle, Camera, ShieldCheck, UserRound, Activity, Dumbbell, Apple, Check, Clock, MapPin, Filter, Settings, BarChart3, RefreshCw, Smile, Paperclip, ChevronRight } from 'lucide-react';
import { api, imageUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { connectSocket } from '../socket';
const notify = e => alert(e?.response?.data?.error || e?.message || 'Something went wrong');
const useData = (url, initial) => {
  const [data, setData] = useState(initial);
  const reload = () => api.get(url).then(r => setData(r.data)).catch(notify);
  useEffect(() => {
    reload();
  }, [url]);
  return [data, reload, setData];
};
const Avatar = ({
  user,
  size = 44
}) => user?.avatarUrl ? <img className="adv-avatar" style={{
  width: size,
  height: size
}} src={imageUrl(user.avatarUrl)} alt={user.name || 'Profile'} /> : <span className="adv-avatar adv-initial" style={{
  width: size,
  height: size,
  fontSize: size * .37
}}>{(user?.name || user?.displayName || '?').slice(0, 1).toUpperCase()}</span>;
const Head = ({
  icon: Icon,
  title,
  subtitle
}) => <div className="adv-head"><span className="adv-head-icon"><Icon size={24} /></span><div><h1>{title}</h1><p>{subtitle}</p></div></div>;
const Tabs = ({
  items,
  value,
  onChange
}) => <div className="adv-tabs">{items.map(x => <button className={value === x ? 'selected' : ''} onClick={() => onChange(x)} key={x}>{x}</button>)}</div>;
const Card = ({
  children,
  className = ''
}) => <section className={'adv-card ' + className}>{children}</section>;
export function AdvancedChat() {
  const {
    id
  } = useParams();
  const {
    user
  } = useAuth();
  const [buddies] = useData('/requests/buddies', []);
  const [conversations, reload] = useData('/chat/conversations', []);
  const [active, setActive] = useState(id || null),
    [messages, setMessages] = useState([]),
    [q, setQ] = useState(''),
    [filter, setFilter] = useState(''),
    [typing, setTyping] = useState(false),
    [online, setOnline] = useState([]),
    [socket, setSocket] = useState(null);
  const bottom = useRef(null);
  useEffect(() => {
    const s = connectSocket();
    setSocket(s);
    s.on('online', setOnline);
    return () => s.disconnect();
  }, []);
  useEffect(() => {
    if (!active) return;
    api.get('/chat/conversations/' + active + '/messages').then(r => setMessages(r.data)).catch(notify);
    socket?.emit('join-conversation', {
      conversationId: active
    });
    const onMessage = ({
      message
    }) => {
      if (String(message.conversationId) === String(active)) setMessages(old => old.some(x => x._id === message._id) ? old : [...old, message]);
    };
    const onTyping = ({
      typing
    }) => setTyping(typing);
    socket?.on('message', onMessage);
    socket?.on('typing', onTyping);
    return () => {
      socket?.emit('leave-conversation', {
        conversationId: active
      });
      socket?.off('message', onMessage);
      socket?.off('typing', onTyping);
    };
  }, [active, socket]);
  useEffect(() => {
    bottom.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages, typing]);
  const start = async other => {
    try {
      const {
        data
      } = await api.post('/chat/conversations', {
        userId: other
      });
      setActive(data._id);
      reload();
    } catch (e) {
      notify(e);
    }
  };
  const send = () => {
    const msg = q.trim();
    if (!msg || !active) return;
    setQ('');
    if (socket?.connected) {
      socket.emit('send-message', {
        conversationId: active,
        text: msg
      }, response => {
        if (response?.error) {
          notify(new Error(response.error));
          setQ(msg);
        }
      });
    } else {
      api.post('/chat/conversations/' + active + '/messages', {
        text: msg
      }).then(r => setMessages(old => [...old, r.data])).catch(notify);
    }
  };
  const current = conversations.find(c => c._id === active);
  const other = c => c?.participants?.find(p => String(p._id) !== String(user?.id));
  const selected = other(current);
  return <div className="adv-page"><Head icon={MessageCircle} title="Chat" subtitle="Real-time conversations with your gym buddies" /><div className="adv-chat-layout"><Card className="adv-chat-list"><div className="adv-row"><h3>Messages</h3><span className="adv-count">{conversations.length}</span></div><div className="adv-search"><Search size={16} /><input placeholder="Search conversations" value={filter} onChange={e => setFilter(e.target.value)} /></div><div className="adv-scroll">{conversations.filter(c => other(c)?.name?.toLowerCase().includes(filter.toLowerCase())).map(c => {
            const person = other(c);
            return <button key={c._id} className={'adv-person ' + (active === c._id ? 'active' : '')} onClick={() => setActive(c._id)}><Avatar user={person} /><span><strong>{person?.name || 'Buddy'}</strong><small>{online.includes(person?._id) ? '● Online' : 'View conversation'}</small></span><ChevronRight size={16} /></button>;
          })}</div><h4>Start a conversation</h4><div className="adv-scroll adv-buddies-mini">{buddies.map(b => {
            const person = String(b.from?._id) === String(user?.id) ? b.to : b.from;
            return <button className="adv-person" key={b._id} onClick={() => start(person._id)}><Avatar user={person} size={36} /><span><strong>{person.name}</strong><small>Message buddy</small></span><MessageCircle size={15} /></button>;
          })}</div></Card><Card className="adv-chat-main">{active ? <><div className="adv-chat-top"><Avatar user={selected} /><div><strong>{selected?.name || 'Conversation'}</strong><small>{online.includes(selected?._id) ? '● Online' : 'Gym buddy'} {typing ? ' · typing…' : ''}</small></div><span className="adv-secure"><ShieldCheck size={15} /> Buddy chat</span></div><div className="adv-messages">{messages.map(m => <div key={m._id} className={'adv-message ' + (String(m.senderId) === String(user?.id) ? 'mine' : 'theirs')}><span>{m.text}</span><small>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : ''}</small></div>)}<div ref={bottom} /></div><div className="adv-compose"><input placeholder="Type your message…" value={q} onChange={e => {
              setQ(e.target.value);
              socket?.emit('typing', {
                conversationId: active,
                typing: !!e.target.value
              });
            }} onKeyDown={e => e.key === 'Enter' && send()} /><button className="adv-primary" onClick={send} disabled={!q.trim()}><Send size={19} /></button></div></> : <div className="adv-empty"><MessageCircle size={48} /><h3>Start a conversation</h3><p>Choose an existing chat or a connected gym buddy.</p></div>}</Card></div></div>;
}
export function AdvancedBuddies() {
  const [tab, setTab] = useState('Discover'),
    [search, setSearch] = useState(''),
    [goal, setGoal] = useState('All'),
    [near, reloadNear] = useData('/buddies/nearby', {
      items: []
    }),
    [me, reloadMe] = useData('/buddies/me', null),
    [incoming, reloadIn] = useData('/requests/incoming', []),
    [outgoing, reloadOut] = useData('/requests/outgoing', []),
    [accepted] = useData('/requests/buddies', []),
    [form, setForm] = useState({
      displayName: '',
      bio: '',
      goals: 'muscle gain',
      lat: 28.61,
      lng: 77.21
    });
  const nav = useNavigate();
  useEffect(() => {
    if (me) setForm({
      displayName: me.displayName || '',
      bio: me.bio || '',
      goals: (me.goals || []).join(', '),
      lat: me.lat ?? 28.61,
      lng: me.lng ?? 77.21
    });
  }, [me?._id]);
  const refresh = () => {
    reloadNear();
    reloadIn();
    reloadOut();
  };
  const request = async id => {
    try {
      await api.post('/requests', {
        to: id
      });
      refresh();
    } catch (e) {
      notify(e);
    }
  };
  const answer = async (id, action) => {
    try {
      await api.post('/requests/' + id + '/' + action);
      refresh();
    } catch (e) {
      notify(e);
    }
  };
  const candidates = (near.items || []).filter(x => x.displayName?.toLowerCase().includes(search.toLowerCase()) && (goal === 'All' || x.goals?.some(g => g.toLowerCase().includes(goal.toLowerCase()))));
  return <div className="adv-page"><Head icon={Users} title="Gym Buddies" subtitle="Discover, connect and train with like-minded fitness enthusiasts" /><Tabs items={['Discover', 'My Buddies', 'Requests', 'My Buddy Profile']} value={tab} onChange={setTab} />{tab === 'Discover' && <><div className="adv-toolbar"><div className="adv-search"><Search size={16} /><input placeholder="Search buddies by name" value={search} onChange={e => setSearch(e.target.value)} /></div><select value={goal} onChange={e => setGoal(e.target.value)}>{['All', 'Muscle Gain', 'Fat Loss', 'Strength', 'General'].map(x => <option key={x}>{x}</option>)}</select><button onClick={reloadNear}><RefreshCw size={16} /> Refresh</button></div><div className="adv-buddy-grid">{candidates.map(p => <Card key={p._id} className="adv-buddy-card"><Avatar user={{
            name: p.displayName,
            avatarUrl: p.userId?.avatarUrl
          }} size={64} /><h3>{p.displayName}</h3><span className="adv-pill">{p.goals?.[0] || 'Fitness'}</span><p><MapPin size={14} /> {p.distanceKm} km away</p><small>{p.bio || 'Ready to connect and train together'}</small><div className="adv-card-actions"><button onClick={() => request(p.userId?._id)} disabled={!p.userId?._id || outgoing.some(r => r.to?._id === p.userId?._id)}> {outgoing.some(r => r.to?._id === p.userId?._id) ? 'Requested' : 'Add Buddy'}</button></div></Card>)}</div>{!candidates.length && <Card>No matching buddy profiles yet. Try another filter.</Card>}</>}{tab === 'My Buddies' && <Card><h3>Connected buddies ({accepted.length})</h3>{accepted.map(b => <div className="adv-person" key={b._id}><Avatar user={b.from} /><span><strong>{b.from?.name} & {b.to?.name}</strong><small>Connected</small></span><button onClick={() => nav('/chat')}>Open Chat</button></div>)}{!accepted.length && <p>No accepted buddies yet.</p>}</Card>}{tab === 'Requests' && <div className="adv-two"><Card><h3>Incoming requests</h3>{incoming.map(x => <div className="adv-request" key={x._id}><Avatar user={x.from} /><strong>{x.from?.name}</strong><span>{x.status}</span>{x.status === 'pending' && <><button onClick={() => answer(x._id, 'accept')}>Accept</button><button onClick={() => answer(x._id, 'reject')}>Reject</button></>}</div>)}{!incoming.length && <p>No requests</p>}</Card><Card><h3>Sent requests</h3>{outgoing.map(x => <div className="adv-request" key={x._id}><Avatar user={x.to} /><strong>{x.to?.name}</strong><span>{x.status}</span></div>)}{!outgoing.length && <p>No requests</p>}</Card></div>}{tab === 'My Buddy Profile' && <Card><h3>Your discoverable buddy profile</h3><div className="adv-form-grid">{['displayName', 'bio', 'goals', 'lat', 'lng'].map(k => <label key={k}>{k}<input value={form[k] ?? ''} onChange={e => setForm(v => ({
            ...v,
            [k]: e.target.value
          }))} /></label>)}</div><button className="adv-primary" onClick={() => api.put('/buddies/me', {
        ...form,
        lat: Number(form.lat),
        lng: Number(form.lng),
        goals: form.goals.split(',').map(x => x.trim()).filter(Boolean)
      }).then(() => {
        reloadMe();
        reloadNear();
        setTab('Discover');
      }).catch(notify)}>Save Buddy Profile</button><p className="adv-hint">Location is used for approximate distance; only share coordinates you are comfortable sharing.</p></Card>}</div>;
}
export function AdvancedProfile() {
  const {
    user,
    setUser
  } = useAuth();
  const [tab, setTab] = useState('Profile Info'),
    [form, setForm] = useState({
      name: '',
      bio: '',
      fitnessGoal: '',
      experience: '',
      city: ''
    }),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user) setForm({
      name: user.name || '',
      bio: user.bio || '',
      fitnessGoal: user.fitnessGoal || '',
      experience: user.experience || '',
      city: user.city || ''
    });
  }, [user]);
  const upload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) return alert('Use JPEG, PNG or WebP up to 5MB');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const {
        data
      } = await api.post('/auth/avatar', fd);
      setUser(data);
    } catch (x) {
      notify(x);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };
  const save = async () => {
    setBusy(true);
    try {
      const {
        data
      } = await api.patch('/auth/me', form);
      setUser(data);
      alert('Profile saved');
    } catch (x) {
      notify(x);
    } finally {
      setBusy(false);
    }
  };
  return <div className="adv-page"><Head icon={UserRound} title="My Profile" subtitle="Your identity, fitness details and account preferences" /><div className="adv-profile-hero"><Avatar user={user} size={94} /><div><h2>{user?.name}</h2><p>{user?.email}</p><span className="adv-pill">{user?.role || 'member'}</span></div><label className="adv-upload"><Camera size={16} /> Change Photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden disabled={busy} /></label></div><Tabs items={['Profile Info', 'Fitness Details', 'Achievements', 'Preferences']} value={tab} onChange={setTab} /><Card>{['Profile Info', 'Fitness Details'].includes(tab) ? <><h3>{tab}</h3><div className="adv-form-grid">{(tab === 'Profile Info' ? ['name', 'bio', 'city'] : ['fitnessGoal', 'experience']).map(k => <label key={k}>{{
              name: 'Full name',
              bio: 'About me',
              city: 'City',
              fitnessGoal: 'Fitness goal',
              experience: 'Experience level'
            }[k]}<input value={form[k]} maxLength={k === 'bio' ? 300 : 80} onChange={e => setForm({
              ...form,
              [k]: e.target.value
            })} /></label>)}</div><button className="adv-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save Changes'}</button></> : tab === 'Achievements' ? <><h3>Your achievement badges</h3><p>Earn badges through your workout milestones.</p><div className="adv-badges">{(user?.badges || []).length ? user.badges.map(x => <span className="adv-pill" key={x}>🏅 {x}</span>) : 'No badges unlocked yet.'}</div></> : <><h3>Account preferences</h3><p>Update your public photo or manage your gym buddy visibility.</p><div className="adv-row"><button onClick={() => {
            if (confirm('Remove your profile photo?')) api.delete('/auth/avatar').then(r => setUser(r.data)).catch(notify);
          }}>Remove Profile Photo</button><Link className="adv-primary" to="/buddies">Manage Buddy Profile</Link></div></>}</Card></div>;
}
export function AdvancedAdmin() {
  const [tab, setTab] = useState('Users'),
    [overview, reloadOverview] = useData('/admin/overview', {}),
    [stats] = useData('/admin/stats', {}),
    [search, setSearch] = useState(''),
    [role, setRole] = useState(''),
    [page, setPage] = useState(1),
    [users, reloadUsers] = useData('/admin/users?search=' + encodeURIComponent(search) + '&role=' + role + '&page=' + page, {
      items: [],
      pagination: {}
    });
  const {
    user
  } = useAuth();
  const change = async (id, value) => {
    if (!confirm('Change this user role to ' + value + '?')) return;
    try {
      await api.patch('/admin/users/' + id + '/role', {
        role: value
      });
      reloadUsers();
      reloadOverview();
    } catch (e) {
      notify(e);
    }
  };
  return <div className="adv-page"><Head icon={ShieldCheck} title="Admin Panel" subtitle="Manage members and monitor platform activity" /><div className="adv-kpis">{[['Users', overview.users, Users], ['Workouts', overview.workouts, Dumbbell], ['Food Logs', overview.foodLogs, Apple], ['Messages', overview.messages, MessageCircle], ['Connections', overview.buddyConnections, Activity]].map(([label, value, Icon]) => <Card key={label}><Icon size={22} /><strong>{Number(value || 0).toLocaleString()}</strong><small>{label}</small></Card>)}</div><Tabs items={['Users', 'Workouts', 'Food Database', 'Reports', 'Settings']} value={tab} onChange={setTab} />{tab === 'Users' ? <Card><div className="adv-row"><h3>User Management</h3><button onClick={() => {
          reloadUsers();
          reloadOverview();
        }}><RefreshCw size={16} /> Refresh</button></div><div className="adv-toolbar"><div className="adv-search"><Search size={16} /><input placeholder="Search users by name or email" value={search} onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }} /></div><select value={role} onChange={e => {
          setRole(e.target.value);
          setPage(1);
        }}>{['', 'user', 'coach', 'admin'].map(x => <option key={x} value={x}>{x || 'All roles'}</option>)}</select></div><div className="adv-table-wrap"><table className="adv-table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Manage role</th></tr></thead><tbody>{(users.items || []).map(u => <tr key={u._id}><td><div className="adv-row"><Avatar user={u} size={32} /><strong>{u.name}</strong></div></td><td>{u.email}</td><td><span className="adv-pill">{u.role}</span></td><td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td><td><select disabled={String(u._id) === String(user?.id)} value={u.role} onChange={e => change(u._id, e.target.value)}>{['user', 'coach', 'admin'].map(x => <option key={x}>{x}</option>)}</select></td></tr>)}</tbody></table></div><div className="adv-row"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} / {users.pagination?.pages || 1}</span><button disabled={page >= (users.pagination?.pages || 1)} onClick={() => setPage(page + 1)}>Next</button></div></Card> : tab === 'Workouts' ? <Card><h3>Workout activity</h3><p>Total logged workouts: <strong>{overview.workouts || 0}</strong></p><p>Total training volume: <strong>{Math.round(stats.totalVolume || 0).toLocaleString()} kg</strong></p><p>Challenge count: {stats.challenges || 0} · Programs: {stats.programs || 0}</p></Card> : tab === 'Food Database' ? <Card><h3>Food tracking overview</h3><p>{overview.foodLogs || 0} food-log entries recorded across the platform.</p><p>Food search and meal logging remain available under Food Tracker.</p><Link to="/food">Open Food Tracker</Link></Card> : tab === 'Reports' ? <Card><h3>Platform activity report</h3><div className="adv-report">{[['Users', overview.users], ['Workouts', overview.workouts], ['Messages', overview.messages], ['Buddy connections', overview.buddyConnections]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || 0}</strong></div>)}</div><button onClick={() => {
        const rows = [['Metric', 'Count'], ['Users', overview.users || 0], ['Workouts', overview.workouts || 0], ['Food Logs', overview.foodLogs || 0], ['Messages', overview.messages || 0], ['Buddy Connections', overview.buddyConnections || 0]];
        const csv = rows.map(r => r.join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], {
          type: 'text/csv'
        }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pulsefit-report.csv';
        a.click();
        URL.revokeObjectURL(url);
      }}>Export CSV Report</button></Card> : <Card><h3>Admin settings</h3><p>Administrative actions are permission-protected. Role changes require confirmation; you cannot change your own role.</p><button onClick={() => {
        reloadUsers();
        reloadOverview();
      }}>Refresh Dashboard Data</button></Card>}</div>;
}
