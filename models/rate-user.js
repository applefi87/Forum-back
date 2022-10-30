import mongoose from 'mongoose'
export default function (ref, setting = {}) {
  const listDetail = () => {
    const d = {
      from: {
        type: mongoose.ObjectId,
        ref: ref,
        required: true
      }
      // 先移除，因為對於版/文章的評價紀錄，系統很方便能直接列出來(版有index 文章是直接在裡面)
      // 至於使用者，原想他查看使用者評價清單，需要以評分來查看，反正目前先不開放吧，自己慢慢找
      // ,score: { type: Number, required: true }
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
    scoreSum: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    // 之後改成統一先創 不然為了省幾個字，要多一大堆次判斷
    // 目前只有使用者有先創
    scoreChart: { type: [Number], default: undefined },
    tags: mongoose.Mixed,
    list: {
      type: [listDetail()],
      default: undefined,
      _id: false
    },
    bannedList: {
      type: [listDetail()],
      _id: false
    },
    bannedAmount: { type: Number, default: 0 }
  }
}