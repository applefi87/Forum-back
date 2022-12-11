import mongoose from 'mongoose'
// user裡面使用

const schema = new mongoose.Schema({
  isSchool: Boolean,
  email: {
    type: String,
    minlength: [10, '必須 10 個字以上'],
    maxlength: [40, '必須 40 個字以下'],
    unique: true,
    match: [/^[a-z0-9]+@[a-z0-9]+\.[a-z0-9\.]+$/, '格式錯誤，僅可含英(不分大小寫)、數字、@、.']
  },
  code: {
    type: String,
    required: true
  },
  getPWD: {
    type: String
  },
  times: {
    type: Number,
    default: 0
  },
  errTimes: {
    type: Number,
    default: 0
  },
  errDate: {
    type: Date,
    default: Date.now()
  },
  date: {
    type: Date,
    default: Date.now()
  },
  occupied: {
    type: Boolean,
    required: true
  },
  user: {
    type: mongoose.ObjectId,
    ref: 'users'
  },
  forgetPWD: Boolean
}, { versionKey: false })

schema.index({ email: 1 })
export default mongoose.model('emails', schema)
