import articles from '../models/articles.js'
import boards from '../models/boards.js'
import _ from 'lodash'

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
      })
    // 有文章?---把發文者與留言者要匿名的暱稱+id移除
    if (articleList.lenth < 1) return res.status(403).send({ success: true, message: '' })
    const out = articleList.map(a => {
      // 要轉物件才會正常,不然有時delete 等等就是不一樣
      const article = a.toObject()
      // 有留言?---把發文者與留言者要匿名的暱稱+id移除
      if (article.msg1?.amount) {
        const cleanMsg1List = article.msg1.list.map(m => {
          const msg = _.cloneDeep(m)
          // 發文者看自己文章，名稱變成"你"
          // 先存著攻下方辨識就能清空了
          const msgUserId = msg.user._id.toString()
          if (msg.privacy === 0) {
            delete msg.user._id
            msg.user.nickName = null
          }
          if ((msgUserId === article.user._id.toString())) {
            // 避免意外，文章設匿名再刪一次
            if (article.privacy === 0) delete msg.user._id
            // 看發文者在留言區，他的名稱變 "樓主"
            msg.user.nickName = 'originalPoster'
          }
          if (msgUserId === req._id) msg.user.nickName = 'you'
          return msg
        })
        delete article.msg1.list
        article.msg1.list = cleanMsg1List
      }
      // 發文者看自己文章，名稱變成"你"
      if (article.user._id.toString() === req._id) {
        article.user.nickName = 'you'
      }
      else if (article.privacy == 0) {
        article.user._id = undefined
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
    const newArticle = await article.save()
    res.status(200).send({ success: true, message: { title: 'published' }, result: newArticle })
  } catch (error) {
    console.log(error);
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: { title: 'ValidationError', text: error.message } })
    } else {
      res.status(500).send({ success: false, message: { title: error } })
    }
    console.log(error);
  }
}

export const getArticle = async (req, res) => {
  console.log('in controller');
  try {
    const article = await articles.findById(req.params.id)
    if (!article) return res.status(403).send({ success: false, message: '查無此評價' })
    res.status(200).send({ success: true, message: '', result: article })
  } catch (error) {
    console.log(error);
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: { title: 'ValidationError', text: error.message } })
    } else {
      res.status(500).send({ success: false, message: { title: error } })
    }
    console.log(error);
  }
}