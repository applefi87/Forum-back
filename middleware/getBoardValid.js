import file from '../translateForm/classesOut.js'
import boards from '../models/boards.js'
// 把過濾等內容都在這處理好
// 代碼表示: 1單行文字 2多行文字 3數字  5單選 6多選 0Boolean 

export default async (req, res, next) => {
  console.log("進middleware getBoardVaild");
  const board = await boards.findById(req.params.id)
  if (!board) return res.status(403).send({ success: false, message: '找無該版' })
  // 使用者有輸入內容直接去資料庫查詢即可(打錯就找不到)
  // 沒有的話，為了效能會預設先給一個
  const condition = { parent: req.params.id }
  // 如果主要filter欄c0沒被宣告過，給預設(下方有宣告就會改false)
  let defaultFilter = true
  if (req.body.filterData.length > 0) {
    req.body.filterData.forEach(filter => {
      // 欄位要有字串非空值 + 要有過濾/全部 才算有效
      if (filter.col && typeof filter.col === "string" && (filter.text || filter.all)) {
        if (filter.col === "c0") { defaultFilter = false }
        // 要有過濾 || 全部就不用篩
        if (!filter.all) {
          condition['colData.' + filter.col] = filter.text
        }
      }
    })
  }
  // defaultFilter 加上默認過濾
  if (defaultFilter) {
    condition['colData.' + "c0"] = board.childBoard.rule.display.filter.dataCol.c0[0]
  }

  // 同 輪到unique的欄位 
  if (req.body.filterUnique?.length > 0) {
    req.body.filterUnique.forEach(filter => {
      if (filter.col && typeof filter.col === "string" && (filter.text || filter.all)) {
        if (!filter.all) {
          condition['uniqueData.' + filter.col] = filter.text
        }
      }
    })
  }
  // 同 輪到search的欄位(目前只一個，保留彈性用array包)
  // 沒有search.all
  if (req.body.search?.length > 0) {
    req.body.search.forEach(search => {
      if (search.col && typeof search.col === "string" && search.text) {
        condition['colData.' + search.col] = RegExp(search.text, "i")
      }
    })
  }
  req.condition = condition
  next()
}
