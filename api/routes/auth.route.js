import express from 'express';
import { 
  signup, 
  signin, 
  google, 
  signOut, 
  verifyEmail, 
  resendVerification 
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/google', google);
router.get('/signout', signOut);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

export default router;