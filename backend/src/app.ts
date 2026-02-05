import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import helmet from 'helmet'
import  csrf from 'csurf'
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'


const { PORT = 3000 } = process.env
const app = express()

app.use(helmet())

app.use(cookieParser())

app.use(cors({ origin: process.env.ORIGIN_ALLOW, credentials: true }))
app.options('*', cors())

// app.use(express.static(path.join(__dirname, 'public')));

app.use(urlencoded({ extended: true }))
app.use(json())

app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next()
    }

    return csrf({
        cookie: {
            httpOnly: true,
            sameSite: 'strict',
        },
    })(req, res, next)
})

app.use((req, res, next) => {
    if (req.csrfToken) {
        res.cookie('XSRF-TOKEN', req.csrfToken())
    }
    next()
})

app.use(serveStatic(path.join(__dirname, 'public')))


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
