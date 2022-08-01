import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: Number, required: true, unique: true },
  users: {type: [String]}
}, { versionKey: false })


export default mongoose.model('group', schema)
