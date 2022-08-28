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
        select: "nickName score info.gender record.toBoard.score record.toBoard.amount record.toBoard.scoreChart msg1"
      }).
      populate({
        path: 'msg1.list.user',
        select: 'nickName '
        // Get friends of friends - populate the 'friends' array for every friend
        // populate: { path: 'friends' }
      });
    if (articleList.lenth < 1) return res.status(403).send({ success: true, message: '' })
    const out = articleList.map(article => {
      // 有留言，把發文者與留言者要匿名的暱稱+id移除
      if (article.msg1?.amount) {
        const cleanMsg1List = article.msg1.list.map(msg => {
          console.log('here');
          console.log(article.user._id + ":" + req.user);
          if (false) {
            // article.user._id === req.user._id
            msg.user.nickName = 'yourself'
          } else {
            // 有留言，把發文者與留言者要匿名的暱稱移除
            if ((msg.user._id === article.user._id)) {
              if (article.privacy === 0) delete msg.user._id
              // 統一發文者叫 "發文者"
              msg.user.nickName = 'originalPoster'
            } else if (msg.privacy === 0) {
              delete msg.user._id
              msg.user.nickName = null
            }
          }
          return msg
        })
        delete article.msg1.list
        article.msg1.list = cleanMsg1List
        article.user.nickName = null
      }
      if (article.privacy == 0) {
        // 先預備id是否可點擊，之後變連結
        delete article.user._id
        article.user.nickName = null
      }
      return article
    })
    console.log('end');
    res.status(200).send({ success: true, message: '', result: out })
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: 'ServerError' })
  }
}

export const createMsg = async (req, res) => {
  try {
    const article = await articles.findById(req.params.id)
    if (!article) return res.status(403).send({ success: false, message: '留言異常，查無此評價' })
    // 找到後加留言
    if (!(article.msg1?.amount)) article.msg1 = { amount: 0, nowId: 0, list: [] }
    article.msg1.amount++
    article.msg1.nowId++
    // beScored:  msg2先忽略
    article.msg1.list.push({
      id: article.msg1.nowId, user: req.user._id, privacy: req.body.privacy, lastEditDate: Date.now(), content: req.body.content
    })
    article.save()
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