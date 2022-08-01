import users from '../models/users.js'
import groups from '../models/groups.js'
// import products from '../models/products.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const register = async (req, res) => {
  const password = req.body.password
  if (!password) { return res.status(400).send({ success: false, message: '缺少密碼欄位' }) }
  if (password.length < 8) { return res.status(400).send({ success: false, message: '密碼必須 8 個字以上' }) }
  if (password.length > 30) { return res.status(400).send({ success: false, message: '密碼必須 30 個字以下' }) }
  if (!password.match(/^[A-Za-z0-9]+$/)) { return res.status(400).send({ success: false, message: '密碼格式錯誤' }) }
  try {
    // 移除不該能新增的欄位
    ['securityData', 'record', 'score'].forEach(e => delete req.body[e]);
    console.log(req.body);

    // 新增管理員身要驗證
    // 不填預設1(使用者)
    if (req.body.role) req.body.role = 1
    // 如果是非使用者，要去驗證對應group是否有該使用者
    if (req.body.role != 1) {
      const success = await groups.findOne({ code: req.body.role, users: req.body.account })
      if (success) {
        // 找不到就回應非法並結束
        res.status(400).send({ success: false, message: 'Wrong admin creatiion!' })
        return
      }
      console.log('creating admin!');
    }

    // 搞得post跟實際資料庫不同，總之我的securityData 不想被別人知道
    req.body.securityData = {
      role: req.body.role, schoolEmail: req.body.schoolEmail,
      email: req.body.email, password: bcrypt.hashSync(password, 15)
    }

    // 新增
    const result = await users.create(req.body)
    res.status(200).send({ success: true, message: '', result })
    console.log('create success!');
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: error.message })
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(400).send({ success: false, message: '帳號已存在' })
    } else {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}

export const login = async (req, res) => {
  try {
    const token = jwt.sign({ _id: req.user._id, role: req.body.role }, process.env.SECRET, { expiresIn: '2 days' })
    req.user.securityData.tokens.push(token)
    await req.user.save()
    res.status(200).send({
      success: true,
      message: '',
      result: {
        token,
        account: req.user.account
      }
    })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

// export const logout = async (req, res) => {
//   try {
//     req.user.tokens = req.user.tokens.filter(token => token !== req.token)
//     await req.user.save()
//     res.status(200).send({ success: true, message: '' })
//   } catch (error) {
//     res.status(500).send({ success: false, message: '伺服器錯誤' })
//   }
// }

// export const extend = async (req, res) => {
//   try {
//     const idx = req.user.tokens.findIndex(token => token === req.token)
//     const token = jwt.sign({ _id: req.user._id }, process.env.SECRET, { expiresIn: '7 days' })
//     req.user.tokens[idx] = token
//     await req.user.save()
//     res.status(200).send({ success: true, message: '', result: token })
//   } catch (error) {
//     res.status(500).send({ success: false, message: '伺服器錯誤' })
//   }
// }

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

// export const addCart = async (req, res) => {
//   try {
//     // 驗證商品
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
//   } catch (error) {
//     if (error.name === 'ValidationError') {
//       const key = Object.keys(error.errors)[0]
//       const message = error.errors[key].message
//       return res.status(400).send({ success: false, message })
//     } else {
//       res.status(500).send({ success: false, message: '伺服器錯誤' })
//     }
//   }
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

// export const getCart = async (req, res) => {
//   try {
//     const result = await users.findById(req.user._id, 'cart').populate('cart.product')
//     res.status(200).send({ success: true, message: '', result: result.cart })
//   } catch (error) {
//     res.status(500).send({ success: false, message: '伺服器錯誤' })
//   }
// }
