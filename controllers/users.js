import users from '../models/users.js'
import groups from '../models/groups.js'
import emails from '../models/emails.js'
import randomPWD from '../util/randomPWD.js'
// import products from '../models/products.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const rateEmpty = {
  score: 0,
  amount: 0,
  list: []
}

export const register = async (req, res) => {

  // 記得改回來
  // if (!req.mail.isSchool) {
  //   res.status(403).send({ success: false, message: { title: '請使用學校信箱' } })
  //   return
  // }
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
  if (password.length < 8 || password.length > 30) { return res.status(400).send({ success: false, message: { title: '長度需介於8~30字之間' } }) }
  if (!(password.match(/[A-Z]/) && password.match(/[a-z]/) && password.match(/[0-9]/))) { return res.status(400).send({ success: false, message: { title: 'pwdRule' } }) }
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

    // *********新增 避免亂丟req.body(之後一定會用到)，所以先練習只列要的
    const input = {
      account: req.body.account,
      nickName: req.body.nickName,
      securityData: {
        role,
        schoolEmail: req.body.schoolEmail,
        password: bcrypt.hashSync(password, 10)
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
    const expireTime = req.body.keepLogin ? {} : { expiresIn: '200000 seconds' }
    const token = jwt.sign({ _id: req.user._id, role: req.user.securityData.role }, process.env.SECRET, expireTime)
    // token太多 自動刪(預估留最後2次登陸，反正自動續約也會在後面，原本的會被刪掉)
    if (req.user.securityData.tokens.length > 10) { req.user.securityData.tokens = req.user.securityData.tokens.slice(3) }
    req.user.securityData.tokens.push(token)
    await req.user.save()
    res.status(200).send({
      message: { success: true, title: 'loginSuccess' },
      result: {
        token,
        account: req.user.account,
        role: req.user.securityData.role,
        score: req.user.score
      }
    })
  } catch (error) {
    res.status(500).send({
      message: { success: true, title: '伺服器錯誤' },
    })
  }
}

export const logout = async (req, res) => {
  try {
    console.log('incontroller');
    req.user.securityData.tokens = req.user.securityData.tokens.filter(token => token !== req.token)
    await req.user.save()
    res.status(200).send({ success: true, message: { success: true, title: '登出' } })
  } catch (error) {
    res.status(500).send({ success: false, message: { success: false, title: '伺服器錯誤' } })
  }
}

export const extend = async (req, res) => {
  try {
    const token = jwt.sign({ _id: req.user._id }, process.env.SECRET, { expiresIn: '200000 seconds' })
    req.user.securityData.tokens = req.user.securityData.tokens.filter(token => token !== req.token)
    req.user.securityData.tokens.push(token)
    await req.user.save()
    res.status(200).send({ success: true, message: '', result: token })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}


export const setPWD = async (req, res) => {
  console.log('incontroller setPWD');
  try {
    const createCode = randomPWD(8, 'medium')
    //需要加上臨時密碼
    const tempPWD = bcrypt.hashSync(createCode, 10)
    const user = await users.findOne({ _id: req.mail.user }).select(['account', 'securityData.password'])
    user.securityData.password = tempPWD
    user.securityData.tokens = []
    user.save()
    // console.log(user.account, createCode);
    res.status(200).send({
      success: true,
      message: { title: '密碼重設成功' },
      result: {
        account: user.account,
        tempPWD: createCode
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

export const changePWD = async (req, res) => {
  console.log('incontroller changePWD');
  try {
    const user = await users.findOne({ _id: req.user._id }).select(['account', 'securityData.password'])
    user.securityData.password = bcrypt.hashSync(req.body.newPWD, 10)
    user.securityData.tokens = []
    user.save()
    console.log('ok');
    res.status(200).send({
      success: true,
      message: { title: '密碼重設成功，請重新登錄' }
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

// 之後建文章可用這個方式
// export const addCart = async (req, res) => {
//     const result = await products.findById(req.body.product)
//     // 沒找到或已下架
//     if (!result || !result.sell) {
//       return res.status(404).send({ success: false, message: '商品不存在' })
//     }
//     // 找購物車有沒有這個商品
//     const idx = req.user.cart.findIndex(item => item.product.toString() === req.body.product)
//     if (idx > -1) {
//       req.user.cart[idx].quantity += req.body.quantity
//     } else {
//       req.user.cart.push({
//         product: req.body.product,
//         quantity: req.body.quantity
//       })
//     }
//     await req.user.save()
//     res.status(200).send({ success: true, message: '', result: req.user.cart.length })
// }

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
