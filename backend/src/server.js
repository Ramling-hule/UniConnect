import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import app from './app.js';
import { env } from './config/env.js';
import { registerSocketHandlers } from './socket/index.js';

// `env` module loads `.env` once and validates required variables.
connectDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);
registerSocketHandlers(io);

const PORT = env.port || 5002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle server errors (e.g., port already in use) to avoid uncaught exceptions
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`ERROR: Port ${PORT} is already in use.`);
    console.error('Possible fixes:');
    console.error(` - Find the process using the port: netstat -ano | findstr :${PORT}`);
    console.error(' - Kill the process: taskkill /PID <PID> /F');
    console.error(` - Or change PORT in backend/.env or pass PORT=<different> when starting.`);
    // Exit with a non-zero code so managers (PM2/docker) know startup failed
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});
