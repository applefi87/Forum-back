// 信箱基本加工
export default function (email) {
  // 轉小寫
  let lowerEmail = email.toLowerCase()
  let idx = lowerEmail.indexOf("@")
  let front = lowerEmail.substr(0, idx)
  let back = lowerEmail.substr(idx + 1, lowerEmail.length)
  // 解決名稱的"."會被許多信箱忽略，而可重複註冊
  front = front.replaceAll(".", "")
  // 解決gmail內部通用名
  back = back.replace("googlemail", 'gmail')
  return front + "@" + back
  // 不再有./gmail重複/大寫
}