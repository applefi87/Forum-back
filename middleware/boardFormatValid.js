import buildFile from '../util/build.js'
import boards from '../models/boards.js'
import _ from 'lodash'

// !!!
// 須確保判斷重複的欄位
// 加入的csv要檢查:必填的意外沒值是否有改預設(目前有d可以預設填東西，之後再評估要程式/csv處理)
//  預設建新板沒有子板/文章 要之後再改
// -----------
// 功能介紹: 確認有母版再新增子板>把傳來的子板CSV轉json>轉代碼版json>
// 抓取現有的子板，比對是新的再更新加入
// -區分之前有的跟新的
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


// 代碼表示: 0Boolean  1單行文字 2多行文字 3數字  5單選 6多選 
export default async (req, res, next) => {
  try {
    // *****************確認有母版再新增子板
    const parent = await boards.findById(req.params.id)
    console.time("get parent");
    if (!parent) return res.status(403).send({ success: false, message: '找無該母版' })
    console.timeEnd("get parent");
    //  *****************把傳來的子板CSV轉json+轉代碼版json
    console.time("buildFile");
    const file = await buildFile(req.body.csv, parent.childBoard.rule)
    console.timeEnd("buildFile");
    // ******************抓取現有的子板，比對是新的再更新加入
    // 留一些計數的，確認運算沒錯
    let count = 0
    let duplicated = 0
    let combineUpdate = 0
    let combineNew = 0
    // 給row2Col審核錯誤後顯示用
    const errorList = []
    const rule = parent.childBoard.rule
    // 為了產生漂亮照數字順序的清單
    const sortedCols = rule.cols.sort((a, b) => a.c.slice(1).localeCompare(b.c.slice(1), undefined, { numeric: true }))
    const pDataCol = sortedCols.filter((it) => rule.dataList.includes(it.c))
    const pUniqueCol = sortedCols.filter((it) => !rule.dataList.includes(it.c))
    //*****區分之前有的跟新的
    // 只拿欄位就夠區分了
    console.time("Get childBoards");
    const childBoards = await boards.find({ parent: req.params.id }, "colData uniqueData")
    console.timeEnd("Get childBoards");
    // console.log("childBoards:" + childBoards.length);

    // *****************************************
    // 只取出關鍵欄位來組合判斷是否相同，節省效能
    const combineDataString = (obj) => {
      let out
      for (let c of rule.combineCheckCols) {
        out += (obj[c] + "*")
      }
      // for (let i = 0; i < rule.combineCheckCols.length; i++) {
      //   out += (obj[rule.combineCheckCols[i]] + "*")
      // }
      return out
    }

    // ******
    const pFilter = parent.childBoard.rule.display.filter
    const pFilterDataKeys = Object.keys(pFilter.dataCols)
    const pFilterUniqueKeys = Object.keys(pFilter.uniqueCols)
    // ***每個過濾欄位都是set格式方便判斷是否重複
    const newDataFilters = {}
    for (let k of pFilterDataKeys) {
      newDataFilters[k] = new Set()
    }
    const newUniqueFilters = {}
    for (let k of pFilterUniqueKeys) {
      newUniqueFilters[k] = new Set()
    }
    const addDataFilter = (row) => {
      for (let k of pFilterDataKeys) {
        newDataFilters[k].add(row[k])
      }
    }
    const addUniqueFilter = (row) => {
      for (let k of pFilterUniqueKeys) {
        newUniqueFilters[k].add(row[k])
      }
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
        if (rule.r && (data === undefined || data === null || data === "") && !rule.d) { errorList.push(combineDataString(toBeAdd) + "|" + rule.c + "|" + "不可是空的!"); return false }
        // 有值才檢查
        if (data) {
          // 類型審核錯誤也抱錯
          // 代碼表示: 1單行文字 2多行文字 3數字  5單選 6多選 7 其他 0Boolean  
          switch (rule.t) {
            case 0:
              if (other) { errorList.push("不該有規則" + rule.c + rule.t + ":" + data); return false }
              if (typeof data !== "boolean") { errorList.push("輸入格式驗證錯誤" + rule.c + rule.t + ":" + data); return false }
              break;
            case 1: case 2:
              // 數字轉文字
              // if (typeof data === "number") data = data.toString()
              if (typeof data !== "string") { errorList.push("輸入格式驗證錯誤" + rule.c + rule.t + ":" + data); return false }
              if (other === undefined) { break }
              if (other.max !== undefined) {
                if (typeof other.max !== "number") { errorList.push("最多字數驗證格式錯誤" + other.max); return false } else {
                  if (data.length > other.max) {
                    if (other.autofix === true) {
                      data = data.substring(0, other.max)
                    } else {
                      errorList.push("最多字數超過" + other.max + "的限制" + rule.c + ";type:" + rule.t + ":" + data); return false
                    }
                  }
                }
              }
              if (other.min !== undefined) {
                if (typeof other.min !== "number") { errorList.push("最少字數驗證格式錯誤" + other.min); return false } else {
                  if (data.length < other.min) { errorList.push("最少字數小於" + other.min + "的限制" + rule.c + ";type:" + rule.t + ":" + data); return false }
                }
              }
              break;
            case 3:
              // 數學包含整數/最大/最小可限制
              if (typeof data !== "number") { errorList.push("輸入格式驗證錯誤" + rule.c + rule.t + ":" + data); return false }
              if (other === undefined) { break }
              if (other.integer !== undefined && (typeof other.integer !== "boolean" || (other.integer && data != Math.floor(data)))) { errorList.push("必須為整數的格式錯誤" + rule.c + rule.t + ":" + other.integer + ":" + data); return false }
              if (other.max !== undefined && (typeof other.max !== "number" || data > other.max)) { errorList.push("最大值超過" + other.max + "的限制" + rule.c + rule.t + ":" + other.max + ":" + data); return false }
              if (other.min !== undefined && (typeof other.min !== "number" || data < other.min)) { errorList.push("最小值超過" + other.min + "的限制" + rule.c + rule.t + ":" + other.min + ":" + data); return false }
              break;
            case 5: case 6:
              // 多選必須包含陣列的選項
              if (typeof data !== "string") { errorList.push("輸入格式驗證錯誤" + rule.c + rule.t + ":" + data); return false }
              if (other === undefined) { errorList.push("必須設定單選選項" + rule.t + ":" + other + ":" + data); return false }
              if (!Array.isArray(other) || other.filter((i) => typeof i !== "string").length > 0) { errorList.push("單選格式錯誤" + rule.c + rule.t + ":" + other + ":" + data); return false }
              break;
            // **********!!!!!!!!!之後要改掉!!!!!!!!!!!!!!!!!!!******************** (未來也許放圖片等等)
            case 7:
              return false
            default:
              { returnerrorList.push("其他" + "母版規則格式錯誤:" + rule.t + ":" + data); return false }
          }
          itData[rule.c] = data
        }
      }
      return itData
    }
    // ***把將被新增的清單與新資料檢查，是新的才新增
    // 有更新則回傳true供計數
    const checkUniqueAndAdd = (uniquesArr, newRow) => {
      // 有些是document物件要轉一般物件，有些不是
      const uniqueDatas = uniquesArr.toObject ? uniquesArr.toObject().uniqueData : uniquesArr.uniqueData
      const newUniqueCol = row2Col(newRow, pUniqueCol)
      let notEqual = true
      for (let it of uniqueDatas) {
        delete it._id
        if (_.isEqual(it, newUniqueCol)) {
          notEqual = false
          break
        }
      }
      if (notEqual) {
        // 審核成功才加進去，不然跳過並存著供回報
        if (newUniqueCol) {
          uniquesArr.uniqueData.push(newUniqueCol)
          // 因為成功更新，該列的display>filter>uniqueCols要存著，等等一起更新
          addUniqueFilter(newUniqueCol)
        }
      }
      return notEqual
    }
    // *******************************************
    // 區分unique/data
    // **************
    console.time('building childBoardsMap');
    const childBoardsMap = new Map()
    for (const item of childBoards) {
      childBoardsMap.set(combineDataString(item.colData), item);
    }
    console.timeEnd('building childBoardsMap');
    const updateList = []
    const updateListMap = new Map()
    const newList = []
    const newListMap = new Map()
    // console.log('start for');
    console.time('for')
    for (const c of file) {
      count++
      let combineCheckColNull = false
      for (let col of rule.combineCheckCols) {
        if (c[col] === "" || c[col] === undefined) {
          combineCheckColNull = true
          break
        }
      }
      // 以課程評價版的"結合判斷欄'當範例，沒課程代碼/教師就忽略
      const cCombineString = combineDataString(row2Col(c, pDataCol))
      if (combineCheckColNull) { errorList.push(cCombineString); continue }
      // // "結合判斷欄'與新的有重複(用更新)=>unique也沒有則確認新增，不然用新增(會合併)
      // const oldClassIdx = childBoards?.findIndex(oldC => (combineDataString(oldC.colData) === cCombineString))
      const sameChildBoard = childBoardsMap.get(cCombineString);
      if (sameChildBoard) {
        // 現有更新清單已經有了?，以它為主判斷是否是全新值
        const sameInUpdateList = updateListMap.get(cCombineString);
        // const newClassUniqueIdx = updateList?.findIndex(newC => (combineDataString(newC.colData) === cCombineString))
        if (sameInUpdateList) {
          if (checkUniqueAndAdd(sameInUpdateList, c)) {
            combineUpdate++
          } else {
            duplicated++
          }
        } else {
          if (checkUniqueAndAdd(sameChildBoard, c)) {
            updateList.push(sameChildBoard)
            updateListMap.set(combineDataString(sameChildBoard.colData), sameChildBoard);
          } else {
            duplicated++
          }
        }
      } else {
        // ***如果新增清單已經有同課程名+老師 直接加到對應unique裡面
        const sameInNewList = newListMap.get(cCombineString);
        // const newClassUniqueIdx = newList?.findIndex(newC => (combineDataString(newC.colData) === cCombineString))
        // 加到對應unique裡面
        if (sameInNewList) {
          if (checkUniqueAndAdd(sameInNewList, c)) {
            combineNew++
          } else {
            duplicated++
          }
        } else {
          // // console.log('creating');
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
          if (!form.colData || !temp) { continue }
          form.uniqueData = [temp]
          // // console.log(temp);
          newList.push({ ...form })
          newListMap.set(combineDataString(form.colData), form);
          // 因為成功更新，該列的display>filter>dataCols&&uniqueCols要存著，等等一起更新
          addDataFilter(c)
          addUniqueFilter(c)
        }
      }
    }
    console.timeEnd('for')
    // ***********
    console.log("count:" + count);
    console.log("updateList:" + updateList.length);
    console.log("combineUpdate:" + combineUpdate);
    console.log("newList:" + newList.length);
    console.log("combineNew:" + combineNew);
    console.log("duplicated:" + duplicated);
    console.log("errorList:" + errorList.length);
    console.log(errorList);
    console.log('next');
    const info = "count:" + count + "; "  + "combineUpdate:" + combineUpdate + "; " + "updateList:" + updateList.length + "; " + "newList:" + newList.length + "; " + "combineNew:" + combineNew + "duplicated:" + duplicated
    // fs.writeFileSync('tt.json', JSON.stringify(updateList))
    req.updateList = updateList
    req.parent = parent
    req.newList = newList
    req.info = info
    req.newDataFilters = newDataFilters
    req.newUniqueFilters = newUniqueFilters
    // return res.status(200).send({ success: false, message: '跑完' })
    next()
  } catch (error) {
    // console.log(error)
  }
}



























