export function coachReply(text, stats) {
  const q = text.toLowerCase();
  let reply = 'Consistency wins. Keep logging workouts and focus on progressive overload.';
  let chips = ['What should I train today?', 'My progress', 'Diet tips'];
  if (/hi|hello|hey/.test(q)) reply = `Hey! You have logged ${stats.totalWorkouts} workouts and your streak is ${stats.streak} days. What can I help with?`;else if (/sore|pain|recovery/.test(q)) reply = 'For ordinary post-workout soreness, consider rest, sleep and light movement. Stop if pain is sharp or unusual and consult a professional.';else if (/train|workout|today/.test(q)) reply = `Your recent exercises: ${stats.recentExercises.join(', ') || 'none yet'}. Consider training a different muscle group and allowing recovery.`;else if (/diet|food|protein|calori/.test(q)) reply = 'Prioritize adequate protein, vegetables, hydration and a calorie target suited to your goals. The premium Diet Plan uses transparent formulas, not ML.';else if (/motivat|tired|quit/.test(q)) reply = `You've already completed ${stats.totalWorkouts} workouts. Small consistent sessions add up.`;else if (/progress|strong|pr|streak/.test(q)) reply = `You have ${stats.totalWorkouts} workouts, a ${stats.streak}-day streak and ${stats.prCount} recorded PR exercises.`;
  return {
    reply,
    chips
  };
}
