"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, Mail } from "lucide-react";
import { OWNER } from "@/lib/plans";
import { readPendingOrder, type PendingOrder } from "@/lib/checkout";
import { generateResultSections, inputFromMetadata } from "@/lib/result-sections";

/**
 * Страница после оплаты.
 *
 * Разбор открывается здесь сразу: параметры расчёта и тариф сохранены в
 * localStorage перед уходом на ЮKassa, а тот же построитель разделов
 * используется в письме и в PDF, поэтому все три источника совпадают.
 */
export function SuccessView() {
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    setOrder(readPendingOrder());
  }, []);

  const sections = useMemo(() => {
    if (!order) return [];
    const input = inputFromMetadata(order.extra);
    return input ? generateResultSections(input, order.plan) : [];
  }, [order]);

  async function downloadPDF() {
    if (!order?.paymentId) {
      setDownloadError(
        "Не нашли номер платежа в этом браузере. Разбор отправлен вам на почту."
      );
      return;
    }

    setDownloading(true);
    setDownloadError("");

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: order.paymentId }),
      });

      if (!response.ok) throw new Error(`PDF request failed with ${response.status}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "chislo-imeni.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Немедленный revoke в некоторых браузерах отменяет загрузку.
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setDownloadError("Не удалось скачать PDF. Он также отправлен вам на почту.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="legal-page">
      <div style={{ textAlign: "center" }}>
        <CheckCircle2 size={56} className="success-icon" aria-hidden="true" />
        <h1>Оплата прошла успешно!</h1>
        <p>
          Ваш разбор открыт ниже. Копия отправлена на указанный вами адрес
          электронной почты.
        </p>

        <button
          type="button"
          className="btn"
          onClick={downloadPDF}
          disabled={downloading}
          style={{ marginTop: 20, maxWidth: 320, marginInline: "auto" }}
        >
          <Download size={18} aria-hidden="true" />
          {downloading ? "Готовим PDF..." : "Скачать PDF"}
        </button>

        {downloadError ? (
          <p className="legal-meta" role="alert">
            {downloadError}
          </p>
        ) : null}
      </div>

      {sections.length > 0 ? (
        <section style={{ marginTop: 32, display: "grid", gap: 12 }} aria-label="Ваш разбор">
          {sections.map((section) => (
            <article
              key={section.title}
              style={{
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                borderRadius: 12,
                padding: 20,
                textAlign: "left",
              }}
            >
              <h2 style={{ fontSize: 17, margin: 0, color: "var(--accent-neon)" }}>
                {section.title}
              </h2>
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "var(--text-secondary)",
                  whiteSpace: "pre-line",
                }}
              >
                {section.content}
              </p>
            </article>
          ))}
        </section>
      ) : (
        <p className="legal-meta" style={{ textAlign: "center" }}>
          Разбор придёт на указанный вами адрес электронной почты в течение
          нескольких минут. Если письма нет — проверьте папку «Спам».
        </p>
      )}

      <p className="legal-links" style={{ marginTop: 28 }}>
        <a href={`mailto:${OWNER.email}`}>
          <Mail size={14} aria-hidden="true" /> {OWNER.email}
        </a>
        <span aria-hidden="true">·</span>
        <Link href="/">На главную</Link>
      </p>
    </main>
  );
}
