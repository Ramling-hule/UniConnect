import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js'; 
import dashboardRoutes from './routes/dashboardRoutes.js';
import chatbotRoutes from './routes/chatbotroutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();

app.use(express.json()); 
app.use(helmet());
app.use(morgan('dev')); 

app.use(cors({
  origin: ["https://uniconnect-tkgb.onrender.com"],
  credentials: true,
}));

app.get('/', (req, res) => {
  res.send('API is running...');
});


app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatbotRoutes);
app.use('/api/upload', uploadRoutes); 

export default app;
