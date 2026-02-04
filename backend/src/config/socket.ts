import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from './env';

export const createSocketServer = (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin.split(','),
      methods: ['GET', 'POST'],
      credentials: config.cors.credentials,
    },
    transports: ['websocket', 'polling'],
  });

  console.log('✅ Socket.IO server initialized');

  return io;
};