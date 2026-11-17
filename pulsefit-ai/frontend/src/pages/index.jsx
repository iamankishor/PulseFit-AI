import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api, imageUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { badges } from '../badges';
import StatCard from '../components/StatCard';
import StatusViewer from '../components/StatusViewer';
import { connectSocket } from '../socket';
import { UserRound } from "lucide-react";
const err = e => alert(e.response?.data?.error || e.response?.data?.code || e.message);
const useLoad = (url, initial = []) => {
  const [data, setData] = useState(initial);
  const reload = () => api.get(url).then(r => setData(r.data)).catch(err);
  useEffect(() => {
    reload();
  }, [url]);
  return [data, reload, setData];
};
const today = () => new Date().toISOString().slice(0, 10);
const Btn = ({
  children,
  ...p
}) => <button className='primary' {...p}>{children}</button>;
const Card = ({
  children
}) => <section className='card'>{children}</section>;
const Field = ({
  label,
  ...p
}) => <label className='field'>{label}<input {...p} /></label>;
const Select = ({
  label,
  options,
  ...p
}) => <label className='field'>{label}<select {...p}>{options.map(x => <option key={x} value={x}>{x}</option>)}</select></label>;
export function Login({
  register = false
}) {
  const {
      login,
      register: signup
    } = useAuth(),
    nav = useNavigate();
  const [f, setF] = useState({
    name: '',
    email: 'demo@example.com',
    password: 'demo1234'
  });
  return <div className='authbox card'><h1>💚 PulseFit AI</h1><p>{register ? 'Create your account' : 'Welcome back. Train smarter.'}</p><form onSubmit={async e => {
      e.preventDefault();
      try {
        register ? await signup(f.name, f.email, f.password) : await login(f.email, f.password);
        nav('/');
      } catch (x) {
        err(x);
      }
    }}>{register && <Field label='Name' required value={f.name} onChange={e => setF({
        ...f,
        name: e.target.value
      })} />}<Field label='Email' type='email' required value={f.email} onChange={e => setF({
        ...f,
        email: e.target.value
      })} /><Field label='Password' type='password' required value={f.password} onChange={e => setF({
        ...f,
        password: e.target.value
      })} /><Btn>{register ? 'Register' : 'Login'}</Btn></form><p><Link to={register ? '/login' : '/register'}>{register ? 'Have an account? Login' : 'New here? Register'}</Link></p><p className='muted'>Demo: demo@example.com / demo1234<br />Admin: admin@pulsefit.in / admin1234</p></div>;
}
export function Dashboard() {
  const [d] = useLoad('/stats/dashboard', {});
  const [series] = useLoad('/stats/volume-series', []);
  const {
    user
  } = useAuth();
  const recent = d.recent || [];
  return <div className="dashboard-page"><section className="welcome-hero"><div><p className="eyebrow">YOUR FITNESS OVERVIEW</p><h1>Hey, {user?.name || 'Athlete'} 👋</h1><p>Keep going! Every rep takes you closer to your goals.</p></div><div className="hero-decoration">
<div className="dashboard-profile-photo">
  {user?.avatarUrl ? <img src={user.avatarUrl.startsWith("http") ? user.avatarUrl : `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}/${user.avatarUrl.replace(/^\/+/, "")}`} alt="User Profile" /> : <UserRound size={65} />}
</div>
</div></section><div className="stats dashboard-stats">{[['Total Workouts', d.totalWorkouts], ['Day Streak', `${d.streak || 0} Days`], ['Total Volume', `${(d.totalVolume || 0).toLocaleString()} kg`], ['This Week Volume', `${(d.weekVolume || 0).toLocaleString()} kg`], ['Badges Unlocked', `${d.badgeCount || 0} / 8`]].map(([label, value]) => <StatCard key={label} label={label} value={value ?? '—'} />)}</div><div className="dashboard-grid"><Card><div className="spread"><h2>📈 12-Week Volume Trend</h2><span className="subtle-pill">Volume (kg)</span></div><ResponsiveContainer width="100%" height={260}><LineChart data={series}><CartesianGrid stroke="#edf2ee" vertical={false} /><XAxis dataKey="week" tick={{
              fontSize: 11
            }} /><YAxis tick={{
              fontSize: 11
            }} /><Tooltip /><Line dataKey="volume" stroke="#099d32" strokeWidth={3} dot={{
              r: 4,
              fill: '#099d32'
            }} type="monotone" /></LineChart></ResponsiveContainer></Card><Card><div className="spread"><h2>🤖 AI Coach</h2><span className="subtle-pill">Rule-based, not an LLM</span></div><div className="coach-teaser"><span className="robot-emoji">🤖</span><p>Ready for your next workout? Get personalized suggestions based on your logged fitness activity.</p></div><Link className="primary full-width" to="/coach">Chat with Coach →</Link></Card><Card><div className="spread"><h2>🏋️ Recent Workouts</h2><Link to="/workouts">View All →</Link></div>{recent.length ? recent.slice(0, 5).map((w, i) => <div className="workout-item" key={w._id}><span className="workout-icon">🏋️</span><div><strong>{w.exercises?.[0]?.name || 'Workout'} {w.isPR?.length > 0 && <span className="pr-tag">⭐ PR</span>}</strong><small>{new Date(w.date).toLocaleDateString()} · {w.exercises?.length || 0} exercises</small></div><b>{(w.volume || 0).toLocaleString()} kg</b></div>) : <p className="muted">No workouts yet. Log your first session!</p>}<Link className="primary full-width" to="/log">+ Log Workout</Link></Card><Card><div className="spread"><h2>🏅 Your Badges</h2><Link to="/profile">View All →</Link></div><div className="badge-grid">{Object.entries(badges).map(([id, name]) => <div className={'badge-tile ' + (user?.badges?.includes(id) ? 'unlocked' : 'locked')} key={id}><span>{user?.badges?.includes(id) ? '🏅' : '🔒'}</span><small>{name}</small></div>)}</div></Card></div></div>;
}
export function LogWorkout() {
  const [ex, setEx] = useState([{
      name: 'Squat',
      sets: [{
        reps: 10,
        weight: 40
      }]
    }]),
    nav = useNavigate();
  const edit = (i, v) => setEx(ex.map((e, j) => j === i ? v : e));
  const volume = ex.reduce((s, e) => s + e.sets.reduce((a, x) => a + (+x.reps || 0) * (+x.weight || 0), 0), 0);
  return <><h1>Log workout</h1>{ex.map((e, i) => <Card key={i}><div className='spread'><Field label='Exercise' value={e.name} onChange={v => edit(i, {
          ...e,
          name: v.target.value
        })} /><button onClick={() => setEx(ex.filter((_, j) => j !== i))}>Remove</button></div>{e.sets.map((s, j) => <div className='inline' key={j}><Field label='Reps' type='number' min='0' value={s.reps} onChange={v => edit(i, {
          ...e,
          sets: e.sets.map((x, k) => k === j ? {
            ...x,
            reps: v.target.value
          } : x)
        })} /><Field label='Weight (kg)' type='number' min='0' value={s.weight} onChange={v => edit(i, {
          ...e,
          sets: e.sets.map((x, k) => k === j ? {
            ...x,
            weight: v.target.value
          } : x)
        })} /><button onClick={() => edit(i, {
          ...e,
          sets: e.sets.filter((_, k) => k !== j)
        })}>×</button></div>)}<button onClick={() => edit(i, {
        ...e,
        sets: [...e.sets, {
          reps: 10,
          weight: 20
        }]
      })}>+ Set</button></Card>)}<button onClick={() => setEx([...ex, {
      name: '',
      sets: [{
        reps: 10,
        weight: 20
      }]
    }])}>+ Exercise</button><h2>Live volume: {volume.toLocaleString()} kg</h2><Btn onClick={() => api.post('/workouts', {
      exercises: ex
    }).then(() => nav('/')).catch(err)}>Save workout</Btn></>;
}
export function Workouts() {
  const [search, setSearch] = useState(''),
    [exercise, setExercise] = useState(''),
    [page, setPage] = useState(1);
  const [d, reload] = useLoad(`/workouts?search=${encodeURIComponent(search)}&exercise=${encodeURIComponent(exercise)}&page=${page}`, {
    items: [],
    pagination: {}
  });
  return <><h1>Workout history</h1><div className='inline'><input placeholder='Search' value={search} onChange={e => setSearch(e.target.value)} /><input placeholder='Exercise filter' value={exercise} onChange={e => setExercise(e.target.value)} /></div>{d.items?.map(w => <Card key={w._id}><div className='spread'><b>{new Date(w.date).toLocaleDateString()} — {w.volume} kg {w.isPR?.length ? '⭐' : ''}</b><button onClick={() => {
          if (confirm('Delete workout?')) api.delete('/workouts/' + w._id).then(reload).catch(err);
        }}>Delete</button></div><p>{w.exercises.map(e => e.name).join(' · ')}</p></Card>)}<button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button> Page {page} / {d.pagination?.pages || 1} <button disabled={page >= d.pagination?.pages} onClick={() => setPage(page + 1)}>Next</button></>;
}
export function Progress() {
  const [series] = useLoad('/stats/volume-series');
  const [exercise, setExercise] = useState('Deadlift');
  const [points] = useLoad('/stats/exercise-progress?exercise=' + encodeURIComponent(exercise));
  return <><h1>Training progress</h1><Card><h2>12-week volume</h2><ResponsiveContainer width='100%' height={270}><BarChart data={series}><XAxis dataKey='week' /><YAxis /><Tooltip /><Bar dataKey='volume' fill='#16a36a' /></BarChart></ResponsiveContainer></Card><Card><Field label='Exercise name' value={exercise} onChange={e => setExercise(e.target.value)} /><ResponsiveContainer width='100%' height={260}><LineChart data={points}><XAxis dataKey='date' tickFormatter={x => new Date(x).toLocaleDateString()} /><YAxis /><Tooltip /><Line dataKey='maxWeight' stroke='#16a36a' /></LineChart></ResponsiveContainer></Card></>;
}
export function Food() {
  const [date, setDate] = useState(today()),
    [d, reload] = useLoad('/food?date=' + date, {
      meals: []
    }),
    [q, setQ] = useState(''),
    [results] = useLoad('/foods/search?q=' + encodeURIComponent(q)),
    [manual, setManual] = useState({
      name: '',
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0
    }),
    [photo, setPhoto] = useState('');
  const meals = d.meals || [];
  const save = m => api.post('/food', {
    date,
    meals: m
  }).then(reload).catch(err);
  const total = k => meals.reduce((s, m) => s + (Number(m[k]) || 0), 0);
  return <><h1>Food tracker</h1><Field label='Date' type='date' value={date} onChange={e => setDate(e.target.value)} /><div className='stats'>{['calories', 'protein', 'carbs', 'fats'].map(k => <StatCard key={k} label={k} value={Math.round(total(k)) + (k === 'calories' ? ' kcal' : ' g')} />)}</div><Card><h2>Food search — 70+ items</h2><input placeholder='Search Indian foods' value={q} onChange={e => setQ(e.target.value)} />{results.slice(0, 8).map(f => <div className='listrow' key={f.id}>{f.name} · {f.calories} kcal <button onClick={() => save([...meals, f])}>+ Add</button></div>)}</Card><Card><h2>Manual meal</h2><div className='inline'>{Object.keys(manual).map(k => <Field key={k} label={k} type={k === 'name' ? 'text' : 'number'} value={manual[k]} onChange={e => setManual({
          ...manual,
          [k]: e.target.value
        })} />)}</div><Field label='Meal photo' type='file' accept='image/*' onChange={async e => {
        const fd = new FormData();
        fd.append('photo', e.target.files[0]);
        try {
          setPhoto((await api.post('/food/photo', fd)).data.photoUrl);
        } catch (x) {
          err(x);
        }
      }} /><Btn onClick={() => save([...meals, {
        ...manual,
        photoUrl: photo
      }])}>Add meal</Btn></Card><Card><h2>Today's meals</h2>{meals.map((m, i) => <div className='listrow' key={i}>{m.name} — {m.calories} kcal <button onClick={() => save(meals.filter((_, j) => i !== j))}>×</button></div>)}</Card></>;
}
export { default as Coach } from '../components/AdvancedCoach';
export function Challenges() {
  const [list, reload] = useLoad('/challenges'),
    [selected, setSelected] = useState(null),
    [leader, setLeader] = useState([]),
    [form, setForm] = useState({
      name: '30 Day Challenge',
      type: 'streak',
      days: 30
    });
  const show = async c => {
    setSelected(c);
    setLeader((await api.get('/challenges/' + c._id + '/leaderboard')).data);
  };
  return <><h1>Community challenges</h1><Card><h2>Create challenge</h2><Field label='Name' value={form.name} onChange={e => setForm({
        ...form,
        name: e.target.value
      })} /><Select label='Type' options={['streak', 'volume', 'workouts']} value={form.type} onChange={e => setForm({
        ...form,
        type: e.target.value
      })} /><Field label='Days' type='number' value={form.days} onChange={e => setForm({
        ...form,
        days: +e.target.value
      })} /><Btn onClick={() => api.post('/challenges', {
        ...form,
        startDate: new Date(),
        endDate: new Date(Date.now() + form.days * 86400000)
      }).then(reload).catch(err)}>Create</Btn></Card>{list.map(c => <Card key={c._id}><h3>{c.name}</h3><p>{c.type} · {c.days} days · {c.participants.length} participants</p><button onClick={() => api.post('/challenges/' + c._id + '/join').then(reload).catch(err)}>{c.participants.length ? 'Join / Joined' : 'Join'}</button> <button onClick={() => show(c)}>Leaderboard & check-in</button></Card>)}{selected && <Card><h2>{selected.name} leaderboard</h2><Btn onClick={() => api.post('/challenges/' + selected._id + '/checkin').then(() => show(selected)).catch(err)}>Today's check-in</Btn>{leader.map((x, i) => <p key={i}>#{i + 1} {x._id} — {x.count} check-ins</p>)}</Card>}</>;
}
export function Buddies() {
  const [me, reloadMe] = useLoad('/buddies/me', {}),
    [near, reloadNear] = useLoad('/buddies/nearby', {
      items: []
    }),
    [incoming, reloadIn] = useLoad('/requests/incoming'),
    [outgoing, reloadOut] = useLoad('/requests/outgoing'),
    [form, setForm] = useState({
      displayName: '',
      lat: 28.61,
      lng: 77.21,
      goals: 'strength,muscle gain',
      bio: ''
    }),
    [search, setSearch] = useState(''),
    [statuses, setStatuses] = useState([]),
    [view, setView] = useState(false);
  useEffect(() => {
    if (me?.displayName) setForm({
      ...me,
      goals: (me.goals || []).join(',')
    });
  }, [me?._id]);
  const refresh = () => {
    reloadIn();
    reloadOut();
    reloadNear();
  };
  return <><h1>Find gym buddies</h1><Card><h2>My buddy profile</h2><div className='inline'>{['displayName', 'lat', 'lng', 'bio', 'goals'].map(k => <Field key={k} label={k} value={form[k] ?? ''} onChange={e => setForm({
          ...form,
          [k]: e.target.value
        })} />)}</div><Btn onClick={() => api.put('/buddies/me', {
        ...form,
        goals: String(form.goals).split(',').map(x => x.trim())
      }).then(reloadMe).catch(err)}>Save profile</Btn></Card><Card><h2>24-hour buddy stories</h2><button onClick={() => api.get('/status/feed').then(r => {
        setStatuses(r.data);
        setView(true);
      }).catch(err)}>View stories</button><input type='file' accept='image/*' onChange={async e => {
        const fd = new FormData();
        fd.append('photo', e.target.files[0]);
        await api.post('/status', fd).catch(err);
      }} /></Card><Card><h2>Nearby users</h2><input placeholder='Search' value={search} onChange={e => setSearch(e.target.value)} />{near.items?.filter(x => x.displayName.toLowerCase().includes(search.toLowerCase())).map(p => <div className='listrow' key={p._id}><b>{p.displayName}</b> · {p.distanceKm} km · {p.goals.join(', ')} <button onClick={() => api.post('/requests', {
          to: p.userId._id
        }).then(refresh).catch(err)}>Request</button></div>)}</Card><div className='twocol'><Card><h2>Incoming requests</h2>{incoming.map(x => <p key={x._id}>{x.from?.name} <button onClick={() => api.post('/requests/' + x._id + '/accept').then(refresh).catch(err)}>Accept</button> <button onClick={() => api.post('/requests/' + x._id + '/reject').then(refresh).catch(err)}>Reject</button></p>)}</Card><Card><h2>Outgoing requests</h2>{outgoing.map(x => <p key={x._id}>{x.to?.name} — {x.status}</p>)}</Card></div>{view && statuses.length > 0 && <StatusViewer statuses={statuses} onClose={() => setView(false)} />}</>;
}
export function Chat() {
  const [buddies] = useLoad('/requests/buddies'),
    [conversations, reload] = useLoad('/chat/conversations'),
    [active, setActive] = useState(null),
    [messages, setMessages] = useState([]),
    [text, setText] = useState(''),
    [typing, setTyping] = useState(false),
    [online, setOnline] = useState([]),
    [socket, setSocket] = useState(null);
  useEffect(() => {
    const s = connectSocket();
    setSocket(s);
    s.on('online', setOnline);
    return () => s.disconnect();
  }, []);
  useEffect(() => {
    if (!active) return;
    api.get('/chat/conversations/' + active + '/messages').then(r => setMessages(r.data));
    socket?.emit('join-conversation', {
      conversationId: active
    });
    const onMsg = ({
      message
    }) => {
      if (message.conversationId === active) setMessages(m => m.some(x => x._id === message._id) ? m : [...m, message]);
    };
    const onTyping = ({
      typing
    }) => setTyping(typing);
    socket?.on('message', onMsg);
    socket?.on('typing', onTyping);
    return () => {
      socket?.emit('leave-conversation', {
        conversationId: active
      });
      socket?.off('message', onMsg);
      socket?.off('typing', onTyping);
    };
  }, [active, socket]);
  const start = async id => {
    try {
      const r = await api.post('/chat/conversations', {
        userId: id
      });
      setActive(r.data._id);
      reload();
    } catch (x) {
      err(x);
    }
  };
  const send = () => {
    if (!text.trim() || !active) return;
    socket?.emit('send-message', {
      conversationId: active,
      text
    }, ack => {
      if (ack.error) alert(ack.error);
    });
    setText('');
  };
  return <><h1>Buddy chat</h1><div className='twocol'><Card><h2>Accepted buddies</h2>{buddies.map(b => {
          const other = b.from._id === b.to._id ? b.to : b.from._id === b.from ? b.to : b.from;
          return <p key={b._id}><button onClick={() => start(other._id)}>{online.includes(other._id) ? '🟢' : '⚪'} {other.name}</button></p>;
        })}<h2>Conversations</h2>{conversations.map(c => <p key={c._id}><button onClick={() => setActive(c._id)}>{c.participants.map(p => p.name).join(' & ')}</button></p>)}</Card><Card><h2>Messages {typing ? '· typing...' : ''}</h2><div className='chatbox'>{messages.map(m => <div key={m._id} className='bubble'>{m.text}</div>)}</div><div className='inline'><input value={text} onChange={e => {
            setText(e.target.value);
            socket?.emit('typing', {
              conversationId: active,
              typing: !!e.target.value
            });
          }} onKeyDown={e => e.key === 'Enter' && send()} /><Btn onClick={send}>Send</Btn></div></Card></div></>;
}
export function Measurements() {
  const [list, reload] = useLoad('/measurements'),
    [insights, reloadInsights] = useLoad('/measurements/insights', {}),
    [f, setF] = useState({
      weight: 76.5,
      chest: 102,
      waist: 83,
      arms: 35,
      thighs: 56
    });
  return <><h1>Body measurements</h1><Card><div className='inline'>{Object.keys(f).map(k => <Field key={k} label={k + (k === 'weight' ? ' (kg)' : ' (cm)')} type='number' value={f[k]} onChange={e => setF({
          ...f,
          [k]: e.target.value
        })} />)}</div><Btn onClick={() => api.post('/measurements', f).then(() => {
        reload();
        reloadInsights();
      }).catch(err)}>Save</Btn></Card><Card><h2>Physique insights</h2>{Object.entries(insights.trends || {}).map(([k, v]) => <p key={k}>{k}: {v > 0 ? '+' : ''}{v} {k === 'weight' ? 'kg' : 'cm'} {k === 'waist' && v < 0 ? '— lean progress' : ''}</p>)}</Card>{Object.keys(f).map(k => <Card key={k}><h3>{k} trend</h3><ResponsiveContainer width='100%' height={180}><LineChart data={list}><XAxis dataKey='date' tickFormatter={x => new Date(x).toLocaleDateString()} /><YAxis domain={['auto', 'auto']} /><Tooltip /><Line dataKey={k} stroke='#16a36a' /></LineChart></ResponsiveContainer></Card>)}</>;
}
export function Transformation() {
  const [list, reload] = useLoad('/photos'),
    [weight, setWeight] = useState(''),
    [notes, setNotes] = useState(''),
    [file, setFile] = useState(null),
    [filter, setFilter] = useState('Natural'),
    [compare, setCompare] = useState(50);
  return <><h1>Transformation gallery</h1><p className='muted'>Natural, Definition+ and B&W are CSS filters only — no body analysis or AI.</p><Card><div className='inline'><Field label='Weight (kg)' value={weight} onChange={e => setWeight(e.target.value)} /><Field label='Notes' value={notes} onChange={e => setNotes(e.target.value)} /><Field label='Photo' type='file' accept='image/*' onChange={e => setFile(e.target.files[0])} /></div><Btn onClick={async () => {
        if (!file) return alert('Select photo');
        const fd = new FormData();
        fd.append('photo', file);
        fd.append('weight', weight);
        fd.append('notes', notes);
        try {
          await api.post('/photos/upload', fd);
          reload();
        } catch (x) {
          err(x);
        }
      }}>Upload progress photo</Btn></Card><Select label='Filter' options={['Natural', 'Definition+', 'B&W']} value={filter} onChange={e => setFilter(e.target.value)} /><div className='gallery'>{list.map(p => <Card key={p._id}><img className={'photo ' + (filter === 'B&W' ? 'bw' : filter === 'Definition+' ? 'definition' : '')} src={imageUrl(p.imageUrl)} /><p>{p.weight} kg — {p.notes}</p><button onClick={() => api.delete('/photos/' + p._id).then(reload)}>Delete</button></Card>)}</div>{list.length >= 2 && <Card><h2>Before / after slider</h2><div className='compare'><img src={imageUrl(list[0].imageUrl)} /><img style={{
          clipPath: `inset(0 0 0 ${compare}%)`
        }} src={imageUrl(list.at(-1).imageUrl)} /></div><input type='range' min='0' max='100' value={compare} onChange={e => setCompare(+e.target.value)} /></Card>}</>;
}
export function Profile() {
  const {
    user
  } = useAuth();
  return <><h1>My profile</h1><Card><h2>{user.name}</h2><p>{user.email} · {user.role} · {user.plan}</p><Link to='/buddies'>Manage buddy profile</Link></Card><h2>Achievement badges</h2><div className='stats'>{Object.entries(badges).map(([id, name]) => <Card key={id}><h3>{user.badges?.includes(id) ? '🏅' : '🔒'} {name}</h3><p>{user.badges?.includes(id) ? 'Unlocked' : 'Locked'}</p></Card>)}</div></>;
}
export function Programs() {
  const [list, reload] = useLoad('/programs'),
    [mine, reloadMine] = useLoad('/programs/my'),
    [search, setSearch] = useState(''),
    [level, setLevel] = useState('all'),
    [goal, setGoal] = useState('all');
  return <><h1>Workout programs</h1><div className='inline'><input placeholder='Search' value={search} onChange={e => setSearch(e.target.value)} /><Select label='Level' options={['all', 'beginner', 'intermediate', 'advanced']} value={level} onChange={e => setLevel(e.target.value)} /><Select label='Goal' options={['all', 'fat-loss', 'muscle-gain', 'strength', 'general']} value={goal} onChange={e => setGoal(e.target.value)} /></div><h2>My programs</h2>{mine.map(e => <Card key={e._id}><h3>{e.programId?.name}</h3><p>{e.completedDays.length}/{e.programId?.durationWeeks * e.programId?.daysPerWeek} days completed</p><progress value={e.completedDays.length} max={e.programId?.durationWeeks * e.programId?.daysPerWeek} /><div className='chips'>{Array.from({
          length: e.programId?.durationWeeks || 0
        }, (_, i) => Array.from({
          length: e.programId?.daysPerWeek || 0
        }, (_, j) => `w${i + 1}d${j + 1}`)).flat().map(key => <button disabled={e.completedDays.includes(key)} key={key} onClick={() => api.post('/programs/' + e.programId._id + '/progress', {
          key
        }).then(reloadMine).catch(err)}>{e.completedDays.includes(key) ? '✓ ' : ''}{key}</button>)}</div></Card>)}<h2>Browse programs</h2>{list.filter(p => (level === 'all' || p.level === level) && (goal === 'all' || p.goal === goal) && p.name.toLowerCase().includes(search.toLowerCase())).map(p => <Card key={p._id}><h3>{p.name}</h3><p>{p.description} · {p.level} · {p.goal} · {p.durationWeeks} weeks · {p.daysPerWeek} days/week</p><Btn onClick={() => api.post('/programs/' + p._id + '/enroll').then(reloadMine).catch(err)}>Enroll</Btn></Card>)}</>;
}
export function Diet() {
  const [f, setF] = useState({
      age: 23,
      gender: 'male',
      weightKg: 76,
      heightCm: 178,
      activity: 'moderate',
      goal: 'fat-loss',
      dietType: 'veg'
    }),
    [plan, setPlan] = useState(null);
  useEffect(() => {
    api.get('/diet/plan').then(r => setPlan(r.data)).catch(() => {});
  }, []);
  return <><h1>Diet Plan Generator</h1><p className='muted'>Rule-based, not ML. BMR uses Mifflin-St Jeor; meals are illustrative templates.</p><Card><div className='inline'>{['age', 'weightKg', 'heightCm'].map(k => <Field key={k} label={k} type='number' value={f[k]} onChange={e => setF({
          ...f,
          [k]: +e.target.value
        })} />)}{Object.entries({
          gender: ['male', 'female'],
          activity: ['sedentary', 'light', 'moderate', 'active', 'very-active'],
          goal: ['fat-loss', 'muscle-gain', 'maintain'],
          dietType: ['veg', 'non-veg']
        }).map(([k, opts]) => <Select key={k} label={k} options={opts} value={f[k]} onChange={e => setF({
          ...f,
          [k]: e.target.value
        })} />)}</div><Btn onClick={() => api.post('/diet/plan', f).then(r => setPlan(r.data)).catch(err)}>Generate plan</Btn></Card>{plan && <><div className='stats'>{[['BMR', plan.bmr], ['TDEE', plan.tdee], ['Target kcal', plan.targetCalories], ['Protein g', plan.macros.protein], ['Carbs g', plan.macros.carbs], ['Fats g', plan.macros.fats]].map(([label, value]) => <StatCard key={label} label={label} value={value} />)}</div>{plan.meals.map((m, i) => <Card key={i}><b>{['Breakfast', 'Lunch', 'Snack', 'Dinner'][i]}</b><p>{m.name} — {m.calories} kcal</p></Card>)}</>}</>;
}
export function Admin() {
  const [stats, reload] = useLoad('/admin/stats', {}),
    [search, setSearch] = useState(''),
    [role, setRole] = useState(''),
    [users, reloadUsers] = useLoad('/admin/users?search=' + encodeURIComponent(search) + '&role=' + role, {
      items: []
    });
  const {
    user
  } = useAuth();
  return <><h1>Admin panel</h1><div className='stats'>{['users', 'workouts', 'challenges', 'programs', 'totalVolume'].map(k => <StatCard key={k} label={k} value={stats[k] ?? 0} />)}</div><Card><h2>Newest users</h2>{stats.newestUsers?.map(u => <p key={u._id}>{u.name} — {u.email}</p>)}</Card><Card><h2>User management</h2><input placeholder='Search users' value={search} onChange={e => setSearch(e.target.value)} /><Select label='Role' options={['', 'user', 'coach', 'admin']} value={role} onChange={e => setRole(e.target.value)} />{users.items?.map(u => <div className='listrow' key={u._id}>{u.name} — {u.email}<select disabled={u._id === user.id} value={u.role} onChange={e => api.patch('/admin/users/' + u._id + '/role', {
          role: e.target.value
        }).then(() => {
          reloadUsers();
          reload();
        }).catch(err)}>{['user', 'coach', 'admin'].map(x => <option key={x}>{x}</option>)}</select></div>)}</Card></>;
}
export function FormCheck() {
  const video = React.useRef(null),
    canvas = React.useRef(null),
    camera = React.useRef(null),
    [running, setRunning] = useState(false),
    [reps, setReps] = useState(0),
    [feedback, setFeedback] = useState('Camera not started'),
    [exercise, setExercise] = useState('squat');
  const phase = React.useRef(false);
  const stop = () => {
    camera.current?.stop();
    camera.current = null;
    setRunning(false);
  };
  useEffect(() => () => stop(), []);
  const start = async () => {
    try {
      const load = src => new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
      await load('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
      await load('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      const pose = new window.Pose({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: .5,
        minTrackingConfidence: .5
      });
      const angle = (a, b, c) => {
        const x = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        return Math.abs(x * 180 / Math.PI) > 180 ? 360 - Math.abs(x * 180 / Math.PI) : Math.abs(x * 180 / Math.PI);
      };
      pose.onResults(r => {
        const ctx = canvas.current?.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, 640, 480);
        if (!r.poseLandmarks) return setFeedback('Move into camera view');
        const p = r.poseLandmarks;
        const ids = exercise === 'squat' ? [23, 25, 27] : [11, 13, 15];
        const a = angle(...ids.map(i => p[i]));
        const down = exercise === 'squat' ? a < 100 : a < 95,
          up = a > 155;
        if (down) {
          phase.current = true;
          setFeedback('Good depth — push up');
        } else if (up && phase.current) {
          phase.current = false;
          setReps(v => v + 1);
          setFeedback('Rep counted!');
        } else setFeedback('Keep moving with control');
        ctx.fillStyle = '#16a36a';
        p.forEach(x => ctx.fillRect(x.x * 640 - 2, x.y * 480 - 2, 4, 4));
      });
      const cam = new window.Camera(video.current, {
        onFrame: async () => pose.send({
          image: video.current
        }),
        width: 640,
        height: 480
      });
      camera.current = cam;
      await cam.start();
      setRunning(true);
    } catch (e) {
      setFeedback('Camera or MediaPipe unavailable: ' + e.message);
    }
  };
  return <><h1>Form Check (Beta)</h1><p className='muted'>MediaPipe Pose landmarks in your browser; heuristic rep counter, not trained AI form assessment. Camera permission required.</p><Card><Select label='Exercise' options={['squat', 'push-up']} value={exercise} onChange={e => {
        setExercise(e.target.value);
        setReps(0);
        phase.current = false;
      }} /><div className='camera'><video ref={video} autoPlay playsInline muted /><canvas ref={canvas} width='640' height='480' /></div><h2>Reps: {reps}</h2><p>{feedback}</p><Btn onClick={running ? stop : start}>{running ? 'Stop camera' : 'Start camera'}</Btn></Card></>;
}
