import 'dotenv/config'
import nodemailer from 'nodemailer'

const pwd = process.env.Gmail_PWD

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  auth: {
    user: 'applefi87@gmail.com',
    pass: pwd
  }
})

export default async (mail, code) => {
  transporter.sendMail({
    from: 'applefi87@gmail.com',
    to: mail,
    subject: '課程網驗證碼在此',
    html: code + '是你的信箱驗證碼，請至原頁面填入驗證，進入下步驟 '
  }).then(info => {
  }).catch(console.error)
}
