import mongoose from 'mongoose'
import rate from './rate.js'

// 信箱基本加工
function normalizeEmail(email) {
  // 轉小寫
  let lowerEmail = email.toLowerCase()
  let idx = lowerEmail.indexOf("@")
  let front = lowerEmail.substr(0, idx)
  let back = lowerEmail.substr(idx + 1, lowerEmail.length)
  // 解決名稱的"."會被許多信箱忽略，而可重複註冊
  front = front.replaceAll(".", "")
  // 解決gmail內部通用名
  back = back.replace("googlemail", 'gmail')
  return front + "@" + back
  // 不再有./gmail重複/大寫
}
// 驗證學校信箱
const emailSchema = (school) => {
  let msg = '信箱格式錯誤'
  const rule = {
    type: String,
    set: normalizeEmail,
    required: [true, '缺少信箱欄位'],
    minlength: [10, '必須 10 個字以上'],
    maxlength: [40, '必須 40 個字以下'],
    unique: true,
    match: [/^[A-Za-z0-9@\.]+$/, '帳號格式錯誤，僅可含英(不分大小寫)數、@、.'],
    validate: {
      validator: function (email) {
        msg = '信箱格式錯誤'
        // 只能一個@ ||  @後面沒有. (SET已經移除前方.) 直接報錯
        if (email.match(/[@]/g)?.length != 1 || email.match(/[\.]/)?.length < 1) {
          return false
        }
        else {
          // 是學校的話還要是.edu(.abc)結尾
          if (!school || email.match(/.*\.edu\.?[a-z]*/)) {
            return true
          }
          else {
            console.log('4545');
            msg = '必須為學校信箱'
            return false
          }
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
    minlength: [8, '帳號必須 8 個字以上'],
    maxlength: [20, '帳號必須 20 個字以下'],
    unique: true,
    match: [/^[A-Za-z0-9]+$/, '帳號格式錯誤']
  },

  score: { // **********************系統操作，使用者無權限****************************
    type: Number
  },

  securityData: { // **********************系統操作，使用者無權限****************************
    rule: {
      type: Number,
      required: [true, '缺少身分欄位'],
      default: 1,
      // 1 使用者 0 管理員
      enum: [0, 1, 2]
    },
    password: {
      type: String,
      required: true
    },
    schoolEmail: emailSchema('school'),
    email: emailSchema(),
    tokens: {
      type: [String]
    }
  },
  info: {
    gender: {
      type: Number,
      required: [true, '必填性別'],
      // 1 男 2 女 3 無
      enum: [1, 2, 3]
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
    toBoard: rate('articles'),
    // 給人文章評價
    toArticle: rate('articles'),
    //給人訊息評價
    toMsg: rate('articles', { hasLocation: true}),
    // 自己文章被評價
    articleScore: rate('articles', { hasAmount : true }),
    // 自己訊息被評價
    msgScore: rate('articles', { hasLocation: true, hasAmount: true })
  }
}, { versionKey: false })


export default mongoose.model('users', schema)
