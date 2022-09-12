import _ from 'lodash'
import fs from 'fs'
import converter from 'json-2-csv'
// 把中文key轉英文(統一)

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
  const translate = rule.transformTable
  let toCode
  // csv2json
  converter.csv2json(
    csv,
    (err, json) => {
      try {
        if (err) throw err
        // 把json檔key轉成代碼
        toCode = json?.map(obj => {
          const ok = {}
          for (let i = 0; i < translate.length; i++) {
            // 欄位是空的/根本沒有就不填入 不然0要照樣填入
            if (obj[translate[i]['zhTW']] !== "" && obj[translate[i]['zhTW']] !== undefined) {
              ok[translate[i]['c']] = obj[translate[i]['zhTW']]
            }
          }
          return ok
        })
        // fs.writeFileSync('toCode.json', JSON.stringify(toCode))
      } catch (error) {
        console.log(error)
        return res.status(400).send({ success: false, message: '轉檔錯誤' })
      }
    },
    // 要提示換行單位、包裹String符號(目前不用 但之後可能會遇到先留著)
    {
      delimiter: {
        // wrap: '"', 
        eol: '\n'
      }
    }
  )
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


