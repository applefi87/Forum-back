import express from 'express'
import * as auth from '../middleware/auth.js'
import content from '../middleware/content.js'

import {
  usersPostBoards,
  createUsers
} from '../controllers/tests.js'

const router = express.Router()

router.post('/usersPostBoards', content('application/json'), auth.jwt, usersPostBoards)
router.post('/createUsers', content('application/json'), auth.jwt, createUsers)

export default router
