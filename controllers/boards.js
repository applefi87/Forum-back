import boards from '../models/boards.js'
import fs from 'fs'

export const createBoard = async (req, res) => {
  try {
    // fs.writeFileSync('tt.json', JSON.stringify(req.updateList))
    if (req.updateList.length > 0) {
      console.log("boards updating");
      const us = Date.now();
      await boards.bulkSave(req.updateList);
      console.log("boards updated" + (Date.now() - us));
    }
    let result
    if (req.newList.length > 0) {
      console.log("boards creating");
      const us = Date.now();
      result = await boards.insertMany(req.newList);
      console.log("boards created" + (Date.now() - us));
    }
    // *******抓之前的filter清單，再把新加入的加進去更新，省效能*****
    const pFilter = req.parent.childBoard.rule.display.filter
    // ***把原顯示的過濾清單，加上新的過濾清單
    const addObj2ObjSet = (cols, newFilters) => {
      // // console.log(cols);
      for (let k of Object.keys(cols)) {
        // // console.log(req.newFilters[k]);
        const filterArr = [...newFilters[k]]
        if (cols[k]?.l?.length > 0) {
          for (let nk of filterArr) {
            if (!cols[k].l?.includes(nk)) {
              cols[k].l?.push(nk)
            }
          }
        }
        else {
          // 不然直接新增
          cols[k].l = filterArr
        }
        cols[k].l.sort().reverse()
      }
    }
    // ***只要任一有更新，更新display>filter>unique欄位
    if (req.updateList.length > 0 || req.newList.length > 0) {
      // 沒有要先建
      if (!pFilter.uniqueCols) {
        pFilter.uniqueCols = {}
      }
      addObj2ObjSet(pFilter.uniqueCols, req.newUniqueFilters)
      req.parent.markModified('childBoard.rule.display.filter.uniqueCols')
      // // console.log(pFilter.uniqueCols);
      await req.parent.save()
      // console.log("uniqueCols updated");
    } else {
      console.log('no changed');
    }
    // dataCols 比較多 要去比對新資料
    if (result) {
      // 沒有要先建
      if (!pFilter.dataCols) {
        pFilter.dataCols = {}
      }
      addObj2ObjSet(pFilter.dataCols, req.newDataFilters)
      console.log("filterList updated");
      // 要這樣通知才能更新mixed
      req.parent.markModified('childBoard.rule.display.filter.dataCols')
      await req.parent.save()
      console.log("filter list updated");
    }
    console.log('end---------------------------------');
    res.status(200).send({ success: true, message: { title: '上傳更新完成', text: req.info, duration: 20000 } })
  } catch (error) {
    // console.log(error);
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: { title: 'ValidationError' } })
    } else {
      res.status(500).send({ success: false, message: { title: 'ServerError' }, error })
    }
  }
}

export const createRoot = async (req, res) => {
  try {
    // 目前沒檢查格式，之後再調整，先只檢查與研究好
    const buildedRoot = JSON.parse(JSON.stringify(req.body))
    if (buildedRoot.childBoard?.article?.active) {
      // 有文章就一定要設語言，至少要有英文
      if (buildedRoot.childBoard.article.languages.length < 1) {
        return res.status(400).send({ success: false, message: "需設定語言選項" })
      }
      const langsOut = {}
      for (let it of buildedRoot.childBoard.article.languages) {
        // 之後會增加語言清單供檢查，不然可以被亂放
        if (typeof it !== 'string') return res.status(400).send({ success: false, message: "語言選項的" + it + "格式非文字" })
        if (!Object.keys(langsOut).includes(it)) {
          langsOut[it] = 0
        }
      }
      buildedRoot.childBoard.article.languages = langsOut
    }
    const result = await boards.create(buildedRoot)
    res.status(200).send({ success: true, message: { title: 'createded', text: result } })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({ success: false, message: error.message })
    } else {
      res.status(500).send({ success: false, message: 'ServerError', error })
    }
  }
}
export const getBoard = async (req, res) => {
  // console.log('in controller -getBoard');
  try {
    res.status(200).send({ success: true, message: '', result: req.board })
    // // console.log("end");
  } catch (error) {
    // console.log(error);
    res.status(500).send({ success: false, message: 'ServerError' })
  }
}
export const getBoardTest = async (req, res) => {
  // console.log('in controller-getBoardTest');
  // // console.log(req.board);
  try {
    res.status(200).send({ success: true, message: '', result: req.all })
    // console.log("end");
  } catch (error) {
    // console.log(error);
    res.status(500).send({ success: false, message: 'ServerError' })
  }
}
export const getChildBoards = async (req, res) => {
  // console.log("in Controller-getChildBoards");
  try {
    const filter = JSON.parse(decodeURI(req.query.test))
    // 先處理過濾內容
    const condition = { parent: req.params.id }
    // filterData search filterUnique 是規則的必搜內容 未來可能沒有，但目前先列出來
    // 雖然目前駭客一定會選all,但之後有可能會取消
    let defaultFilter = true
    // 使用者有輸入內容直接去資料庫查詢即可(打錯就找不到)
    // // console.log(filter);
    if (filter.filterData.length > 0) {
      filter.filterData.forEach(filter => {
        // 欄位要有字串非空值 + 要有過濾/全部 才算有效
        if (filter.col && typeof filter.col === "string" && (filter.text || filter.all)) {
          // 有宣告過，不用預設值
          if (filter.col === "c0") { defaultFilter = false }
          // 要有過濾 || 全部就不用篩
          if (!filter.all) { condition['colData.' + filter.col] = filter.text }
        }
      })
    }
    // c0是一定要有宣告的過濾欄(可以有全選)，如果c0沒被宣告過代表是機器直接post，直接回傳空的
    if (defaultFilter) {
      return res.status(400).send({ success: false, message: '', result: "" })
      // 原本因應不同過濾機制，某些欄位必須要過濾，抓第一個 之後再重新想
      // condition['colData.' + "c0"] = req.board.childBoard.rule.display.filter.dataCols.c0[0]
    }
    // 同 輪到search的欄位(目前只一個，保留彈性用array包)(不打就全部)
    // 目前先不可查
    // if (filter.search?.length > 0) {
    //   filter.search.forEach(search => {
    //     if (search.col && typeof search.col === "string" && search.text && search.text != "") {
    //       condition['colData.' + search.col] = RegExp(search.text, "i")
    //     }
    //   })
    // }
    // 同 輪到unique的欄位 
    // filter.all抄filterData 目前沒用
    if (filter.filterUnique?.length > 0) {
      filter.filterUnique.forEach(filter => {
        if (filter.col && typeof filter.col === "string" && ((filter.text && filter.text != "") || filter.all)) {
          if (!filter.all) {
            condition['uniqueData.' + filter.col] = filter.text
          }
        }
      })
    }
    if (filter.onlyRated) {
      condition['beScored.amount'] = { $gt: 0 }
    }
    // // console.log(condition);
    //版名只顯示當下多語言
    let displayCols = `colData.${req.board.childBoard.rule.titleCol[filter.langWord]} `;
    // 只拿會在母版table顯示/用來排序的欄位 就好
    req.board.childBoard.rule.displayCol.forEach(c =>
      displayCols += `colData.${c} `
    )
    // // console.log(displayCols);
    const childBoards = await boards.find(condition, "title beScored uniqueData " + displayCols)
    res.status(200).send({ success: true, message: '', result: childBoards })
    // console.log("end");
  } catch (error) {
    // console.log(error);
    res.status(500).send({ success: false, message: 'ServerError' })
  }
}