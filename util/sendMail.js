import 'dotenv/config'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  auth: {
    user: 'applefi87@gmail.com',
    pass: process.env.Gmail_PWD
  }
})

export default async (mail, title,text) => { 
  transporter.sendMail({
    from: 'applefi87@gmail.com(師大選課論壇)',
    to: mail,
    subject: title ,
    html: text
  }).then(info => {
  }).catch(console.error)
}
