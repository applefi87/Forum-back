import * as dotenv from 'dotenv'
import mongoose from 'mongoose'
import express from 'express'
import rateLimit from 'express-rate-limit'
import rateLimit2 from 'rate-limiter-flexible'
import mongoSanitize from 'express-mongo-sanitize'
import cors from 'cors'
import testRouter from './routes/tests.js'
import userRouter from './routes/users.js'
import groupRouter from './routes/groups.js'
import articleRouter from './routes/articles.js'
import boardRouter from './routes/boards.js'
import './passport/passport.js'
dotenv.config({ path: `./.env.${process.env.NODE_ENV}` });
console.log(process.env.NODE_ENV);
// 初始化
mongoose.connect(process.env.DB_URL, { autoIndex: false })
// https://mongoosejs.com/docs/api.html#schematype_SchemaType-index:~:text=the%20background%20by-,default.,-If%20background%20is
// mongoose.connect(process.env.DB_URL)

// mongoose.set('sanitizeFilter', true)
const app = express()
// 限流量
const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 1 minutes
  max: 90, // Limit each IP to 100 requests per `window` (here, per 1 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler(req, res, next, options) {
    res.status(429).send({ success: false, message: '太多請求' })
  }
})
app.use(limiter)
// app.set('trust proxy', 1);
app.use(cors({
  origin(origin, callback) {
    const corsCheck = process.env.NODE_ENV === 'main' ? origin === 'https://leisureforum.onrender.com' : (origin === undefined || origin === 'https://leisureforum-develop.onrender.com' || origin === 'http://localhost:9000' || true)
    if (corsCheck) {
      callback(null, true)
    } else {
      callback(new Error('Not Allowed'), false)
    }
  }
  ,
  // https://github.com/expressjs/cors#readme  https://israynotarray.com/vscode/20210709/4359299/
  credentials: true
  // methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD', 'DELETE'],
  // exposedHeaders: ["set-cookie"]
  // allowedHeaders: ['Content-Type', 'X-H', 'x-requested-with', 'Accept']
}))

// 再限定一次防mongo語法
app.use(mongoSanitize({
  replaceWith: '_'
}))
app.use(express.json({ limit: '5mb' }))

app.use('/user', userRouter)
app.use('/group', groupRouter)
app.use('/article', articleRouter)
app.use('/board', boardRouter)
app.use('/test', testRouter)
app.listen(process.env.PORT || 4000, () => {
  console.log('Server is running')
})
