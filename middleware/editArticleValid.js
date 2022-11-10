import fs from 'fs'
import _ from 'lodash'
import xss from 'xss'
// 找到版> 去母版看文章規則>審查規則+對應欄位>存入
const cleanXSS = (html) => {
  return xss(html)
}
export default async (req, res, next) => {
  console.log('in middle formatvalid');
  try {
    // 評價需要改目標版資料，確認有找到板再刪
    if (req.body.score !== undefined) {
      if (!(Number.isInteger(req.body.score) && req.body.score <= 5 && req.body.score >= 0)) {
        return res.status(401).send({ success: false, message: '評分格式錯誤' })
      }
    }
    // (給schema檢查)
    req.article.privacy = req.body.privacy || 0
    req.article.title = req.body.title
    req.article.content = cleanXSS(req.body.content)
    // 是1(評價版)才加評分 (給schema檢查)
    let isScoreChange
    let scoreChange
    if (req.article.category === 1) {
      isScoreChange = req.body.score !== req.article.score
      scoreChange = _.cloneDeep([req.article.score, req.body.score])
      req.article.score = req.body.score
    }
    //***找是否有對應到母版該category的規則
    const category = req.articleRule.category.find((it) => {
      return it.c == req.body.category
    })
    // 處理tag (母板歸有訂才加入) (已經審查完內容)
    // 等等判斷是否更新版資料用
    let isTagsChange
    let tagsChange
    if (category.tagActive) {
      const tags = []
      const tagsObj = category.tagOption
      for (let tag of Object.keys(tagsObj)) {
        // 清單有，但沒被加過(避免重複的tag)才加入
        if (req.body.tags?.includes(tag) && !tags.includes(tag)) tags.push(tag)
      }
      isTagsChange = !_.isEqual(_.sortBy(req.article.tags), _.sortBy(tags))
      tagsChange = _.cloneDeep([req.article.tags, tags])
      req.article.tags = tags
    }
    // 不用mongoose內建，因為我編輯評價分數會被自動更新，但只有發文者改資料才該更新
    req.article.update_at = Date.now()
    // 先忽略schema 的 cols
    // const columns = []
    // column.
    //   form.columns = 2
    // console.log('articleFormatValid ok');
    req.isTagsChange = isTagsChange
    req.tagsChange = tagsChange
    req.scoreChange = scoreChange
    req.isScoreChange = isScoreChange
    // return res.status(403).send({ success: false, message: '到這完成', result: form })
    next()
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

