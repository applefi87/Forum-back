// import file from '../classesOut.js'
// import boards from '../models/boards.js'
// import mongoose from 'mongoose'
// mongoose.connect("mongodb+srv://user:aaaaa55555@cluster0.bwqfbhd.mongodb.net/tt2")
// mongoose.set('sanitizeFilter', true)

// const out = file.map((c) => {
//   const data = {
//     "title": c.className,
//     "parent": "62f26cb065e7568850863720",
//     // 為了分離uniqueData
//     "colData": Object.keys(c).map((d) => {
//       if (d != "uniqueData" && d != "className") { return { [d]: c[d] } }
//     }).filter((exist) => exist),
//     "uniqueData": c.uniqueData,
//     // "intro": "各校選課評價",
//     "childBoard": {
//       "active": false,
//     }
//   }
//   return data
// })

// // console.log(out.slice(100,108))
// console.log(out[500]);
// await boards.create(out[500])