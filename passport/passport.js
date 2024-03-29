import passport from 'passport'
import passportJWT from 'passport-jwt'
import passportLocal from 'passport-local'
import bcrypt from 'bcrypt'
import users from '../models/users.js'
import { jwtPickSignature } from '../util/dataFormetTool.js'
import { json } from 'express'

const LocalStrategy = passportLocal.Strategy
const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

passport.use('login', new LocalStrategy({
  usernameField: 'account',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, account, password, done) => {
  try {
    // 因為req.body.role 是0 所以要用undefined判斷
    let user = await users.findOne({ account, 'securityData.role': (req.body.role !== undefined ? req.body.role : 1) }, req.sqlSelect).populate({
      path: 'notification.user',
      select: "nickName"
    }).populate({ path: 'notification.board', select: 'titleCol parent colData',populate:{ path: 'parent', select: 'childBoard.rule.titleCol' } })
    console.log(user);
    if (!user) {
      return done(null, false, { message: '帳號不存在' })
    }
    // 驗證密碼
    if (!bcrypt.compareSync(password, user.securityData.password)) {
      return done(null, false, { message: '密碼錯誤' })
    }
    return done(null, user)
  } catch (error) {
    return done(error, false, { message: '伺服器錯誤' })
  }
}))

passport.use('jwt', new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET,
  passReqToCallback: true,
  ignoreExpiration: true
}, async (req, payload, done) => {
  try {
    const expired = payload.exp * 1000 < Date.now()
    if (expired) {
      if (req.originalUrl !== '/user/extend' && req.originalUrl !== '/user/logout') {
        return done(null, false, { message: '登入逾期' })
      }
    }
    const token = req.headers.authorization.split(' ')[1]
    const jwtSignature = jwtPickSignature(token)
    const user = await users.findById(payload._id, req.sqlSelect).populate({path: "notification.user", select: 'nickName'})
    if (!user) {
      return done(null, false, { message: '使用者不存在' })
    }
    if (user.securityData.tokens.indexOf(jwtSignature) === -1) {
      return done(null, false, { message: '驗證錯誤,請重新登錄' })
    }
    return done(null, { user, jwtSignature: jwtSignature })
  } catch (error) {
    // console.log('passportjwt ERROR');
    return done(error, false)
  }
}))
passport.use('jwtForId', new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET,
  passReqToCallback: true,
  ignoreExpiration: true
}, async (req, payload, done) => {
  //不驗證過期 畢竟那都是可用來取新的，所以即使過期也應該有效
  // const expired = payload.exp * 1000 < Date.now()
  // if (expired) {
  //   return done(null, false, { message: '不採用ID' })
  // }
  return done(null, { _id: payload._id })
}))
