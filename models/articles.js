import mongoose from 'mongoose'

const rate = {
  score: { type: Number },
  amount: { type: Number },
  list: [{
    user: {
      type: mongoose.ObjectId,
      ref: 'users',
      required: true
    },
    score: { type: Number, required: true }
  }]
}
const msg = (nth) => {
  let rule = {
    amount: { type: Number },// **********************系統操作，使用者無權限****************************
    nowId: { type: Number, default: 0 },// **********************系統操作，使用者無權限****************************
    list: {
      id: { // **********************系統操作，使用者無權限**************************** 
        // this.msg.id
        type: Number,
        required: [true, '缺少留言id']
      },
      user: {
        type: mongoose.ObjectId,
        ref: 'users',
        required: [true, '缺少留言創建者']
      },
      privacy: {
        type: Number,
        required: [true, '缺少留言隱私設定'],
        default: 1,
        // 0 全開(可被查看個人資訊) 1只顯示暱稱 2只顯示校系 3 只顯示校
        enum: [0, 1, 2, 3]
      },
      publishDate: { // **********************系統操作，使用者無權限****************************
        type: Date
      },
      lastEditDate: {   // **********************系統操作，使用者無權限****************************
        type: Date
      },
      content: {
        type: String,
        required: [true, '必填留言內容'],
        minlength: [20, '留言必須 3個字以上'],
        maxlength: [1000, '留言必須 1000 個字以下'],
      },
      beScored: rate
    }
  }
  if (nth === '1') {
    rule.msg2 = msg('2')
  }
  return rule
}

const schema = new mongoose.Schema({
  parent: {
    type: mongoose.ObjectId,
    ref: 'boards',
    required: [true, '缺少母板']
  },
  user: {
    type: mongoose.ObjectId,
    ref: 'users',
    required: [true, '缺少創建者']
  },
  privacy: {
    type: Number,
    required: [true, '缺少隱私設定'],
    default: 1,
    // 0 全開(可被查看個人資訊) 1只顯示暱稱 2只顯示校系 3 只顯示校
    enum: [0, 1, 2, 3]
  },
  publishDate: { // **********************系統操作，使用者無權限****************************
    type: Date
  },
  lastEditDate: {   // **********************系統操作，使用者無權限****************************
    type: Date
  },
  // ---------------------------------------------------------------
  title: {
    type: String,
    required: [true, '必填標題'],
    maxlength: [50, '必須 50 個字以下'],
  },
  content: {
    type: String,
    required: [true, '必填內容'],
    minlength: [20, '必須 20 個字以上'],
    maxlength: [5000, '必須 5000 個字以下'],
  },
  // ---------------------------------------------------------------
  beScored: rate,
  msg1: msg(1)
}, { versionKey: false })

export default mongoose.model('articles', schema)
