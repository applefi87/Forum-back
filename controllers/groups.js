import groups from '../models/groups.js'

export const addGroup = async (req, res) => {
  try {
    const result = await groups.create(req.body)
    res.status(200).send({ success: true, message: '', result })
  } catch (error) {
    return res.status(400).send({ success: false, error })
  }
}