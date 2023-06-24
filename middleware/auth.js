import passport from 'passport'
import jsonwebtoken from 'jsonwebtoken'

export const login = (sqlSelect) => {
  return (req, res, next) => {
    req.sqlSelect = sqlSelect ? sqlSelect : "_id nickName account score info securityData.tokens securityData.role securityData.schoolEmail record.toBoard notification"
    passport.authenticate('login', { session: false }, (err, user, info) => {
      // console.log('authErr');
      if (err || !user) {
        if (info?.message === 'Missing credentials') { info.message = '驗證錯誤' }
        return res.status(401).send({ success: false, message: { title: info?.message } })
      }
      req.user = user
      next()
    })(req, res, next)
  }
}

export const jwt = (sqlSelect) => {
  return (req, res, next) => {
    req.sqlSelect = sqlSelect ? sqlSelect : "_id nickName account score info securityData.tokens securityData.role securityData.schoolEmail record.toBoard notification"
    passport.authenticate('jwt', { session: false }, (err, data, info) => {
      if (err || !data) {
        // console.log(err, info);
        if (info instanceof jsonwebtoken.JsonWebTokenError) {
          return res.status(404).send({ success: false, message: { title: '驗證錯誤' } })
        } else {
          return res.status(401).send({ success: false, message: { title: info.message } })
        }
      }
      req.user = data.user
      req.jwtSignature = data.jwtSignature
      next()
    })(req, res, next)
  }
}

// 直接取出沒過期token的id 供controller簡易比對是否是本人 
export const jwtForId = (req, res, next) => {
  passport.authenticate('jwtForId', { session: false }, (err, data, info) => {
    if (err || !data) {
      // console.log('no Id');
    } else {
      req._id = data._id
    }
    next()
  })(req, res, next)
}