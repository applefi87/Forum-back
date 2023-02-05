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
    articles: rateUser('articles', { hasAmount: true }),
    // 自己訊息被評價
    msgs: rateUser('articles', { hasLocation: true, hasAmount: true })
  },
  favorite: {
    boards: [{
      type: mongoose.ObjectId,
      ref: "boards"
    }],
    // {$wew版id:["文章oid1","文章oid2"]}
    articles: mongoose.Mixed
  },
  temp: mongoose.Mixed,
  //基於使用者最多20個通知 過多刪除? 而且日常抓取會跳過這欄位，所以不用一直去資料庫搜(未來要也可改放新資料表)
  notification: {
    //檢舉應也可用同樣架構，導到對應的位置查看詳情(所以就差權限對應不同按鈕)
    type: [
      {
        //模仿fb 最深是msg2標記我/給評價 (action判斷行為)
        //常態可能: 1.你的權限已通過 2.你在xx版的評論大受好評
        //較刁鑽可能: 1.你的權限已通過 2.你在xx版的評論大受好評
        //只有版必填，其他深度的文章、留言都是選填
        //因為版名稱可能要往母版抓，省資源
        BoardTitleCol: mongoose.Mixed,
        board: {
          type: mongoose.ObjectId,
          ref: 'boards',
        },
        articleType: {
          type: Number
        },
        //populate抓id+標題
        article: {
          type: mongoose.ObjectId,
          ref: 'articles',
        },
        msg1: Number,
        msg2: Number,
        //留言 標記 回覆 按讚
        action: {
          type: Number,
          required: [true, '必填動詞'],
          // 1 回復你對
          enum: [1]
        },
        //未來通知種類變多: 您在xx爭辯的論點有評論/待回復/等下一步 (很像action 但是爭辯的版本)
        //目前預設不填
        type: {
          type: Number,
          // 1 文章留言通知
          enum: [1]
        },
        //留言xxx 顯示一部分
        detail: mongoose.Mixed,
        user: {
          type: mongoose.ObjectId,
          ref: 'users',
        },
        time: {
          type: Date,
          require: true
        },
        read: { type: Boolean, default: false }
      }
    ],
    default: [],
    _id: false
  }
}, { versionKey: false })

// schema.index({ nickName: 1 })
export default mongoose.model('users', schema)
