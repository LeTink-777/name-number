import type { PlanId } from "@/lib/plans";

type CheckoutResponse = {
  confirmationUrl?: string;
  paymentId?: string;
  error?: string;
};

const PENDING_ORDER_KEY = "name_number_pending_order";

export type PendingOrder = {
  plan: string;
  /** Нужен /api/generate-pdf, чтобы подтвердить оплату перед выдачей PDF. */
  paymentId: string | null;
  /** Параметры расчёта — те же, что уходят в metadata платежа. */
  extra: Record<string, string>;
};

/** Переживает переход на страницу оплаты ЮKassa и обратно. */
export function savePendingOrder(order: PendingOrder): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(order));
  } catch {
    // Отчёт всё равно уходит письмом, даже если браузер ничего не сохранил.
  }
}

export function readPendingOrder(): PendingOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_ORDER_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingOrder>;
    if (typeof parsed?.plan !== "string") return null;

    return {
      plan: parsed.plan,
      paymentId: typeof parsed.paymentId === "string" ? parsed.paymentId : null,
      extra:
        parsed.extra && typeof parsed.extra === "object"
          ? (parsed.extra as Record<string, string>)
          : {},
    };
  } catch {
    return null;
  }
}

/**
 * Creates a YooKassa payment and redirects the browser to the hosted
 * confirmation page. Every payment method enabled on the shop is offered
 * there, because the request intentionally sends no payment_method_data.
 *
 * `extra` carries the values the result is computed from. They travel in the
 * payment metadata, which is the only channel the webhook can read them back
 * from once the buyer has left the site.
 */
export async function startCheckout(
  plan: PlanId,
  email: string,
  extra: Record<string, string> = {}
): Promise<string | null> {
  const res = await fetch("/api/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, email, extra }),
  });

  const data = (await res.json().catch(() => ({}))) as CheckoutResponse;

  if (!res.ok || !data.confirmationUrl) {
    return data.error ?? "Не удалось создать платёж. Попробуйте ещё раз.";
  }

  // Нужен /success, чтобы подтвердить оплату при скачивании PDF.
  savePendingOrder({ plan, paymentId: data.paymentId ?? null, extra });

  window.location.href = data.confirmationUrl;
  return null;
}
