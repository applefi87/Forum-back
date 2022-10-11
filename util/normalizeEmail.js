// 信箱基本加工
export default function (email) {
  console.log('start normalizeEmail');

  // 轉小寫
  console.log(1);
  let lowerEmail = email.toLowerCase()
  console.log(2);
  let idx = lowerEmail.indexOf("@")
  console.log(3);
  let front = lowerEmail.substr(0, idx)
  console.log(4);
  let back = lowerEmail.substr(idx + 1, lowerEmail.length)
  console.log(5);
  // 解決名稱的"."會被許多信箱忽略，而可重複註冊
  // front = front.replaceAll(".", "")
  console.log(6);
  // 解決gmail內部通用名
  back = back.replace("googlemail", 'gmail')
  console.log(7);
  return front + "@" + back
  // 不再有./gmail重複/大寫
}