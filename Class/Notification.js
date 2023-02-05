import users from '../models/users.js'
import boards from '../models/boards.js'
export default class Notification {
  /**
 * @constructor 建置文章部分欄位(剩下會在新增時自動async抓取)
 * @param {number} type目前1
 * @param {object} req
 * @param {number} action目前1
 * @param {objectId} targetOID(目前抓取是以article而已)
 */
  constructor(type, req, action, target) {
    return (async () => {
      //類型請看model說明
      this.type = type
      this.user = req.user._id.toString()
      this.action = action
      this.targetId = target._id.toString()
      this.detail = req.body.content.slice(0, 30)
      //目前只有文章，文章必須到板塊甚至母版抓
      const board = await boards.findById(target.board)
      if (!board.titleCol) {
        const parentBoard = await boards.findById(board.parent)
        const parentRule = JSON.parse(JSON.stringify(parentBoard.childBoard.rule.titleCol))
        //置換原本{zhtw:c8} c8改抓Board欄位值
        Object.keys(parentRule).forEach(k => {
          parentRule[k] = board.colData[parentRule[k]]
        })
        this.targetTitleCol = parentRule
      } else {
        this.targetTitleCol = board._id.toString()
      }
      return this;
    })();
  }
  static async addNotification(targetUserId, Notification) {
    try {
      const poster = await users.findById(targetUserId, "notification")
      if (!poster) throw new Error("找不到該用戶通知，新增失敗")
      poster.notification.push({ type: Notification.type, time: Date.now(), user: Notification.user, action: Notification.action, target: Notification.targetId, targetTitleCol: Notification.targetTitleCol, detail: Notification.detail })
      await poster.save()
    } catch (error) {
      throw error
    }
  }
}

//
// import users from '../models/users.js'
// import boards from '../models/boards.js'
// export default class Notification {
//   /**
//  * @constructor 建置文章部分欄位(剩下會在新增時自動async抓取)
//  * @param {number} type目前1
//  * @param {object} req
//  * @param {number} action目前1
//  * @param {objectId} targetOID(目前抓取是以article而已)
//  */
//   constructor(type, req, action, target) {
//       console.log(type, req, action, target);
//       //類型請看model說明
//       this.type = type
//       this.user = req.user._id.toString()
//       this.action = action
//       this.targetId = target._id.toString()
//       this.detail = req.body.content.slice(0, 30)
//   }
//   static async addNotification(targetUserId, Notification) {
//     try {
//       //目前只有文章，文章必須到板塊甚至母版抓
//       const board = await boards.findById(target.board)
//       if (!board.titleCol) {
//         const parentBoard = await boards.findById(board.parent)
//         const parentRule = JSON.parse(JSON.stringify(parentBoard.childBoard.rule.type.titleCol))
//         //置換原本{zhtw:c8} c8改抓Board欄位值
//         Object.keys(parentRule).forEach(k => {
//           parentRule[k] = board.colData[parentRule[k]]
//         })
//         this.targetTitleCol = parentRule
//       } else {
//         this.targetTitleCol = board._id.toString()
//       }
//       const poster = await users.findById(targetUserId, "notification")
//       if (!poster) throw new Error("找不到該用戶通知，新增失敗")
//       poster.notification.push({ type: Notification.type, time: Date.now(), user: Notification.user, action: Notification.action, target: Notification.targetId, targetTitleCol: Notification.targetTitleCol, detail: Notification.detail })
//       await poster.save()
//       console.log("END");
//     } catch (error) {
//       throw error
//     }
//   }
// }