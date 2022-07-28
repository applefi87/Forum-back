import mongoose from 'mongoose'
import rate from './rate.js'

const msg = (nth) => {
  let msglist = (n) => {
    const list = {
      _id: { // **********************系統操作，使用者無權限**************************** 
        // this.msg.id
        type: Number,
        required: [true, '缺少留言_id'],
        // unique: true
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
        minlength: [3, '留言必須 3個字以上'],
        maxlength: [1000, '留言必須 1000 個字以下'],
      },
      beScored: rate
    }
    if (n === '1') {
      list.msg2 = msg('2')
    }
    return list
  }
  let items = {
    // 因為看文章很多 留言可能很少，所以算出來放著
    amount: { type: Number },// **********************系統操作，使用者無權限****************************
    // 留言加個Id才能讓系統追蹤他給的評價，ex:在xxx文章的id=6 給了好評後編輯 ，系統能對應修改個紀錄s，不然別人刪一條陣列就跑位
    nowId: { type: Number },// **********************系統操作，使用者無權限****************************
    list: { type: [msglist(nth)], default: undefined }
  }
  return items
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
  // ---------------------------------------------------------------
  title: {
    type: String,
    required: [true, '必填標題'],
    minlength: [4, '必須 4 個字以上'],
    maxlength: [50, '必須 50 個字以下'],
  },
  content: {
    type: String,
    required: [true, '必填內容'],
    minlength: [20, '必須 20 個字以上'],
    maxlength: [5000, '必須 5000 個字以下'],
  },
  // ---------------------------------------------------------------
  filterRow: {type:[mongoose.Mixed] , default: undefined },
  // ---------------------------------------------------------------
  // 抓取母板規則:(程式判斷)
  detail: {
    score: Number,
    tag: [Number],
    category: Number,
    column:  {type:[mongoose.Mixed] , default: undefined }
  },
  // ---------------------------------------------------------------
  beScored: rate,
  msg1: msg('1'),
  lastEditDate: {   // **********************系統操作，使用者無權限****************************
    type: Date,
    required: true,
  }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } })

export default mongoose.model('articles', schema)
