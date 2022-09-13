import buildFile from '../util/build.js'
import boards from '../models/boards.js'
import _ from 'lodash'
import fs from 'fs'
// !!!
// 須確保判斷重複的欄位
// 加入的csv要檢查:必填的意外沒值是否有改預設(目前有d可以預設填東西，之後再評估要程式/csv處理)
//  預設建新板沒有子板/文章 要之後再改
// -----------
// 功能介紹: 確認有母版再新增子板>把傳來的子板CSV轉json>轉代碼版json>
// 抓取現有的子板，比對是新的再更新加入
// -區分之前有的跟新的
// -
// -
// -


// // 開始分組
// // 加工出
// var group = _.mapValues(
//   // 產生同代碼老師 { '代碼+老師': [課程詳細內容清單], '6': [6.1, 6.3] }
//   _.groupBy(row2Col, (obj) => {
//     return combineDataString(obj)
//   }),
//   clist => clist.map(obj => _.pick(obj, uniqueList)));
// // fs.writeFileSync('group.json', JSON.stringify(group))
// // ********************
// // 輸出頁面的
// // 從每個課程的key開始回找
// const classesOut = Object.keys(group).map((key) => {
//   const idx = row2Col.findIndex((obj) => {
//     return combineDataString(obj) === key
//   }
//   )
//   // 取得在原檔的完整清單
//   const o = JSON.parse(JSON.stringify(row2Col[idx]))
//   // 移除Unique的欄位
//   const allKey = Object.keys(o)
//   for (let i = 0; i < allKey.length; i++) {
//     if (!(dataList.find(key => key == allKey[i]))) {
//       delete o[allKey[i]]
//     }
//   }
//   return { ...o, uniqueData: group[key] }
// })
// fs.writeFileSync('classesOut.json', JSON.stringify(classesOut))
// ---------------------------------------------


// 代碼表示: 1單行文字 2多行文字 3數字  5單選 6多選 0Boolean 
// isMatchWith
export default async (req, res, next) => {
  try {
    // *****************確認有母版再新增子板
    const parent = await boards.findById(req.params.id)
    if (!parent) return res.status(403).send({ success: false, message: '找無該母版' })
    console.log("get parent");
    //  *****************把傳來的子板CSV轉json+轉代碼版json
    const file = await buildFile(req.body.csv, parent.childBoard.rule)
    // ******************抓取現有的子板，比對是新的再更新加入
    // 留一些計數的，確認運算沒錯
    let count = 0
    let same = 0
    let combineUpdate = 0
    let combineNew = 0
    const rule = parent.childBoard.rule
    const pDataCol = rule.cols.filter((it) => rule.dataList.includes(it.c))
    const pUniqueCol = rule.cols.filter((it) => !rule.dataList.includes(it.c))
    console.log(pUniqueCol);
    // return res.status(403).send({ success: false, message: '測試完成' })
    //*****區分之前有的跟新的
    // 只拿欄位就夠區分了
    const childBoards = await boards.find({ parent: req.params.id }, "colData uniqueData")
    console.log("childBoards:" + childBoards.length);
    const updateList = []
    const newList = []
    // *****************************************
    // 只取出關鍵欄位來組合判斷是否相同，節省效能
    const combineDataString = (obj) => {
      let out
      for (let c of rule.combineCheckCols) {
        out += (obj[c] + "*")
      }
      return out
    }
    // ***整列code資料只留unique(存進去)
    // 用rule.cols規則去檢查，合格且有列出才回傳
    const row2Col = (toBeAdd, pColRules) => {
      const itData = {}
      // ----------開始區分
      for (let rule of pColRules) {
        // 母版的規則其他參數
        const other = rule.o
        // !!! 變化處
        let data = toBeAdd[rule.c]
        // 沒值但有預設不填進去=>避免原資料與加入資料不同，再次比對會重複加入(改在輸出端放預設值)
        // if (data === undefined && rule.d) data = rule.d
        // 必填沒值就報錯
        if (rule.r && (data === undefined || data === null || data === "") && !rule.d) return res.status(403).send({ success: false, message: combineDataString(toBeAdd) + "|" + rule.c + "|" + "不可是空的!" })
        // 有值才檢查
        if (data) {
          // 類型審核錯誤也抱錯
          // 代碼表示: 1單行文字 2多行文字 3數字  5單選 6多選 7 其他 0Boolean  
          switch (rule.t) {
            case 0:
              if (other) return res.status(403).send({ success: false, message: "不該有規則" + rule.c + rule.t + ":" + data })
              // 防止常見的傻傻忘記改Boolean
              if (data === "是" || "true" || "yes") data = true
              if (typeof data !== "boolean") return res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.c + rule.t + ":" + data })
              break;
            case 1: case 2:
              // 數字轉文字
              if (typeof data === "number") data = data.toString()
              if (typeof data !== "string") return res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.c + rule.t + ":" + data })
              if (other === undefined) { break }
              if (other.max !== undefined && (typeof other.max !== "number" || data.length > other.max)) return res.status(403).send({ success: false, message: "最多字數超過" + other.max + "的限制" + rule.c + rule.t + ":" + other.max + ":" + data })
              if (other.min !== undefined && (typeof other.min !== "number" || data.length < other.min)) return res.status(403).send({ success: false, message: "最少字數超過" + other.min + "的限制" + rule.c + rule.t + ":" + other.min + ":" + data })
              break;
            case 3:
              // 數學包含整數/最大/最小可限制
              if (typeof data !== "number") return res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.c + rule.t + ":" + data })
              if (other === undefined) { break }
              if (other.integer !== undefined && (typeof other.integer !== "boolean" || (other.integer && data != Math.floor(data)))) return res.status(403).send({ success: false, message: "必須為整數的格式錯誤" + rule.c + rule.t + ":" + other.integer + ":" + data })
              if (other.max !== undefined && (typeof other.max !== "number" || data > other.max)) return res.status(403).send({ success: false, message: "最大值超過" + other.max + "的限制" + rule.c + rule.t + ":" + other.max + ":" + data })
              if (other.min !== undefined && (typeof other.min !== "number" || data < other.min)) return res.status(403).send({ success: false, message: "最小值超過" + other.min + "的限制" + rule.c + rule.t + ":" + other.min + ":" + data })
              break;
            case 5: case 6:
              // 多選必須包含陣列的選項
              if (typeof data !== "string") return res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.c + rule.t + ":" + data })
              if (other === undefined) return res.status(403).send({ success: false, message: "必須設定單選選項" + rule.t + ":" + other + ":" + data })
              if (!Array.isArray(other) || other.filter((i) => typeof i !== "string").length > 0) return res.status(403).send({ success: false, message: "單選格式錯誤" + rule.c + rule.t + ":" + other + ":" + data })
              break;
            // **********!!!!!!!!!之後要改掉!!!!!!!!!!!!!!!!!!!******************** (未來也許放圖片等等)
            case 7:
              return
            default:
              return res.status(403).send({ success: false, message: "其他" + "母版規則格式錯誤:" + rule.t + ":" + data })
          }
          itData[rule.c] = data
        }
        console.log(itData);
      }
      return itData
    }
    // ***把將被新增的清單與新資料檢查，是新的才新增
    // 有更新則回傳true供計數
    const checkUniqueAndAdd = (uniquesArr, newRow) => {
      let success = false
      const uniqueDatas = uniquesArr.uniqueData
      let equal = false
      for (let it of uniqueDatas) {
        if (_.isEqual(it, newRow)) {
          equal = true
          break
        }
      }
      if (equal) {
        same++
      } else {
        success = true
        uniqueDatas.push(row2Col(newRow, pUniqueCol))
        // !!!!!!!!!!! 檢查是否需要!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // uniquesArr._id = mongoose.Types.ObjectId(oldClass._id)
      }
      return success
    }
    // *******************************************
    // 區分unique/data
    const dataList = rule.dataList
    const uniqueList = rule.transformTable.filter(c => !dataList.includes(c.c)).map(i => i.c)
    // **************
    console.log('start for');
    for (const c of file) {
      count++
      let combineCheckColNull = false
      for (let col of rule.combineCheckCols) {
        if (c[col] === "" || c[col] === undefined) {
          combineCheckColNull = true
          break
        }
      }
      // 沒課程碼/課程名稱就忽略
      if (combineCheckColNull) { console.log(combineDataString(c)); continue }
      const cCombineString = combineDataString(c)
      // 課代碼+老師與新的有重複(用更新)=>unique也沒有則確認新增，不然用新增(會合併)
      const oldClassIdx = childBoards?.findIndex(oldC => (combineDataString(oldC.colData) === cCombineString))
      if (oldClassIdx >= 0) {
        // 現有更新清單已經有了?，以它為主判斷是否是全新值
        const newClassUniqueIdx = updateList?.findIndex(newC => (combineDataString(newC.colData) === cCombineString))
        if (newClassUniqueIdx >= 0) {
          if (checkUniqueAndAdd(updateList[newClassUniqueIdx], c)) {
            combineUpdate++
          }
        } else {
          const form = { ...childBoards[oldClassIdx] }
          // console.log(form);
          checkUniqueAndAdd(form, c)
          updateList.push(form)
        }
      } else {
        // ***如果新增清單已經有同課程名+老師 直接加到對應unique裡面
        const newClassUniqueIdx = newList?.findIndex(newC => (combineDataString(newC.colData) === cCombineString))
        // 加到對應unique裡面
        if (newClassUniqueIdx >= 0) {
          if (checkUniqueAndAdd(newList[newClassUniqueIdx], c)) {
            combineNew++
          }
        } else {
          // 要全新增的
          const form = {
            // title/intro只根版才一定要有 不然抓它母版的titleCol欄位去調資料
            "parent": req.params.id,
            // 預設建新板沒有子板/文章 要之後再改
            "childBoard": {
              "active": false
            }
          }
          // !!!!!!!!!!!!!!!!!!!!!!!!!! 是否有必要{...obj}? !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          form.colData = row2Col(c, pDataCol)
          const temp = row2Col(c, pUniqueCol)
          form.uniqueData = [temp]
          console.log(temp);
          newList.push(form)
        }
      }
    }
    // ***********
    console.log("count:" + count);
    console.log("same:" + same);
    console.log("combineUpdate:" + combineUpdate);
    console.log("newList:" + newList.length);
    console.log("combineNew:" + combineNew);
    console.log("updateList:" + updateList.length);
    console.log('next');
    const info = "count:" + count + "; " + "same:" + same + "; " + "combineUpdate:" + combineUpdate + "; " + "updateList:" + updateList.length + "; " + "newList:" + newList.length + "; " + "combineNew:" + combineNew
    // fs.writeFileSync('tt.json', JSON.stringify(updateList))
    req.updateList = updateList
    req.parent = parent
    req.newList = newList
    req.info = info
    return res.status(200).send({ success: false, message: '跑完' })
    // next()
  } catch (error) {
    console.log(error)
  }
}
