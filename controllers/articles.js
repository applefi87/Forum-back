import articles from '../models/articles.js'
import boards from '../models/boards.js'


export const createArticle = async (req, res) => {
  try {
    const result = await articles.create(req.form)
    // 如果是評分版，成功後呼叫板塊更新評分
    if (req.body.category === 1) {
      const board = await boards.findById(req.params.id)
      if (!board) return res.status(403).send({ success: false, message: { title: 'BoardNoFound' } })
      // 之前沒有就產生新beScored物件  不預設放空值是減少資料負擔      
      if (!(board.beScored?.list?.length > 0)) board.beScored = { score: 0, amount: 0, scoreChart: [0, 0, 0, 0, 0, 0], list: [] }
      board.beScored.list.push({ from: result.id, score: req.body.score })
      // 考量只是加陣列不太會出錯，最簡單算法拿之前的算
      // board.beScored.amount = board.beScored.list.length
      // let sumScore = board.beScored.list.reduce((sum, it) => sum + it.score, 0)
      // board.beScored.score = sumScore / board.beScored.amount
      board.beScored.score = Math.ceil((board.beScored.amount * board.beScored.score + req.body.score) / (board.beScored.amount + 1))
      board.beScored.amount++
      //對應0分 在陣列[0]+1 就能給chart.js讀取
      // 因應部分板塊用舊規則 有bescore 但沒scoreChart || == []
      if (!(board.beScored.scoreChart.length === 6)) {
        board.beScored.scoreChart = [0, 0, 0, 0, 0, 0]
      }
      board.beScored.scoreChart[req.body.score]++
      await board.save()
      // 更新個人評分
      const toBoard = req.user.record.toBoard
      toBoard.list.push({ from: result.id, score: req.body.score })
      toBoard.score = Math.ceil((toBoard.amount * toBoard.score + req.body.score) / (toBoard.amount + 1))
      toBoard.scoreChart[req.body.score]++
      toBoard.amount++
      await req.user.save()
    }
    res.status(200).send({ success: true, message: { title: 'published' } })
  } catch (error) {
    console.log(error);
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: { title: 'ValidationError', text: error.message } })
    } else {
      res.status(500).send({ success: false, message: { title: error } })
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
        select: "nickName score info.gender record.toBoard.score record.toBoard.scoreChart"
      })
    if (articleList.lenth < 1) return res.status(403).send({ success: true, message: '' })
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
    res.status(500).send({ success: false, message: 'ServerError' })
  }
}
