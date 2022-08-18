import boards from '../models/boards.js'

export const createBoard = async (req, res) => {
  try {
    // 這裡clg很多因為要測哪裡跑最久 就是上傳mongoDB最久
    console.log("in Controller createBoard");
    const result = await boards.create(req.boardList)
    console.log("boards created");
    // 抓之前的filter清單，再把新加入的加進去更新，省效能
    const pFilter = req.parent.childBoard.rule.display.filter
    let filterList = new Set(pFilter.dataCol.c0)
    let repeat = new Set()
    result.forEach(board => {
      // 取出所有欄位的資料
      const item = board.colData.c0
      filterList.has(item) ? repeat.add(item) : filterList.add(item);
    })
    // 把取出來不重複清單存回去
    pFilter.dataCol.c0 = [...filterList]
    console.log("完成filter清單");
    // 要這樣通知才能更新mixed
    req.parent.markModified('childBoard.rule.display.filter.dataCol')
    await req.parent.save()
    console.log("filter list updated");
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
export const createRoot = async (req, res) => {
  try {
    const result = await boards.create(req.body)
    res.status(200).send({ success: true, message: '', result })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: error.message })
    } else {
      res.status(500).send({ success: false, message: '伺服器錯誤', error })
    }
  }
}
export const getBoard = async (req, res) => {
  console.log('in controller');
  // console.log(req.board);
  try {
    res.status(200).send({ success: true, message: '', result: req.board })
    console.log("end");
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}
export const getChildBoards = async (req, res) => {
  console.log("進Controller");
  try {
    const filter = JSON.parse(decodeURI(req.query.test))
    console.log(filter);
    // 先處理過濾內容
    const condition = { parent: req.params.id }
    // 如果主要filter欄c0沒被宣告過，給預設(下方有宣告就會改false)
    let defaultFilter = true
    // 使用者有輸入內容直接去資料庫查詢即可(打錯就找不到)
    if (filter.filterData.length > 0) {
      filter.filterData.forEach(filter => {
        // 欄位要有字串非空值 + 要有過濾/全部 才算有效
        if (filter.col && typeof filter.col === "string" && (filter.text || filter.all)) {
          // 有宣告過，不用預設值
          if (filter.col === "c0") { defaultFilter = false }
          // 要有過濾 || 全部就不用篩
          if (!filter.all) { condition['colData.' + filter.col] = filter.text }
        }
      })
    }
    // 沒宣告過加上默認過濾
    if (defaultFilter) {
      condition['colData.' + "c0"] = req.board.childBoard.rule.display.filter.dataCol.c0[0]
    }
    // 同 輪到unique的欄位 
    if (filter.filterUnique?.length > 0) {
      filter.filterUnique.forEach(filter => {
        if (filter.col && typeof filter.col === "string" && (filter.text || filter.all)) {
          if (!filter.all) {
            condition['uniqueData.' + filter.col] = filter.text
          }
        }
      })
    }
    // 目前讓前台去比對，先拔除
    // 同 輪到search的欄位(目前只一個，保留彈性用array包)
    // 沒有search.all
    // if (filter.search?.length > 0) {
    //   filter.search.forEach(search => {
    //     if (search.col && typeof search.col === "string" && search.text) {
    //       condition['colData.' + search.col] = RegExp(search.text, "i")
    //     }
    //   })
    // }
    // 只拿會在母版table顯示/用來排序的欄位 就好
    console.log(condition);
    const childBoards = await boards.find(condition, "title beScored colData")
    res.status(200).send({ success: true, message: '', result: childBoards })
    console.log("end");
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const getPart = async (req, res) => {
  console.log('in controller getPart');
  // console.log(req.board);
  try {
    // const Boards = await boards.find({ parent: '62fc99277f3adbe07e542a58' }, "title")
    // console.log(Boards);
    // const out = Boards.slice(0, 100).map((it) => { return it._id.toString() })
    // console.log(out);
    const boardList = [
      '62fc99327f3adbe07e542a5c',
      '62fcd32725545d5ca0362eeb',
      '62fc99327f3adbe07e542a5e',
      // '62fc99327f3adbe07e542a66',
      // '62fc99327f3adbe07e542a68',
      // '62fc99327f3adbe07e542a6a',
      // '62fc99327f3adbe07e542a6c',
      // '62fc99327f3adbe07e542a6e',
      // '62fc99327f3adbe07e542a70',
      // '62fc99327f3adbe07e542a72',
      // '62fc99327f3adbe07e542a74',
      // '62fc99327f3adbe07e542a76',
      // '62fc99327f3adbe07e542a78',
      // '62fc99327f3adbe07e542a7a',
      // '62fc99327f3adbe07e542a7c',
      // '62fc99327f3adbe07e542a82',
      // '62fc99327f3adbe07e542a84',
      // '62fc99327f3adbe07e542a64',
      // '62fc99327f3adbe07e542a62',
      // '62fc99327f3adbe07e542a88',
      // '62fc99327f3adbe07e542a86',
      // '62fc99327f3adbe07e542a8c',
      // '62fc99327f3adbe07e542a8a',
      // '62fc99327f3adbe07e542a8e',
      // '62fc99327f3adbe07e542a90',
      // '62fc99327f3adbe07e542a92',
      // '62fc99327f3adbe07e542a94',
      // '62fc99327f3adbe07e542a96',
      // '62fc99327f3adbe07e542a98',
      // '62fc99327f3adbe07e542a9a',
      // '62fc99327f3adbe07e542a9c',
      // '62fc99327f3adbe07e542a9e',
      // '62fc99327f3adbe07e542aa0',
      // '62fc99327f3adbe07e542aa2',
      // '62fc99327f3adbe07e542aa4',
      // '62fc99327f3adbe07e542aa8',
      // '62fc99327f3adbe07e542a7e',
      // '62fc99327f3adbe07e542aaa',
      // '62fc99327f3adbe07e542aac',
      // '62fc99327f3adbe07e542ab0',
      // '62fc99327f3adbe07e542a80',
      // '62fc99327f3adbe07e542ab2',
      // '62fc99327f3adbe07e542aba',
      // '62fc99327f3adbe07e542ab6',
      // '62fc99327f3adbe07e542ab4',
      // '62fc99327f3adbe07e542abc',
      // '62fc99327f3adbe07e542abe',
      // '62fc99327f3adbe07e542ab8',
      // '62fc99327f3adbe07e542ac0',
      // '62fc99327f3adbe07e542ac2',
      // '62fc99327f3adbe07e542ac4',
      // '62fc99327f3adbe07e542ac6',
      // '62fc99327f3adbe07e542ac8',
      // '62fc99327f3adbe07e542aca',
      // '62fc99327f3adbe07e542acc',
      // '62fc99327f3adbe07e542ace',
      // '62fc99327f3adbe07e542ad0',
      // '62fc99327f3adbe07e542ad2',
      // '62fc99327f3adbe07e542ad4',
      // '62fc99327f3adbe07e542ad6',
      // '62fc99327f3adbe07e542ada',
      // '62fc99327f3adbe07e542ad8',
      // '62fc99327f3adbe07e542adc',
      // '62fc99327f3adbe07e542ade',
      // '62fc99327f3adbe07e542ae0',
      // '62fc99327f3adbe07e542ae2',
      // '62fc99327f3adbe07e542ae4',
      // '62fc99327f3adbe07e542ae6',
      // '62fc99327f3adbe07e542ae8',
      // '62fc99327f3adbe07e542aa6',
      // '62fc99327f3adbe07e542aec',
      // '62fc99327f3adbe07e542aee',
      // '62fc99327f3adbe07e542af2',
      // '62fc99327f3adbe07e542aae',
      // '62fc99327f3adbe07e542af4',
      // '62fc99327f3adbe07e542af6',
      // '62fc99327f3adbe07e542af8',
      // '62fc99327f3adbe07e542afa',
      // '62fc99327f3adbe07e542afc',
      // '62fc99327f3adbe07e542afe',
      // '62fc99327f3adbe07e542b00',
      // '62fc99327f3adbe07e542b06',
      // '62fc99327f3adbe07e542b04',
      // '62fc99327f3adbe07e542b14',
      // '62fc99327f3adbe07e542b16',
      // '62fc99327f3adbe07e542b08',
      // '62fc99327f3adbe07e542b0e',
      // '62fc99327f3adbe07e542b0c',
      // '62fc99327f3adbe07e542b10',
      // '62fc99327f3adbe07e542b02',
      // '62fc99327f3adbe07e542b0a',
      // '62fc99327f3adbe07e542b12',
      // '62fc99327f3adbe07e542b18',
      // '62fc99327f3adbe07e542b1c',
      // '62fc99327f3adbe07e542b1a',
      // '62fc99327f3adbe07e542b1e',
      // '62fc99327f3adbe07e542b20',
      // '62fc99327f3adbe07e542b22',
      // '62fc99327f3adbe07e542b24',
      // '62fc99327f3adbe07e542b28'
    ]
    const Boards = await boards.find({ _id: boardList }, "title")
    res.status(200).send({ success: true, message: '', result: Boards })
    console.log("end");
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}
