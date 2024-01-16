# What is this

A set of API utilities intended for my own personal/commercial use.

# Mailer

Module to send mail via [Brevo](https://brevo.com) via the credentials from [this page](https://app.brevo.com/settings/keys/smtp).

Set the following in your environment variables.

- `MAILER_USER` (Brevo credentials)
- `MAILER_PASS` (Brevo credentials)
- `SYS_EVENTS_SENDER` (Default email to send from)
- `SYS_EVENTS_RECIPIENT` (Default email to send to - and set as the reply to)
