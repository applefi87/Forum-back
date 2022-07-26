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

transporter.sendMail({
  from: 'applefi87@gmail.com',
  to: 'werrtyyui@yahoo.com.tw',
  subject: '測試喔',
  html: 'wwww'
}).then(info => {
  console.log({ info })
}).catch(console.error)
