import mongoose from 'mongoose'

function normalizeEmail(email) {
  // 轉小寫
  let lowerEmail = email.toLowerCase()
  let idx = lowerEmail.indexOf("@")
  let front = lowerEmail.substr(0, idx)
  let back = lowerEmail.substr(idx + 1, lowerEmail.length)
  // 解決名稱的.會被許多信箱忽略，而可重複註冊
  front = front.replaceAll(".", "")
  // 解決gmail內部通用名
  back = back.replace("googlemail", 'gmail')
  return front + "@" + back
}
function emailValid(email) {
  if (email.match(/[@]/g)?.length != 1) { return false }
  let idx = email.indexOf("@")
  let back = email.substr(idx + 1, email.length)
  return email.match(/[\.]/g)?.length > 0
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
  // score: {
  //   type: Number,
  //   enum: [0, 1, 2],
  //   default: 5
  // },
  // securityData: {
  //   type: {
  //     type: Number,
  //     required: [true, '缺少身分欄位'],
  //     default: 1,
  //     // 1 使用者 0 管理員
  //     enum: [0, 1, 2]
  //   },
  //   password: {
  //     type: String,
  //     required: true
  //   },
  //   schoolEmail: {
  //     type: String,
  //     set: normalizeEmail,
  //     required: [true, '缺少信箱欄位'],
  //     minlength: [10, '必須 10 個字以上'],
  //     maxlength: [40, '必須 40 個字以下'],
  //     unique: true,
  //     match: [/^[A-Za-z0-9@\.]+$/, '帳號格式錯誤，僅可含英(不分大小寫)數、@、.'],
  //     validate: [(emailValid(email) && email.match(/.*\.edu\.?[a-z]*/)), '限學校email'],
  //     message: '信箱格式錯誤'
  //   },
  email: {
    type: String,
    set: normalizeEmail,
    required: [true, '缺少信箱欄位'],
    minlength: [10, '必須 10 個字以上'],
    maxlength: [40, '必須 40 個字以下'],
    unique: true,
    match: [/^[A-Za-z0-9@\.]+$/, '帳號格式錯誤，僅可含英(不分大小寫)數、@、.'],
    validate: emailValid,
    message: '信箱格式錯誤'
  },
  //   tokens: {
  //     type: [String]
  //   },
  // },

  // info: {
  //   gender: {
  //     type: Number,
  //     required: [true, '必填性別'],
  //     // 1 男 2 女 3 無
  //     enum: [1, 2, 3]
  //   },
  //   living: {
  //     type: String,
  //     maxlength: [100, '必須 100 個字以下'],
  //   },
  //   job: {
  //     type: String,
  //     maxlength: [30, '必須 30 個字以下'],
  //   },
  //   interest: {
  //     type: String,
  //     maxlength: [100, '必須 100 個字以下'],
  //   },
  //   others: {
  //     type: String,
  //     maxlength: [100, '必須 100 個字以下'],
  //   }
  // },
  // record: {
  //   toBoard: {
  //     sum: { score: { type: Number, required: true, default: 5 }, amount: { type: Number, required: true, default: 0 } }
  //     , list: [{
  //       article: {
  //         type: mongoose.ObjectId,
  //         ref: 'articles',
  //         required: true
  //       },
  //       score: { type: Number, required: true }
  //     }]
  //   },
  //   toArticle: {
  //     sum: { score: { type: Number, required: true, default: 5 }, amount: { type: Number, required: true, default: 0 } },
  //     list: [{
  //       article: {
  //         type: mongoose.ObjectId,
  //         ref: 'articles',
  //         required: true
  //       },
  //       // 在該文章何處
  //       location: {
  //         type: String,
  //         required: true
  //       },
  //       score: { type: Number, required: true }
  //     }]
  //   },
  //   articleScore: {
  //     sum: { score: { type: Number, required: true, default: 5 }, amount: { type: Number, required: true, default: 0 } },
  //     list: [{
  //       article: {
  //         type: mongoose.ObjectId,
  //         ref: 'articles',
  //         required: true
  //       },
  //       score: { type: Number, required: true },
  //       amount: { type: Number, required: true }
  //     }]
  //   }
  // }
}, { versionKey: false })

export default mongoose.model('users', schema)
