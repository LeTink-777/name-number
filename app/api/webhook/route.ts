import { NextResponse } from "next/server";
import { generatePDF } from "@/lib/pdf-generator";
import { sendResultEmail } from "@/lib/email";
import {
  buildSubtitle,
  generateResultSections,
  inputFromMetadata,
} from "@/lib/result-sections";
import { clientIp, isYookassaAddress } from "@/lib/webhook-guard";
import { SITE_NAME } from "@/lib/site-name";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Уведомления ЮKassa об оплате.
 *
 * Раньше у проекта вебхука не было вовсе: платёж проходил, а покупателю
 * ничего не уходило. Проверка адреса отправителя стоит здесь с самого начала —
 * ЮKassa ничего не подписывает, и без этой проверки любой, кто знает URL, мог
 * бы вызвать бесплатную выдачу платного отчёта на произвольный адрес.
 *
 * Документация: https://yookassa.ru/developers/using-api/webhooks
 */

type Notification = {
  type?: string;
  event?: string;
  object?: {
    id?: string;
    status?: string;
    paid?: boolean;
    amount?: { value?: string; currency?: string };
    metadata?: Record<string, string>;
  };
};

export async function POST(request: Request) {
  const ip = clientIp(request);

  if (!isYookassaAddress(ip)) {
    console.warn("[webhook] уведомление с неизвестного адреса отклонено", { ip });
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let notification: Notification;

  try {
    notification = (await request.json()) as Notification;
  } catch {
    // ЮKassa повторяет доставку при не-200, а на битом теле повтор бесполезен.
    console.error("[webhook] некорректное тело уведомления");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const payment = notification.object;

  if (payment?.status === "succeeded") {
    console.log("[webhook] платёж подтверждён", {
      paymentId: payment.id,
      plan: payment.metadata?.plan,
      email: payment.metadata?.email,
      amount: payment.amount?.value,
    });

    await deliverReport(payment.metadata ?? {}, payment.id ?? null);
  } else {
    console.log("[webhook] событие без подтверждённой оплаты", {
      event: notification.event,
      paymentId: payment?.id,
      status: payment?.status,
    });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

/**
 * Защита от повторной отправки одного и того же отчёта.
 *
 * ЮKassa повторяет уведомление, пока не получит 200, поэтому доставка,
 * завершившаяся после медленного ответа, ушла бы покупателю дважды. Множество
 * живёт в памяти инстанса и покрывает только повторы, попавшие на тот же
 * прогретый процесс — надёжное решение это запись заказа в базе, которой у
 * проекта пока нет.
 */
const delivered = new Set<string>();

async function deliverReport(
  metadata: Record<string, string>,
  paymentId: string | null
): Promise<void> {
  if (paymentId && delivered.has(paymentId)) {
    console.log("[webhook] отчёт уже отправлен, пропускаем", { paymentId });
    return;
  }

  const email = metadata.email;
  const input = inputFromMetadata(metadata);

  if (!email || !input) {
    console.error("[webhook] недостаточно данных для отправки отчёта", {
      paymentId,
      hasEmail: Boolean(email),
      hasInput: Boolean(input),
    });
    return;
  }

  const subtitle = buildSubtitle(input);

  try {
    const sections = generateResultSections(input, metadata.plan);

    const pdfBuffer = await generatePDF({
      title: "Ваше число имени",
      userName: subtitle,
      sections,
      siteName: SITE_NAME,
    });

    await sendResultEmail({
      to: email,
      subject: "Ваш разбор числа имени готов",
      userName: subtitle,
      resultHtml: sections
        .map(
          (section) =>
            `<h3 style="color:#39FF14;font-size:17px;margin:24px 0 8px;">${section.title}</h3>` +
            `<p style="font-size:15px;line-height:1.6;margin:0;white-space:pre-line;">${section.content}</p>`
        )
        .join(""),
      pdfBuffer,
      fileName: "chislo-imeni.pdf",
      siteName: SITE_NAME,
    });

    if (paymentId) delivered.add(paymentId);

    console.log("[webhook] отчёт отправлен", { paymentId, to: email });
  } catch (error) {
    // Ошибку намеренно не пробрасываем: ответ всё равно 200. Ответ не-200
    // заставит ЮKassa повторять уведомление часами, а сбой здесь относится к
    // доставке, а не к платежу — деньги уже приняты в любом случае.
    console.error("[webhook] не удалось отправить отчёт", {
      paymentId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
