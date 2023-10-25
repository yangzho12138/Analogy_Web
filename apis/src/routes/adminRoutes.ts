import express, { Request, Response } from 'express'
import { BadRequestError } from '../../../common/src/errors/bad-request-error';
import { requireAuth } from '../../../common/src/middlewares/require-auth';
import { validateRequest } from '../../../common/src/middlewares/validate-request';
import mongoose from 'mongoose';
import { User } from '../models/users';

const router = express.Router();

// get all users wasted all 3 opportunities
router.get('/api/admin/getAllFailedUser', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const admin = await User.findById(req.currentUser!.id);
    if (!admin || !admin.isAdmin) {
        throw new BadRequestError('Only admin can access this route');
    }
    const users = await User.find({
        failedAttempts: {
            $gte: 3
        }
    }).select('email');
    res.status(200).send({users});
})

// reset failed attempts to 0
router.post('/api/admin/resetFailedAttempts', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const admin = await User.findById(req.currentUser!.id);
    if (!admin || !admin.isAdmin) {
        throw new BadRequestError('Only admin can access this route');
    }
    const { email, failedAttempts } = req.body;
    const user = await User.findOne({email});
    if (!user) {
        throw new BadRequestError('User not found');
    }
    user.failedAttempts = failedAttempts;
    await user.save();
    res.status(200).send(user);
})



export { router as adminRouter };

