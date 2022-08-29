import express from 'express'
import content from '../middleware/content.js'
import * as auth from '../middleware/auth.js'
import admin from '../middleware/admin.js'
import articleFormatValid from '../middleware/articleFormatValid.js'
import getArticleValid from '../middleware/getArticleValid.js'
import {
  createArticle,
  getArticles,
  createMsg,
  getArticle,
  banMsg
} from '../controllers/articles.js'

const router = express.Router()

router.post('/create/:id', content('application/json'), auth.jwt, articleFormatValid, createArticle)
router.post('/createMsg/:id', content('application/json'), auth.jwt, auth.jwtForId, createMsg)
router.get('/getArticle/:id', auth.jwtForId, getArticle)
router.delete('/:id', auth.jwt, admin, banMsg)
// router.get('/all', auth.jwt, admin, getAllProducts)
// router.get('/:id', getProduct)
// router.patch('/:id', content('multipart/form-data'), auth.jwt, admin, upload, editProduct)
router.get('/:id', getArticleValid, auth.jwtForId, getArticles)

export default router
