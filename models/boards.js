import mongoose from 'mongoose'
import rate from './rate.js'

const col = (t) => {
  let it = {
    type: [{
      c: { type: Number, required: true, alias: 'code' },
      n: { type: String, required: true, alias: 'name' },
      r: { type: String, required: true, alias: 'required' },
      // 代碼表示: 單行文字 多行文字 數字 單選 多選 Boolean  
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

const schema = new mongoose.Schema({
  // ---------------------------------------------------------------
  title: {
    type: String,
    required: [true, '必填版名'],
    minlength: [3, '必須 3 個字以上'],
    maxlength: [20, '必須 20 個字以下'],
  },
  content: {
    type: String,
    required: [true, '必填內容'],
    minlength: [20, '必須 20 個字以上'],
    maxlength: [5000, '必須 5000 個字以下'],
  },
  parent: {
    type: mongoose.ObjectId,
    ref: 'boards',
    required: [true, '缺少母板']
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
      col: col(),
      // 程式抓母版不重複供選擇,填上代表必填
      unique: col("noOther"),// 對應欄位+附值(任意格式，程式處理成可用)
    },
    display: display(),
    // 子版的文章規則
    childArticle: {
      active: { type: Boolean, required: function () { this.childBoard.active } },
      // 勾選評價版，則下方至少選一
      review: { type: Boolean, required: true },
      rate: Boolean,
      tag: Boolean,
      // 大分類(評價版不用自己打，上面會判斷自動生成1評價代碼)
      // 版見越多 要管的規則越多
      category: {
        type: [{
          c: { type: Number, required: true, alias: 'code' },
          n: { type: String, required: true, alias: 'name' },
          i: { type: String, required: true, alias: 'info' }
        }], default: undefined, _id: false
      },
      rule: {
        //如果有勾tag再填
        tag: [String],
        category: {
          type: [{
            //對應上方不同大分類
            c: { type: Number, required: true, alias: 'code' },
            //的欄位規則
            col: col(),
          }], default: undefined, _id: false
        }
      },
      display: display()
    },
  }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } })

export default mongoose.model('boards', schema)
