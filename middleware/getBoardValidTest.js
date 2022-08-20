import boards from '../models/boards.js'
import articles from '../models/articles.js'
export default async (req, res, next) => {
  try {
    console.log("進middleware getBoardVaildTest");
    // 先取原版
    const all = {}
    all.board = await boards.findById(req.params.id)
    if (!all.board) return res.status(404).send({ success: false, message: '找無該版' })
    req.board = all.board
    // 有母版代表有文章>
    // 取母版抓規則>對應文章
    if (all.board.parent) {
      all.parent = await boards.findById(all.board.parent)
      console.log('all.parent');
      console.log(all.parent);
      // -------------
      if (all.parent.childBoard?.article?.active) {
        all.article = await boards.findById(req.params.id)
        console.log('all.article');
        console.log(all.article);
      }
    }
    console.log('middleware OK');
    // 取規則
    req.all = all
    next()
  } catch (error) {
    console.log("err middleware");
    res.status(404).send({ success: false, message: '查無該id' })
  }
}
