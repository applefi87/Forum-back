import emails from '../models/emails.js'
import normalizeEmail from '../util/normalizeEmail.js'
import sendMailGo from '../util/sendMail.js'

export const sendMail = async (req, res) => {
  try {
    const formatedEmail = normalizeEmail(req.body.email)
    const email = await emails.findOne({ email: formatedEmail })
    // 8位驗證碼
    const createCode = Math.floor(Math.random() * 1000000).toString().padStart(6, "0")
    if (email) {
      //已經註冊過，就不可用
      if (email.occupied) {
        res.status(403).send({ success: false, message: { title: '該信箱已經註冊', text: formatedEmail } })
        return
      }
      email.code = createCode
      email.date = Date.now()
      email.times = 1
      await sendMailGo(formatedEmail, createCode)
      await email.save()
    } else {
      await sendMailGo(formatedEmail, createCode)
      await emails.create({ isSchool: req.body.isSchool, email: formatedEmail, code: createCode, date: Date.now(), occupied: false })
    }
    res.status(200).send({ success: true, message: { title: '信箱已寄送', text: formatedEmail } })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      return res.status(403).send({ success: false, message: { title: message, duration: 3 } })
    } else {
      console.log(error);
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}

export const mailVerify = (isMiddle) => {
  return async (req, res, next) => {
    try {
      const formatedEmail = normalizeEmail(req.body.email)
      const email = await emails.findOne({ email: formatedEmail })
      // 防亂驗證信箱
      if (email && email?.occupied) {
        res.status(403).send({ success: false, message: { title: '該信箱已註冊', text: formatedEmail, duration: 3 } })
        return
      }
      if (!email) {
        res.status(403).send({ success: false, message: { title: '請寄送驗證信驗證', duration: 3 } })
      } else if (email.date + 1000 * 60 * 60 * 24 < Date.now()) {
        res.status(403).send({ success: false, message: { title: '驗證碼超過一天,請重寄驗證信驗證', duration: 3 } })
      } else if (email.times > 3) {
        res.status(403).send({ success: false, message: { title: '錯誤過多次，請重寄驗證信驗證', duration: 3 } })
      } else if (email.code != req.body.schoolEmailCode) {
        email.times++
        await email.save()
        res.status(403).send({ success: false, message: { title: '驗證碼錯誤,超過3次須重寄驗證信', duration: 3 } })
      } else {
        isMiddle ? () => {
          req.mailOk = true
          next()
        } : res.status(200).send({ success: true, message: { title: '驗證成功', text: formatedEmail + '請進行下步驟', duration: 2 } })
      }
    } catch (error) {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}
