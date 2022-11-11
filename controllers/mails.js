import emails from '../models/emails.js'
import normalizeEmail from '../util/normalizeEmail.js'
import sendMailJs from '../util/sendMail.js'
import randomPWD from '../util/randomPWD.js'
import hash from 'hash.js'

const checkSchoolMail = (e) => {
  return (/^[a-z0-9]+@[a-z0-9\.]+\.edu\.tw$/).test(e)
}

export const sendMail = async (req, res) => {
  console.log('in controller>mail-sendmail');
  try {
    // ***會驗證isSchool跟實際驗證結果，目前統一要學校(以免亂試，反正目前都要是學校的)
    // 之後多加區分學校與一般信箱的註冊有區別即可 (使用者schema要調整成校Email可不填，且二選一)
    const formatedEmail = normalizeEmail(req.body.email)
    if (formatedEmail === 'Email error') return res.status(403).send({ success: false, message: { title: '信箱錯誤', text: formatedEmail } })
    // console.log(checkSchoolMail(formatedEmail));
    if (checkSchoolMail(formatedEmail) !== req.body.isSchool) return res.status(403).send({ success: false, message: { title: '信箱驗證失敗', text: formatedEmail } })
    if (!req.body.isSchool) return res.status(403).send({ success: false, message: { title: '必須為學校信箱', text: formatedEmail } })
    // console.log('normalized')
    const email = await emails.findOne({ email: formatedEmail })
    //已經註冊過，就不可用 (搬出來省下方效能)
    if (email?.occupied) {
      res.status(403).send({ success: false, message: { title: '該信箱已經註冊', text: formatedEmail } })
      return
    }
    // 6位驗證碼
    // console.log(email || '沒找到此email');
    // const createCode = randomPWD(10, 'low')
    const createCode = "temp123456"
    const hashCode = hash.sha256().update(createCode).digest('hex')
    if (email) {
      email.code = hashCode
      email.date = Date.now()
      email.times = 1
      // console.log('已申請過，要寄信');
      await sendMailJs(formatedEmail, '課程網註冊驗證碼',
        `${createCode}  是你的信箱驗證碼，一天內有效<br> 請至原頁面填入驗證，進入下步驟`
      )
      console.log(createCode);
      // console.log('已申請過，要儲存');
      await email.save()
    } else {
      await sendMailJs(formatedEmail, '課程網註冊驗證碼',
        `${createCode}  是你的信箱驗證碼，一天內有效<br> 請至原頁面填入驗證，進入下步驟`
      )
      console.log(createCode);
      // console.log('未申請過，要創建');
      await emails.create({ isSchool: req.body.isSchool, email: formatedEmail, code: hashCode, date: Date.now(), occupied: false })
      // console.log('未申請過，創建完成');
    }
    res.status(200).send({ success: true, message: { title: '請至該信箱收信', text: formatedEmail, duration: 10000 } })
  } catch (error) {
    res.status(500).send({ success: false, message: { title: 'ServerError' }, info: error })
  }
}

export const verifyMail = (isMiddle) => {
  return async (req, res, next) => {
    const code = req.body.schoolEmailCode || req.body.emailCode
    if (!(code?.length === 10 && (/[a-z]/).test(code) && (/[0-9]/).test(code))) { return res.status(403).send({ success: false, message: { title: '驗證碼應為十位英數', duration: 3 } }) }
    try {
      // 如果是code一般信箱就驗證一般
      // 不然就全走學校信箱驗證
      // const mail = req.body.schoolEmailCode ? req.body.schoolEmail : req.body.email
      //重評估email code 區分兩個的目的
      const mail = req.body.schoolEmail || req.body.email
      if (!mail) return res.status(403).send({ success: false, message: { title: '信箱錯誤', text: mail } })
      const formatedEmail = normalizeEmail(mail)
      if (formatedEmail === 'Email error') return res.status(403).send({ success: false, message: { title: '信箱錯誤', text: formatedEmail } })
      const email = await emails.findOne({ email: formatedEmail })
      // 防亂驗證信箱
      if (!email) {
        res.status(403).send({ success: false, message: { title: '請寄送驗證信驗證', duration: 3 } })
      } else if (email && email?.occupied) {
        res.status(403).send({ success: false, message: { title: '該信箱已註冊', text: formatedEmail, duration: 3 } })
      } else if (email.date.getTime() + 1000 * 60 * 60 * 24 < Date.now()) {
        res.status(403).send({ success: false, message: { title: '驗證碼超過一天,請重寄驗證信驗證', duration: 3 } })
      } else if (email.times > 3) {
        res.status(403).send({ success: false, message: { title: '錯誤過多次，請重寄驗證信驗證', duration: 3 } })
      } else if (email.code != hash.sha256().update(code).digest('hex')) {
        email.times++
        await email.save()
        res.status(403).send({ success: false, message: { title: '驗證碼錯誤,超過3次須重寄驗證信', duration: 3 } })
      } else if (isMiddle) {
        req.mail = email
        req.formatedEmail = formatedEmail
        next()
      } else { res.status(200).send({ success: true, message: { title: '驗證成功，請填寫帳密', text: formatedEmail, duration: 2 } }) }
    } catch (error) {
      console.log(error);
      res.status(500).send({ success: false, message: 'ServerError' })
    }
  }
}
// 顯示指定min內還要等多久
const afterMin = (time) => Math.ceil((Date.now() - time) / 60000)


// 關鍵步驟前，確認是否錯誤累計時間已隔24hr可清除/次數過多(不合格回傳錯誤訊息)
const errCheckFail = (email, needSave) => {
  // 如果錯誤時間累積超過一天，錯誤次數重算
  // 並確認是否需要再等
  if (afterMin(email.errDate.getTime()) > 60 * 24) {
    email.errTimes = 0
    email.errDate = Date.now()
    needSave = true
  } // 當日異常次數大於15要隔一陣子
  else if (email.errTimes > 15) {
    const rM = afterMin(email.date.getTime())
    if (email.errTimes > 30 && 24 * 60 > rM) {
      return `錯誤次數過多，請隔${Math.ceil(24 - (rM / 60))}小時再試`
    } else if (10 > rM) return `錯誤次數過多，請隔${10 - rM}分鐘再試`
  }
}

export const sendForgetPWDMail = async (req, res) => {
  try {
    // 把emailVal accountVal的內容搬來
    if (!req.body.account || !req.body.email) return res.status(403).send({ success: false, message: { title: '格式錯誤', text: `帳號:${req.body.account},Email: ${req.body.email}` } })
    const formatedEmail = normalizeEmail(req.body.email)
    if (formatedEmail === 'Email error') return res.status(403).send({ success: false, message: { title: '信箱錯誤', text: formatedEmail } })
    const identifier = randomPWD(3, 'low')
    const email = await emails.findOne({ email: formatedEmail }).populate({
      path: 'user',
      select: "account"
    })
    // 其他可追朔到有資料的會記錄錯誤次數，未註冊成功給他試也沒差
    if (!email || !email.occupied) {
      return res.status(403).send({ success: false, message: { title: '該信箱尚未註冊', text: formatedEmail } })
    }
    // 每次要間隔60秒
    const waitSecond = Math.ceil((Date.now() - email.date.getTime()) / 1000)
    if (waitSecond < 15) {
      return res.status(403).send({ success: false, message: { title: `請隔${15 - waitSecond}秒再試`, text: formatedEmail } })
    }
    // 
    const needSave = false
    const errorMsg = errCheckFail(email, needSave)
    if (errorMsg) res.status(403).send({ success: false, message: { title: errorMsg, text: formatedEmail } })
    // 上方是叫你等所以不扣分，但這裡就可能是有異常在try，所以扣一分
    email.errTimes++
    if (email.user?.account !== req.body.account) {
      res.status(403).send({ success: false, message: { title: '該信箱與帳號不符', text: formatedEmail } })
      return await email.save()
    }
    // 這裡是真正有寄信，所以要再扣分，避免被破解驗證碼
    email.errTimes++
    email.date = Date.now()
    const createCode = randomPWD(10, email.errTimes < 10 ? 'low' : 'medium')
    const hashCode = hash.sha256().update(createCode).digest('hex')
    email.code = hashCode
    email.times = 0
    email.forgetPWD = true
    await email.save()
    console.log(`批次:${identifier} 【${createCode}】 10位英數是你的臨時驗證碼，一天內有效 <br> 請至原頁面輸入驗證`);
    await sendMailJs(formatedEmail, '課程網找回密碼',
      `批次:${identifier} 【${createCode}】 10位英數是你的臨時驗證碼，一天內有效 <br> 請至原頁面輸入驗證`
    )
    res.status(200).send({ success: true, message: { title: formatedEmail, text: `已寄送找回密碼驗證碼, 批次${identifier}`, identifier } })
  } catch (error) {
    res.status(500).send({ success: false, message: 'ServerError' })
  }
}


export const verifyForgetPWDCode = async (req, res, next) => {
  try {
    // 基本不符合就不去資料庫抓，畢竟這不常用，犧牲一點運算是保護資料庫被搞爆
    if (!(req.body.code?.length === 10 && (/[a-zA-Z]/).test(req.body.code) && (/[0-9]/).test(req.body.code))) { return res.status(403).send({ success: false, message: { title: '驗證碼應為10位英數' } }) }
    const formatedEmail = normalizeEmail(req.body.email)
    if (formatedEmail === 'Email error') return res.status(403).send({ success: false, message: { title: '信箱錯誤', text: formatedEmail } })
    const email = await emails.findOne({ email: formatedEmail })
    if (!email) {
      res.status(403).send({ success: false, message: { title: '尚未申請忘記密碼', text: formatedEmail } })
      return
    }
    // 
    const needSave = false
    const errorMsg = errCheckFail(email, needSave)
    if (errorMsg) res.status(403).send({ success: false, message: { title: errorMsg, text: formatedEmail } })
    // 有異常測試，扣3分
    if (!email.occupied || !email.forgetPWD) {
      res.status(403).send({ success: false, message: { title: '尚未申請忘記密碼', text: formatedEmail } })
      email.errTimes += !email.occupied ? 5 : 1
      await email.save()
    } else if (email.times > 5) {
      res.status(403).send({ success: false, message: { title: '錯誤過多次，請重寄驗證信驗證', duration: 3 } })
      // 如果都沒變沒必要儲存
      if (email.forgetPWD || needSave) {
        email.forgetPWD = false
        await email.save()
      }
    } else if (afterMin(email.date.getTime()) > 60) {
      res.status(403).send({ success: false, message: { title: '驗證碼超過一小時,請重寄驗證信驗證', duration: 3 } })
      // 如果都沒變沒必要儲存
      if (email.forgetPWD || needSave) {
        email.forgetPWD = false
        await email.save()
      }
    } else if (email.code !== hash.sha256().update(req.body.code).digest('hex')) {
      email.times++
      res.status(403).send({ success: false, message: { title: '驗證碼錯誤,若超過5次須重寄驗證信', duration: 3 } })
      await email.save()
    } else {
      // 供等等抓users
      req.user = email.user
      email.errTimes++
      req.formatedEmail = formatedEmail
      email.forgetPWD = false
      await email.save()
      next()
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: 'ServerError' })
  }
}

