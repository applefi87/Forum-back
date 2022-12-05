

export const article = (req, res, next) => {
  console.log('check Review only once');
  if (req.board.beScored?.list?.find(id => id.toString() === req.user._id.toString())) {
    console.log('Already reviewed.');
    return res.status(403).send({ success: false, message: { title: '已經給過評價' } })
  }
  // console.log('New Review');
  next()
}
