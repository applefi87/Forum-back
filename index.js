import * as dotenv from 'dotenv'
import mongoose from 'mongoose'
import express from 'express'
import rateLimit from 'express-rate-limit'
import rateLimit2 from 'rate-limiter-flexible'
import cookieSession from 'cookie-session'
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
    const corsCheck = process.env.NODE_ENV === 'main' ? origin === 'https://leisureforum.onrender.com' : (origin === undefined || origin === 'https://leisureforum-develop.onrender.com' || origin?.includes('http://localhost'))
    if (corsCheck) {
      callback(null, true)
    } else {
      callback(new Error('Not Allowed'), false)
    }
  }
  , credentials: true
}))

// 再限定一次防mongo語法
app.use(mongoSanitize())
app.use(express.json({ limit: '5mb' }))

app.use(cookieSession({
  name: 'session',
  secret: process.env.COOKIE_SECRET,
  cookie: {
    // https://github.com/expressjs/cookie-session#readme
    // *不讓網頁JS 去存取cookie(你自己不會顯示，但有被XSS攻擊就能被抓到，所以多一道保險但你自己也不之內容)
    // httpOnly: false, 預設true
    // *lax 限制外網的指令是get則可帶cookie 'strict'則都不行 但被限制送出則伺服器也無法寫入
    sameSite: 'lax',
    // *只有在https連線才會帶給伺服器
    secure: true
    // domain: "lei.com",  設的話子網域test.lei.com均可讀取
    // path: '/admin',  設的話/admin內的route才可讀取
    // expires: 5 (UTC格式設截止日) maxAge 是以豪秒為有效時間
    // secret: "0",


  }

}))
// *********************待紀錄ip
// app.set('trust proxy', 1)
// app.get('/ip', (request, response) => response.send(request.ip))

app.use('/user', userRouter)
app.use('/group', groupRouter)

app.use('/article', articleRouter)
app.use('/board', boardRouter)
app.use('/test', testRouter)
app.listen(process.env.PORT || 4000, () => {
  console.log('Server is running')
})
