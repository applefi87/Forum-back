import boards from '../models/boards.js'

export const createBoard = async (req, res) => {
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

// export const getProducts = async (req, res) => {
//   try {
//     const result = await products.find({ sell: true })
//     res.status(200).send({ success: true, message: '', result })
//   } catch (error) {
//     res.status(500).send({ success: false, message: '伺服器錯誤' })
//   }
// }

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
