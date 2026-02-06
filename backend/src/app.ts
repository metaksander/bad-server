import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'


const { PORT = 3000 } = process.env
const app = express()

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 60,
        message: 'Превышен лимит запросов, попробуйте позже',
        legacyHeaders: false,
    })
)


app.use(helmet())

app.use(cookieParser())

app.use(
    cors({
        origin: process.env.ORIGIN_ALLOW,
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    })
)


// app.use(express.static(path.join(__dirname, 'public')));

app.use(urlencoded({ extended: true }))
app.use(json( ))


app.use(serveStatic(path.join(__dirname, 'public')))
app.use(mongoSanitize())
app.options('*', cors())
app.use(routes)
app.use(errors())
app.use(errorHandler)

// eslint-disable-next-line no-console

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
