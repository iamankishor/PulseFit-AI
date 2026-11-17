import React from 'react';
import { Dumbbell, Flame, Layers, ChartNoAxesColumnIncreasing, Medal } from 'lucide-react';
const icons = [Dumbbell, Flame, Layers, ChartNoAxesColumnIncreasing, Medal];
export default function StatCard({
  label,
  value
}) {
  const index = /streak/i.test(label) ? 1 : /total volume/i.test(label) ? 2 : /week/i.test(label) ? 3 : /badge/i.test(label) ? 4 : 0;
  const Icon = icons[index];
  return <section className={'card stat stat-' + index}><span className="stat-icon"><Icon size={24} /></span><span>{label}</span><strong>{value}</strong></section>;
}
