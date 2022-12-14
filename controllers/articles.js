import articles from '../models/articles.js'
import boards from '../models/boards.js'
import users from '../models/users.js'
import _ from 'lodash'
// **************小功能區
// 移除使用者設匿名後的暱稱/id,以及本人/版主的暱稱修改
// 保留字: 'originalPoster' 'you' 'admin' 
const sanitizeArticle = (req, articleIn) => {
  // 要轉物件才會正常,不然有時delete 等等就是不一樣
  const article = articleIn.toObject()
  // 有留言?---把發文者與留言者要匿名的暱稱+id移除
  if (article.msg1?.amount) {
    const cleanMsg1List = article.msg1.list.map(m => {
      const msg = _.cloneDeep(m)
      // 發文者看自己文章，名稱變成"你"
      // 避免使用者被刪除 找不到id...
      const msgUserId = msg.user?._id?.toString()
      if (!msgUserId) {
        // msg.user = { nickName: 'deleted' }
        return
      } else if (msgUserId === req._id) {
        msg.owner = true
        if (msg.privacy === 0) {
          msg.user.nickName = 'youHide'
        } else {
          msg.user.nickName = 'you'
        }
      } else if (msgUserId === article.user._id.toString()) {
        // 看發文者在留言區，他的名稱變 "樓主"
        msg.user.nickName = 'owner'
        // 避免意外，文章設匿名再刪一次
        if (article.privacy === 0) delete msg.user._id
      } else if (msg.privacy === 0) {
        delete msg.user._id
        msg.user.nickName = null
      }
      return msg
    }).filter(m => !!m?.user)
    delete article.msg1.list
    article.msg1.list = cleanMsg1List
  }
  // 發文者看自己文章，名稱變成"你"
  if (article.user._id.toString() === req._id) {
    article.user.nickName = 'you'
    article.owner = true
  }
  else if (article.privacy == 0) {
    article.user._id = undefined
    article.user.nickName = null
  }
  return article
}
// 因為刪除/ban文章 版的評分/使用者紀錄要移除
const removeReviewinfo = (article, board, user) => {
  // 更新板紀錄***
  board.beScored.scoreSum -= article.score
  board.beScored.amount--
  board.beScored.list.splice(board.beScored.list.findIndex(u => u.toString() === user._id.toString()), 1)
  //對應0分 在陣列[0]+1 就能給chart.js讀取
  board.beScored.scoreChart[article.score]--
  for (let i of article.tags) board.beScored.tags[i]--
  board.markModified('beScored.tags')
  // 刪除使用者發文紀錄***
  const toBoard = user.record.toBoard
  toBoard.list.splice(toBoard.list.findIndex(a => a.from.toString() === article._id.toString()), 1)
  toBoard.scoreSum -= article.score
  toBoard.amount--
  toBoard.scoreChart[article.score]--
}

// **************正式router區
export const createArticle = async (req, res) => {
  try {
    // 如果是評分版，成功後呼叫板塊更新評分
    const result = await articles.create(req.form)
    if (req.body.category === 1) {
      // 之前沒有就產生新beScored物件  不預設放空值是減少資料負擔      
      // board.beScored 因為是mogoose格式,所以沒設也有東西，才用.list去抓
      if (!req.board.beScored?.list) {
        // console.log('create bs');
        req.board.beScored = { scoreSum: 0, amount: 0, list: [] }
      }
      req.board.beScored.scoreSum += req.body.score
      req.board.beScored.amount++
      // 給過評分就加入清單(不可重複評)
      req.board.beScored.list.push(req.user._id)
      //對應0分 在陣列[0]+1 就能給chart.js讀取
      // 因應部分板塊用舊規則 有bescore 但沒scoreChart || == []
      if (!(req.board.beScored.scoreChart?.length === 6)) {
        req.board.beScored.scoreChart = [0, 0, 0, 0, 0, 0]
      }
      req.board.beScored.scoreChart[req.body.score]++
      if (!req.board.beScored.tags) req.board.beScored.tags = {}
      for (let i of req.form.tags) {
        if (req.board.beScored.tags[i] !== undefined) { req.board.beScored.tags[i]++ }
        else { req.board.beScored.tags[i] = 1 }
      }
      req.board.markModified('beScored.tags')
      await req.board.save()
      // 更新個人評分***
      const toBoard = req.user.record.toBoard
      toBoard.list.push({ from: result.id })
      toBoard.scoreSum += req.body.score
      toBoard.scoreChart[req.body.score]++
      toBoard.amount++
      await req.user.save()
    }
    console.log("create Article:" + req.user.nickName);
    res.status(200).send({ success: true, message: { title: 'published' } })
  } catch (error) {
    // console.log(error);
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: { title: '格式不符', text: error.message } })
    } else {
      res.status(500).send({ success: false, message: { title: error } })
    }
  }
}
export const editArticle = async (req, res) => {
  // console.log('in controller editArticle');
  try {
    await req.article.save()
    // 更新版評分/tags/使用者評分***(如果有更動的話)
    // 如果是評分版，成功後呼叫板塊更新評分
    if (req.article.category === 1) {
      if (req.isTagsChange || req.isScoreChange) {
        if (req.isScoreChange) {
          req.board.beScored.scoreSum += req.scoreChange[1] - req.scoreChange[0]
          //對應0分 在陣列[0]+1 就能給chart.js讀取
          req.board.beScored.scoreChart[req.scoreChange[0]]--
          req.board.beScored.scoreChart[req.scoreChange[1]]++
        }
        if (req.isTagsChange) {
          for (let i of req.tagsChange[0]) req.board.beScored.tags[i]--
          for (let i of req.tagsChange[1]) {
            if (req.board.beScored.tags[i] !== undefined) { req.board.beScored.tags[i]++ }
            else { req.board.beScored.tags[i] = 1 }
          }
          req.board.markModified('beScored.tags')
        }
        await req.board.save()
      }
      if (req.isScoreChange) {
        // 更新個人評分
        const toBoard = req.user.record.toBoard
        toBoard.list[toBoard.list.findIndex(a => a.from.toString() === req.article._id.toString())].score = req.scoreChange[1]
        toBoard.scoreSum += req.scoreChange[1] - req.scoreChange[0]
        toBoard.scoreChart[req.scoreChange[0]]--
        toBoard.scoreChart[req.scoreChange[1]]++
        await req.user.save()
      }
    }
    res.status(200).send({ success: true, message: { title: 'published' } })
  } catch (error) {
    // console.log(error);
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const deleteArticle = async (req, res) => {
  // console.log('in controller deleteArticle');
  try {
    // 評價需要改目標版資料，確認有找到板再刪
    let board
    if (req.article.category === 1) {
      board = await boards.findById(req.article.board)
      if (!board) return res.status(403).send({ success: false, message: { title: 'BoardNoFound' } })
    }
    // console.log('start del');
    await articles.deleteOne({ _id: req.article._id })
    // console.log('del ok');
    // 如果是評分版，成功後呼叫板塊移除評分
    // (不該合併到上面，避免文章沒刪成功就移除資訊)
    if (req.article.category === 1) {
      removeReviewinfo(req.article, board, req.user)
      await board.save()
      await req.user.save()
    }
    res.status(200).send({ success: true, message: { title: 'deleted' } })
  } catch (error) {
    // console.log(error);
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const banArticle = async (req, res) => {
  // console.log('in controller');
  try {
    const article = await articles.findById(req.params.id)
    if (!article) return res.status(403).send({ success: false, message: '查無此評價' })
    let board
    let user
    // 如果是評分版，有抓到板塊就移除紀錄(因為文章確定有資訊，儲存應不是問題)
    if (article.category === 1) {
      board = await boards.findById(article.board)
      if (!board) return res.status(403).send({ success: false, message: { title: 'BoardNoFound' } })
      user = await users.findById(article.user)
      if (!user) return res.status(403).send({ success: false, message: { title: 'UserNoFound' } })
      // 使用者banned的文章要備份到bannedList再移除並更新
      const toBoard = user.record.toBoard
      toBoard.bannedAmount++
      toBoard.bannedList.push(toBoard.list.find(a => a.from.toString() === article._id.toString()))
      removeReviewinfo(article, board, user)
      await board.save()
      await user.save()
    }
    article.state = 0
    const result = await article.save()
    res.status(200).send({ success: true, message: '', result })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: { title: 'ValidationError', text: error.message } })
    } else {
      res.status(500).send({ success: false, message: { title: error } })
    }
    // console.log(error);
  }
}

export const getArticles = async (req, res) => {
  try {
    // console.log('in controller');
    const articleList = await articles.find({ board: req.params.id }).
      populate({
        path: 'user',
        select: "nickName score info.gender record.toBoard.scoreSum record.toBoard.amount record.toBoard.scoreChart record.toBoard.bannedAmount msg1"
      }).
      populate({
        path: 'msg1.list.user',
        select: 'nickName '
      })
    // 有文章?---把發文者與留言者要匿名的暱稱+id移除
    if (articleList.lenth < 1) return res.status(403).send({ success: true, message: '' })
    const out = articleList.map(a => {
      return sanitizeArticle(req, a)
    }).filter(a => !!a.user)
    // console.log('end');
    res.status(200).send({ success: true, message: '', result: out })
  } catch (error) {
    // console.log(error);
    res.status(500).send({ success: false, message: 'ServerError' })
  }
}



// ******
export const createMsg = async (req, res) => {
  try {
    const article = await articles.findById(req.params.id).
      populate({
        path: 'msg1.list.user',
        select: 'nickName _id'
      })
    if (!article) return res.status(403).send({ success: false, message: '留言異常，查無此評價' })
    // 找到後加留言
    if (!(article.msg1?.amount)) article.msg1 = { amount: 0, nowId: 0, list: [] }
    article.msg1.amount++
    article.msg1.nowId++
    // beScored:  msg2先忽略
    article.msg1.list.push({
      id: article.msg1.nowId, user: req.user._id, privacy: req.body.privacy, lastEditDate: Date.now(), content: req.body.content
    })
    await article.save()
    // 偷工 存完不重抓，由於新增的缺nickname，直接前台設沒nickname就是'you'
    res.status(200).send({ success: true, message: { title: 'published' }, result: sanitizeArticle(req, article) })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: { title: 'ValidationError', text: error.message } })
    } else {
      res.status(500).send({ success: false, message: { title: error } })
    }
    // console.log(error);
  }
}

export const editMsg = async (req, res) => {
  // console.log('in controller editMsg');
  try {
    const msg1List = req.article.msg1.list
    const theMsg = msg1List[msg1List.findIndex(msg => msg.id === req.body.id)]
    // theMsg.privacy = req.body.privacy
    theMsg.content = req.body.content
    theMsg.lastEditDate = Date.now()
    // 偷工 抓資料就加工(預期存=取)
    // console.log('start update');
    await req.article.save()
    // console.log('updated');
    res.status(200).send({ success: true, message: { title: 'updated' } })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: { title: 'ValidationError', text: error.message } })
    } else {
      res.status(500).send({ success: false, message: { title: error } })
    }
    // console.log(error);
  }
}

export const deleteMsg = async (req, res) => {
  try {
    const msg1List = req.article.msg1.list
    msg1List.splice(msg1List.findIndex(msg => msg.id === req.body.id), 1)
    // 找到後加留言
    req.article.msg1.amount--
    // console.log('saving del result in C');
    await req.article.save()
    // 之後留言有評分功能要補上下方使用者紀錄
    // 刪除使用者發文紀錄
    // 如果是評分版，成功後呼叫板塊移除評分
    // if (req.article.category === 1) {
    //   // 更新板紀錄
    //   board.beScored.scoreSum -= req.article.score
    //   board.beScored.amount--
    //   //對應0分 在陣列[0]+1 就能給chart.js讀取
    //   board.beScored.scoreChart[req.article.score]--
    //   for (let i of req.article.tags) board.beScored.tags[i]--
    //   board.markModified('beScored.tags')
    //   await board.save()
    //   // 更新使用者紀錄
    //   toBoard.scoreSum -= req.article.score
    //   toBoard.amount--
    //   toBoard.scoreChart[req.article.score]--
    // }
    // console.log('del ok');
    res.status(200).send({ success: true, message: { title: 'deleted' } })
  } catch (error) {
    // console.log(error);
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}


export const banMsg = async (req, res) => {
  // console.log('in controller banMsg');
  try {
    const article = await articles.findById(req.params.id)
    if (!article) return res.status(403).send({ success: false, message: '查無此文章' })
    const msg1List = article.msg1.list
    const theMsg = msg1List[msg1List.findIndex(msg => msg.id === req.body.id)]
    // theMsg.privacy = req.body.privacy
    theMsg.state = 0
    // 偷工 抓資料就加工(預期存=取)
    // console.log('start ban');
    await article.save()
    // console.log('banned');
    res.status(200).send({ success: true, message: { title: 'banned' } })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: { title: 'ValidationError', text: error.message } })
    } else {
      res.status(500).send({ success: false, message: { title: error } })
    }
    // console.log(error);
  }
}
export const getArticle = async (req, res) => {
  // console.log('in controller');
  try {
    const article = await articles.findById(req.params.id)
    if (!article) return res.status(403).send({ success: false, message: '查無此評價' })
    res.status(200).send({ success: true, message: '', result: article })
  } catch (error) {
    // console.log(error);
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: { title: 'ValidationError', text: error.message } })
    } else {
      res.status(500).send({ success: false, message: { title: error } })
    }
  }
}