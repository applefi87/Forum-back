import file from '../classesOut.js'
import boards from '../models/boards.js'

// 代碼表示: 1單行文字 2多行文字 3數字  5單選 6多選 0Boolean 

export default async (req, res, next) => {
  const board = await boards.findById(req.params.id)
  if (!board) return res.status(403).send({ success: false, message: '找無該版' })
  // 使用者有輸入內容直接去資料庫查詢即可(打錯就找不到)
  // 沒有的話，為了效能會預設先給一個
  const condition = { parent: req.params.id }
  if (req.body.searchCol && req.body.search) {
    condition['colData.' + "c40"] = RegExp(req.body.search, "i")
    console.log(condition);
  } else {
    const filterList = board.childBoard.rule.display.filter.dataCol.c0
    condition['colData.' + "c0"] = filterList.findIndex(i => i === req.params.filter) >= 0 ? req.params.filter : filterList[0]
  }
  req.condition = condition
  next()
}
