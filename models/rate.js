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
    list: {
      type: [listDetail()],
      default: undefined,
      _id: false
    }
  }
}