import express from 'express';
import { createOrGetChat, getMyChats, getChatById } from '../controllers/chatController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, createOrGetChat);
router.get('/', auth, getMyChats);
router.get('/:chatId', auth, getChatById);

export default router;
