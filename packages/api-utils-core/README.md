# What is this

A set of API utilities intended for my own personal/commercial use.

NOT INTENDED TO BE USED BY OTHERS. This utility library is intended to reduce my boilerplate API code, so it
will have my defaults hardcoded. APIs are subject to breaking changes.

# Mailer

Module to send mail via [Brevo](https://brevo.com) API

Set the following in your environment variables.

- `MAILER_API_KEY` (Brevo API key)
- `SYS_EVENTS_SENDER` (Default email to send from)
- `SYS_EVENTS_RECIPIENT` (Default email to send to - and set as the reply to)
