import boards from '../models/boards.js'


// 找到版> 去母版看文章規則>審查規則+對應欄位>存入

export default async (req, res, next) => {
  console.log('in middle formatvalid');
  const board = await boards.findById(req.params.id)
  if (!board) return res.status(403).send({ success: false, message: '找無該版' })
  const parent = await boards.findById(req.params.id)
  if (!parent || !parent.childBoard?.article?.active) return res.status(403).send({ success: false, message: '該版無法建立文章' })
  // 先統一當要評價 之後再區分不同類型文章
  if (!parent.childBoard?.article?.hasReview) return res.status(403).send({ success: false, message: '該版無法建立評價' })
  const article = parent.childBoard.article.category[0]
  if (!article) return res.status(403).send({ success: false, message: '該版無文章區資訊' })
  // 
  const form = {}
  form.board = req.params.id
  form.user = req.user._id
  form.title = req.body.title
  form.content = req.body.content
  form.privacy = req.body.privacy || 2
  form.lastEditDate = Date.now()
  // form.=req.body.
  // form.=req.body.
  req.article = article
  return res.status(403).send({ success: false, message: '到這完成', result: form })
  next()
}

