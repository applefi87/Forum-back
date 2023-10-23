/**
 * @description: Generate a random password
 * @param {number} len Password length
 * @param {string} mode Password complexity: high (uppercase, lowercase, numbers, special characters), 
 *                       medium (uppercase, lowercase, numbers), 
 *                       low (lowercase, numbers)
 * @Date: 2021-07-02 15:52:32
 * @Author: mulingyuer
 */
export default function (len = 10, mode = "medium") {
  const lowerCaseArr = Array.from('abcdefghijklmnopqrstuvwxyz');
  const upperCaseArr = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  const numberArr = Array.from('0123456789');
  const specialArr = ['!', '@', '-', '_', '=', '<', '>', '*', ' ', '/', '|', '#', '*', '%', '+', '&', '^', '$', '~', '`', '(', ')', '[', ']', '{', '}', '.'];
  let charSet = [];

  switch (mode) {
    case "high":
      charSet = [...lowerCaseArr, ...upperCaseArr, ...numberArr, ...specialArr];
      break;
    case "medium":
      charSet = [...lowerCaseArr, ...upperCaseArr, ...numberArr];
      break;
    case "low":
    default:
      charSet = [...lowerCaseArr, ...numberArr];
      break;
  }
  const getRandomChar = () => charSet[Math.floor(Math.random() * charSet.length)];
  return [...Array(len)].map(getRandomChar).join('');
}
