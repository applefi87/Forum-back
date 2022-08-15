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
  try {
    // 只拿會在母版table顯示/用來排序的欄位 就好
    console.log("進Controller");
    const childBoards = await boards.find(req.condition, "title beScored colData")
    res.status(200).send({ success: true, message: '', result: childBoards })
    console.log("end");
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
