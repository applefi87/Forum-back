import articles from '../models/articles.js'
export default async (req, res, next) => {
  try {
    const article = await articles.findById(req.params.id)
    if (req.user._id.toString() === article.msg1?.list?.find(msg => msg.id === req.body?.id)?.user?.toString()) {
      req.theArticle = article
      next()
    } else {
      res.status(403).send({ success: false, message: '非留言擁有者' })
    }
  } catch (error) {
    console.log(error);
    res.status(404).send({ success: false, message: '伺服器錯誤' })
  }
}
