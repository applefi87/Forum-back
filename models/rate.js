import mongoose from 'mongoose'
export default function (ref, hasLocation= false, hasAmount = false) {
  const listDetail = () => {
    const d = {
      from: {
        type: mongoose.ObjectId,
        ref: ref,
        required: true
      },
      score: { type: Number, required: true }
    }
    if (hasLocation) {
      d.location = { type: String, required: true }
    }
    if (hasAmount) {
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