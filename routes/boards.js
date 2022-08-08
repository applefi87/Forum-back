import express from 'express'
// import content from '../middleware/content.js'
import * as auth from '../middleware/auth.js'
import admin from '../middleware/admin.js'
// import upload from '../middleware/upload.js'
import {
  createBoard,
} from '../controllers/boards.js'

const router = express.Router()

router.post('/create',auth.jwt,admin, createBoard)
// router.get('/', getProducts)
// router.get('/all', auth.jwt, admin, getAllProducts)
// router.get('/:id', getProduct)
// router.patch('/:id', content('multipart/form-data'), auth.jwt, admin, upload, editProduct)

export default router
