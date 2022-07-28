import mongoose from 'mongoose'
export default new mongoose.Schema({
  score: Number,
  amount: Number,
  list: {
    type: [{
      user: {
        type: mongoose.ObjectId,
        ref: 'users',
        required: true
      },
      score: { type: Number, required: true }
    }],
    default: undefined
  }
}, { _id: false })