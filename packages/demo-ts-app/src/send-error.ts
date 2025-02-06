import { config } from "dotenv"
config()
import { emailError, Mailer } from "@kennethkeim/api-utils-core"

const mailer = new Mailer("The Most Awesomest API")

emailError(new Error("Oh no"), mailer, {
  event: "test-error-handler",
  eventType: "oltp",
  remediation: "there is no hope of recovery",
  notes: "give up",
}).then(() => console.log("Sent error email"))
