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
router.post('/create/:id', auth.jwt, admin, boardFormatValid, createBoard)
router.post('/createRoot', auth.jwt, admin, createRoot)
router.post('/:id-:search-:filter-:sort',getBoardValid, getBoard)
// router.get('/all', auth.jwt, admin, getAllProducts)
// router.patch('/:id', content('multipart/form-data'), auth.jwt, admin, upload, editProduct)

export default router
