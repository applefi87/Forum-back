import express from 'express'
import content from '../middleware/content.js'
import * as auth from '../middleware/auth.js'
import articleFormatValid from '../middleware/articleFormatValid.js'
import getArticleValid from '../middleware/getArticleValid.js'
import {
  createArticle,
  getArticles
} from '../controllers/articles.js'

const router = express.Router()

router.post('/create/:id', content('application/json'), auth.jwt, articleFormatValid, createArticle)
router.get('/:id', getArticleValid, getArticles)
// router.get('/all', auth.jwt, admin, getAllProducts)
// router.get('/:id', getProduct)
// router.patch('/:id', content('multipart/form-data'), auth.jwt, admin, upload, editProduct)

export default router
