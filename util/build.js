import csv from './original.js'
// import group from '../group.js'
import _ from 'lodash'
import fs from 'fs'

// 把中文key轉英文(統一)
const translate = [
  ["開課序號", 'serialCode'],
  ["開課代碼", 'classCode'],
  ["系所", "department"],
  ["組", "team"],
  ["年", "grade"],
  ["班", "class"],
  ["全英語", "english"],
  ["限性別", "gender"],
  // 
  ["中文課程名稱", "className"],
  ["英文課程名稱", "classNameEng"],
  ["學分", 'score'],
  ["必/選", "required"],
  ["教師", "teacher"],
  // 
  ["地點時間", "timeLocation"],
  // 並非必要但可能引誤會 先刪除限修人數
  ["限修條件", "condition"],
  ["備註", "others"]]

// 分組前，同一組的資料可以省去，用idx來控制(方便)，用陣列名來刪除(才穩定) (之後也可直接全手打)
const dataCol = [1, 2, 6, 8, 9, 10, 11, 12]
const dataKey = []
for (let colNum in dataCol) {
  dataKey.push(translate[dataCol[colNum]][1])
}

const toEnglish = csv.map(obj => {
  const ok = {}
  for (let i = 0; i < translate.length; i++) {
    // 不能用空，因為方便我辨識第幾陣列，不然第幾陣列會跑掉
    // if (obj[translate[i][0]] != undefined) {
    if (obj[translate[i][0]]) {
      if (translate[i][0] !== "地點時間") {
        ok[translate[i][1]] = obj[translate[i][0]]
      } else {
        //拆分時間地點(部分單獨的沒有的就不存) 
        const data = obj[translate[i][0]].split(" ")
        ok["time"] = data[1] ? [data[0], data[1]] : [data[0]]
        if (data[2]) { ok["location"] = data[2] }
      }
    }
  }
  return ok
})

// 開始分組
var group = _.mapValues(_.groupBy(toEnglish, (obj) => {
  return obj.serialCode + "kk" + obj.teacher
}),
  clist => clist.map(obj => _.omit(obj, dataKey)));
// fs.writeFileSync('group.json', JSON.stringify(group))

// *************
// 輸出頁面的
// 從每個課程的key開始回找
const classesOut = Object.keys(group).map((key) => {
  const idx = toEnglish.findIndex((obj) => (obj.serialCode + "kk" + obj.teacher) === key)
  // 取得在原檔的完整清單
  const o = JSON.parse(JSON.stringify(toEnglish[idx]))
  // 移除Unique的欄位
  const allKey = Object.keys(o)
  for (let i = 0; i < allKey.length; i++) {
    if (!(dataKey.find(key => key == allKey[i]))) {
      // console.log(allKey[i]);
      delete o[allKey[i]]
    }
  }
  return { ...o, unique: group[key] }
})

fs.writeFileSync('classesOut.json', JSON.stringify(classesOut))


// *****
// fs.writeFileSync('group.json', JSON.stringify(group))

// 用來檢查不重複位是否合理/需要新增(ex:發現班也是unique)
// const o = []
// const keyArray = Object.keys(group)
// for (let i in keyArray) {
//   if (group[keyArray[i]].length > 1) {
//     o.push(group[keyArray[i]])
//   }
// }
// *****
// fs.writeFileSync('out.json', JSON.stringify(o))

// 把原本簡單欄位補回去


