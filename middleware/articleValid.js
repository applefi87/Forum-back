import boards from '../models/boards.js'
import fs from 'fs'

export default async (req, res, next) => {
  try {
    // 找該版
    const board = await boards.findById(req.params.id)
    if (!board) return res.status(403).send({ success: false, message: '找無該版' })
    // 找母版對是否開放文章
    const parent = await boards.findById(board.parent)
    if (!parent.childBoard?.article?.active) return res.status(403).send({ success: false, message: '該版無法建立文章' })
    const article = parent.childBoard.article
    if (article.category.length < 1) return res.status(403).send({ success: false, message: '該版無文章區資訊' })
    //找是否有對應到該版unique項目id
    // mongoose特殊用法
    const uniqueOK = board.uniqueData?.id(req.body.uniqueId)
    if (!uniqueOK) return res.status(403).send({ success: false, message: '沒對到該版獨立分類' })
    console.log('ArticleValid OK');
    req.article = article
    // return res.status(403).send({ success: false, message: '到這完成', result: form })
    next()
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

