import React, { useEffect, useState } from 'react';
import { api, imageUrl } from '../api';
export default function StatusViewer({
  statuses,
  onClose
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!statuses.length) return;
    api.post('/status/' + statuses[i]._id + '/view').catch(() => {});
    const t = setTimeout(() => setI(v => v + 1 < statuses.length ? v + 1 : (onClose(), v)), 5000);
    return () => clearTimeout(t);
  }, [i, statuses]);
  if (!statuses[i]) return null;
  return <div className='story'><button onClick={onClose}>✕ Close</button><img src={imageUrl(statuses[i].imageUrl)} /><p>{statuses[i].caption}</p><div className='tap left' onClick={() => setI(Math.max(0, i - 1))} /><div className='tap right' onClick={() => i + 1 < statuses.length ? setI(i + 1) : onClose()} /></div>;
}
