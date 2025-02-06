import * as z from "zod"
import { fetchJson, getFirstZodIssue } from "@kennethkeim/core"
import { ConfigError } from "@kennethkeim/core"

export interface MailRecipient {
  email: string
  /** Maximum allowed characters are 70.*/
  name?: string
}

export interface MailSender {
  email?: string
  name?: string
  id?: string
}

export interface MailAttachment {
  /** Absolute urls only */
  url?: string
  /** Required if content is attached directly */
  name?: string
  /** Base64 content */
  content?: string
}

/** https://developers.brevo.com/reference/sendtransacemail */
interface SendMailApiRequest {
  sender: MailSender
  to: Array<MailRecipient>
  cc?: Array<MailRecipient>
  bcc?: Array<MailRecipient>
  subject: string
  /** Mandatory if not using template */
  htmlContent: string
  textContent?: string
  replyTo: MailRecipient
  /** ISO date to schedule email. Expect +- 5 min accuracy */
  scheduledAt?: string
  attachment?: MailAttachment[]
}

type PassThroughParams = Pick<
  SendMailApiRequest,
  "cc" | "bcc" | "scheduledAt" | "attachment"
>

export interface SendMailOptions extends PassThroughParams {
  to?: string | MailRecipient[]
  /** NOTE: email must be registered as a sender with Brevo */
  from?: MailSender
  subject: string
  html: string
  text?: string
  replyTo?: MailRecipient
}

const envSchema = z.object({
  apiKey: z.string().min(3),
  sysEventsSender: z.string().email(),
  sysEventsRecipient: z.string().email(),
})

export class Mailer {
  private env: z.infer<typeof envSchema>

  /** @param appName Name of your app as it appears in email sender. */
  constructor(private appName: string) {
    const envResult = envSchema.safeParse({
      apiKey: process.env["MAILER_API_KEY"],
      sysEventsSender: process.env["SYS_EVENTS_SENDER"],
      sysEventsRecipient: process.env["SYS_EVENTS_RECIPIENT"],
    })

    if (!envResult.success) {
      const zodIssue = getFirstZodIssue(envResult.error)
      throw new ConfigError(`Invalid Mailer environment variables. ${zodIssue}`)
    }

    this.env = envResult.data
  }

  public async send(options: SendMailOptions): Promise<void> {
    // Set up default recipient email or use provided recipient
    let to: MailRecipient[] = [{ email: this.env.sysEventsRecipient }]
    if (typeof options.to === "string") {
      to = [{ email: options.to }]
    } else if (options.to) {
      to = options.to
    }

    const apiOptions: SendMailApiRequest = {
      sender: options.from ?? {
        email: this.env.sysEventsSender,
        name: this.appName,
      },
      to,
      replyTo: options.replyTo ?? { email: this.env.sysEventsRecipient },
      subject: options.subject,
      htmlContent: options.html,
    }

    // Things to only set if provided
    if (options.text) apiOptions.textContent = options.text
    if (options.scheduledAt) apiOptions.scheduledAt = options.scheduledAt
    if (options.cc) apiOptions.cc = options.cc
    if (options.bcc) apiOptions.bcc = options.bcc
    if (options.attachment) apiOptions.attachment = options.attachment

    await fetchJson("https://api.brevo.com/v3/smtp/email", {
      headers: { "api-key": this.env.apiKey },
      method: "POST",
      body: JSON.stringify(apiOptions),
    })
  }
}
