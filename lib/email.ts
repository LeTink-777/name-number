import { Resend } from 'resend'

/**
 * Transactional delivery of the paid report via Resend.
 *
 * The client is created lazily: instantiating it at module scope would throw
 * during the build on any environment where RESEND_API_KEY is not set, which
 * includes CI and local `next build`.
 */

let client: Resend | null = null

function resend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('Resend is not configured: set RESEND_API_KEY')
  }
  if (!client) {
    client = new Resend(apiKey)
  }
  return client
}

export type SendResultEmailInput = {
  to: string
  subject: string
  userName: string
  resultHtml: string
  pdfBuffer: Buffer
  fileName: string
  siteName: string
}

export async function sendResultEmail({
  to,
  subject,
  userName,
  resultHtml,
  pdfBuffer,
  fileName,
  siteName,
}: SendResultEmailInput) {
  const { data, error } = await resend().emails.send({
    from: process.env.RESEND_FROM || 'onboarding@resend.dev',
    to,
    subject,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #050508; color: #FFFFFF;">
        <h1 style="color: #39FF14; font-size: 24px; margin-bottom: 20px;">${escapeHtml(siteName)}</h1>
        <p style="font-size: 16px; margin-bottom: 20px;">Здравствуйте, ${escapeHtml(userName)}!</p>
        <p style="font-size: 16px; margin-bottom: 30px;">Ваш персональный расчёт готов. PDF файл прикреплён к этому письму.</p>
        ${resultHtml}
        <hr style="border: 1px solid #0F0F16; margin: 30px 0;" />
        <p style="font-size: 12px; color: #5F5F6B;">
          Евдокимов Даниил Владимирович · ИНН 381928138362 · Самозанятый<br/>
          danyavdkmvv3@gmail.com · @dvdkmv
        </p>
      </div>
    `,
    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
      },
    ],
  })

  // Resend reports delivery failures in the body rather than by throwing, so a
  // silent `return` here would look like a successful send to the webhook.
  if (error) {
    throw new Error(`Resend refused the message: ${error.name} — ${error.message}`)
  }

  return data
}

/**
 * The name is interpolated into an HTML email; a buyer-supplied name
 * containing markup would otherwise be rendered as such.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
