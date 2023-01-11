import users from '../models/users.js'
export default class Notification {
  constructor(type, userOID, action, targetOID, detail) {
    //類型請看model說明
    this.type = type
    this.user = userOID.toString()
    this.action = action
    this.target = targetOID.toString()
    this.detail = detail.slice(0, 30)
  }
  static async addNotification(posterId, Notification) {
    try {
      const poster = await users.findById(posterId, "notification")
      if (!poster) throw new Error("找不到該用戶通知，新增失敗")
      poster.notification.push({ type: Notification.type, time: Date.now(), user: Notification.user, action: Notification.action, target: Notification.target, detail: Notification.detail })
      await poster.save()
    } catch (error) {
      throw error
    }
  }
}