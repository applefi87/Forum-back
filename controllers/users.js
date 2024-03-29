import users from '../models/users.js'
import groups from '../models/groups.js'
import emails from '../models/emails.js'
import randomPWD from '../util/randomPWD.js'
import sendMailJs from '../util/sendMail.js'
import { jwtPickSignature } from '../util/dataFormetTool.js'
// import fs from 'fs'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

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
        // // console.log('Wrong admin creatiion!');
        return
      }
      // // console.log('creating admin!');
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
        articles: rateEmpty,
        msgs: rateEmpty
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

      // 直接陣列放前方要; 不然會出錯...
      ;['securityData', '_id'].forEach(e => delete result[e])
    // 註冊成功
    res.status(200).send({ success: true, message: { title: '註冊成功' }, result })
    // console.log('create success!');
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: { title: error.message } })
    } else {
      // console.log(error);
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}
// 
const expireTime = { expiresIn: '3 hours' }
// const expireTime = { expiresIn: '2 seconds' }
const updateJWT = async (req) => {
  try {
    const token = jwt.sign({ _id: req.user._id, role: req.user.securityData.role }, process.env.SECRET, expireTime)
    // token太多 自動刪(預估留最後2次登陸，反正自動續約也會在後面，原本的會被刪掉)
    if (req.user.securityData.tokens.length > 8) { req.user.securityData.tokens = req.user.securityData.tokens.slice(4) }
    // 只留驗證部分，這樣偷看資料庫也沒差(雖不曉得何時會被看，也許防工程師?)
    const jwtSignature = jwtPickSignature(token)
    req.user.securityData.tokens.push(jwtSignature)
    await req.user.save()
    return token
  } catch (error) {
    throw error
  }
}
// 
export const login = async (req, res) => {
  // console.log('incontroller login');
  try {
    const newJWT = await updateJWT(req)
    res.status(200).send({
      message: { success: true, title: 'Login success!' },
      result: {
        token: newJWT,
        _id: req.user._id,
        nickName: req.user.nickName,
        role: req.user.securityData.role,
        score: req.user.score,
        notification: req.user.notification
      }
    })
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: { success: true, title: '伺服器錯誤' },
    })
  }
}
export const extend = async (req, res) => {
  try {
    const newJWT = await updateJWT(req)
    res.status(200).send({
      success: true, message: '', result: { token: newJWT, notification: req.user.notification }
    })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}
export const logout = async (req, res) => {
  try {
    req.user.securityData.tokens = req.user.securityData.tokens.filter(token => token !== req.jwtSignature)
    await req.user.save()
    res.status(200).send({ success: true, message: { success: true, title: '登出' } })
  } catch (error) {
    res.status(500).send({ success: false, message: { success: false, title: '伺服器錯誤' } })
  }
}

export const resetPWD = async (req, res) => {
  // console.log('incontroller resetPWD');
  try {
    const createCode = randomPWD(10)
    //需要加上臨時密碼
    const user = await users.findOne({ _id: req.user._id }).select(['account', 'securityData.password'])
    user.securityData.password = bcrypt.hashSync(createCode, 8)
    user.securityData.tokens = []
    await sendMailJs(req.formatedEmail, '歐趴論壇(師大課程評價網)新密碼',
      `${createCode}  是你的師大課程評價網新密碼，請用此密碼登錄<br> 可改回原密碼無限制`
    )
    await user.save()
    // console.log('密碼重設成功' + createCode);
    res.status(200).send({
      success: true,
      message: { title: '密碼重設成功，請至email查看新密碼' },
      result: {
        account: user.account
      }
    })
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      success: false,
      message: { title: '伺服器錯誤' },
    })
  }
}


export const changePWD = async (req, res) => {
  // console.log('incontroller changePWD');
  try {
    if (req.body.password.length < 8 || req.body.password.length > 40 || !((/[a-zA-Z]/).test(req.body.password) && (/[0-9]/).test(req.body.password)) || req.body.newPWD.length < 8 || req.body.newPWD.length > 40 || !((/[a-zA-Z]/).test(req.body.newPWD) && (/[0-9]/).test(req.body.newPWD))) {
      return res.status(403).send({
        success: false,
        message: { title: '密碼必含英數，8位以上' },
      })
    }
    const user = await users.findOne({ _id: req.user._id }).select(['securityData.password', 'securityData.tokens', ' securityData.safety.time', ' securityData.safety.errTimes', ' securityData.safety.errDate'])
    if (user.securityData.safety.times > 4) {
      user.securityData.tokens = user.securityData.tokens.filter(token => token !== req.jwtSignature)
      user.securityData.safety.times = 0
      user.securityData.safety.errTimes++
      res.status(410).send({ success: false, message: { success: false, title: '錯誤次數過多，請重新登入' } })
      return await user.save()
    }
    if (!bcrypt.compareSync(req.body.password, user.securityData.password)) {
      user.securityData.safety.times++
      res.status(403).send({ success: false, message: { success: false, title: `密碼錯誤，再${5 - user.securityData.safety.times}次錯誤將登出` } })
      return await user.save()
    }
    user.securityData.password = bcrypt.hashSync(req.body.newPWD, 8)
    user.securityData.tokens = []
    await user.save()
    // // console.log('ok');
    res.status(200).send({
      success: true,
      message: { title: '密碼重設成功，請重新登入' }
    })
  } catch (error) {
    // console.log(error);
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
