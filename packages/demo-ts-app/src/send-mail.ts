import { config } from "dotenv"
config()
import { Mailer } from "@kennethkeim/api-utils-core"

const mailer = new Mailer("The Most Awesomest API")

console.log("Sending mail to", process.env["TEMP_RECIPIENT"])
mailer.send({
  to: process.env["TEMP_RECIPIENT"],
  subject: "Hello Friend",
  html: `
    <h1>Hi</h1>
    <p>This is a test from my mailer app. I hope you like it. The mailer will make it easy to send transactional emails from my APIs. I hope you are doing well today. Please note that whenever I am testing the mailer module, you'll get one of these emails. I hope that's ok. Cheers.</p>
    `,
})
