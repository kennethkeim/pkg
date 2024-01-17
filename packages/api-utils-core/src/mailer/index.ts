import * as nodemailer from "nodemailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport"
import * as z from "zod"
import { getFirstZodIssue } from "~/errors/zod-errors"

export interface SendMailOptions {
  to?: string
  from?: string
  subject: string
  html: string
}

const envSchema = z.object({
  user: z.string().email(),
  pass: z.string().min(3),
  sysEventsSender: z.string().email(),
  sysEventsRecipient: z.string().email(),
})

export class Mailer {
  private transporter: nodemailer.Transporter

  /** @param appName Name of your app as it appears in email sender. */
  constructor(appName: string) {
    const envResult = envSchema.safeParse({
      user: process.env["MAILER_USER"],
      pass: process.env["MAILER_PASS"],
      sysEventsSender: process.env["SYS_EVENTS_SENDER"],
      sysEventsRecipient: process.env["SYS_EVENTS_RECIPIENT"],
    })

    if (!envResult.success) {
      const zodIssue = getFirstZodIssue(envResult.error)
      throw new Error(`Invalid Mailer environment variables. ${zodIssue}`)
    }

    const env = envResult.data

    // https://app.brevo.com/settings/keys/smtp
    // https://nodemailer.com/smtp/#tls-options
    const smtpTransportOptions: SMTPTransport.Options = {
      auth: { user: env.user, pass: env.pass },
      host: "smtp-relay.brevo.com",
      port: 587,
      // Does not mean we're not using TLS, see nodemailer link above
      secure: false,
      // Require STARTTLS
      requireTLS: true,
    }

    const defaults: SMTPTransport.Options = {
      to: env.sysEventsRecipient,
      from: `"${appName}" <${env.sysEventsSender}>`,
      replyTo: env.sysEventsRecipient,
    }

    // create reusable transporter object using credentials and defaults
    this.transporter = nodemailer.createTransport(
      smtpTransportOptions,
      defaults
    )

    // automatically provide plain text version of all emails
    // htmlToText is from nodemailer-html-to-text, but we probably don't need it
    // it's about as big as nodemailer itself
    // this.transporter.use("compile", htmlToText());
  }

  public async send(options: SendMailOptions): Promise<void> {
    await this.transporter.sendMail(options)
  }
}
