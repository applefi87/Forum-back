import mongoose from 'mongoose'
import rate from './rate.js'

const col = (t) => {
  let it = {
    type: [{
      c: { type: Number, required: true, alias: 'code' },
      n: { type: String, required: true, alias: 'name' },
      r: { type: String, required: true, alias: 'required' },
      // 代碼表示: 1單行文字 2多行文字 3數字 4單選 5多選 0Boolean  
      t: { type: Number, required: true, alias: 'type' }
    }], default: undefined, _id: false,
  }
  if (t != "noOther") {
    it.o = { type: [{ type: [mongoose.Mixed], default: undefined }], alias: 'others' }
  }
  return it
}
const display = () => {
  return {
    special: mongoose.Mixed,
    // 抓取
    filter: { type: [{ type: [Number] }], default: undefined },
    sort: { type: [{ type: [Number] }], default: undefined },
    search: Number
  }
}

const article = new mongoose.Schema({
  c: { type: Number, required: true, alias: 'code' },
  name: { type: String, required: true },
  intro: { type: String, required: true },
  titleCol: { type: String, required: true },
  contentCol: { type: String, required: true },
  tagActive: Boolean,
  //如果有勾tag再填
  tagOption: { type: [String], required: function () { this.tagActive } },
  col: col(),
  // 程式抓版不重複供選擇,填上代表必填
})


const schema = new mongoose.Schema({
  // ---------------------------------------------------------------
  title: {
    type: String,
    required: [true, '必填版名'],
    minlength: [3, '必須 3 個字以上'],
    maxlength: [20, '必須 20 個字以下'],
  },
  intro: {
    type: String,
    required: [true, '必填內容'],
    minlength: [5, '必須 5 個字以上'],
    maxlength: [5000, '必須 5000 個字以下'],
  },
  parent: {
    type: mongoose.ObjectId,
    ref: 'boards',
    // required: [true, '缺少母板']
  },
  related: {
    type: [{ type: mongoose.ObjectId, ref: 'boards' }],
    default: undefined,
  },
  // ---------------------------------------------------------------
  // 抓取母板規則:(程式判斷)(不一定有)
  beScored: rate('articles'),
  // 抓取母板規則:(程式判斷)
  // 使用者要填該板塊的其他欄位基本資訊
  fill: {
    // 對應欄位+附值(任意格式，程式處理成可用)
    type: [{
      c: { type: Number, required: true, alias: 'code' },
      d: { type: [mongoose.Mixed], alias: 'data' },
    }], default: undefined, _id: false
  },
  unique: {
    type: [{
      c: { type: Number, required: true, alias: 'code' },
      d: { type: [mongoose.Mixed], alias: 'data' },
    }], default: undefined, _id: false
  },

  // ---------------------------------------------------------------
  childBoard: {
    active: { type: Boolean, required: true },
    rule: {
      title: { type: String, required: true },
      col: col(),
      // 程式抓母版不重複供選擇,填上代表必填
      unique: col(),// 對應欄位+附值(任意格式，程式處理成可用)
      display: display(),
    },
    // 子版的文章規則
    article: {
      active: { type: Boolean, required: function () { this.childBoard.active } },
      // 勾選評價版，則下方至少選一
      review: { type: Boolean, required: true },

      // 大分類(評價版不用自己打，上面會判斷自動生成1評價代碼)
      // 版見越多 要管的規則越多
      category: {
        type: [article],
        default: undefined, _id: false
      },
      display: display(),
    }
  }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } })

export default mongoose.model('boards', schema)
