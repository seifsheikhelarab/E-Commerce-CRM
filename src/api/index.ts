import { Router } from 'express';
import authRouter from './auth/auth.router.js';
import customerRouter from './customers/customers.router.js';
import { rateLimiter } from '../config/ratelimit.config.js';

const router = Router();
router.use(rateLimiter);

router.use('/auth', authRouter);
router.use('/customers', customerRouter);

export default router;
