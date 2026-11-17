import mongoose from 'mongoose';
const {
  Schema,
  model
} = mongoose;
const O = {
  timestamps: true
};
const ref = {
  type: Schema.Types.ObjectId,
  ref: 'User'
};
const create = (n, fields, options = O) => model(n, new Schema(fields, options));
export const User = create('User', {
  name: String,
  email: {
    type: String,
    unique: true,
    lowercase: true
  },
  passwordHash: String,
  badges: {
    type: [String],
    default: []
  },
  role: {
    type: String,
    enum: ['user', 'coach', 'admin'],
    default: 'user'
  },
  plan: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  premiumUntil: Date,
  avatarUrl: String,
  bio: {
    type: String,
    maxlength: 300
  },
  fitnessGoal: String,
  experience: String,
  city: String
});
export const Workout = create('Workout', {
  userId: ref,
  date: {
    type: Date,
    default: Date.now
  },
  exercises: [{
    name: String,
    sets: [{
      reps: Number,
      weight: Number
    }],
    volume: Number
  }],
  volume: Number,
  isPR: [String]
});
export const FoodLog = create('FoodLog', {
  userId: ref,
  date: String,
  meals: [{
    name: String,
    protein: Number,
    carbs: Number,
    fats: Number,
    calories: Number,
    photoUrl: String
  }]
});
FoodLog.schema.index({
  userId: 1,
  date: 1
}, {
  unique: true
});
export const Measurement = create('Measurement', {
  userId: ref,
  date: {
    type: Date,
    default: Date.now
  },
  weight: Number,
  chest: Number,
  waist: Number,
  arms: Number,
  thighs: Number
});
export const Photo = create('Photo', {
  userId: ref,
  date: {
    type: Date,
    default: Date.now
  },
  imageUrl: String,
  weight: Number,
  notes: String
});
export const Status = create('Status', {
  userId: ref,
  imageUrl: String,
  caption: {
    type: String,
    maxlength: 120
  },
  expiresAt: Date,
  views: [ref]
});
Status.schema.index({
  expiresAt: 1
}, {
  expireAfterSeconds: 0
});
export const Conversation = create('Conversation', {
  participants: [ref],
  lastRead: {
    type: Map,
    of: Date,
    default: {}
  }
});
export const Message = create('Message', {
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  senderId: ref,
  text: {
    type: String,
    maxlength: 1000
  }
});
export const BuddyProfile = create('BuddyProfile', {
  userId: {
    ...ref,
    unique: true
  },
  displayName: String,
  lat: Number,
  lng: Number,
  goals: [String],
  bio: String
});
export const BuddyRequest = create('BuddyRequest', {
  from: ref,
  to: ref,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
});
export const Challenge = create('Challenge', {
  name: String,
  type: {
    type: String,
    enum: ['streak', 'volume', 'workouts']
  },
  days: Number,
  startDate: Date,
  endDate: Date,
  participants: [ref],
  createdBy: ref
});
export const CheckIn = create('CheckIn', {
  userId: ref,
  challengeId: {
    type: Schema.Types.ObjectId,
    ref: 'Challenge'
  },
  date: String,
  note: String
});
CheckIn.schema.index({
  userId: 1,
  challengeId: 1,
  date: 1
}, {
  unique: true
});
export const Notification = create('Notification', {
  userId: ref,
  type: {
    type: String,
    enum: ['buddy_request', 'buddy_accepted', 'challenge_joined', 'message', 'program', 'system']
  },
  title: String,
  body: String,
  link: String,
  read: {
    type: Boolean,
    default: false
  },
  meta: Schema.Types.Mixed
});
export const Program = create('Program', {
  name: String,
  description: String,
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  goal: {
    type: String,
    enum: ['fat-loss', 'muscle-gain', 'strength', 'general']
  },
  durationWeeks: {
    type: Number,
    min: 1,
    max: 24
  },
  daysPerWeek: {
    type: Number,
    min: 1,
    max: 7
  },
  days: [{
    day: Number,
    title: String,
    exercises: [String],
    sets: String,
    rest: String
  }],
  createdBy: ref
});
export const Enrollment = create('Enrollment', {
  userId: ref,
  programId: {
    type: Schema.Types.ObjectId,
    ref: 'Program'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  currentWeek: {
    type: Number,
    default: 1
  },
  completedDays: [String],
  status: {
    type: String,
    default: 'active'
  }
});
Enrollment.schema.index({
  userId: 1,
  programId: 1
}, {
  unique: true
});
export const DietPlan = create('DietPlan', {
  userId: {
    ...ref,
    unique: true
  },
  inputs: Schema.Types.Mixed,
  bmr: Number,
  tdee: Number,
  targetCalories: Number,
  macros: Schema.Types.Mixed,
  meals: [Schema.Types.Mixed]
});
