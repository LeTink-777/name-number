import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { OWNER } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Оплата принята — Число имени",
  robots: { index: false, follow: false },
};

export default function SuccessPage() {
  return (
    <main className="legal-page legal-page--center">
      <CheckCircle2 size={56} className="success-icon" aria-hidden="true" />
      <h1>Оплата принята</h1>
      <p>
        Спасибо за заказ. Материал формируется и придёт на указанный вами адрес
        электронной почты в течение нескольких минут.
      </p>
      <p className="legal-meta">
        Если письмо не пришло — проверьте папку «Спам» или напишите нам.
      </p>
      <p className="legal-links">
        <a href={`mailto:${OWNER.email}`}>
          <Mail size={14} aria-hidden="true" /> {OWNER.email}
        </a>
        <span aria-hidden="true">·</span>
        <Link href="/">На главную</Link>
      </p>
    </main>
  );
}
