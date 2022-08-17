import boards from '../models/boards.js'


// 找到版> 去母版看文章規則>審查規則+對應欄位>存入

export default async (req, res, next) => {
  console.log('in middle formatvalid');
  // 找該版
  const board = await boards.findById(req.params.id)
  if (!board) return res.status(403).send({ success: false, message: '找無該版' })
  // 找母版對是否有文章與規則
  const parent = await boards.findById(board.parent)
  if (!parent || !parent.childBoard?.article?.active) return res.status(403).send({ success: false, message: '該版無法建立文章' })
  // 先統一當評價 之後再區分不同類型文章
  if (!parent.childBoard?.article?.hasReview) return res.status(403).send({ success: false, message: '該版無法建立評價' })
  const article = parent.childBoard.article
  if (article.category.length < 1) return res.status(403).send({ success: false, message: '該版無文章區資訊' })
  //找是否有對應到該版unique項目id
  const uniqueOK = board.uniqueData?.find((it) => {
    return it._id.toString() === req.body.uniqueId
  })
  if (!uniqueOK) return res.status(403).send({ success: false, message: '沒對到該版獨立分類' })

  const form = {}
  // 此為必填區 不然就報錯 (上方已經驗證過)
  form.board = req.params.id
  form.user = req.user._id
  form.privacy = req.body.privacy || 2
  form.uniqueId = req.body.uniqueId
  //找是否有對應到母版定義的category code
  // 順便取出該類型的相關規則
  const category = article.category.find((it) => {
    return it.c == req.body.category
  })
  if (!category) return res.status(403).send({ success: false, message: '文章類型錯誤' })
  form.category = req.body.category
  // 
  form.title = req.body.title
  form.content = req.body.content
  // 是1(評價版)才加評分
  if (category.c === 1) { form.score = req.body.score }
  // 處理tag (母板歸有定才加入)
  if (category.tagActive) {
    const tags = []
    for (let tag of article.category[0].tagOption) {
      if (req.body.tags?.includes(tag)) {
        tags.push(tag)
      }
    }
    form.tags = tags
  }

  // 不用mongoose內建，因為我編輯評價會改到，但只有發文者改資料才該更新
  form.update_at = Date.now()

  // 先忽略schema 的 cols
  // const columns = []
  // column.
  //   form.columns = 2
  req.article = article.category[0]
  req.form = form
  // return res.status(403).send({ success: false, message: '到這完成', result: form })
  next()
}

