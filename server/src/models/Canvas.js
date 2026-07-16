import mongoose from 'mongoose';

const canvasSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'Untitled sketch',
    trim: true,
  },
  elements: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  appState: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  publicRole: {
    type: String,
    enum: ['viewer', 'editor', null],
    default: null,
  },
  shareToken: {
    type: String,
  },
}, { timestamps: true });

canvasSchema.index({ userId: 1, updatedAt: -1 });
canvasSchema.index(
  { shareToken: 1 },
  { unique: true, sparse: true, partialFilterExpression: { shareToken: { $type: 'string' } } },
);

export const Canvas = mongoose.model('Canvas', canvasSchema);
