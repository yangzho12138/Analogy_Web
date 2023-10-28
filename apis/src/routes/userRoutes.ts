import express, { Request, Response } from 'express'
import { body } from 'express-validator'
import jwt from 'jsonwebtoken'
import { User } from '../models/users';
import { validateRequest, BadRequestError } from '@ticket_hub/common';
import { Password } from '../utils/password';

const router = express.Router();

router.post('/api/users/signup', [
    body('email').isEmail().contains('@illinois.edu').withMessage('Email must be valid'),
    body('password').trim().isLength({ min: 4, max: 20 }).withMessage('Password must be between 4 and 20 characters')
], validateRequest, async (req: Request, res: Response) => {
    const { email, password } = req.body
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new BadRequestError('Email in use');
    }

    const user = User.build({ email, password, searchHistoryIds: [] });
    await user.save();

    // Generate JWT
    const userJwt = jwt.sign({
        id: user.id,
        email: user.email
    }, process.env.JWT_KEY!, {
        expiresIn: '1d'
    });

    req.session = {
        jwt: userJwt
    };

    res.status(201).send(user);
});

router.post('/api/users/signin', [
    body('email').isEmail().withMessage('Email must be valid'),
    body('password').trim().notEmpty().withMessage('Password can not be empty')
], validateRequest, async (req: Request, res: Response) => {
    const { email, password } = req.body

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        throw new BadRequestError('Invalid email or password');
    }

    const passwordMatch = await Password.compare(existingUser.password, password);
    if (!passwordMatch) {
        throw new BadRequestError('Invalid email or password');
    }

    // Generate JWT
    const userJwt = jwt.sign({
        id: existingUser.id,
        email: existingUser.email
    }, process.env.JWT_KEY!, {
        expiresIn: '1d'
    });

    req.session = {
        jwt: userJwt
    };

    res.status(200).send(existingUser);
})

router.post('/api/users/signout', (req, res) => {
    req.session = null
    res.send({})
})

export { router as userRouter };
