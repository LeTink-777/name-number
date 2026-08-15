"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, MoveRight } from "lucide-react";
import { MatrixRain } from "@/components/MatrixRain";
import { TerminalPricing } from "@/components/TerminalPricing";
import { LOCKED_TITLES, PROFILES, calculateNameNumber } from "@/lib/numerology";

function ResultInner() {
  const params = useSearchParams();
  const rawName = params.get("name") ?? "";
  const result = calculateNameNumber(rawName);

  if (!result) {
    return (
      <main className="shell" style={{ paddingTop: 90, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Имя не распознано</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
          Вернитесь на главную и введите имя буквами.
        </p>
        <Link href="/" className="btn" style={{ maxWidth: 260, margin: "0 auto" }}>
          На главную
        </Link>
      </main>
    );
  }

  const profile = PROFILES[result.number];
  const displayName = rawName.trim();

  return (
    <>
      <MatrixRain />

      <main className="shell" style={{ paddingTop: 34, paddingBottom: 30 }}>
        <Link href="/" className="legal-back">
          <ArrowLeft size={15} aria-hidden="true" />
          <span>{"> другое имя"}</span>
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.2em",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            {displayName.toUpperCase()}
          </p>

          <div className="neon-number">{result.number}</div>

          <p
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            сумма букв: {result.sum}
            <MoveRight size={14} aria-hidden="true" />
            {result.number}
          </p>

          <div style={{ marginTop: 26 }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.18em",
                color: "var(--text-secondary)",
                margin: "0 0 4px",
              }}
            >
              ТВОЯ ЭНЕРГИЯ
            </p>
            <p
              className="neon-text"
              style={{
                fontFamily: "var(--font-head)",
                fontWeight: 700,
                fontSize: 34,
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {profile.energy}
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="card"
          style={{ marginTop: 34 }}
        >
          <p style={{ margin: 0, fontSize: 16 }}>{profile.free}</p>
        </motion.section>

        <section style={{ marginTop: 30 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              justifyContent: "center",
              marginBottom: 26,
            }}
          >
            {result.letters.map((item, index) => (
              <span
                key={`${item.letter}-${index}`}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  border: "1px solid var(--border)",
                  borderRadius: 2,
                  padding: "5px 7px",
                  color: "var(--text-secondary)",
                }}
              >
                {item.letter}
                <span className="neon-text" style={{ marginLeft: 4 }}>
                  {item.value}
                </span>
              </span>
            ))}
          </div>

          <h2 style={{ fontSize: 19, marginBottom: 14 }}>Закрытые разделы</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {LOCKED_TITLES.map((title, index) => (
              <div key={title} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <Lock size={14} className="neon-text" aria-hidden="true" />
                  <h3 style={{ fontSize: 15, margin: 0 }}>{title}</h3>
                </div>
                <p className="locked-body" style={{ margin: 0, fontSize: 13.5 }}>
                  {[profile.full, profile.money, profile.relationships, profile.forecast][index]}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 38 }}>
          <TerminalPricing name={rawName} />
        </section>
      </main>
    </>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main className="shell" style={{ paddingTop: 90, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
            {"> расчёт..."}
          </p>
        </main>
      }
    >
      <ResultInner />
    </Suspense>
  );
}
