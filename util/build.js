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
  // // console.log(csv);
  // csv2json

  // csv.replace(xxx) ，因為csv可能是'\r'、'\n'換行，測試到有'\r\n'換行，而且結尾是'/n'會出錯,所以統一確保加工
  await converter.csv2jsonAsync(csv.replace(/\r\n/g, '\n').replace(/\r/g, ''), {
    delimiter: {
      // wrap: '"', 
      // eol: '\r\n'
    }
  }).then(
    (arr) => {
      // // console.log(arr)
      // 預加工母版定義要Boolean/數字等無法直接用csv檔建立的資料(由於我判斷用_.isEqual,物件/陣列無法比較，先用字串留著)
      const preFormatCols = {}
      rule.cols.forEach(it => {
        if (it.t === 0 || it.t === 1 || it.t === 2 || it.t === 3) {
          preFormatCols[it.c] = it.t
        }
      })
      // 把部分欄位轉換成特定格式，並且轉換成英文的key值
      toCode = arr?.map(obj => {
        const ok = {}
        for (let k of Object.keys(translate)) {
          // 欄位是空的/根本沒有就不填入 不然0要照樣填入
          if (obj[translate[k]['zhTW']] !== "" && obj[translate[k]['zhTW']] !== undefined) {
            if (preFormatCols[k] !== undefined) {
              const t = obj[translate[k]['zhTW']]
              switch (preFormatCols[k]) {
                case 1:
                case 2: {
                  ok[k] = obj[translate[k]['zhTW']].toString()
                  break;
                }
                case 0: {
                  if (t === "有" || t === "是" || t === "yes" || t === "true" || t === 'TRUE' || t === true) {
                    ok[k] = true
                  } else if (t === "無" || t === "否" || t === "no" || t === "false" || t === "FALSE" || t === false) {
                    ok[k] = false
                  }
                  break;
                }
                case 3: {
                  const number = Number(obj[translate[k]['zhTW']])
                  if (!isNaN(number)) ok[k] = number
                  break;
                }
              }
            } else {
              ok[k] = obj[translate[k]['zhTW']]
            }
          }
        }
        return ok
      })
    }
  ).catch((err) => {
    // console.log('ERROR: ' + err.message)
    return res.status(400).send({ success: false, message: '轉檔錯誤' })
  }
  );
  // // console.log(toCode);
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


