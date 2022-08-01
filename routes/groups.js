import express from 'express'
import content from '../middleware/content.js'
import {
 addGroup
} from '../controllers/groups.js'

const router = express.Router()

router.post('/',content('application/json'), addGroup)
export default router
