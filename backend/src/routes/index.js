import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import groupRoutes from './groupRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import messageRoutes from './messageRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import careerRoutes from './careerRoutes.js';

const routes = [
  ['/api/auth', authRoutes],
  ['/api/dashboard', dashboardRoutes],
  ['/api/groups', groupRoutes],
  ['/api/notifications', notificationRoutes],
  ['/api/messages', messageRoutes],
  ['/api/upload', uploadRoutes],
  ['/api/career', careerRoutes],
];

export const registerRoutes = (app) => {
  routes.forEach(([path, router]) => app.use(path, router));
};
