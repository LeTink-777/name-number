import path from 'node:path'
import React from 'react'
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer'

/**
 * Server-side PDF rendering for the paid report.
 *
 * The whole document is Russian, and the PDF standard-14 fonts (Helvetica and
 * friends) carry no Cyrillic: @react-pdf silently truncates each codepoint to
 * its low byte, so "Привет" is drawn as "@825B" with no error raised. A
 * Unicode TrueType face therefore has to be registered before anything renders.
 *
 * The bundled Roboto is subset to Latin + Cyrillic + the punctuation and
 * currency marks these reports actually use, which takes it from ~515 KB to
 * ~22 KB per weight.
 */

const FONT_DIR = path.join(process.cwd(), 'public', 'fonts')

// Module scope runs once per server instance, but Next's dev HMR can re-evaluate
// it; re-registering the same family throws, so the flag keeps it idempotent.
let fontsRegistered = false

function registerFonts(): void {
  if (fontsRegistered) return

  Font.register({
    family: 'Roboto',
    fonts: [
      { src: path.join(FONT_DIR, 'Roboto-Regular.ttf'), fontWeight: 'normal' },
      { src: path.join(FONT_DIR, 'Roboto-Bold.ttf'), fontWeight: 'bold' },
    ],
  })

  // Cyrillic has no hyphenation dictionary here, and the default English
  // hyphenator breaks Russian words in the wrong places. Return the word whole.
  Font.registerHyphenationCallback((word) => [word])

  fontsRegistered = true
}

const COLORS = {
  background: '#050508',
  card: '#0F0F16',
  accent: '#39FF14',
  text: '#FFFFFF',
  muted: '#8A8A99',
  footer: '#5F5F6B',
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.background,
    paddingTop: 44,
    paddingBottom: 64,
    paddingHorizontal: 40,
    fontFamily: 'Roboto',
  },
  header: {
    fontSize: 22,
    color: COLORS.accent,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subject: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  meta: {
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 14,
    padding: 14,
    backgroundColor: COLORS.card,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.accent,
    marginBottom: 7,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 1.6,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    fontSize: 8,
    color: COLORS.footer,
    textAlign: 'center',
  },
})

export type PdfSection = {
  title: string
  content: string
}

export type PdfData = {
  title: string
  userName: string
  subtitle?: string
  sections: PdfSection[]
  siteName: string
}

/**
 * `pdf(...).toBuffer()` resolves to a Node readable stream, not a Buffer,
 * despite the name. Draining it here keeps that detail out of the callers.
 */
function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk: Buffer | string) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    })
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

export async function generatePDF(data: PdfData): Promise<Buffer> {
  registerFonts()

  const doc = (
    <Document title={data.title} author={data.siteName} language="ru">
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{data.title}</Text>

        {data.userName ? <Text style={styles.subject}>{data.userName}</Text> : null}
        {data.subtitle ? <Text style={styles.meta}>{data.subtitle}</Text> : null}

        {data.sections.map((section, index) => (
          <View key={`${section.title}-${index}`} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.text}>{section.content}</Text>
          </View>
        ))}

        <Text style={styles.footer} fixed>
          {data.siteName} · Евдокимов Даниил Владимирович · ИНН 381928138362
        </Text>
      </Page>
    </Document>
  )

  return streamToBuffer(
    (await pdf(doc).toBuffer()) as unknown as NodeJS.ReadableStream,
  )
}
