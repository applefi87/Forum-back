import express from 'express'
import content from '../middleware/content.js'
import * as auth from '../middleware/auth.js'
import admin from '../middleware/admin.js'
import createArticleValid from '../middleware/createArticleValid.js'
import editArticleValid from '../middleware/editArticleValid.js'
import articleValid from '../middleware/articleValid.js'
import getArticleValid from '../middleware/getArticleValid.js'
import {
  createArticle,
  createMsg,
  editArticle,
  getArticles,
  getArticle,
  banMsg
} from '../controllers/articles.js'

const router = express.Router()

router.post('/create/:id', content('application/json'), auth.jwt, articleValid, createArticleValid, createArticle)
router.post('/createMsg/:id', content('application/json'), auth.jwt, auth.jwtForId, createMsg)
router.post('/edit/:id', content('application/json'), auth.jwt, articleValid, editArticle)
router.get('/getArticle/:id', auth.jwtForId, getArticle)
router.delete('/:id', auth.jwt, admin, banMsg)
// router.get('/all', auth.jwt, admin, getAllProducts)
// router.get('/:id', getProduct)
// router.patch('/:id', content('multipart/form-data'), auth.jwt, admin, upload, editProduct)
router.get('/:id', getArticleValid, auth.jwtForId, getArticles)

export default router
