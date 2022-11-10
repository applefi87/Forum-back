import passport from 'passport'
import jsonwebtoken from 'jsonwebtoken'
import cookie from 'cookies'

export const login = (req, res, next) => {
  passport.authenticate('login', { session: false }, (err, user, info) => {
    console.log('authErr');
    if (err || !user) {
      if (info.message === 'Missing credentials') { info.message = '驗證錯誤' }
      return res.status(401).send({ success: false, message: { title: info.message } })
    }
    req.user = user
    next()
  })(req, res, next)
}

const globalCookieSetting = { sameSite: 'lax', signed: true }
export const jwt = (req, res, next) => {
  req.cookies = new cookie(req, res, { keys: [process.env.COOKIE_SECRET] })
  req.keyJWT = req.cookies.get('keyJWT', { httpOnly: true, ...globalCookieSetting })
  req.loginCookie = req.cookies.get('loginCookie', { httpOnly: false, ...globalCookieSetting })
  passport.authenticate('jwt', { session: false }, (err, data, info) => {
    if (err || !data) {
      if (info.message === 'LoginCookie ERR!') {
        console.log('LoginCookie ERR!. Cleared all!');
        req.cookies.set('keyJWT')
        req.cookies.set('loginCookie')
        return res.status(410).send({ success: false, message: { title: '請重新登錄' } })
      }
      if (info instanceof jsonwebtoken.JsonWebTokenError) {
        return res.status(404).send({ success: false, message: { title: '驗證錯誤' } })
      } else {
        return res.status(401).send({ success: false, message: { title: info.message } })
      }
    }
    req.user = data.user
    req.token = data.token
    // if(req.route){}
    // console.log('auth-jwtOk');
    next()
  })(req, res, next)
}

// 直接取出沒過期token的id 供controller簡易比對是否是本人 
export const jwtForId = (req, res, next) => {
  passport.authenticate('jwtForId', { session: false }, (err, data, info) => {
    if (err || !data) {
      console.log('no Id');
    } else {
      req._id = data._id
      console.log('Get Id');
    }
    next()
  })(req, res, next)
}