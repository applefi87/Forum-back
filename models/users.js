import mongoose from 'mongoose'
import rateUser from './rate-user.js'
import normalizeEmail from '../util/normalizeEmail.js'

// 驗證學校信箱
const emailSchema = (school) => {
  let msg = '信箱格式錯誤'
  const rule = {
    type: String,
    set: normalizeEmail,
    required: [true, '缺少信箱欄位'],
    minlength: [10, '必須 10 個字以上'],
    maxlength: [100, '必須 100 個字以下'],
    unique: true,
    match: [/^[A-Za-z0-9]+@[A-Za-z0-9]+\.[A-Za-z0-9\.]+$/, '帳號格式錯誤，僅可含英(不分大小寫)、數、@、.'],
    validate: {
      validator: function (email) {
        // 是學校的話還要是.edu.tw結尾
        if (!school || (/^[A-Za-z0-9]+@[A-Za-z0-9\.]+\.edu\.tw$/).test(email)) {
          return true
        }
        else {
          msg = '必須為學校信箱'
          return false
        }
      },
      message: () => { return msg }
    }
  }
  return rule
}


const schema = new mongoose.Schema({
  account: {
    type: String,
    required: [true, '缺少帳號欄位'],
    minlength: [6, '帳號必須 6 個字以上'],
    maxlength: [30, '帳號必須 30 個字以下'],
    unique: true,
    match: [/^[A-Za-z0-9]+$/, '帳號格式錯誤']
  },
  nickName: {
    type: String,
    required: [true, '缺少暱稱欄位'],
    minlength: [3, '必須 3 個字以上'],
    maxlength: [30, '必須 30 個字以下'],
    unique: true
  },
  score: { // **********************系統操作，使用者無權限****************************
    type: Number
  },
  securityData: { // **********************系統操作，使用者無權限****************************
    role: {
      type: Number,
      required: [true, '缺少身分欄位'],
      // 1 使用者 0 管理員
      enum: [0, 1, 2]
    },
    // 記得改回 schoolEmail: emailSchema('school'),
    schoolEmail: emailSchema(true),
    // email: emailSchema(),
    tokens: {
      type: [String]
    },
    password: {
      type: String,
      required: true
    },
    // 目前沒用
    loginRec: {
      time: { type: Date },
      count: { type: Number }
    },
    safety: {
      // 紀錄忘記密碼/等小次數用
      times: {
        type: Number,
        default: 0
      },
      // 紀錄狂登陸帳密失敗用
      errTimes: {
        type: Number,
        default: 0
      },
      // 供換算超過日期後清除
      errDate: {
        type: Date,
        default: Date.now()
      },
    }
  },
  info: {
    gender: {
      type: Number,
      required: [true, '必填性別'],
      // 1 男 2 女 0 無
      enum: [1, 2, 0]
    },
    living: {
      type: String,
      maxlength: [100, '必須 100 個字以下'],
    },
    job: {
      type: String,
      maxlength: [30, '必須 30 個字以下'],
    },
    interest: {
      type: String,
      maxlength: [100, '必須 100 個字以下'],
    },
    others: {
      type: String,
      maxlength: [100, '必須 100 個字以下'],
    }
  },
  record: { // **********************系統操作，使用者無權限****************************
    //給版評價
    toBoard: rateUser('articles'),
    // 給人文章評價
    toArticle: rateUser('articles'),
    //給人訊息評價
    toMsg: rateUser('articles', { hasLocation: true }),
    // 自己文章被評價
    articleScore: rateUser('articles', { hasAmount: true }),
    // 自己訊息被評價
    msgScore: rateUser('articles', { hasLocation: true, hasAmount: true })
  },
  temp: mongoose.Mixed
}, { versionKey: false })

// schema.index({ nickName: 1 })
export default mongoose.model('users', schema)
