const express = require("express")
const nodemailer = require("nodemailer")
const bodyParser = require("body-parser")
const multer = require("multer")
const cors = require("cors")
const validator = require("validator")

const fs = require("fs")
require("dotenv").config({ path: __dirname + "/.env" })

// Mail Credentials

const MAIL_ID = process.env["USER_NAME"]
const PASSWORD = process.env["PASSWORD"]

// Server and port
const app = express()
const PORT = process.env.PORT || 8080

// MiddleWare
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static("files"))

// Server listerning
app.listen(PORT, () => {
  console.log(`server listerning at ${PORT}`)
})

// Base route for checking
app.get("/", (req, res) => {
  res.send({
    status: 200,
    message: "Server is working fine",
  })
})

// file store in uploads using multer
let Storage = multer.diskStorage({
  destination: "uploads",
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
})

const upload = multer({ storage: Storage })

// utility function

const mailSend = async (body, fileName) => {
  let { message, email, phoneNumber, name } = body

  return new Promise(async (resolve, reject) => {
    let transporter = nodemailer.createTransport({
      // service: "Outlook365",
      // host: "smtp.office365.com",
      // port: "587",
      // tls: {
      //   ciphers: "SSLv3",
      //   rejectUnauthorized: false,
      // },
      service: "gmail",
      auth: {
        user: MAIL_ID,
        pass: PASSWORD,
      },
    })

    let info = await transporter
      .sendMail({
        from: MAIL_ID,
        to: MAIL_ID,
        subject: message,
        html: `<b>Mr/Ms/Mrs. ${name} sent you an application with email : ${email} and Phone Number :${phoneNumber}</b>`, // html body
        attachments: [
          {
            filename: `${fileName}`,
            path: __dirname + `/uploads/${fileName}`,
            contentType: "application/pdf",
          },
        ],
      })
      .then((result) => {
        resolve(result)
      })
      .catch((error) => reject(error))
  })
}

// utility function

const mailSubscription = async (text) => {
  return new Promise(async (resolve, reject) => {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MAIL_ID,
        pass: PASSWORD,
      },
    })

    let info = await transporter
      .sendMail({
        from: MAIL_ID,
        to: MAIL_ID,
        subject: "Mail Subscription",
        html: `<b>A New mail Subscription is requested by ${text}</b>`,
      })
      .then((result) => {
        resolve(result)
      })
      .catch((error) => reject(error))
  })
}

// Utility function

const contactUs = async ({ name, email, subject, message }) => {
  return new Promise(async (resolve, reject) => {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MAIL_ID,
        pass: PASSWORD,
      },
    })

    let info = await transporter
      .sendMail({
        from: MAIL_ID,
        to: MAIL_ID,
        subject: subject,
        html: `<b>Mr/Ms/Mrs. ${name} sent you an application with email : ${email}</b> shared his message ${message}`,
      })
      .then((result) => {
        resolve(result)
      })
      .catch((error) => reject(error))
  })
}

// Utility function
const jobApplication = async (body, applicationName) => {
  const {
    jobPosition,
    experience,
    department,
    jobDescription,
    location,
    published,
  } = body
  return new Promise(async (resolve, reject) => {
    let transporter = nodemailer.createTransport({
      service: "hotmail",
      auth: {
        user: MAIL_ID,
        pass: PASSWORD,
      },
    })

    let info = await transporter
      .sendMail({
        from: MAIL_ID,
        to: MAIL_ID,
        subject: "New Job Application",
        html: `<p>Job Position : ${jobPosition}</p>
        <p>Experience : ${experience}</p>
        <p>Department : ${department}</p>
        <p>Job Description :${jobDescription}</p>
        <p>Location : ${location}</p>
        <p>Pubslished on : ${published}</p>`,
        attachments: [
          {
            filename: `${applicationName}`,
            path: __dirname + `/uploads/${applicationName}`,
            contentType: "application/pdf",
          },
        ],
      })
      .then((result) => {
        resolve(result)
      })
      .catch((error) => reject(error))
  })
}

// Spontaneous Application route

app.post("/sendmail", upload.single("cv"), (req, res) => {
  const { name, email, phoneNumber, message } = req.body
  const cv = req.file
  if (!name || !email || !phoneNumber || !message || !cv) {
    return res.send({
      status: 403,
      message: "Please fill in the details completely",
    })
  }
  if (!validator.isEmail(email)) {
    return res.send({
      status: 403,
      message: "invalid email address",
    })
  }
  if (phoneNumber.length !== 10) {
    return res.send({
      status: 403,
      message: "invalid phone Number",
    })
  }
  try {
    mailSend(req.body, cv.originalname)
      .then((response) => {
        ;async () => {
          try {
            fs.unlinkSync(__dirname + `/uploads/${cv.originalname}`)
          } catch (error) {
            console.log(error)
          }
        }
        return res.send({
          status: 200,
          message: "mail send successful",
        })
      })
      .catch((error) => {
        return res.send({
          status: 400,
          message: "mail sent failed",
          error: error,
        })
      })
  } catch (error) {
    return res.send({
      status: 500,
      message: "mail sent failed",
      error: error,
    })
  }
})

// news letter submission route

app.post("/newsletter", (req, res) => {
  if (req.body.email == "" || !validator.isEmail(req.body.email)) {
    return res.send({
      status: 400,
      message: "Please enter valid Email ID",
      email_entered: req.body.email,
    })
  } else {
    mailSubscription(req.body.email)
    return res.send({
      status: 200,
      message: "Thank you for your email subscription.",
      data: req.body.email,
    })
  }
})

// job application submission route

app.post("/submitapplication", upload.single("application"), (req, res) => {
  const application = req.file

  try {
    if (application) {
      jobApplication(req.body, application.originalname).then((response) => {
        ;async () => {
          try {
            fs.unlinkSync(__dirname + `/uploads/${application.originalname}`)
          } catch (error) {
            console.log(error)
          }
        }
        return res.send({
          status: 200,
          message: "Application send successfully",
        })
      })
    }
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal error, please try again",
    })
  }
})

// Contact us route

app.post("/contactus", (req, res) => {
  const { name, email, subject, message } = req.body
  if (!validator.isEmail(email)) {
    return res.send({
      status: 403,
      message: "invalid email address",
    })
  }
  if (!name || !email || !subject || !message) {
    res.send({
      status: 400,
      message: "please kindly fill the complete details before submitting",
    })
  }
  try {
    contactUs(req.body)
    return res.send({
      status: 200,
      message: "Contact form sent successfully",
    })
  } catch (error) {
    return res.send({
      status: 500,
      message: "internal error",
      error: error,
    })
  }
})
