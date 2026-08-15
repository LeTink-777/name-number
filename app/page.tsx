"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Hash, Terminal, Zap } from "lucide-react";
import { MatrixRain } from "@/components/MatrixRain";
import { calculateNameNumber } from "@/lib/numerology";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
    };
  }, []);

  function submit() {
    const trimmed = name.trim();
    const result = calculateNameNumber(trimmed);

    if (!result) {
      setError("Введите имя буквами — русскими или латинскими.");
      return;
    }

    setError(null);
    setLoading(true);

    // Count-up while the rain intensifies, then hand off to the result page.
    let step = 0;
    const tick = () => {
      step += 1;
      setCounter(Math.floor(Math.random() * 100));
      if (step < 26) {
        timers.current.push(setTimeout(tick, 55));
      } else {
        setCounter(result.number);
        timers.current.push(
          setTimeout(() => {
            router.push(`/result?name=${encodeURIComponent(trimmed)}`);
          }, 550)
        );
      }
    };
    tick();
  }

  return (
    <>
      <MatrixRain intense={loading} />

      <main className="shell" style={{ paddingTop: 70, paddingBottom: 30 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.24em",
              color: "var(--text-secondary)",
              margin: "0 0 22px",
            }}
          >
            NUMEROLOGY / NAME
          </p>

          <h1 style={{ fontSize: "clamp(38px, 9vw, 78px)", marginBottom: 18 }}>
            Одно имя —<br />
            <span className="neon-text">один ответ</span>
          </h1>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 16,
              maxWidth: 480,
              margin: "0 auto 44px",
            }}
          >
            Без даты рождения, без времени, без города. Только имя — и число,
            которое оно даёт.
          </p>
        </motion.div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: "center" }}
          >
            <div className="neon-number">{counter}</div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--accent-neon)",
                fontSize: 13,
                letterSpacing: "0.16em",
              }}
            >
              РАСЧЁТ<span className="caret">_</span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
          >
            <label
              htmlFor="name"
              style={{
                display: "block",
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                letterSpacing: "0.16em",
                color: "var(--text-secondary)",
                marginBottom: 12,
              }}
            >
              ВВЕДИТЕ ИМЯ
            </label>

            <input
              id="name"
              className="field"
              type="text"
              autoComplete="given-name"
              placeholder="Дарья"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
            />

            {error ? (
              <p
                style={{
                  color: "#ff4d6d",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  textAlign: "center",
                  margin: "12px 0 0",
                }}
              >
                {error}
              </p>
            ) : null}

            <button
              type="button"
              className="btn"
              style={{ marginTop: 16 }}
              onClick={submit}
              disabled={name.trim().length === 0}
            >
              Узнать число имени
              <ArrowRight size={17} aria-hidden="true" />
            </button>

            <p
              style={{
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-secondary)",
                marginTop: 14,
              }}
            >
              Бесплатно · Мгновенно · Без регистрации
            </p>
          </motion.div>
        )}

        <section style={{ marginTop: 80 }}>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            }}
          >
            {[
              {
                icon: <Hash size={18} aria-hidden="true" />,
                title: "Как считается",
                text: "Каждая буква имени имеет числовое значение по русской нумерологической таблице. Сумма сводится к числу от 1 до 9 либо к мастер-числу 11 или 22.",
              },
              {
                icon: <Zap size={18} aria-hidden="true" />,
                title: "Почему без даты",
                text: "Дата рождения описывает задачу, имя — способ её решать. Это то, как вас считывают люди с первой секунды знакомства.",
              },
              {
                icon: <Terminal size={18} aria-hidden="true" />,
                title: "Что вы получите",
                text: "Число, его значение, слово-энергию — бесплатно. Денежный код, отношения и прогноз на 2026 год — в полной версии.",
              },
            ].map((item) => (
              <div key={item.title} className="card">
                <span className="neon-text">{item.icon}</span>
                <h2 style={{ fontSize: 15, margin: "10px 0 6px" }}>{item.title}</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 13.5, margin: 0 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
