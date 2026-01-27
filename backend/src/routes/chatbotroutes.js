import express from 'express';
import { userChat } from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/', userChat);

export default router;