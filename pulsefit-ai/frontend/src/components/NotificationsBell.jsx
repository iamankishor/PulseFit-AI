import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { connectSocket } from '../socket';
export default function NotificationsBell() {
  const [items, setItems] = useState([]),
    [open, setOpen] = useState(false);
  const load = () => api.get('/notifications').then(r => setItems(r.data.items)).catch(() => {});
  useEffect(() => {
    load();
    const s = connectSocket();
    s.on('notification', load);
    return () => s.disconnect();
  }, []);
  return <div className='bell'><button onClick={() => setOpen(!open)}>🔔 {items.filter(x => !x.read).length || ''}</button>{open && <div className='bell-list card'><button onClick={async () => {
        await api.post('/notifications/read-all');
        load();
      }}>Read all</button>{items.map(x => <p key={x._id}><a href={x.link || '#'}>{x.title}</a> — {x.body}</p>)}</div>}</div>;
}
