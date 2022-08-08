export default (req, res, next) => {
  if (req.user.securityData.role !== 0) {
    res.status(403).send({ success: false, message: '權限不足' })
  } else {
    next()
  }
}
