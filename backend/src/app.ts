import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from './middleware/error.middleware.js';
import { env, isDevelopment } from './config/env.js';

// Import des routes
import authRoutes from './modules/auth/auth.routes.js';
import studentsRoutes from './modules/students/students.routes.js';
import carnetsRoutes from './modules/carnets/carnets.routes.js';
import photosRoutes from './modules/photos/photos.routes.js';
import preferencesRoutes from './modules/preferences/preferences.routes.js';

export const app = express();

// Sécurité
app.use(helmet());

// CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Limite de requêtes
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging en développement
if (isDevelopment) {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// Routes API
app.get('/api', (_req, res) => {
  res.json({
    name: 'Carnet de Suivi API',
    version: '1.0.0',
    status: 'running',
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/carnets', carnetsRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/preferences', preferencesRoutes);

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Gestion des erreurs (doit être en dernier)
app.use(errorMiddleware);
