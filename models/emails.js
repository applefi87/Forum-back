import mongoose from 'mongoose'
// user裡面使用

// 驗證學校信箱
const emailSchema = (isSchool) => {
  let msg = '信箱格式錯誤'
  const rule = {
    type: String,
    minlength: [10, '必須 10 個字以上'],
    maxlength: [40, '必須 40 個字以下'],
    unique: true,
    match: [/^[A-Za-z0-9]+@[A-Za-z0-9]+\.[A-Za-z0-9\.]+$/, '格式錯誤，僅可含英(不分大小寫)、數、@、.'],
    validate: {
      validator: function (email) {
        // 是學校的話還要是.edu(.abc)結尾
        if ((!isSchool || isSchool.length < 1) || (/^[A-Za-z0-9]+@[A-Za-z0-9\.]+\.edu\.[A-Za-z0-9\.]+$/).test(email)) {
          return true
        }
        else {
          msg = '必須為學校信箱'
          return false
        }
      },
      message: () => { return msg }
    }
  }
  return rule
}

const schema = new mongoose.Schema({
  isSchool: Boolean,
  email: emailSchema(() => { return this.isSchool }),
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


export default mongoose.model('emails', schema)
