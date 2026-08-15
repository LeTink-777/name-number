/**
 * Проверка источника уведомлений ЮKassa.
 *
 * ЮKassa ничего не подписывает — единственная доступная проверка это адрес
 * отправителя. Пока вебхук только писал в лог, открытый эндпоинт ничем не
 * грозил; теперь он формирует и отправляет платный отчёт, поэтому запрос с
 * чужого адреса означал бы бесплатную выдачу товара на любой e-mail.
 *
 * Документация: https://yookassa.ru/developers/using-api/webhooks
 */

/** Опубликованные адреса, с которых приходят уведомления ЮKassa. */
const ALLOWED_CIDRS = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.156.11/32",
  "77.75.156.35/32",
  "77.75.154.128/25",
  "2a02:5180::/32",
];

function ipToLong(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;

  let result = 0;
  for (const part of parts) {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;
    result = result * 256 + octet;
  }
  return result;
}

function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [range, bitsRaw] = cidr.split("/");
  const bits = Number(bitsRaw);
  const ipLong = ipToLong(ip);
  const rangeLong = ipToLong(range);

  if (ipLong === null || rangeLong === null || !Number.isInteger(bits)) return false;

  // Маска /0 сдвинула бы на 32 бита, что в JS не делает ничего — обрабатываем явно.
  const mask = bits === 0 ? 0 : (-1 << (32 - bits)) >>> 0;
  return (ipLong & mask) === (rangeLong & mask);
}

/** Адрес отправителя из заголовков прокси Vercel. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() ?? "";
}

export function isYookassaAddress(ip: string): boolean {
  if (!ip) return false;

  // Для IPv6 достаточно проверки префикса — блок опубликован один.
  if (ip.includes(":")) {
    return ip.toLowerCase().startsWith("2a02:5180:");
  }

  return ALLOWED_CIDRS.filter((cidr) => !cidr.includes(":")).some((cidr) =>
    isIpv4InCidr(ip, cidr)
  );
}
