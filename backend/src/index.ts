import 'dotenv/config';
import 'express-async-errors';
import { app } from './app.js';
import { env, isDevelopment } from './config/env.js';
import { prisma } from './config/database.js';

const PORT = parseInt(env.PORT) || 3001;

async function startServer() {
  try {
    // Vérifier la connexion à la base de données
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 Server started successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 API URL: ${env.API_URL}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`🔧 Port: ${PORT}`);
      console.log(`📝 Health Check: ${env.API_URL}/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      if (isDevelopment) {
        console.log('💡 Development mode:');
        console.log(`   - Frontend: ${env.FRONTEND_URL}`);
        console.log(`   - Database: Connected`);
        console.log(`   - S3/MinIO: ${env.S3_ENDPOINT}`);
        console.log('');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

// Démarrer le serveur
startServer();
