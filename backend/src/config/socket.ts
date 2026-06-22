import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.use((socket: Socket, next: (err?: Error) => void) => {
    try {
      const cookieHeader = socket.request.headers.cookie;
      if (!cookieHeader) {
        return next(new Error('Authentication error'));
      }

      // Parse cookies manually
      const cookies = cookieHeader.split(';').reduce((res: any, item: string) => {
        const data = item.trim().split('=');
        res[data[0]] = data[1];
        return res;
      }, {});

      // Check admin token first (Admin / Staff / Mid TPR)
      if (cookies.admin_token) {
        try {
          const decoded = jwt.verify(cookies.admin_token, process.env.ADMIN_JWT_SECRET as string) as any;
          socket.data.user = decoded; // { userId, role, ... }
          socket.join(`user:${decoded.userId}`);
          socket.join(`role:${decoded.role}`);
          return next();
        } catch (e) {
          // Fall through
        }
      }

      // Check tpr token (Base TPR)
      if (cookies.tpr_token) {
        try {
          const decoded = jwt.verify(cookies.tpr_token, process.env.JWT_SECRET as string) as any;
          socket.data.user = decoded; // { branchId, role: 'branch_tpr' }
          if (decoded.branchId) {
            socket.join(`branch:${decoded.branchId}`);
          }
          return next();
        } catch (e) {
          // Fall through
        }
      }

      next(new Error('Authentication error'));
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('Socket connected:', socket.id, 'User:', socket.data.user?.userId || socket.data.user?.branchId);
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
