import articles from '../models/articles.js'
export default async (req, res, next) => {
  const article = await articles.findById(req.route.path === "/edit/:id" ? req.body._id : req.params.id)
  if (req.user._id.toString() === article.user._id.toString()) {
    req.theArticle = article
    next()
  } else {
    res.status(403).send({ success: false, message: '非文章擁有者' })
  }
}
