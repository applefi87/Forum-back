import express from 'express'
import * as auth from '../middleware/auth.js'
import content from '../middleware/content.js'
import {
  register,
  login,
  logout,
  extend,
  setPWD,
  getUser,
  editInfo,
  // getCart
  // giveMsg
} from '../controllers/users.js'
import {
  sendMail,
  verifyMail,
  sendPWDMail,
  verifyPWDMail
} from '../controllers/mails.js'

const router = express.Router()

router.post('/', content('application/json'), verifyMail(true), register)
router.post('/login', content('application/json'), auth.login, login)
router.delete('/logout', auth.jwt, logout)
router.post('/extend', auth.jwt, extend)

router.post('/sendMail', content('application/json'), sendMail())
router.post('/mailVerify', content('application/json'), verifyMail(false))

router.post('/sendPWDMail', content('application/json'), sendPWDMail)
router.post('/verifyPWDMail', content('application/json'), verifyPWDMail, setPWD)
router.get('/', auth.jwt, getUser)
// router.post('/cart', content('application/json'), auth.jwt, addCart)
router.patch('/editInfo', content('application/json'), auth.jwt, editInfo)
// router.get('/cart', auth.jwt, getCart)
export default router
