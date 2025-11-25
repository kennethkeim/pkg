import { config } from "dotenv"
config()
import { Mailer } from "@kennethkeim/api-utils-core"

const mailer = new Mailer("The Most Awesomest API")

console.log("Sending mail to", process.env["TEMP_RECIPIENT"])
mailer.send({
  to: process.env["TEMP_RECIPIENT"],
  subject: "Test Email",
  html: `
    <h1>Hi</h1>
    <p>Testing Brevo emails...</p>
    `,
})

console.log("Sending template email to", process.env["TEMP_RECIPIENT"])
mailer.send({
  to: process.env["TEMP_RECIPIENT"],
  templateId: 1,
  params: { userFirstName: "Ken" },
})
