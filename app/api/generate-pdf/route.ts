import { NextResponse } from "next/server";
import { generatePDF } from "@/lib/pdf-generator";
import {
  buildSubtitle,
  generateResultSections,
  inputFromMetadata,
} from "@/lib/result-sections";
import { getPayment } from "@/lib/yookassa";
import { SITE_NAME } from "@/lib/site-name";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Формирует платный PDF для кнопки скачивания на /success.
 *
 * Отчёт и есть товар, поэтому запрос обязан подтвердить, что относится к
 * состоявшейся оплате: браузер присылает идентификатор платежа, полученный от
 * /api/payment, а данные расчёта читаются из metadata этого платежа, а не из
 * тела запроса. Без проверки эндпоинт отдавал бы платный отчёт любому, а
 * доверие к телу запроса позволило бы покупателю базового тарифа получить
 * полную версию.
 */
export async function POST(request: Request) {
  let body: { paymentId?: unknown };

  try {
    body = (await request.json()) as { paymentId?: unknown };
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const paymentId = typeof body.paymentId === "string" ? body.paymentId.trim() : "";

  if (!paymentId) {
    return NextResponse.json(
      { error: "Не указан платёж. Откройте страницу заказа заново." },
      { status: 400 }
    );
  }

  let payment;
  try {
    payment = await getPayment(paymentId);
  } catch (error) {
    console.error("[generate-pdf] не удалось проверить платёж", {
      paymentId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Не удалось проверить оплату." }, { status: 502 });
  }

  if (!payment || payment.status !== "succeeded") {
    return NextResponse.json(
      { error: "Оплата по этому заказу не найдена." },
      { status: 403 }
    );
  }

  const input = inputFromMetadata(payment.metadata);

  if (!input) {
    return NextResponse.json({ error: "В заказе нет данных расчёта." }, { status: 422 });
  }

  const pdfBuffer = await generatePDF({
    title: "Ваше число имени",
    userName: buildSubtitle(input),
    sections: generateResultSections(input, payment.metadata.plan),
    siteName: SITE_NAME,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="chislo-imeni.pdf"',
      "Content-Length": String(pdfBuffer.length),
      "Cache-Control": "no-store",
    },
  });
}
