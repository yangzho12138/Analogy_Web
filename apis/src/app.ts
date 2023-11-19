import express from 'express'
import { json } from 'body-parser'
import 'express-async-errors'
import cookieSession from 'cookie-session'
import { userRouter } from './routes/userRoutes'
import { searchRouter } from './routes/searchRoutes'
import { conceptRouter } from './routes/conceptRoutes'
import { adminRouter } from './routes/adminRoutes'
import { currentUser, NotFoundError, errorHandler } from '@ticket_hub/common';
import cors from 'cors'

const app = express()
app.set('trust proxy', true) // https
app.use(cors())
app.use(json())
app.use(cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test' // need https request (test env: false -> http)
}))

app.use(currentUser)
app.use(userRouter)
app.use(searchRouter)
app.use(conceptRouter)
app.use(adminRouter)

app.all('*', async (req, res) => { 
    throw new NotFoundError()
})

app.use(errorHandler)

export { app }



