import { config } from "dotenv"
config()
import { handleApiError, Mailer } from "@kennethkeim/api-utils-core"

const mailer = new Mailer("The Most Awesomest API")

handleApiError(
  new Error("Oh no"),
  {
    event: "test-error-handler",
    eventType: "oltp",
    remediation: "there is no hope of recovery",
    notes: "give up",
  },
  mailer
).then(() => console.log("Sent error email"))
