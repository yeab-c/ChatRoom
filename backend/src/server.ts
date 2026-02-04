import http from 'http';
import app from './app';
import { config } from './config/env';
import { connectPostgreSQL } from './config/database';
import { connectMongoDB } from './config/database';
import { createSocketServer } from './config/socket';
import { authenticateSocket } from './middleware/socket.middleware';
import { setupSocketHandlers } from './sockets/socketHandlers';
import { startCleanupJob } from './jobs/cleanupExpiredChats';
import { logger } from './utils/logger';

const PORT = config.port || 5000;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = createSocketServer(server);

// Socket.IO authentication middleware
io.use(authenticateSocket);

// Setup socket event handlers
setupSocketHandlers(io);

// Make io available to routes
app.set('io', io);

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    await connectPostgreSQL();
    await connectMongoDB();

    // Start cleanup job for expired chats
    startCleanupJob();

    // Start listening
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API available at http://localhost:${PORT}/api`);
      logger.info(`Socket.IO running on http://localhost:${PORT}`);
      logger.info(`Health check at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      logger.error(`Port ${PORT} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`Port ${PORT} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

startServer();

export { io };