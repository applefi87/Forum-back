import group from '../group.js'
import _ from 'lodash'
import fs from 'fs'

const translate = [
  ["開課序號", 'classCodeTTT'],
  ["開課代碼", 'classUniqueCodeTTT'],
  ["系所", "departmentTTT"],
  ["組", "teamTTT"],
  ["年", "gradeTTT"],
  ["班", "classTTT"],
  ["全英語", "EnglishTTT"],
  ["限性別", "genderTTT"],
  ["中文課程名稱", "classNameTTT"],
  ["英文課程名稱", "classNemaEngTTT"],
  ["學分", 'scoreTTT'],
  ["必/選", "mustTTT"],
  ["全/半", "FullOrHalfTTT"],
  ["教師", "teacherTTT"],
  ["地點時間", "timeLocationTTT"],
  ["限修人數", 'NumberTTT'],
  ["限修條件", "conditionTTT"],
  ["備註", "othersTTT"]]

const dataCol = [1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 16, 17]
// const array = () => {
//   const out = []
//   for (let colNum in dataCol) {
//     out.push(translate[colNum][1])
//   }
//   return out
// }

const o = { l: [] }
const keyArray = Object.keys(group)
for (let i in keyArray) {
  if (group[keyArray[i]].length > 1) {
    o.l.push(group[keyArray[i]])
  }
}
fs.writeFileSync('out.json', JSON.stringify(o))

// const sliced = JSON.parse(group)
// console.log(sliced);

// fs.writeFileSync('sliced.json', JSON.stringify(sliced))
