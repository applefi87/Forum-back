import express from 'express'
// import content from '../middleware/content.js'
import * as auth from '../middleware/auth.js'
import admin from '../middleware/admin.js'
import boardFormatValid from '../middleware/boardFormatValid.js'
import getBoardValid from '../middleware/getBoardValid.js'
// import upload from '../middleware/upload.js'
import {
  createBoard,
  createRoot,
  getBoard
} from '../controllers/boards.js'

const router = express.Router()
 
// 身分核可>格式母版檢查OK>post
router.post('/create/temp/:id', auth.jwt, admin, boardFormatValid, createBoard)
// 創建不用審核的母版(之後限特定身分)
router.post('/createRoot', auth.jwt, admin, createRoot)
// 取得板塊資料(含左方篩選欄+子版清單+文章)
// 多參數不知為何不能用
// router.post('/:id-:search-:filter-:sort',getBoardValid, getBoard)
router.post('/:id',getBoardValid, getBoard)
// router.get('/all', auth.jwt, admin, getAllProducts)
// router.patch('/:id', content('multipart/form-data'), auth.jwt, admin, upload, editProduct)

export default router
