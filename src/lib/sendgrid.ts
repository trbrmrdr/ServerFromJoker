import sendGrid from '@sendgrid/mail'
import { config } from '../config'

sendGrid.setApiKey(config.sendgridApiKey)

export const sendEmail = async ({ email, subject, data, template }: any, logger: any) => {
  if (logger) {
    logger.debug({ email, subject, data, template }, 'Send email')
  }
  await sendGrid.send({
    to: email,
    subject,
    from: {
      email: config.sendgridEmailFrom,
      name: 'Joker App'
    },
    reply_to: {
      email: config.sendgridEmailFrom,
      name: 'Joker App'
    },
    dynamic_template_data: data,
    template_id: template
  } as any)
}
