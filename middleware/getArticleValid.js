import boards from '../models/boards.js'

export default async (req, res, next) => {
  try {
    // console.log("進middleware getArticleVaild");
    const board = await boards.findById(req.params.id)
    if (!board) return res.status(404).send({ success: false, message: '找無該版' })
    req.board = board
    // console.log("middleware OK");
    next()
  } catch (error) {
    // console.log("err middleware");
    res.status(404).send({ success: false, message: '查無該id' })
  }
}
