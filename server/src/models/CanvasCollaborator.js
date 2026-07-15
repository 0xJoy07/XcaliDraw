import mongoose from 'mongoose';

const canvasCollaboratorSchema = new mongoose.Schema({
  canvasId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canvas',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['viewer', 'editor'],
    default: 'viewer',
  },
}, { timestamps: true });

canvasCollaboratorSchema.index({ canvasId: 1, userId: 1 }, { unique: true });

export const CanvasCollaborator = mongoose.model('CanvasCollaborator', canvasCollaboratorSchema);
