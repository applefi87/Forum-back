import mongoose from 'mongoose'
import rate from './rate.js'

const col = {
  type: [{
    // 先不用，因為用code是方便多語言/換名稱，但用i18n也能辦到
    // c: { type: Number, required: true, alias: 'code' },
    n: { type: String, required: true, alias: 'name' },
    r: { type: Boolean, required: true, alias: 'required' },
    // 代碼表示: 1單行文字 2多行文字 3數字  5單選 6多選 0Boolean  
    t: { type: Number, required: true, alias: 'type', enum: [0, 1, 2, 3, 4, 5, 6, 7] },
    o: { type: mongoose.Mixed, alias: 'others' },
    d: { type: String, alias: 'default' }
  }], default: undefined, _id: false,
}

// sort/nestedCol則顯示欄位
const display = (type) => {
  const rule = {
    special: mongoose.Mixed,
  }
  // 抓取母版區域不重複的代號
  if (type === "article") {
    rule.filter = mongoose.Mixed
    rule.sort = { type: [String], default: undefined }
  } else {
    rule.filter = {
      // ex:系別
      // 預計 C0:[111-1,110-1,110-2]
      dataCol: {},
      // ex 學期+時間
      uniqueCol: mongoose.Mixed
      // 先改成限定要有清單的才可過濾(用板定的選項就好)
      // uniqueCol: {
      //   type: [{
      //     n: { type: String, required: true, alias: 'name' },
      //     l: { type: [String], default: undefined, alias: 'list' }
      //   }], default: undefined
      // }
      // 原要處理通識 之後再搞八...
      // nestedCol: {
      //   type: [{
      //     motherCol: String,
      //     fliter: String,
      //     data: [
      //       {
      //         col: String,
      //         list: [String]
      //       }
      //     ]
      //   }], default: undefined
      // },
    }
    // 只排序dataCol,不然排序還要顯示，麻煩，要得自己點進去看
    rule.sort = { type: [String], default: undefined }
  }
  return rule
}

const article = new mongoose.Schema({
  n: { type: String, required: true, alias: 'name' },
  intro: { type: String, required: true },
  titleCol: { type: String, required: true },
  tagActive: Boolean,
  //如果有勾tag再填
  tagOption: { type: [String], required: function () { return this.tagActive }, default: undefined },
  contentCol: { type: String, required: true },
  col: col,
  // 程式抓版不重複供選擇,填上代表必填
})

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '必填版名'],
    minlength: [2, '必須 2 個字以上'],
    maxlength: [50, '必須 50 個字以下'],
  },
  intro: {
    type: String,
    // required: [true, '必填內容'],
    // minlength: [5, '必須 5 個字以上'],
    maxlength: [1000, '必須 1000 個字以下'],
  },
  parent: {
    type: mongoose.ObjectId,
    ref: 'boards'
  },
  related: {
    type: [{ type: mongoose.ObjectId, ref: 'boards' }],
    default: undefined, _id: false
  },
  // 抓取母板規則:(不一定有)
  beScored: rate('articles'),
  // 抓取母板規則:使用者要填對應的內容，就像填表單
  colData: mongoose.Mixed,
  uniqueData: {
    type: [mongoose.Mixed],
    default: undefined, _id: false
  },
  // ---------------------------------------------------------------
  childBoard: {
    active: { type: Boolean, required: true },
    titleCol: { type: String, required: function () { return this.childBoard.active } },
    rule: {
      dataCol: col,
      // 程式抓母版不重複供選擇,填上代表必填
      uniqueCol: col,// 對應欄位+附值(任意格式，程式處理成可用)
      display: display('board'),
    },
    // 子版的文章規則
    article: {
      active: { type: Boolean, required: function () { return this.childBoard.active } },
      // 是否要評價區
      hasReview: { type: Boolean, required: function () { return this.childBoard.article.active } },
      // 大分類(評價版不用自己打，上面會判斷自動生成1評價代碼)
      // 版見越多 要管的規則越多
      category: {
        type: [article],
        default: undefined, _id: false
      },
      display: display("article"),
    }
  }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } })
// 考量, "beScored.score" 是會一直變動的，先移除
schema.index({ parent: 1, "colData.c0": 1 })
export default mongoose.model('boards', schema)
