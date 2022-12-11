import mongoose from 'mongoose'
import rate from './rate.js'
// title/intro只根版才一定要有 不然抓它母版的titleCol欄位去調資料
// 
const col = {
  type: [{
    // 先不用，因為用code是方便多語言/換名稱，但用i18n也能辦到
    // c: { type: Number, required: true, alias: 'code' },
    c: { type: String, required: true, alias: 'code' },
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
      dataCols: mongoose.Mixed,
      // ex 學期+時間
      uniqueCols: mongoose.Mixed
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
// 為了要_id(直接包mixed不行 的替代方案)
const unique = () => {
  const obj = {}
  for (let i = 0; i <= 100; i += 5) {
    obj['c' + i] = mongoose.Mixed
  }
  return new mongoose.Schema(obj)
}

const article = new mongoose.Schema({
  c: { type: Number, required: true, alias: 'code' },
  n: { type: mongoose.Mixed, required: function () { return this.c !== 1 }, alias: 'name' },
  intro: { type: String, required: true },
  tagActive: Boolean,
  //如果有勾tag再填
  tagOption: { type: mongoose.Mixed, required: function () { return this.tagActive } },
  contentCol: mongoose.Mixed,
  contentTemplate: { type: [String], default: false },
  cols: col
  // 程式抓版不重複供選擇,填上代表必填
})

const schema = new mongoose.Schema({
  // 標題採多語言格式，如果是根版(沒母版)才用這，不然規則會設在母版的childBoard.rule.titleCol裡(對應前端也要去存取)
  titleCol: { type: mongoose.Mixed, required: function () { return this.parent == undefined }, default: undefined },
  intro: {
    type: String,
    required: [function () { return this.title }, '有title為根版，必填介紹'],
    // minlength: [5, '必須 5 個字以上'],
    maxlength: [1000, '必須 1000 個字以下'],
  },
  parent: {
    type: mongoose.ObjectId,
    ref: 'boards'
  },
  related: {
    type: [{ type: mongoose.ObjectId, ref: 'boards' }],
    default: undefined,
    _id: false
  },
  // 抓取母板規則:(不一定有) 放文章id是編輯時能直接找到更新
  beScored: rate('users'),
  reviewList: {
    type: [mongoose.Mixed], default: undefined, _id: false
  },
  // 抓取母板規則:使用者要填對應的內容，就像填表單
  colData: mongoose.Mixed,
  uniqueData: {
    type: [unique()],
    default: undefined
  },
  // ---------------------------------------------------------------
  childBoard: {
    active: { type: Boolean, required: true },
    rule: {
      type: {
        //整個資料各欄位的資料格式
        cols: col,
        // 未來預期，不同版有各自適合的過濾介面樣貌與過濾欄位，所以用可調整的
        display: display('board'),
        // 各欄位名稱支援多語系，這樣可彈性給前端顯示(未來應不會全部給，避免幾十個多語系浪費資源，但更改語系就要觸發get重抓)
        transformTable: [mongoose.Mixed],
        // 與unique區隔，像課程名稱是重要區隔，用dataCol(dataList列出就會自動轉);同課程不同學期出產可能細微差異但應是維繫像差異，則為uniqueCol(不列在dataList就自動變)
        dataList: [String],
        // uniqueList: [String], 先移除 反正transformTable中不是datecol 就是 不該有多餘的在transformTable中 也方便只調整一邊就好
        // 標題(版名)必定可多語言，所以特別區隔那些欄位是板名並對應語言
        titleCol: { type: mongoose.Mixed, required: function () { return this.parent.length > 0 }, default: undefined },
        // 未來可能部分欄位會像title操作，先保留
        multiLangList: [String],
        // 系統在區分dataList是否相同時，沒必要全部欄位比對，把關鍵欄位比對就好;或有時細微內容會變化(課程名轉繁體，目前先忽略)
        combineCheckCols: [String],
        // (請跳過title欄): dataCol可能很多，但目前需求設定下實際顯示可能只有一部分(多語系只傳當下語系欄位)，所以會偵測當下語系給對應需要的值(未來有這欄位再說)
        // 目前先陣列 未來應可設定交錯顯示，可改物件{"C0":5}(第五欄位)
        // 目前只是讓後端提供欄位時提供title+下面欄位,節省流量(不然名稱長的20多語系就炸了)
        displayCol: [String]
      },
      required: function () { return this.childBoard.active },
      _id: false
    },
    // 子版的文章規則
    article: {
      active: { type: Boolean, required: function () { return this.childBoard.active } },
      // 大分類(評價版不用自己打，上面會判斷自動生成1評價代碼)
      // 版建越多 要管的規則越多
      category: {
        type: [article],
        default: undefined, _id: false
      },
      display: display("article"),
    }
  }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } })
// 考量, "beScored.score" 是會一直變動的，先移除
schema.index({ parent: -1, "colData.c0": 1 })
// 處理index 錯誤
export default mongoose.model('boards', schema)
  .on('index', function (err) {
    if (err) console.error(err);
  })