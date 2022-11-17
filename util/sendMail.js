import 'dotenv/config'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'applefi87@gmail.com',
    pass: process.env.Gmail_PWD
  }
})

export default async (mail, title, text) => {
  transporter.sendMail({
    from: '師大選課論壇 <applefi87@gmail.com>',
    to: mail,
    subject: title,
    html: text
  }).then(info => {
  }).catch(console.error)
}
