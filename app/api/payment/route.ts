import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import axios from "axios";
import { PLANS, isPlanId } from "@/lib/plans";
import { resolveReturnUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YOOKASSA_API = "https://api.yookassa.ru/v3/payments";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * ЮKassa ограничивает metadata 16 ключами и 512 символами на значение и
 * отклоняет платёж целиком при превышении. Пустые значения не отправляем.
 */
function sanitizeExtra(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};

  const result: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw !== "string" || raw.length === 0) continue;
    // 14 оставляет место под plan и email, которые добавляются ниже.
    if (Object.keys(result).length >= 14) break;
    result[key] = raw.slice(0, 512);
  }
  return result;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const body = payload as {
    plan?: unknown;
    email?: unknown;
    returnOrigin?: unknown;
    extra?: unknown;
  };

  if (!isPlanId(body.plan)) {
    return NextResponse.json({ error: "Неизвестный тариф." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Укажите корректный e-mail." }, { status: 400 });
  }

  const shopId = process.env.NEXT_PUBLIC_YUKASSA_SHOP_ID;
  const secretKey = process.env.YUKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    return NextResponse.json(
      { error: "Приём платежей временно недоступен." },
      { status: 503 }
    );
  }

  const plan = PLANS[body.plan];
  const amount = { value: plan.price.toFixed(2), currency: "RUB" };

  // No payment_method_data / payment_method_type is sent on purpose:
  // YooKassa then renders every payment method enabled for the shop.
  const request_body = {
    amount,
    capture: true,
    description: plan.description,
    confirmation: {
      type: "redirect",
      // Validated against the allowlist in lib/site.ts.
      return_url: resolveReturnUrl(body.returnOrigin, plan.id),
    },
    receipt: {
      customer: { email },
      items: [
        {
          description: plan.description,
          quantity: "1.00",
          amount,
          vat_code: 1,
          payment_mode: "full_payment",
          payment_subject: "service",
        },
      ],
    },
    // Параметры расчёта уезжают сюда: вебхук больше ниоткуда их не узнает.
    metadata: { ...sanitizeExtra(body.extra), plan: plan.id, email },
  };

  try {
    const response = await axios.post(YOOKASSA_API, request_body, {
      auth: { username: shopId, password: secretKey },
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": randomUUID(),
      },
      timeout: 20000,
    });

    const confirmationUrl = response.data?.confirmation?.confirmation_url;
    if (typeof confirmationUrl !== "string") {
      return NextResponse.json(
        { error: "Платёжная система не вернула ссылку на оплату." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      confirmationUrl,
      paymentId: response.data?.id ?? null,
    });
  } catch (error) {
    const description = axios.isAxiosError(error)
      ? error.response?.data?.description
      : undefined;
    console.error("YooKassa payment failed:", description ?? error);
    return NextResponse.json(
      { error: "Не удалось создать платёж. Попробуйте ещё раз." },
      { status: 502 }
    );
  }
}
