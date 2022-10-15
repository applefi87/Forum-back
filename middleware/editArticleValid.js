import articles from '../models/articles.js'
import fs from 'fs'
import xss from 'xss'
// 找到版> 去母版看文章規則>審查規則+對應欄位>存入
const cleanXSS = (html) => {
  return xss(html)
}
export default async (req, res, next) => {
  console.log('in middle formatvalid');
  try {
    // 找該文章
    const article = await articles.findById(req.body._id)
    // (給schema檢查)
    article.title = req.body.title
    article.content = cleanXSS(req.body.content)
    // 是1(評價版)才加評分 (給schema檢查)
    if (article.category === 1 && req.body.score >= 0 && req.body.score <= 5 && Number.isInteger(req.body.score)) { article.score = req.body.score }
    //找是否有對應到母版該category的規則
    const category = req.article.category.find((it) => {
      return it.c == req.body.category
    })
    // 處理tag (母板歸有訂才加入) (已經審查完內容)
    if (category.tagActive) {
      article.tags.length = 0
      const tags = []
      const tagsObj = category.tagOption
      for (let tag of Object.keys(tagsObj)) {
        if (req.body.tags?.includes(tag)) tags.push(tag)
      }
      article.tags.push(...tags)
    }
    // 不用mongoose內建，因為我編輯評價會改到，但只有發文者改資料才該更新
    article.update_at = Date.now()
    // 先忽略schema 的 cols
    // const columns = []
    // column.
    //   form.columns = 2
    console.log('articleFormatValid ok');
    // return res.status(403).send({ success: false, message: '到這完成', result: form })
    next()
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

