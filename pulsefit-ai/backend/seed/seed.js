import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Workout, Program, Enrollment, Challenge, CheckIn, BuddyProfile, BuddyRequest, Measurement } from '../models/index.js';
import { awardBadges } from '../utils/badges.js';
await mongoose.connect(process.env.MONGO_URI);
for (const m of [User, Workout, Program, Enrollment, Challenge, CheckIn, BuddyProfile, BuddyRequest, Measurement]) await m.deleteMany({});
const make = async (name, email, password, role = 'user', plan = 'free') => User.create({
  name,
  email,
  passwordHash: await bcrypt.hash(password, 10),
  role,
  plan,
  premiumUntil: plan === 'premium' ? new Date(Date.now() + 30 * 86400000) : null
});
const demo = await make('Demo Lifter', 'demo@example.com', 'demo1234'),
  admin = await make('PulseFit Admin', 'admin@pulsefit.in', 'admin1234', 'admin', 'premium');
const buddyNames = ['Rohan', 'Priya', 'Aman', 'Neha', 'Vikram', 'Simran', 'Kabir', 'Ananya'];
const buddies = [];
for (let i = 0; i < 8; i++) {
  const name = buddyNames[i];
  const u = await make(name, `buddy.${name.toLowerCase()}@example.com`, 'buddy1234');
  buddies.push(u);
  await BuddyProfile.create({
    userId: u.id,
    displayName: name,
    lat: 28.61 + (i - 4) * .025,
    lng: 77.21 + (i - 4) * .025,
    goals: ['strength', 'muscle gain'],
    bio: 'Delhi NCR fitness buddy'
  });
}
await BuddyProfile.create({
  userId: demo.id,
  displayName: demo.name,
  lat: 28.61,
  lng: 77.21,
  goals: ['strength']
});
await BuddyRequest.create({
  from: demo.id,
  to: buddies[0].id,
  status: 'accepted'
});
await BuddyRequest.create({
  from: buddies[1].id,
  to: demo.id,
  status: 'pending'
});
const vols = [2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 2850];
for (let i = 0; i < 11; i++) {
  const date = new Date();
  date.setDate(date.getDate() - (11 - i) * 2);
  await Workout.create({
    userId: demo.id,
    date,
    exercises: [{
      name: 'Deadlift',
      sets: [{
        reps: 10,
        weight: vols[i] / 10
      }],
      volume: vols[i]
    }],
    volume: vols[i],
    isPR: i ? [] : ['Deadlift']
  });
}
await awardBadges(demo);
const specs = [['Beginner Full Body — 4 Weeks', 'beginner', 'strength', 4, 3], ['Fat Loss — 4 Weeks', 'intermediate', 'fat-loss', 4, 4], ['Muscle Gain — 6 Weeks', 'intermediate', 'muscle-gain', 6, 4]];
const programs = [];
for (const [name, level, goal, durationWeeks, daysPerWeek] of specs) programs.push(await Program.create({
  name,
  description: 'Structured progressive training',
  level,
  goal,
  durationWeeks,
  daysPerWeek,
  createdBy: admin.id,
  days: Array.from({
    length: daysPerWeek
  }, (_, i) => ({
    day: i + 1,
    title: 'Workout ' + (i + 1),
    exercises: ['Squat', 'Bench Press', 'Row'],
    sets: '3 x 10',
    rest: '60s'
  }))
}));
await Enrollment.create({
  userId: demo.id,
  programId: programs[0].id,
  completedDays: ['w1d1']
});
for (const name of ['30 Day Consistency', 'Volume Warriors']) {
  const c = await Challenge.create({
    name,
    type: name.startsWith('30') ? 'streak' : 'volume',
    days: 30,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 86400000),
    participants: [demo.id],
    createdBy: admin.id
  });
  for (let i = 0; i < 3; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    await CheckIn.create({
      userId: demo.id,
      challengeId: c.id,
      date: d
    });
  }
}
for (const [i, weight] of [78, 77.5, 77, 76.5].entries()) {
  const date = new Date();
  date.setDate(date.getDate() - (3 - i) * 10);
  await Measurement.create({
    userId: demo.id,
    date,
    weight,
    waist: 86 - i,
    chest: 102,
    arms: 35,
    thighs: 56
  });
}
console.log('Seed complete: demo@example.com / demo1234; admin@pulsefit.in / admin1234; buddy.rohan@example.com / buddy1234');
console.log('11 workouts, volume 27350 kg, 3 programs');
await mongoose.disconnect();
