import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorMiddleware } from './middleware/error.middleware.js';
import { env, isDevelopment } from './config/env.js';
import { globalLimiter } from './middleware/rateLimiting.middleware.js';
import { mongoSanitization, xssSanitization } from './middleware/sanitization.middleware.js';

// Import des routes
import authRoutes from './modules/auth/auth.routes.js';
import studentsRoutes from './modules/students/students.routes.js';
import carnetsRoutes from './modules/carnets/carnets.routes.js';
import photosRoutes from './modules/photos/photos.routes.js';
import preferencesRoutes from './modules/preferences/preferences.routes.js';
import schoolYearsRoutes from './modules/school-years/school-years.routes.js';
import subjectsRoutes from './modules/subjects/subjects.routes.js';

export const app = express();

// Sécurité - Configuration Helmet avec CSP et HSTS
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Pour les styles inline si nécessaire
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'], // Pour les images uploadées
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 an
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true, // X-Content-Type-Options: nosniff
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    xssFilter: true, // X-XSS-Protection: 1; mode=block (legacy mais utile)
  })
);

// CORS
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://127.0.0.1:*',
  'http://localhost:*',
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,  // Proxy de prévisualisation
  /^https?:\/\/localhost(:\d+)?$/      // Localhost avec n'importe quel port
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (comme les applications mobiles, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origine est dans la liste des origines autorisées
    if (allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      return allowedOrigin.test(origin);
    })) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
}));

// Gérer les requêtes OPTIONS (prévol)
app.options('*', cors());

// Parsing (avant sanitization)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitization des inputs (MongoDB injection et XSS)
app.use(mongoSanitization);
app.use(xssSanitization);

// Rate limiting global
app.use('/api/', globalLimiter);

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
app.use('/api/school-years', schoolYearsRoutes);
app.use('/api/subjects', subjectsRoutes);

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Gestion des erreurs (doit être en dernier)
app.use(errorMiddleware);
