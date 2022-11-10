import users from '../models/users.js'
import groups from '../models/groups.js'
import emails from '../models/emails.js'
import randomPWD from '../util/randomPWD.js'
import sendMailJs from '../util/sendMail.js'
// import fs from 'fs'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cookie from 'cookies'
// const expireTime = { expiresIn: '60 minutes' }
const expireTime = { expiresIn: '2 seconds' }

const globalCookieSetting = { sameSite: 'lax', signed: true, secure: true}

const rateEmpty = {
  score: 0,
  amount: 0,
  scoreChart: [0, 0, 0, 0, 0, 0],
  list: [],
  bannedList: [],
  bannedAmount: 0
}

export const register = async (req, res) => {
  if (['originalPoster', 'you', 'admin'].includes(req.body.nickName)) return res.status(403).send({ success: false, message: { title: '該暱稱不可使用', NickNameOccupied: true, nickName: req.body.nickName } })
  // *******驗證帳號與暱稱
  const findUser = await users.findOne({ account: req.body.account })
  if (findUser) {
    res.status(403).send({ success: false, message: { title: '該帳號已註冊', accountOccupied: true, account: req.body.account } })
    return
  }
  const findNickName = await users.findOne({ nickName: req.body.nickName })
  if (findNickName) {
    res.status(403).send({ success: false, message: { title: '該暱稱已被使用', NickNameOccupied: true, nickName: req.body.nickName } })
    return
  }
  // ********驗證密碼
  const password = req.body.password
  if (!password) { return res.status(400).send({ success: false, message: { title: '缺少密碼欄位' } }) }
  if (password.length < 8 || password.length > 40) { return res.status(400).send({ success: false, message: { title: '長度需介於8~40字之間' } }) }
  // 先改成簡易密碼 必須有英數就好(可以有其他符號，反正會加工應該穿不進來)
  if (!((/[a-zA-Z]/).test(password) && (/[0-9]/).test(password))) { return res.status(400).send({ success: false, message: { title: '必須含英文與數字' } }) }
  // if (!(password.match(/[A-Z]/) && password.match(/[a-z]/) && password.match(/[0-9]/))) { return res.status(400).send({ success: false, message: { title: 'pwdRule' } }) }
  try {
    // ***********新增管理員身要驗證
    // 不填預設1(使用者)
    const role = req.body.role ? req.body.role : 1
    // 如果是非使用者，要去驗證對應group是否有該使用者
    if (role != 1) {
      const success = await groups.findOne({ code: role, users: req.body.account })
      if (!success) {
        // 找不到就回應非法並結束
        res.status(400).send({ success: false, message: 'Wrong admin creatiion!' })
        console.log('Wrong admin creatiion!');
        return
      }
      console.log('creating admin!');
    }

    // ***********移除不該能新增的欄位
    ;['securityData', 'record', 'score'].forEach(e => delete req.body[e]);

    // *********新增 避免亂丟req.body，所以只列要的
    const input = {
      account: req.body.account,
      nickName: req.body.nickName,
      securityData: {
        role,
        schoolEmail: req.formatedEmail,
        password: bcrypt.hashSync(password, 8)
      },
      info: { gender: req.body.gender },
      // 必須初始化，不然發東西要更新時會找不到而報錯
      record: {
        toBoard: rateEmpty,
        toArticle: rateEmpty,
        articleScore: rateEmpty,
        msgScore: rateEmpty
      }
    }

    const result = JSON.parse(JSON.stringify(await users.create(input)))
    // !!!!!!!!!!!!!!!!!!!
    // fs.writeFileSync('users.json', JSON.stringify(input))
    // return
    // !!!!!!!!!!!!!!!!!!!
    // 註冊完把email清單改已註冊
    const emailcheck = await emails.findOne({ email: req.mail.email })
    emailcheck.occupied = true
    emailcheck.user = result._id
    emailcheck.save()

      // 直接丟陣列記得前方要; 不然會出錯...
      ;['securityData', '_id'].forEach(e => delete result[e])
    // 註冊成功
    res.status(200).send({ success: true, message: { title: '註冊成功' }, result })
    console.log('create success!');
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: { title: error.message } })
    } else {
      console.log(error);
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}

// 
export const login = async (req, res) => {
  console.log('incontroller login');
  try {
    const loginCookie = randomPWD(10, 'high')
    const token = jwt.sign({ _id: req.user._id, role: req.user.securityData.role, ck: loginCookie, kp: req.body.keepLogin }, process.env.SECRET, expireTime)
    // token太多 自動刪(預估留最後2次登陸，反正自動續約也會在後面，原本的會被刪掉)
    if (req.user.securityData.tokens.length > 5) { req.user.securityData.tokens = req.user.securityData.tokens.slice(3) }
    req.user.securityData.tokens.push(token)
    await req.user.save()
    // ***cookie
    // *只有在https連線才會帶給伺服器
    // *待啟用* secure: true
    // *不讓網頁JS 去存取cookie(你自己不會顯示，但有被XSS攻擊就能被抓到，所以多一道保險但你自己也不之內容)
    // httpOnly: false, 預設true
    // domain: "lei.com",  設的話子網域test.lei.com均可讀取
    // path: '/admin',  設的話/admin內的route才可讀取
    // expires: 5 (UTC格式設截止日) maxAge 是以豪秒為有效時間
    // secret: "0",
    // }))
    const cookieSet = JSON.parse(JSON.stringify(globalCookieSetting))
    if (req.body.keepLogin) {
      cookieSet.maxAge = 30 * 24 * 60 * 60000
    }
    let cookies = new cookie(req, res, { keys: [process.env.COOKIE_SECRET] })
    cookies.set('keyJWT', token, {
      httpOnly: true, ...cookieSet
      // ,secure: true
    })
    cookies.set('loginCookie', loginCookie, {
      httpOnly: false, ...cookieSet
      // ,secure: true
    })
    res.status(200).send({
      message: { success: true, title: 'Login success!' },
      result: {
        // token,
        _id: req.user._id,
        account: req.user.account,
        role: req.user.securityData.role,
        score: req.user.score
      }
    })
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: { success: true, title: '伺服器錯誤' },
    })
  }
}

export const logout = async (req, res) => {
  try {
    console.log('incontroller');
    req.user.securityData.tokens = req.user.securityData.tokens.filter(token => token !== req.token)
    req.cookies.set('keyJWT')
    req.cookies.set('loginCookie')
    await req.user.save()
    res.status(200).send({ success: true, message: { success: true, title: '登出' } })
  } catch (error) {
    res.status(500).send({ success: false, message: { success: false, title: '伺服器錯誤' } })
  }
}

export const extend = async (req, res) => {
  try {
    const loginCookie = randomPWD(10, 'high')
    const token = jwt.sign({ _id: req.user._id, role: req.user.securityData.role, ck: loginCookie, kp: req.keepLogin }, process.env.SECRET, expireTime)
    req.user.securityData.tokens = req.user.securityData.tokens.filter(token => token !== req.token)
    req.user.securityData.tokens.push(token)
    await req.user.save()
    const cookieSet = JSON.parse(JSON.stringify(globalCookieSetting))
    if (req.keepLogin) {
      cookieSet.maxAge = 30 * 24 * 60 * 60000
    }
    let cookies = new cookie(req, res, { keys: [process.env.COOKIE_SECRET] })
    cookies.set('keyJWT', token, {
      httpOnly: true, ...cookieSet
      // ,secure: true
    })
    cookies.set('loginCookie', loginCookie, {
      httpOnly: false, ...cookieSet
      // ,secure: true
    })
    console.log('extended');
    res.status(200).send({ success: true, message: '' })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}


export const resetPWD = async (req, res) => {
  console.log('incontroller resetPWD');
  try {
    const createCode = randomPWD(10)
    //需要加上臨時密碼
    const user = await users.findOne({ _id: req.user }).select(['account', 'securityData.password'])
    user.securityData.password = bcrypt.hashSync(createCode, 8)
    user.securityData.tokens = []
    await sendMailJs(req.formatedEmail, '歐趴論壇(師大課程評價網)新密碼',
      `${createCode}  是你的師大課程評價網新密碼，請用此密碼登錄<br> 可改回原密碼無限制`
    )
    console.log(createCode);
    await user.save()
    res.status(200).send({
      success: true,
      message: { title: '密碼重設成功，請至email查看新密碼' },
      result: {
        account: user.account
      }
    })
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: { title: '伺服器錯誤' },
    })
  }
}
// 關鍵步驟前，確認是否錯誤累計時間已隔24hr可清除/次數過多(不合格回傳錯誤訊息)
const errCheckFail = (data, needSave) => {
  // 如果錯誤時間累積超過一天，錯誤次數重算
  // 並確認是否需要再等
  if (afterMin(data.errDate.getTime()) > 60 * 24) {
    data.errTimes = 0
    data.errDate = Date.now()
    needSave = true
  } // 當日異常次數大於15要隔一陣子
  else if (data.errTimes > 15) {
    const rM = afterMin(data.date.getTime())
    if (data.errTimes > 30 && 24 * 60 > rM) {
      return `錯誤次數過多，請隔${Math.ceil(24 - (rM / 60))}小時再試`
    } else if (10 > rM) return `錯誤次數過多，請隔${10 - rM}分鐘再試`
  }
}

export const changePWD = async (req, res) => {
  console.log('incontroller changePWD');
  try {
    if (req.body.password.length < 8 || req.body.password.length > 40 || !((/[a-zA-Z]/).test(req.body.password) && (/[0-9]/).test(req.body.password)) || req.body.newPWD.length < 8 || req.body.newPWD.length > 40 || !((/[a-zA-Z]/).test(req.body.newPWD) && (/[0-9]/).test(req.body.newPWD))) {
      return res.status(403).send({
        success: false,
        message: { title: '密碼必含英數，8位以上' },
      })
    }
    const user = await users.findOne({ _id: req.user._id }).select(['securityData.password', 'securityData.tokens', ' securityData.safty'])
    if (user.securityData.safty.times > 4) {
      user.securityData.tokens = user.securityData.tokens.filter(token => token !== req.token)
      user.securityData.safty.times = 0
      user.securityData.safty.errTimes++
      req.cookies.set('keyJWT')
      req.cookies.set('loginCookie')
      res.status(410).send({ success: false, message: { success: false, title: '錯誤次數過多，請重新登入' } })
      return await user.save()
    }
    if (!bcrypt.compareSync(req.body.password, user.securityData.password)) {
      user.securityData.safty.times++
      res.status(403).send({ success: false, message: { success: false, title: `密碼錯誤，再${5 - user.securityData.safty.times}次錯誤將登出` } })
      return await user.save()
    }
    user.securityData.password = bcrypt.hashSync(req.body.newPWD, 8)
    user.securityData.tokens = []
    user.save()
    console.log('ok');
    res.status(200).send({
      success: true,
      message: { title: '密碼重設成功，請重新登入' }
    })
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: { title: '伺服器錯誤' },
    })
  }
}


export const getUser = (req, res) => {
  try {
    res.status(200).send({
      success: true,
      message: '',
      result: {
        account: req.user.account,
        role: req.user.securityData.role,
        score: req.user.score,
        schoolEmail: req.user.securityData.schoolEmail,
        email: req.user.securityData.email,
        info: req.user.info
      }
    })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}


export const editInfo = async (req, res) => {
  try {
    await users.findOneAndUpdate(
      { _id: req.user._id }, { info: req.body },
    )
    res.status(200).send({ success: true, message: '' })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      return res.status(400).send({ success: false, message })
    } else {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}
