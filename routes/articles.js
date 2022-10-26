import express from 'express'
import content from '../middleware/content.js'
import * as auth from '../middleware/auth.js'
import * as onlyOnce from '../middleware/onlyOnce.js'
import admin from '../middleware/admin.js'
import owner from '../middleware/owner.js'
import msgOwner from '../middleware/msgOwner.js'
import createArticleValid from '../middleware/createArticleValid.js'
import articleValid from '../middleware/articleValid.js'
import editArticleValid from '../middleware/editArticleValid.js'
import getArticleValid from '../middleware/getArticleValid.js'
import {
  createArticle,
  createMsg,
  editArticle,
  editMsg,
  deleteArticle,
  deleteMsg,
  banArticle,
  banMsg,
  getArticles,
  getArticle
} from '../controllers/articles.js'

const router = express.Router()
// auth.jwtForId : 給會回傳匿名等內容用的，會加入req._id等供移除需匿名項目
router.post('/create/:id', content('application/json'), auth.jwt, articleValid, onlyOnce.article, createArticleValid, createArticle)
// 要articleValid 因為要母版的文章規則
router.post('/edit/:id', content('application/json'), auth.jwt, owner, articleValid, editArticleValid, editArticle)
router.post('/', auth.jwt, owner, deleteArticle)
router.delete('/banArticle/:id', auth.jwt, admin, banArticle)
router.get('/getArticle/:id', auth.jwtForId, getArticle)
router.get('/:id', getArticleValid, auth.jwtForId, getArticles)

// ***
router.post('/msg/create/:id', content('application/json'), auth.jwt, auth.jwtForId, createMsg)
router.post('/msg/edit/:id', content('application/json'), auth.jwt, msgOwner, editMsg)
router.post('/msg/delete/:id', content('application/json'), auth.jwt, msgOwner, deleteMsg)
router.post('/msg/ban/:id', auth.jwt, admin, banMsg)
export default router
