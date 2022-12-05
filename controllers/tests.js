import articles from '../models/articles.js'
import boards from '../models/boards.js'


export const usersPostBoards = async (req, res) => {
  try {
    const text = {
      "board": "6306b6629944977060b181ba",
      "user": "62f7b8dfa85f9035bad4159a",
      "privacy": 0,
      "uniqueId": "6306b6be32afedd39b9fa2f4",
      "category": 1,
      "title": "wdaaaaaaaaaaaaa",
      "content": "<p>wwwwww5555555555555555wwwwwwwwww</p>",
      "score": 5,
      "tags": [],
      "update_at": 1661427199247
    }
    const result = await articles.create()

    // 如果是評分版，成功後呼叫板塊更新評分
    if (req.body.category === 1) {
      const board = await boards.findById(req.params.id)
      if (!board) { res.status(403).send({ success: false, message: '找不到該版' }) }
      // 之前沒有就產生新beScored物件  不預設放空值是減少資料負擔      
      if (!(board.beScored?.list?.length > 0)) {
        board.beScored = { score: 0, amount: 0, list: [] }
      }
      board.beScored.list.push({ from: result.id, score: req.body.score })

      board.beScored.score = Math.ceil((board.beScored.amount * board.beScored.score + req.body.score) / (board.beScored.amount + 1))
      board.beScored.amount++
      await board.save()
      // 更新個人評分
      const toBoard = req.user.record?.toBoard
      toBoard?.list.push({ from: result.id, score: req.body.score })
      toBoard.score = Math.ceil((toBoard?.amount * toBoard?.score + req.body.score) / (toBoard?.amount + 1))
      toBoard.amount++
      const t = await req.user.save()
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

export const createUsers = async (req, res) => {
  // ********驗證密碼ㄈ
  try {
    // ***********新增管理員身要驗證
    // 不填預設1(使用者)
    const role = req.body.role ? req.body.role : 1
    // 如果是非使用者，要去驗證對應group是否有該使用者
    if (role != 1) {
      const success = await groups.findOne({ code: role, users: req.body.account })
      if (!success) {
        // 找不到就回應非法並結束
        res.status(400).send({ success: false, message: 'Wrong admin creatiion!' })
        console.log('Wrong admin creatiion!');
        return
      }
      console.log('creating admin!');
    }

    // ***********移除不該能新增的欄位
    ;['securityData', 'record', 'score'].forEach(e => delete req.body[e]);

    // *********新增 避免亂丟req.body(之後一定會用到)，所以先練習只列要的
    const input = {
      account: req.body.account,
      nickName: req.body.nickName,
      securityData: {
        role,
        schoolEmail: req.body.schoolEmail,
        password: bcrypt.hashSync(password, 8)
      },
      info: { gender: req.body.gender },
      // 必須初始化，不然發東西要更新時會找不到而報錯
      record: {
        toBoard: rateEmpty,
        toArticle: rateEmpty,
        articleScore: rateEmpty,
        msgScore: rateEmpty
      }
    }
    const result = JSON.parse(JSON.stringify(await users.create(input)))
    // 註冊完把email清單改已註冊
    const emailcheck = await emails.findOne({ email: req.mail.email })
    emailcheck.occupied = true
    emailcheck.user = result._id
    emailcheck.save()

      // 直接丟陣列記得前方要; 不然會出錯...
      ;['securityData', '_id'].forEach(e => delete result[e])
    // 註冊成功
    res.status(200).send({ success: true, message: { title: '註冊成功' }, result })
    console.log('create success!');
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: { title: error.message } })
    } else {
      console.log(error);
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}
