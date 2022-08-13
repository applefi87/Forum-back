import boards from '../models/boards.js'

export const createBoard = async (req, res) => {
  try {
    // 為了最高效率處理過濾的filter清單，而上傳資料似乎不會立刻index排序抓取
    // 所以先抓之前的選取清單，再把新加入的新的加進去並更新
    const pFilter = req.parent.childBoard.rule.display.filter
    let filterList = new Set(pFilter.dataCol.c0)
    let repeat = new Set()
    const result = await boards.create(req.boardList)
    console.log('ok');
    result.forEach(board => {
      // 取出所有欄位的資料
      const item = board.colData.c0
      filterList.has(item) ? repeat.add(item) : filterList.add(item);
    })
    // 把取出來不重複清單存回去
    pFilter.dataCol.c0 = [...filterList]
    const up = await req.parent.save()
    console.log(up.childBoard.rule.display.filter.dataCol.c0);
    res.status(200).send({ success: true, message: '', result: up })
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

    const childBoards = boards.find({ parent: req.params.id, 'colData.c0': req.filter })
    res.status(200).send({ success: true, message: '', result: childBoards })
  } catch (error) {
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
