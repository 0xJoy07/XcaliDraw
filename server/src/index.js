import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import passport from 'passport';
import { connectDb } from './config/db.js';
import './config/passport.js';
import authRoutes from './routes/auth.js';
import canvasRoutes from './routes/canvases.js';

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT;
const clientUrl = process.env.CLIENT_URL;

app.use(cors({
  origin: [clientUrl],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/canvases', canvasRoutes);

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Auth server listening on port ${port}`);
    });
  })
  .catch(() => {
    process.exit(1);
  });

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
