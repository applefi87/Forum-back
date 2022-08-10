import file from '../classesOut.js'
import boards from '../models/boards.js'

export default async (req, res, next) => {
  const parent = await boards.findById(req.params.id)
  if (!parent) return res.status(403).send({ success: false, message: '找無該母版' })
  const pDataCol = parent.childBoard.rule.dataCol
  const pUniqueCol = parent.childBoard.rule.uniqueCol
  // *******************************************
  const out = []
  for (let c of file) {
    const form = {
      // 限20字
      "title": c.className.split(' [')[0].slice(0, 20),
      "parent": req.body.parent,
      // "uniqueData": c.uniqueData,
      "childBoard": {
        "active": false,
      }
    }
    // ***colData**
    form.colData = []
    // 母版有列才加入
    for (let rule of pDataCol) {
      const data = c[rule.n]
      // 必填沒值就報錯
      console.log(c[rule.n]);
      console.log(rule.r);
      console.log(rule.r && (data === undefined || data === null || data === ""));
      if (rule.r && (data === undefined || data === null || data === "")) res.status(403).send({ success: false, message: c.className + "|" + rule.n + "|" + "不可是空的!" })
      // 有值才檢查
      if (data) {
        console.log('dataCol')
        // 類型審核錯誤也抱錯
        // 代碼表示: 1單行文字 2多行文字 3數字 4範圍 5單選 6多選 0Boolean  
        switch (rule.t) {
          case 0:
            if (typeof data !== boolean) res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data })
            break;
          case 1:
            if (typeof data !== String) res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data })
            break;
          case 2:
            if (typeof data !== String) res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data })
            break;
          case 3:
            if (typeof data !== Number) res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data })
            break;
          case 4:
            if (!(Array.isArray(data) && data.filter((it) => typeof it !== Number).length <= 0)) res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data })
            break;
          case 5:
            if (typeof data !== String) res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data })
            break;
          case 6:
            if (!Array.isArray(data)) res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data })
            break;
          default:
            return res.status(403).send({ success: false, message: "其他"+"母版規則格式錯誤:" + rule.t })
        }
        // 完成把母版ok的加進去
        form.colData.push({ [rule.n]: data })
      } else {
        // 不然把預設值填進去
        form.colData.push({ [rule.n]: rule.d })
      }
    }
    // // ***uniqueData
    // form.uniqueData = []
    // // 母版有列才加入
    // for (let rule of pUniqueCol) {
    //   const data = c.uniqueData[rule.n]
    //   // 必填沒值就報錯
    //   if (rule.r && (data === undefined || data === null || data === "")) res.status(403).send({ success: false, message: c.className + rule.n + "不可是空的!" })
    //   // 有值才檢查
    //   if (data) {
    //     // 類型審核錯誤也抱錯
    //     switch (rule.t) {
    //       case 0:
    //         if (typeof data !== boolean)  res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data }) 
    //         break;
    //       case 1:
    //         if (typeof data !== String)  res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data }) 
    //         break;
    //       case 2:
    //         if (typeof data !== String)  res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data }) 
    //         break;
    //       case 3:
    //         if (typeof data !== Number)  res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data }) 
    //         break;
    //       case 4:
    //         if (!(Array.isArray(data) && data.filter((it) => typeof it !== Number).length <= 0))  res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data }) 
    //         break;
    //       case 5:
    //         if (typeof data !== Number)  res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data }) 
    //         break;
    //       case 6:
    //         if (!(Array.isArray(data) && data.filter((it) => typeof it !== Number).length <= 0))  res.status(403).send({ success: false, message: "輸入格式驗證錯誤" + rule.t + ":" + data }) 
    //         break;
    //       default:
    //         return res.status(403).send({ success: false, message: "母版規則格式錯誤:" + rule.t })
    //     }
    //     // 完成把母版ok的加進去
    //     form.uniqueData.push({ [rule.n]: data })
    //   } else {
    //     // 不然把預設值填進去
    //     form.uniqueData.push({ [rule.n]: rule.d })
    //   }
    // }
    // 
    out.push(form)
  }
  req.boardList = out
  next()
}

