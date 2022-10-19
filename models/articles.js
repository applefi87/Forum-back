import mongoose from 'mongoose'
import rate from './rate.js'

const msg = (nth) => {
  let msglist = (n) => {
    const list = {
      id: { // **********************系統操作，使用者無權限****************************  
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
        // 0 隱身匿名  1全開(可被查看個人資訊)  ..只顯示暱稱 2只顯示校系 3 只顯示校
        enum: [0, 1]
      },
      content: {
        type: String,
        required: [true, '必填留言內容'],
        maxlength: [1000, '留言必須 1000 個字以下'],
      },
      state: {
        type: Number,
        default: 1,
        //屏蔽    1.正常
        enum: [0, 1]
      },
      beScored: rate('users')
    }
    if (n === '1') {
      list.msg2 = msg('2')
    }
    // 更新內部msg時記得取消 updateAt功能 
    return mongoose.Schema(list, { timestamps: true })
  }
  let items = {
    // 因為看文章很多 留言可能很少，所以算出來放著
    amount: { type: Number },// **********************系統操作，使用者無權限****************************
    // // 留言加個Id才能讓系統追蹤他給的評價，ex:在xxx文章的id=6 給了好評後編輯 ，系統能對應修改個紀錄s，不然別人刪一條陣列就跑位
    nowId: { type: Number },// **********************系統操作，使用者無權限****************************
    list: { type: [msglist(nth)], default: undefined, _id: false }
  }
  return items
}

const schema = new mongoose.Schema({
  board: {
    type: mongoose.ObjectId,
    ref: 'boards',
    required: [true, '缺少母板']
  },
  user: {
    type: mongoose.ObjectId,
    ref: 'users',
    required: [true, '缺少創建者']
  },
  state: {
    type: Number,
    default: 1,
    //屏蔽    1.正常
    enum: [0, 1]
  },
  privacy: {
    type: Number,
    required: [true, '缺少隱私設定'],
    default: 1,
    //0.匿名    1.顯示暱稱    後方先跳過 2只顯示校系 3 只顯示校 0 全開(可被查看個人資訊)(先不可點擊)
    enum: [0, 1, 2, 3]
  }, // ---------------------------------------------------------------
  // 1是默認評價專用區，要母板塊有開放才可選
  uniqueId: {
    type: mongoose.ObjectId,
    ref: 'boards',
    required: [true, '缺少版內分類']
  },
  category: {
    type: Number,
    required: [true, '缺少文章類型']
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
    minlength: [10, '必須 10 個字以上'],
    maxlength: [50000, '必須 50000 個字以下'],
  },
  score: {
    type: Number,
    required: function () { return (this.category === 1 ? [true, '缺少文章類型'] : false) },
    enum: [0, 1, 2, 3, 4, 5]
  },
  tags: [{ type: String }],
  // ---------------------------------------------------------------
  // 抓取母板規則:(程式判斷)
  // 使用者要填下方分數/tag/類型/其他欄位
  columns: {
    // 對應欄位+附值(任意格式，程式處理成可用)
    type: [{
      c: { type: Number, required: true, alias: 'col' },
      o: { type: mongoose.Mixed, alias: 'others' },
    }], default: undefined
  },
  // 
  beScored: rate('users'),
  msg1: msg('1'),// **********************系統操作，使用者無權限****************************
  // lastEditDate: {   // **********************系統操作，使用者無權限****************************
  //   type: Date,
  //   required: true,
  // }
  update_at: {
    type: Date,
    required: [true, "系統應該要自動填更新時間，異常"]
  }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } })
schema.index({ board: 1, category: 1 })
// 處理index 錯誤
export default mongoose.model('articles', schema)
  .on('index', err => {
    if (err) console.log(err)
  })
