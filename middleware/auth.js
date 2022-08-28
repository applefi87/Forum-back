import passport from 'passport'
import jsonwebtoken from 'jsonwebtoken'

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

export const jwt = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, data, info) => {
    if (err || !data) {
      console.log('authJWTErr');
      console.log(err, info);
      if (info instanceof jsonwebtoken.JsonWebTokenError) {
        return res.status(401).send({ success: false, message: { title: '驗證錯誤' } })
      } else {
        return res.status(401).send({ success: false, message: { title: info.message, text: err } })
      }
    }
    req.user = data.user
    req.token = data.token
    req.role = data.role
    console.log('authOk');
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
      req.role = data.role
      console.log('Get Id');
    }
    next()
  })(req, res, next)
}