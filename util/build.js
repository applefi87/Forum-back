import _ from 'lodash'
import fs from 'fs'
import converter from 'json-2-csv'
// 把中文key轉英文(統一)
// 剛改可變化檢查:
// 傳出即為cx
// 值是0 不影響判斷
// 地點時間要先拆分加工，時間自行先改"周,節"

export default async function (csv, rule) {
  const translate = rule.transformTable
  let toCode
  // csv2json
  await converter.csv2jsonAsync(csv, {
    delimiter: {
      // wrap: '"', 
      eol: '\n'
    }
  }).then(
    (arr) => {
      toCode = arr?.map(obj => {
        const ok = {}
        for (let i = 0; i < translate.length; i++) {
          // 欄位是空的/根本沒有就不填入 不然0要照樣填入
          if (obj[translate[i]['zhTW']] !== "" && obj[translate[i]['zhTW']] !== undefined) {
            ok[translate[i]['c']] = obj[translate[i]['zhTW']]
          }
        }
        return ok
      })
    }
  ).catch((err) => {
    console.log('ERROR: ' + err.message)
    return res.status(400).send({ success: false, message: '轉檔錯誤' })
  }
  );
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


