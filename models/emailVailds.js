import mongoose from 'mongoose'
// 信箱基本加工
function normalizeEmail(email) {
  // 轉小寫
  let lowerEmail = email.toLowerCase()
  let idx = lowerEmail.indexOf("@")
  let front = lowerEmail.substr(0, idx)
  let back = lowerEmail.substr(idx + 1, lowerEmail.length)
  // 解決名稱的"."會被許多信箱忽略，而可重複註冊
  front = front.replaceAll(".", "")
  // 解決gmail內部通用名
  back = back.replace("googlemail", 'gmail')
  return front + "@" + back
  // 不再有./gmail重複/大寫
}
// 驗證學校信箱
const emailSchema = (school) => {
  let msg = '信箱格式錯誤'
  const rule = {
    type: String,
    set: normalizeEmail,
    minlength: [10, '必須 10 個字以上'],
    maxlength: [40, '必須 40 個字以下'],
    unique: true,
    match: [/^[A-Za-z0-9@\.]+$/, '帳號格式錯誤，僅可含英(不分大小寫)、數、@、.'],
    validate: {
      validator: function (email) {
        msg = '信箱格式錯誤'
        // 只能一個@ ||  @後面沒有. (SET已經移除前方.) 直接報錯
        if (email.match(/[@]/g)?.length != 1 || email.match(/[\.]/)?.length < 1) {
          return false
        }
        else {
          // 是學校的話還要是.edu(.abc)結尾
          if ((!school||school?.length<1)||  email.match(/.*\.edu\.?[a-z]*/)) {
            return true
          }
          else {
            msg = '必須為學校信箱'
            return false
          }
        }
      },
      message: () => { return msg }
    }
  }
  return rule
}

const schema = new mongoose.Schema({
  isSchool: Boolean,
  email: emailSchema(()=>{return this.isSchool?'school':''}),
  code:{
    type:String,
    required:true
  },
  date:Date
}, { versionKey: false })


export default mongoose.model('emailVailds', schema)
