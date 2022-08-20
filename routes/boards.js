import express from 'express'
import content from '../middleware/content.js'
import * as auth from '../middleware/auth.js'
import admin from '../middleware/admin.js'
import boardFormatValid from '../middleware/boardFormatValid.js'
import getBoardValid from '../middleware/getBoardValid.js'
import getBoardValidTest from '../middleware/getBoardValidTest.js'
import {
  createBoard,
  createRoot,
  getBoard,
  getBoardTest,
  getChildBoards
} from '../controllers/boards.js'
//   181 209
const router = express.Router()
// 身分核可>格式母版檢查OK>post
router.post('/create/temp/:id', content('application/json'), auth.jwt, admin, boardFormatValid, createBoard)
// 創建不用審核的母版(之後限特定身分)
router.post('/createRoot', content('application/json'), auth.jwt, admin, createRoot)
// 取得板塊資料(含左方篩選欄+子版清單+文章)
// 主要在過濾+搜尋的部分(sort先放在用戶端排)
router.get('/childs/:id', getBoardValid, getChildBoards)   
router.get('/:id', getBoardValid, getBoard)
// 考量掉包機率大 增加風險 先暫停(目前已經可回傳全部資料)
// router.get('/test/:id', getBoardValidTest, getBoardTest)
export default router 
