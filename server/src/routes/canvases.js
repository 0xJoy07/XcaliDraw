import express from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { Canvas } from '../models/Canvas.js';

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

const validateBody = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid request', issues: parsed.error.flatten().fieldErrors });
    return;
  }

  req.body = parsed.data;
  next();
};

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

const serializeCanvas = (canvas) => ({
  id: canvas._id.toString(),
  title: canvas.title,
  elements: canvas.elements || [],
  appState: canvas.appState || {},
  isPublic: canvas.isPublic,
  shareToken: canvas.shareToken,
  createdAt: canvas.createdAt,
  updatedAt: canvas.updatedAt,
});

const serializeCanvasSummary = (canvas) => ({
  id: canvas._id.toString(),
  title: canvas.title,
  updatedAt: canvas.updatedAt,
  createdAt: canvas.createdAt,
});

const findOwnedCanvas = async (req, res) => {
  const canvas = await Canvas.findById(req.params.id);
  if (!canvas) {
    res.status(404).json({ message: 'Canvas not found' });
    return null;
  }

  if (canvas.userId.toString() !== req.user.userId) {
    res.status(403).json({ message: 'You do not have access to this canvas' });
    return null;
  }

  return canvas;
};

router.use(requireAuth);

router.post('/', validateBody(createCanvasSchema), async (req, res, next) => {
  try {
    const canvas = await Canvas.create({
      userId: req.user.userId,
      title: req.body.title || 'Untitled',
      elements: req.body.elements || [],
      appState: req.body.appState || {},
    });

    res.status(201).json({ canvas: serializeCanvas(canvas) });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
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
    const canvas = await findOwnedCanvas(req, res);
    if (!canvas) return;

    res.json({ canvas: serializeCanvas(canvas) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', validateCanvasId, validateBody(updateCanvasSchema), async (req, res, next) => {
  try {
    const canvas = await findOwnedCanvas(req, res);
    if (!canvas) return;

    if (req.body.title !== undefined) canvas.title = req.body.title;
    if (req.body.elements !== undefined) canvas.elements = req.body.elements;
    if (req.body.appState !== undefined) canvas.appState = { ...canvas.appState, ...req.body.appState };

    await canvas.save();
    res.json({ canvas: serializeCanvas(canvas) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', validateCanvasId, async (req, res, next) => {
  try {
    const canvas = await findOwnedCanvas(req, res);
    if (!canvas) return;

    await canvas.deleteOne();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
