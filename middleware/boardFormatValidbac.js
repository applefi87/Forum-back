import buildFile from '../util/build.js'
import boards from '../models/boards.js'
import codeList from '../translateForm/school.js'
import mongoose from 'mongoose'
import fs from 'fs'
// 代碼表示: 1單行文字 2多行文字 3數字  5單選 6多選 0Boolean 
// isMatchWith
export default async (req, res, next) => {
  try {
    let count = 0
    let same = 0
    console.log('in boardFormatValid');
    const temp = buildFile(req.body.csv.slice(500, 501))
    // const file = [temp[505], temp[506], temp[507]]
    const file = temp
    console.log('builded');
    const parent = await boards.findById(req.params.id)
    if (!parent) return res.status(403).send({ success: false, message: '找無該母版' })
    //區分之前有的跟新的
    // 只拿會在母版table顯示/用來排序的欄位 就好
    const childBoards = await boards.find({ parent: req.params.id }, "title beScored colData uniqueData")
    const updateList = []
    const newList = []
    // *******************************************
    // 區分unique/data(build就有 這裡直接借) 
    const dataKey = ["department", 'classCode', "english", "className", "classNameEng", 'score', "required", "teacher"]
    const uniqueCode = codeList.filter(c => !dataKey.includes(c[1]))
    const pUniqueCol = parent.childBoard.rule.uniqueCol
    // **************
    console.log('start for');
    for (const c of file) {
      count++
      // 沒課程碼/課程名稱就忽略
      if (!(c.classCode && c.className)) { console.log(c.classCode, c.className); continue }
      const oldClass = childBoards.find(oldC => (oldC.colData.c10 + oldC.colData.c60) === (c.classCode + (c.teacher || '無')))
      if (oldClass) {
        // 確認資料不重複
        // 原課程unique轉字串
        const oldUnique = []
        for (let u of oldClass.uniqueData) {
          let uniqueString = ''
          for (let code of uniqueCode) {
            if (u[code[2]]) uniqueString += (code[2] + ":" + (typeof u[code[2]] !== 'object' ? u[code[2]] : JSON.stringify(u[code[2]])))
          }
          oldUnique.push(uniqueString)
        }
        // 新課程每個unique轉字串 比對不重複就validate加入原陣列
        let changed = false
        for (let it of c.uniqueData) {
          let uniqueString = ''
          for (let code of uniqueCode) {
            if (it[code[1]]) { uniqueString += (code[2] + ":" + (typeof it[code[1]] !== 'object' ? it[code[1]] : JSON.stringify(it[code[1]]))) }
            else if (code[2] === 'c80') {
              uniqueString += ('c80:' + req.body.uniqueCol)
            } else if (code[2] === 'c90') {
              uniqueString += ('c90:' + '無')
            } else if (code[2] === 'c60') {
              uniqueString += ('c60:' + '無')
            }
          }
          // if (!oldUnique.find(s => { console.log(s); console.log(uniqueString); console.log(s === uniqueString); console.log(s === uniqueString); return s === uniqueString })){
          if (!oldUnique.find(s => s === uniqueString)) {
            const itData = {}
            // ----------開始區分
            for (let rule of pUniqueCol) {
              // 母版的規則其他參數
              const other = rule.o
              // !!! 變化處
              let data = it[rule.n]
              // 預先統一填入
              if (rule.n === "semester") data = req.body.uniqueCol;
              // 沒值但有預設就填進去
              if (data === undefined && rule.d) data = rule.d
              // 必填沒值就報錯
              if (rule.r && (data === undefined || data === null || data === "")) return res.status(403).send({ success: false, message: c.className + "|" + rule.n + "|" + "不可是空的!" })
              // 有值才檢查
              if (data) {
                // 類型審核錯誤也抱錯
                // 代碼表示: 1單行文字 2多行文字 3數字  5單選 6多選 7 其他 0Boolean  
                switch (rule.t) {
                  case 0:
                    if (other) return res.status(403).send({ success: false, message: "不該有規則" + rule.n + rule.t + ":" + data })
                    if (data === "是" || "true" || "yes") data = true
                    if (typeof data !== "boolean") return res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.n + rule.t + ":" + data })
                    break;
                  case 1: case 2:
                    if (typeof data === "number") data = data.toString()
                    if (typeof data !== "string") return res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.n + rule.t + ":" + data })
                    if (other === undefined) { break }
                    if (other.max !== undefined && (typeof other.max !== "number" || data.length > other.max)) return res.status(403).send({ success: false, message: "最多字數超過" + other.max + "的限制" + rule.n + rule.t + ":" + other.max + ":" + data })
                    if (other.min !== undefined && (typeof other.min !== "number" || data.length < other.min)) return res.status(403).send({ success: false, message: "最少字數超過" + other.min + "的限制" + rule.n + rule.t + ":" + other.min + ":" + data })
                    break;
                  case 3:
                    // 數學包含整數/最大/最小可限制
                    if (typeof data !== "number") return res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.n + rule.t + ":" + data })
                    if (other === undefined) { break }
                    if (other.integer !== undefined && (typeof other.integer !== "boolean" || (other.integer && data != Math.floor(data)))) return res.status(403).send({ success: false, message: "必須為整數的格式錯誤" + rule.n + rule.t + ":" + other.integer + ":" + data })
                    if (other.max !== undefined && (typeof other.max !== "number" || data > other.max)) return res.status(403).send({ success: false, message: "最大值超過" + other.max + "的限制" + rule.n + rule.t + ":" + other.max + ":" + data })
                    if (other.min !== undefined && (typeof other.min !== "number" || data < other.min)) return res.status(403).send({ success: false, message: "最小值超過" + other.min + "的限制" + rule.n + rule.t + ":" + other.min + ":" + data })
                    break;
                  case 5: case 6:
                    // 多選必須包含陣列的選項
                    if (typeof data !== "string") return res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.n + rule.t + ":" + data })
                    if (other === undefined) return res.status(403).send({ success: false, message: "必須設定單選選項" + rule.t + ":" + other + ":" + data })
                    if (!Array.isArray(other) || other.filter((i) => typeof i !== "string").length > 0) return res.status(403).send({ success: false, message: "單選格式錯誤" + rule.n + rule.t + ":" + other + ":" + data })
                    break;
                  // **********!!!!!!!!!之後要改掉!!!!!!!!!!!!!!!!!!!********************
                  case 7:
                    break;
                  default:
                    return res.status(403).send({ success: false, message: "其他" + "母版規則格式錯誤:" + rule.t + ":" + data })
                }
                const key = codeList[codeList.findIndex((arr) => arr[1] === rule.n)][2]
                itData[key] = data
              }
            }
            oldClass.uniqueData.push(itData)
            oldClass._id = mongoose.Types.ObjectId(oldClass._id)
            changed = true
          } else { same++ }
        }
        if (changed) updateList.push(oldClass)
      } else {
        // 基本加工
        const form = {
          // 限20字
          "title": c.className.split(' [')[0].slice(0, 20),
          "parent": req.params.id,
          // "uniqueData": c.uniqueData,
          "childBoard": {
            "active": false
          }
        }
        // ***宣告存兩個欄位用的變數**
        const pDataCol = parent.childBoard.rule.dataCol
        form.colData = {}
        form.uniqueData = []
        // 把colData, uniqueData一起用同個代碼判斷規則 但比較..不好懂000
        for (const col of ['colData', 'uniqueData']) {
          for (let it of col === 'uniqueData' ? c.uniqueData : ["once"]) {
            // 只有uniqueData會用到
            const itData = {}
            // ----------開始區分
            for (let rule of col === 'uniqueData' ? pUniqueCol : pDataCol) {
              // 母版的規則其他參數
              const other = rule.o
              // !!! 變化處
              let data = col === 'uniqueData' ? it[rule.n] : c[rule.n]
              // 預先統一填入
              if (rule.n === "semester") data = req.body.uniqueCol;
              // 沒值但有預設就填進去
              if (data === undefined && rule.d) data = rule.d
              // 必填沒值就報錯
              if (rule.r && (data === undefined || data === null || data === "")) return res.status(403).send({ success: false, message: c.className + "|" + rule.n + "|" + "不可是空的!" })
              // 有值才檢查
              if (data) {
                // 類型審核錯誤也抱錯
                // 代碼表示: 1單行文字 2多行文字 3數字  5單選 6多選 7 其他 0Boolean  
                switch (rule.t) {
                  case 0:
                    if (other) return res.status(403).send({ success: false, message: "不該有規則" + rule.n + rule.t + ":" + data })
                    if (data === "是" || "true" || "yes") data = true
                    if (typeof data !== "boolean") return res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.n + rule.t + ":" + data })
                    break;
                  case 1: case 2:
                    if (typeof data === "number") data = data.toString()
                    if (typeof data !== "string") return res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.n + rule.t + ":" + data })
                    if (other === undefined) { break }
                    if (other.max !== undefined && (typeof other.max !== "number" || data.length > other.max)) return res.status(403).send({ success: false, message: "最多字數超過" + other.max + "的限制" + rule.n + rule.t + ":" + other.max + ":" + data })
                    if (other.min !== undefined && (typeof other.min !== "number" || data.length < other.min)) return res.status(403).send({ success: false, message: "最少字數超過" + other.min + "的限制" + rule.n + rule.t + ":" + other.min + ":" + data })
                    break;
                  case 3:
                    // 數學包含整數/最大/最小可限制
                    if (typeof data !== "number") return res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.n + rule.t + ":" + data })
                    if (other === undefined) { break }
                    if (other.integer !== undefined && (typeof other.integer !== "boolean" || (other.integer && data != Math.floor(data)))) return res.status(403).send({ success: false, message: "必須為整數的格式錯誤" + rule.n + rule.t + ":" + other.integer + ":" + data })
                    if (other.max !== undefined && (typeof other.max !== "number" || data > other.max)) return res.status(403).send({ success: false, message: "最大值超過" + other.max + "的限制" + rule.n + rule.t + ":" + other.max + ":" + data })
                    if (other.min !== undefined && (typeof other.min !== "number" || data < other.min)) return res.status(403).send({ success: false, message: "最小值超過" + other.min + "的限制" + rule.n + rule.t + ":" + other.min + ":" + data })
                    break;
                  case 5: case 6:
                    // 多選必須包含陣列的選項
                    if (typeof data !== "string") return res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.n + rule.t + ":" + data })
                    if (other === undefined) return res.status(403).send({ success: false, message: "必須設定單選選項" + rule.t + ":" + other + ":" + data })
                    if (!Array.isArray(other) || other.filter((i) => typeof i !== "string").length > 0) return res.status(403).send({ success: false, message: "單選格式錯誤" + rule.n + rule.t + ":" + other + ":" + data })
                    break;
                  // **********!!!!!!!!!之後要改掉!!!!!!!!!!!!!!!!!!!********************
                  case 7:
                    break;
                  default:
                    return res.status(403).send({ success: false, message: "其他" + "母版規則格式錯誤:" + rule.t + ":" + data })
                }
                const key = codeList[codeList.findIndex((arr) => arr[1] === rule.n)][2]
                col === 'uniqueData' ? (itData[key] = data) : (form.colData[key] = data)
              }
            }
            col === 'uniqueData' ? form.uniqueData.push(itData) : null
          }
        }
        newList.push(form)
      }
    }
    // ***********
    console.log("count:" + count);
    console.log("same:" + same);
    req.parent = parent
    req.newList = newList
    console.log("newList:" + newList.length);
    fs.writeFileSync('tt.json', JSON.stringify(updateList))
    req.updateList = updateList
    console.log("updateList:" + updateList.length);
    console.log('next');
    next()
  } catch (error) {
    console.log(error)
  }
}
