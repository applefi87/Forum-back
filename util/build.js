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
  // ********************
  // 只取出關鍵欄位來組合判斷是否相同，節省效能
  const createCombineString = (obj) => {
    let out
    for (let c in rule.combineCheckCols) {
      out += (obj[c] + "*")
    }
    return out
  }
  // 開始分組
  // 加工出
  var group = _.mapValues(
    // 產生同代碼老師 { '代碼+老師': [課程詳細內容清單], '6': [6.1, 6.3] }
    _.groupBy(toCode, (obj) => {
      return createCombineString(obj)
    }),
    clist => clist.map(obj => _.pick(obj, uniqueList)));
  // fs.writeFileSync('group.json', JSON.stringify(group))

  // *************
  // 輸出頁面的
  // 從每個課程的key開始回找
  const classesOut = Object.keys(group).map((key) => {
    const idx = toCode.findIndex((obj) => {
      return createCombineString(obj) === key
    }
    )
    // 取得在原檔的完整清單
    const o = JSON.parse(JSON.stringify(toCode[idx]))
    // 移除Unique的欄位
    const allKey = Object.keys(o)
    for (let i = 0; i < allKey.length; i++) {
      if (!(dataKey.find(key => key == allKey[i]))) {
        delete o[allKey[i]]
      }
    }
    return { ...o, uniqueData: group[key] }
  })
  // fs.writeFileSync('classesOut.json', JSON.stringify(classesOut))
  return classesOut
}



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


