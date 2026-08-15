const YOOKASSA_API = "https://api.yookassa.ru/v3/payments";

export type FetchedPayment = {
  id: string;
  status: string;
  paid: boolean;
  metadata: Record<string, string>;
};

/**
 * Читает платёж по идентификатору.
 *
 * Нужен, чтобы подтвердить: запрос на скачивание относится к реально
 * оплаченному заказу, и чтобы взять данные расчёта из самого платежа,
 * а не из тела запроса браузера.
 */
export async function getPayment(paymentId: string): Promise<FetchedPayment | null> {
  const shopId = process.env.NEXT_PUBLIC_YUKASSA_SHOP_ID;
  const secretKey = process.env.YUKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    throw new Error(
      "ЮKassa не настроена: задайте NEXT_PUBLIC_YUKASSA_SHOP_ID и YUKASSA_SECRET_KEY"
    );
  }

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");

  const response = await fetch(`${YOOKASSA_API}/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    id?: string;
    status?: string;
    paid?: boolean;
    metadata?: Record<string, string>;
  };

  if (!data.id || !data.status) return null;

  return {
    id: data.id,
    status: data.status,
    paid: Boolean(data.paid),
    metadata: data.metadata ?? {},
  };
}
