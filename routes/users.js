import express from 'express'
import * as auth from '../middleware/auth.js'
import content from '../middleware/content.js'
import {
  register,
  login,
  logout,
  extend,
  resetPWD,
  changePWD,
  getUser,
  editInfo
} from '../controllers/users.js'
import {
  sendMail,
  verifyMail,
  sendForgetPWDMail,
  verifyForgetPWDCode
} from '../controllers/mails.js'

const router = express.Router()

// 
router.post('/sendMail', content('application/json'), sendMail)
router.post('/mailVerify', content('application/json'), verifyMail(false))
// 
router.post('/', content('application/json'), verifyMail(true), register)
router.post('/login', content('application/json'), auth.login("_id nickName score securityData.role securityData.password securityData.tokens notification"), login)
router.delete('/logout', auth.jwt(), logout)
router.post('/extend', auth.jwt("_id securityData.role securityData.tokens notification"), extend)
// 改密碼/忘記密碼相關
router.post('/sendForgetPWDMail', content('application/json'), sendForgetPWDMail)
router.post('/verifyForgetPWDCode', content('application/json'), verifyForgetPWDCode, resetPWD)
router.post('/changePWD', content('application/json'), auth.jwt(), changePWD)

// router.get('/', auth.jwt, getUser)
// router.patch('/editInfo', content('application/json'), auth.jwt, editInfo)
// router.get('/cart', auth.jwt, getCart)
export default router
