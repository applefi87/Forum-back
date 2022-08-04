import express from 'express'
import * as auth from '../middleware/auth.js'
import content from '../middleware/content.js'
import {
  register,
  login,
  // logout, 
  // extend,
  getUser,
  // addCart,
  editInfo, 
  // getCart
  // giveMsg
} from '../controllers/users.js'
import {
  sendMail,
  mailVerify
} from '../controllers/mails.js'

const router = express.Router()

router.post('/',content('application/json'),mailVerify(true),register)
router.post('/sendMail', content('application/json'),  sendMail)
router.post('/mailVerify', content('application/json'),  mailVerify(false))
router.post('/login', content('application/json'), auth.login, login)
// router.delete('/logout', auth.jwt, logout)
// router.post('/extend', auth.jwt, extend)
router.get('/', auth.jwt, getUser)
// router.post('/cart', content('application/json'), auth.jwt, addCart)
router.patch('/editInfo', content('application/json'), auth.jwt, editInfo)
// router.get('/cart', auth.jwt, getCart)
export default router
