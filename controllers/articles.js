import articles from '../models/articles.js'
import boards from '../models/boards.js'


export const createArticle = async (req, res) => {
  try {
    const result = await articles.create(req.form)
    // 如果是評分版，成功後呼叫板塊更新評分
    if (req.body.category === 1) {
      const board = await boards.findById(req.params.id)
      if (!board) { res.status(403).send({ success: false, message: '找不到該版' }) }
      // 之前沒有就產生對應object 不預設有是減少資料負擔      
      if (!(board.beScored?.list?.length > 0)) {
        board.beScored = { score: 0, amount: 0, list: [] }
      }
      board.beScored.list.push({ from: req.user.id, score: req.body.score })
      board.beScored.amount = board.beScored.list.length
      let sumScore = board.beScored.list.reduce((sum, it) => sum + it.score, 0)
      board.beScored.score = sumScore / board.beScored.amount
      const out = await board.save()
    }
    res.status(200).send({ success: true, message: '', result })
  } catch (error) {
    console.log(error);
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: error.message })
    } else {
      res.status(500).send({ success: false, message: '伺服器錯誤', error })
    }
  }
}

export const getArticles = async (req, res) => {
  try {
    console.log('in controller');
    // 直接用populate 秒殺
    const articleList = await articles.find({ board: req.params.id }).
      populate({
        path: 'user',
        select: "nickName score info.gender"
      })
    if (articleList.lenth < 1) return res.status(403).send({ success: true, message: '沒文章' })
    const out = articleList.map(a => {
      const o = JSON.parse(JSON.stringify(a))
      if (o.privacy == 0) {
        // 先預備id是否可點擊，之後變連結
        delete o.user._id
        o.user.nickName = 'anonymous'
      }
      return o
    })
    console.log('end');
    res.status(200).send({ success: true, message: '', result: out })
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

// export const getAllProducts = async (req, res) => {
//   try {
//     const result = await products.find()
//     res.status(200).send({ success: true, message: '', result })
//   } catch (error) {
//     res.status(500).send({ success: false, message: '伺服器錯誤' })
//   }
// }

// export const getProduct = async (req, res) => {
//   try {
//     const result = await products.findById(req.params.id)
//     res.status(200).send({ success: true, message: '', result })
//   } catch (error) {
//     res.status(500).send({ success: false, message: '伺服器錯誤' })
//   }
// }

// export const editProduct = async (req, res) => {
//   try {
//     const data = {
//       name: req.body.name,
//       price: req.body.price,
//       description: req.body.description,
//       sell: req.body.sell,
//       category: req.body.category
//     }
//     if (req.file) data.image = req.file.path
//     const result = await products.findByIdAndUpdate(req.params.id, data, { new: true })
//     res.status(200).send({ success: true, message: '', result })
//   } catch (error) {
//     if (error.name === 'ValidationError') {
//       const key = Object.keys(error.errors)[0]
//       const message = error.errors[key].message
//       return res.status(400).send({ success: false, message })
//     } else {
//       res.status(500).send({ success: false, message: '伺服器錯誤' })
//     }
//   }
// }
