import fs from 'fs'
import xss from 'xss'
// 找到版> 去母版看文章規則>審查規則+對應欄位>存入
const cleanXSS = (html) => {
  return xss(html)
}
export default async (req, res, next) => {
  console.log('in middle formatvalid');
  try {
    // 延遲工具
    // await new Promise(resolve => setTimeout(() => resolve(console.log('ok')), 2000));
    const form = {}
    // 此為必填區 不然就報錯 (上方已經驗證過)
    form.board = req.params.id
    form.user = req.user._id
    form.uniqueId = req.body.uniqueId
    //找是否有對應到母版該category的規則
    const category = req.article.category.find((it) => {
      return it.c == req.body.category
    })
    if (!category) return res.status(403).send({ success: false, message: '無該文章類型' })
    form.category = req.body.category
    // (給schema檢查)
    form.privacy = req.body.privacy || 0
    form.title = req.body.title
    form.content = cleanXSS(req.body.content)
    // 是1(評價版)才加評分 (給schema檢查)
    if (category.c === 1) { form.score = req.body.score }
    // 處理tag (母板歸有訂才加入) (已經審查完內容)
    if (category.tagActive) {
      const tags = []
      const tagsObj = category.tagOption
      for (let tag of Object.keys(tagsObj)) {
        if (req.body.tags?.includes(tag)) tags.push(tag)
      }
      // 沒有標tag也是正常的
      form.tags = tags
    }
    // 不用mongoose內建，因為我編輯評價會改到，但只有發文者改資料才該更新
    form.update_at = Date.now()
    // 先忽略schema 的 cols
    // const columns = []
    // column.
    //   form.columns = 2
    req.form = form
    console.log('articleFormatValid ok');
    // return res.status(403).send({ success: false, message: '到這完成', result: form })
    next()
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

