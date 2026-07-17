import express from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import crypto from 'crypto';
import { requireAuth, optionalAuth } from '../middleware/requireAuth.js';
import { Canvas } from '../models/Canvas.js';
import { CanvasCollaborator } from '../models/CanvasCollaborator.js';
import { User } from '../models/User.js';
import { resolveAccess } from '../utils/resolveAccess.js';
import rateLimit from 'express-rate-limit';
import { sendMail } from '../lib/mailer.js';
import { collaboratorInviteEmail } from '../emails/collaboratorInvite.js';

const router = express.Router();

const createCanvasSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  elements: z.array(z.unknown()).optional(),
  appState: z.record(z.unknown()).optional(),
});

const updateCanvasSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  elements: z.array(z.unknown()).optional(),
  appState: z.record(z.unknown()).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

const shareCanvasSchema = z.object({
  isPublic: z.boolean(),
  publicRole: z.enum(['viewer', 'editor']).nullable(),
});

const collaboratorSchema = z.object({
  email: z.string().email(),
  role: z.enum(['viewer', 'editor']),
});

const validateBody = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid request', issues: parsed.error.flatten().fieldErrors });
    return;
  }
  req.body = parsed.data;
  next();
};

const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many invites sent. Please try again later.' },
  keyGenerator: (req) => req.user?.userId || req.ip,
});

const validateCanvasId = (req, res, next) => {
  const { id } = req.params;
  const isValidObjectId = mongoose.Types.ObjectId.isValid(id)
    && new mongoose.Types.ObjectId(id).toString() === id;

  if (!isValidObjectId) {
    res.status(400).json({ message: 'Invalid canvas id' });
    return;
  }
  next();
};

const serializeCanvas = (canvas, role = 'owner') => ({
  id: canvas._id.toString(),
  title: canvas.title,
  elements: canvas.elements || [],
  appState: canvas.appState || {},
  isPublic: canvas.isPublic,
  publicRole: canvas.publicRole,
  shareToken: canvas.shareToken,
  createdAt: canvas.createdAt,
  updatedAt: canvas.updatedAt,
  role, // include the role in the response
});

const serializeCanvasSummary = (canvas) => ({
  id: canvas._id.toString(),
  title: canvas.title,
  updatedAt: canvas.updatedAt,
  createdAt: canvas.createdAt,
});

const findCanvasForAccess = async (req, res) => {
  const canvas = await Canvas.findById(req.params.id);
  if (!canvas) {
    res.status(404).json({ message: 'Canvas not found' });
    return null;
  }
  return canvas;
};

// --- NON-AUTH ROUTES ---

router.get('/shared/:shareToken', optionalAuth, async (req, res, next) => {
  try {
    const { shareToken } = req.params;
    const canvas = await Canvas.findOne({ shareToken });
    
    if (!canvas || !canvas.isPublic) {
      return res.status(404).json({ message: 'Canvas not found or is no longer shared' });
    }

    const role = await resolveAccess({ canvas, userId: req.user?.userId });
    if (role === 'none') {
      return res.status(403).json({ message: 'You do not have access to this canvas' });
    }

    res.json({ canvas: serializeCanvas(canvas, role) });
  } catch (error) {
    next(error);
  }
});

// --- AUTH ROUTES ---

router.use(requireAuth);

router.post('/', validateBody(createCanvasSchema), async (req, res, next) => {
  try {
    const canvas = await Canvas.create({
      userId: req.user.userId,
      title: req.body.title || 'Untitled',
      elements: req.body.elements || [],
      appState: req.body.appState || {},
    });
    res.status(201).json({ canvas: serializeCanvas(canvas, 'owner') });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    // Only show canvases where the user is the owner (can be expanded to show collaborated later)
    const canvases = await Canvas.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 })
      .select('_id title createdAt updatedAt')
      .lean();
    res.json({ canvases: canvases.map(serializeCanvasSummary) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validateCanvasId, async (req, res, next) => {
  try {
    const canvas = await findCanvasForAccess(req, res);
    if (!canvas) return;

    const role = await resolveAccess({ canvas, userId: req.user.userId });
    if (role === 'none') {
      return res.status(403).json({ message: 'You do not have access to this canvas' });
    }

    res.json({ canvas: serializeCanvas(canvas, role) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', validateCanvasId, validateBody(updateCanvasSchema), async (req, res, next) => {
  try {
    const canvas = await findCanvasForAccess(req, res);
    if (!canvas) return;

    const role = await resolveAccess({ canvas, userId: req.user.userId });
    if (!['owner', 'editor'].includes(role)) {
      return res.status(403).json({ message: 'You do not have permission to edit this canvas' });
    }

    if (req.body.title !== undefined) canvas.title = req.body.title;
    if (req.body.elements !== undefined) canvas.elements = req.body.elements;
    if (req.body.appState !== undefined) canvas.appState = { ...canvas.appState, ...req.body.appState };

    await canvas.save();
    res.json({ canvas: serializeCanvas(canvas, role) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', validateCanvasId, async (req, res, next) => {
  try {
    const canvas = await findCanvasForAccess(req, res);
    if (!canvas) return;

    const role = await resolveAccess({ canvas, userId: req.user.userId });
    if (role !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can delete this canvas' });
    }

    await canvas.deleteOne();
    await CanvasCollaborator.deleteMany({ canvasId: canvas._id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// --- SHARING ROUTES ---

router.post('/:id/share', validateCanvasId, validateBody(shareCanvasSchema), async (req, res, next) => {
  try {
    const canvas = await findCanvasForAccess(req, res);
    if (!canvas) return;

    const role = await resolveAccess({ canvas, userId: req.user.userId });
    if (role !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can modify sharing settings' });
    }

    canvas.isPublic = req.body.isPublic;
    canvas.publicRole = req.body.publicRole;
    
    if (req.body.isPublic && !canvas.shareToken) {
      canvas.shareToken = crypto.randomUUID();
    }

    await canvas.save();
    res.json({ canvas: serializeCanvas(canvas, 'owner') });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/revoke', validateCanvasId, async (req, res, next) => {
  try {
    const canvas = await findCanvasForAccess(req, res);
    if (!canvas) return;

    const role = await resolveAccess({ canvas, userId: req.user.userId });
    if (role !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can revoke sharing' });
    }

    canvas.isPublic = false;
    canvas.publicRole = null;
    canvas.shareToken = undefined; // use undefined so it unsets or drops from sparse index
    
    await canvas.save();
    await CanvasCollaborator.deleteMany({ canvasId: canvas._id });
    
    res.json({ canvas: serializeCanvas(canvas, 'owner') });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/collaborators', validateCanvasId, inviteLimiter, validateBody(collaboratorSchema), async (req, res, next) => {
  try {
    const canvas = await findCanvasForAccess(req, res);
    if (!canvas) return;

    const accessRole = await resolveAccess({ canvas, userId: req.user.userId });
    if (accessRole !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can invite collaborators' });
    }

    const invitedUser = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!invitedUser) {
      return res.status(404).json({ message: 'This user needs to sign up first' });
    }

    if (invitedUser._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'You cannot invite yourself' });
    }

    const collabo = await CanvasCollaborator.findOneAndUpdate(
      { canvasId: canvas._id, userId: invitedUser._id },
      { role: req.body.role },
      { upsert: true, new: true }
    ).populate('userId', 'email name avatarUrl');

    let emailSent = false;
    try {
      const owner = await User.findById(req.user.userId).select('name email');
      const ownerName = owner?.name || owner?.email || 'Someone';
      const canvasLink = `${process.env.CLIENT_URL}/canvas/${canvas._id}`;

      await sendMail({
        to: invitedUser.email,
        subject: 'You have been invited to a canvas on Xcalidraw',
        html: collaboratorInviteEmail({
          ownerName,
          canvasTitle: canvas.title || 'Untitled',
          role: req.body.role,
          canvasLink
        }),
        text: `${ownerName} gave you ${req.body.role} access to '${canvas.title || 'Untitled'}'. Open it here: ${canvasLink}`
      });
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to dispatch collaborator invite email:', emailError);
    }

    res.json({
      collaborator: {
        id: collabo.userId._id.toString(),
        email: collabo.userId.email,
        name: collabo.userId.name,
        avatarUrl: collabo.userId.avatarUrl,
        role: collabo.role
      },
      emailSent
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/collaborators', validateCanvasId, async (req, res, next) => {
  try {
    const canvas = await findCanvasForAccess(req, res);
    if (!canvas) return;

    const accessRole = await resolveAccess({ canvas, userId: req.user.userId });
    if (accessRole !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can view collaborators' });
    }

    const collaborators = await CanvasCollaborator.find({ canvasId: canvas._id })
      .populate('userId', 'email name avatarUrl')
      .lean();

    res.json({
      collaborators: collaborators.map(c => ({
        id: c.userId._id.toString(),
        email: c.userId.email,
        name: c.userId.name,
        avatarUrl: c.userId.avatarUrl,
        role: c.role
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/collaborators/:userId', validateCanvasId, async (req, res, next) => {
  try {
    const canvas = await findCanvasForAccess(req, res);
    if (!canvas) return;

    const accessRole = await resolveAccess({ canvas, userId: req.user.userId });
    if (accessRole !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can remove collaborators' });
    }

    await CanvasCollaborator.deleteOne({ canvasId: canvas._id, userId: req.params.userId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
