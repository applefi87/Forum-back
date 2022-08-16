import boards from '../models/boards.js'

export default async (req, res, next) => {
  try {
    console.log("進middleware getBoardVaild");
    const board = await boards.findById(req.params.id)
    if (!board) return res.status(404).send({ success: false, message: '找無該版' })
    req.board = board
    next()
  } catch (error) {
    console.log("err middleware");
    res.status(404).send({ success: false, message: '查無該id' })
  }
}
