import 'dotenv/config'
import mongoose from 'mongoose'
import express from 'express'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import cors from 'cors'
import testRouter from './routes/tests.js'
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
    console.log(origin);
    if (origin.includes('https://leisureforum.onrender.com')) {
      // if (origin === undefined || origin.includes('https://applefi87.github.io') || origin === 'https://leisureforum.onrender.com' || origin.includes('http://localhost')) {
      callback(null, true)
    } else {
      callback(new Error('Not Allowed'), false)
    }
  }
}))

// 再限定一次防mongo語法
app.use(mongoSanitize())
app.use(express.json({ limit: '5mb' }))
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

// //
// console.time('building');
// const arr1 = [] // 250,000 objects
// const arr2 = []
// const final = []
// for (let i = 0; i < 100000; i++) {
//   arr1.push({ prop1: "foo" + i, prop2: i })
// }

// for (let i = 0; i < 100000; i++) {
//   arr2.push({ prop1: "foo" + i, prop2: i })
// }
// console.timeEnd('building');
// // console.time('checking');
// // for (let left of arr1) {
// //   for (let right of arr2) {
// //     if (left.prop1 === right.prop1 && left.prop2 == right.prop2) {
// //       final.push(left)
// //       break
// //     }
// //   }
// // }
// // console.timeEnd('checking');
// // console.log(final.length);

// // console.log('----');

// console.time('building');
// // 250,000 objects
// const mapB = new Map() // 250,000 objects
// let mapC = new Map() // results
// // for (let i = 0; i < 5; i++) {
// //   mapA.set(Object.entries({ prop1: "foo" + i, prop2: i }))
// // }

// // for (let i = 0; i < 5; i++) {
// //   mapB.set(Object.entries({ prop1: "foo" + i, prop2: i }))
// // }
// const mapA = new Map()
// for (const item of arr2) {
//   mapA.set(item.prop1, item);
// }
// console.timeEnd('building');
// console.time('checking');

// for (const item1 of arr1) {
//   const item2 = mapA.get(item1.prop1);
//   if (item2 && item1.prop2 == item2.prop2) {
//     final.push(item1);
//   }
// }

// // console.log(mapA);
// // console.log(mapB);

// // mapA.forEach((v, k) => {
// //   console.log(v);
// //   console.log(k);
// //   console.log(mapB.has(v));
// //   if (mapB.has(v)) {
// //     console.log('has key');
// //     const o = MapA.get(k)
// //     if (o.prop === v.prop) {
// //       mapC.set(k, v)
// //     }
// //   }
// // })
// console.timeEnd('checking');
// console.log(final.length);
