import type { PlanId } from "@/lib/plans";

type CheckoutResponse = {
  confirmationUrl?: string;
  error?: string;
};

/**
 * Creates a YooKassa payment and redirects the browser to the hosted
 * confirmation page. Every payment method enabled on the shop is offered
 * there, because the request intentionally sends no payment_method_data.
 */
export async function startCheckout(plan: PlanId, email: string): Promise<string | null> {
  const res = await fetch("/api/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, email }),
  });

  const data = (await res.json().catch(() => ({}))) as CheckoutResponse;

  if (!res.ok || !data.confirmationUrl) {
    return data.error ?? "Не удалось создать платёж. Попробуйте ещё раз.";
  }

  window.location.href = data.confirmationUrl;
  return null;
}
