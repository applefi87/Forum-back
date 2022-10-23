import mongoose from 'mongoose'
export default function (ref) {
  return {
    scoreSum: Number,
    amount: Number,
    // 之後改成統一先創 不然為了省幾個字，要多一大堆次判斷
    // 目前只有使用者有先創
    scoreChart: { type: [Number], default: undefined },
    tags: mongoose.Mixed,
    list: {
      type: [{
        type: mongoose.ObjectId,
        ref: ref,
        required: true
      }],
      default: undefined,
      _id: false
    }
  }
}