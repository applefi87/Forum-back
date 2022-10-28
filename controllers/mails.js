import emails from '../models/emails.js'
import normalizeEmail from '../util/normalizeEmail.js'
import sendMailJs from '../util/sendMail.js'

const checkSchoolMail = (e) => {
  return (/^[a-z0-9]+@[a-z0-9\.]+\.edu\.tw$/).test(e)
}

export const sendMail = async (req, res) => {
  console.log('in controller>mail-sendmail');
  try {
    // ***會驗證isSchool跟實際驗證結果，目前統一要學校(以免亂試，反正目前都要是學校的)
    // 之後多加區分學校與一般信箱的註冊有區別即可 (使用者schema要調整成校Email可不填，且二選一)
    const formatedEmail = normalizeEmail(req.body.email)
    console.log(checkSchoolMail(formatedEmail));
    if (checkSchoolMail(formatedEmail) !== req.body.isSchool) return res.status(403).send({ success: false, message: { title: '信箱驗證失敗', text: formatedEmail } })
    if (!req.body.isSchool) return res.status(403).send({ success: false, message: { title: '必須為學校信箱', text: formatedEmail } })
    // console.log('normalized')
    const email = await emails.findOne({ email: formatedEmail })
    // 6位驗證碼
    // console.log(email || '沒找到此email');
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
      // console.log('已申請過，要寄信');
      await sendMailJs(formatedEmail, createCode)
      // console.log('已申請過，要儲存');
      await email.save()
      console.log(createCode);
    } else {
      console.log(createCode);
      await sendMailJs(formatedEmail, '課程網註冊驗證碼',
        `${createCode}  是你的信箱驗證碼，一天內有效<br> 請至原頁面填入驗證，進入下步驟`
      )
      // console.log('未申請過，要創建');
      await emails.create({ isSchool: req.body.isSchool, email: formatedEmail, code: createCode, date: Date.now(), occupied: false })
      // console.log('未申請過，創建完成');
    }
    res.status(200).send({ success: true, message: { title: '請至該信箱收信', text: formatedEmail, duration: 10000 } })
  } catch (error) {
    res.status(500).send({ success: false, message: { title: 'ServerError' }, info: error })
  }
}

export const verifyMail = (isMiddle) => {
  return async (req, res, next) => {
    try {
      const mail = req.body.schoolEmail ? req.body.schoolEmail : req.body.email
      const code = req.body.schoolEmailCode ? req.body.schoolEmailCode : req.body.emailCode
      if (!(code?.length === 6 && (/^[0-9]+$/).test(code))) { return res.status(403).send({ success: false, message: { title: '驗證碼應為六位數字', duration: 3 } }) }
      const formatedEmail = normalizeEmail(mail)
      const email = await emails.findOne({ email: formatedEmail })
      // 防亂驗證信箱
      if (email && email?.occupied) {
        res.status(403).send({ success: false, message: { title: '該信箱已註冊', text: formatedEmail, duration: 3 } })
      } else if (!email) {
        res.status(403).send({ success: false, message: { title: '請寄送驗證信驗證', duration: 3 } })
      } else if (email.date.getTime() + 1000 * 60 * 60 * 24 < Date.now()) {
        res.status(403).send({ success: false, message: { title: '驗證碼超過一天,請重寄驗證信驗證', duration: 3 } })
      } else if (email.times > 3) {
        res.status(403).send({ success: false, message: { title: '錯誤過多次，請重寄驗證信驗證', duration: 3 } })
      } else if (email.code != code) {
        email.times++
        await email.save()
        res.status(403).send({ success: false, message: { title: '驗證碼錯誤,超過3次須重寄驗證信', duration: 3 } })
      } else if (isMiddle) {
        req.mail = email
        next()
      } else { res.status(200).send({ success: true, message: { title: '驗證成功，請填寫帳密', text: formatedEmail, duration: 2 } }) }
    } catch (error) {
      console.log(error);
      res.status(500).send({ success: false, message: 'ServerError' })
    }
  }
}


export const sendPWDMail = async (req, res) => {
  try {
    const formatedEmail = normalizeEmail(req.body.email)
    const email = await emails.findOne({ email: formatedEmail })
    // 8位驗證碼
    //未註冊，就不可用
    if (!email || !email.occupied) {
      res.status(403).send({ success: false, message: { title: '該信箱尚未註冊', text: formatedEmail } })
      return
    }
    const createCode = Math.floor(Math.random() * 10000000000).toString().padStart(10, "0")
    email.code = createCode
    email.date = Date.now()
    email.times = 1
    console.log(createCode);
    await sendMailJs(formatedEmail, '課程網找回密碼',
      `${createCode}  10位數字是你的臨時驗證碼，一天內有效 <br> 請至原頁面填入驗證，進入下步驟`
    )
    await email.save()
    res.status(200).send({ success: true, message: { title: '已寄送找回密碼驗證碼', text: formatedEmail } })
  } catch (error) {
    res.status(500).send({ success: false, message: 'ServerError' })
  }
}


export const verifyPWDMail = async (req, res, next) => {
  try {
    if (!(req.body.code?.length === 10 && (/^[0-9]+$/).test(req.body.code))) { return res.status(403).send({ success: false, message: { title: '驗證碼應為10位數字', duration: 3 } }) }
    const formatedEmail = normalizeEmail(req.body.email)
    const email = await emails.findOne({ email: formatedEmail })
    if (!email || !email.occupied) {
      res.status(403).send({ success: false, message: { title: '尚未申請忘記密碼', text: formatedEmail } })
      return
    } else if (email.date.getTime() + 1000 * 60 * 60 * 1 < Date.now()) {
      res.status(403).send({ success: false, message: { title: '驗證碼超過一小時,請重寄驗證信驗證', duration: 3 } })
    } else if (email.times > 3) {
      res.status(403).send({ success: false, message: { title: '錯誤過多次，請重寄驗證信驗證', duration: 3 } })
    } else if (email.code != req.body.code) {
      email.times++
      await email.save()
      res.status(403).send({ success: false, message: { title: '驗證碼錯誤,超過3次須重寄驗證信', duration: 3 } })
    } else {
      req.mail = email
      next()
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: 'ServerError' })
  }
}

