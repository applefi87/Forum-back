import 'dotenv/config'
import mongoose from 'mongoose'
import express from 'express'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import cors from 'cors'

import userRouter from './routes/users.js'
import groupRouter from './routes/groups.js'
import articleRouter from './routes/articles.js'
import boardRouter from './routes/boards.js'
import './passport/passport.js'
// 初始化
mongoose.connect(process.env.DB_URL, { autoIndex: false })
// mongoose.connect(process.env.DB_URL)

mongoose.set('sanitizeFilter', true)
const app = express()

// 限流量
const limiter = rateLimit({
  windowMs: 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler(req, res, next, options) {
    res.status(429).send({ success: false, message: '太多請求' })
  }
})
app.use(limiter)

app.use(cors({
  origin(origin, callback) {
    if (origin === undefined || origin.includes('github') || origin.includes('localhost')) {
      callback(null, true)
    } else {
      callback(new Error('Not Allowed'), false)
    }
  }
}))

// 再限定一次防mongo語法
app.use(express.json({ limit: '5mb' }))
app.use(mongoSanitize())
// *********************待紀錄ip
// app.set('trust proxy', 1)
// app.get('/ip', (request, response) => response.send(request.ip))

app.use('/user', userRouter)
app.use('/group', groupRouter)

app.use('/article', articleRouter)
app.use('/board', boardRouter)

app.listen(process.env.PORT || 4000, () => {
  console.log('Server is running')
})