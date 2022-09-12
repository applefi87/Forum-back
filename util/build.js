import translate from '../translateForm/school.js'
import _ from 'lodash'
import fs from 'fs'
// 把中文key轉英文(統一)
import codeList from '../translateForm/school.js'

// 分組前，同一組的資料可以省去，用idx來控制(方便)，用陣列名來刪除(才穩定) (之後也可用介面調整)
// const dataCol = [1, 2, 6, 8, 9, 10, 11, 12]
// const dataKey = []
// for (let colNum in dataCol) {
//   dataKey.push(translate[dataCol[colNum]][1])
// }

// 剛改可變化檢查:
// 傳出即為cx
// 值是0 不影響判斷
// 地點時間要先拆分加工，時間自行先改"周,節"
export default function (csv, rule) {
  // const dataKey = ["department", 'classCode', "english", "className", "classNameEng", 'score', "required", "teacher", "semester"]
  const dataList = rule.dataList
  const uniqueList = rule.uniqueList
  const toCode = csv?.map(obj => {
    const ok = {}
    for (let i = 0; i < translate.length; i++) {
      // 不能用空，方便我辨識第幾陣列，不然第幾陣列會跑掉
      if (obj[translate[i][zhTW]] != undefined) {
        ok[translate[i][c]] = obj[translate[i][zhTW]]
      }
    }
    return ok
  })
  fs.writeFileSync('toCode.json', JSON.stringify(toCode))
  return toCode
}

// *****


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


