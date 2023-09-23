import express, { Request, Response } from 'express'
import { body } from 'express-validator'
import jwt from 'jsonwebtoken'
import { User } from '../models/users';
import { BadRequestError } from '../../../common/src/errors/bad-request-error';
import { validateRequest } from '../../../common/src/middlewares/validate-request';
import { Password } from '../utils/password';

const router = express.Router();

router.post('/api/users/signup', [
    body('email')
        .isEmail()
        .contains('@illinicloud.edu')
        .withMessage('Email must be valid'),
    body('password')
        .trim()
        .isLength({ min: 4, max: 20 })
        .withMessage('Password must be between 4 and 20 characters')
], validateRequest, async (req: Request, res: Response) => {
    const { email, password } = req.body
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return new BadRequestError('Email in use');
    }

    const user = User.build({ email, password });
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
    body('email')
    .isEmail()
    .withMessage('Email must be valid'),
    body('password')
    .trim()
    .notEmpty()
    .withMessage('Password can not be empty')
], validateRequest, async (req: Request, res: Response) => {
    const { email, password } = req.body

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        return new BadRequestError('Invalid email or password');
    }

    const passwordMatch = await Password.compare(existingUser.password, password);
    if (!passwordMatch) {
        return new BadRequestError('Invalid email or password');
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
