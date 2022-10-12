import mongoose from 'mongoose'
export default function (ref, setting = {}) {
  const listDetail = () => {
    const d = {
      from: {
        type: mongoose.ObjectId,
        ref: ref,
        required: true
      },
      score: { type: Number, required: true }
    }
    if (setting.hasLocation) {
      d.location = { type: String, required: true }
    }
    if (setting.hasAmount) {
      d.amount = { type: Number, required: true }
    }
    return d
  }
  return {
    score: Number,
    amount: Number,
    // 之後改成統一先創 不然為了省幾個字，要多一大堆次判斷
    // 目前只有使用者有先創
    scoreChart: { type: [Number], default: undefined },
    tags: mongoose.Mixed,
    list: {
      type: [listDetail()],
      default: undefined,
      _id: false
    }
  }
}