import express from 'express'
import { json } from 'body-parser'
import 'express-async-errors'
import cookieSession from 'cookie-session'
import { userRouter } from './routes/userRoutes'
import { NotFoundError } from '../../common/src/errors/not-found-error';
import { errorHandler } from '../../common/src/middlewares/error-handler';

const app = express()
app.set('trust proxy', true) // https
app.use(json())
app.use(cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test' // need https request (test env: false -> http)
}))

app.use(userRouter)

app.all('*', async (req, res) => { 
    throw new NotFoundError()
})

app.use(errorHandler)

export { app }



