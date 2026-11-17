import mongoose from 'mongoose';
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 8000
  }
}, {
  _id: false,
  timestamps: true
});
const schema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New conversation',
    maxlength: 100
  },
  messages: {
    type: [messageSchema],
    default: []
  }
}, {
  timestamps: true
});
schema.index({
  userId: 1,
  updatedAt: -1
});
export default mongoose.models.AIConversation || mongoose.model('AIConversation', schema);
