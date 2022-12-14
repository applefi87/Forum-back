import articles from '../models/articles.js'
export default async (req, res, next) => {
  try {
    const article = await articles.findById(req.body._id)
    if (req.user._id.toString() === article.user._id.toString()) {
      req.article = article
      next()
    } else {
      res.status(403).send({ success: false, message: '非文章擁有者' })
    }
  } catch (error) {
    // console.log(error);
    res.status(403).send({ success: false, message: '伺服器錯誤' })
  }
}
