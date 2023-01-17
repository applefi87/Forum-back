import articles from './models/articles.js'

import users from './models/users.js'
import fs from 'fs'
import mongoose from 'mongoose'


try {
  async function all() {
    // 取得有111-1的課
    const allList = await boards.find({})
    console.log("allList:"+allList.length);
    fs.writeFileSync("allList.json", JSON.stringify(allList))
  }
  //***1***/ 取得文章清單(含板)
  async function t1() {
    const articleList = await articles.find({}).populate({path: 'board'})
  fs.writeFileSync("articleList.json",  JSON.stringify(articleList))
  }
  // t1()

  //***2***/ 取得有111-1的課 並移除111-1的
  async function tt() {
    await all()
    // 取得有111-1的課
    const boardList = await boards.find({
      'uniqueData.c80': "111-1"
    })
    if (!boardList) return console.log("no data");
    console.log("boardList:" + boardList.length);
    // fs.writeFileSync("boardList.json", JSON.stringify(boardList))
    const clearSomeInBoardList = boardList.map(b => {
      // const result = JSON.parse(JSON.stringify(b))
      const result = b
      // result._id=mongoose.Types.ObjectId(result._id)
      result.uniqueData = b.uniqueData.filter(u => u.c80 != "111-1")
      return result
    })
    const updatedBoardList = clearSomeInBoardList.filter(bb => (bb?.uniqueData?.length > 0))
    const deleteBoardList = clearSomeInBoardList.filter(bb => !(bb?.uniqueData?.length > 0))
    console.log("clearSomeInBoardList:" + clearSomeInBoardList.length);
    console.log("updatedBoardList:" + updatedBoardList.length);
    console.log("deleteBoardList:" + deleteBoardList.length);
    fs.writeFileSync("clearSomeInBoardList.json", JSON.stringify(clearSomeInBoardList))
    fs.writeFileSync("updatedBoardList.json", JSON.stringify(updatedBoardList))
    fs.writeFileSync("deleteBoardList.json", JSON.stringify(deleteBoardList))
    await boards.bulkSave(updatedBoardList);
    await boards.deleteMany({ 'uniqueData.c80': "111-1" })
    // boards.bulkWrite();
    const newBoardList = await boards.find({
      'uniqueData.c80': "111-1"
    })
    fs.writeFileSync("newBoardList.json", JSON.stringify(newBoardList))
    console.log("end");
    await all()
    //***3***/ 取得有111-1的課 並移除111-1的
    //自行上傳


  }
  // tt()

} catch (error) {
  console.log(error);
}
