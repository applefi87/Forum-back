// 信箱基本加工
export default function async(email) {
  // // console.log('start normalizeEmail');
  // 轉小寫
  try {
    if (!email || !(/^[a-z0-9]+@[a-z0-9]+\.[a-z0-9\.]+$/).test(email)) return 'error'
    let lowerEmail = email.toLowerCase()
    if (!lowerEmail) return 'error'
    let idx = lowerEmail.indexOf("@")
    let front = lowerEmail.substr(0, idx)
    let back = lowerEmail.substr(idx + 1, lowerEmail.length)
    // 解決名稱的"."會被許多信箱忽略，而可重複註冊
    front = front?.replace(/\./g, "")
    // 解決gmail內部通用名
    back = back?.replace("googlemail", 'gmail')
    // 拔除更動師大email，接受重複註冊，不搞學生麻煩
    // back = back?.replace("gapps.ntnu", 'ntnu')
    if (idx < 1 || !front || !back) {
      return 'error'
    }
    return front + "@" + back
    // 不再有./gmail重複/大寫
  } catch (error) {
    return 'error'
  }

}