import passport from 'passport'
import jsonwebtoken from 'jsonwebtoken'

export const login = (req, res, next) => {
  passport.authenticate('login', { session: false }, (err, user, info) => {
    if (err || !user) {
      if (info.message === 'Missing credentials') { info.message = '驗證錯誤' }
      return res.status(401).send({ success: false, message: { success: false, title: info.message, text: '' } })
    }
    req.user = user
    next()
  })(req, res, next)
}

export const jwt = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, data, info) => {
    if (err || !data) {
      console.log('authErr');
      console.log(err,info);
      if (info instanceof jsonwebtoken.JsonWebTokenError) {
        return res.status(401).send({ success: false, message: { title: '驗證錯誤' } })
      }  else {
        return res.status(401).send({ success: false, message: { title: info.message, test: err } })
      }
    }
    req.user = data.user
    req.token = data.token
    req.role = data.role
    console.log('authOk');
    next()
  })(req, res, next)
}
