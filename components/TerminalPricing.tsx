"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PLANS, PLAN_ORDER, formatPrice, type PlanId } from "@/lib/plans";
import { startCheckout } from "@/lib/checkout";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const TYPE_SPEED = 16;
const STEP_PAUSE = 500;

type Step =
  | { kind: "line"; text: string; tone?: "muted" | "purple" }
  | { kind: "button"; plan: PlanId }
  | { kind: "email" };

const STEPS: Step[] = [
  { kind: "line", text: "> Инициализация...", tone: "muted" },
  { kind: "line", text: "> Анализ завершён." },
  { kind: "line", text: "> Доступно 3 уровня доступа:", tone: "muted" },
  { kind: "line", text: `> Базовый доступ: ${PLANS.basic.price} ₽` },
  { kind: "button", plan: "basic" },
  { kind: "line", text: `> Полный доступ: ${PLANS.full.price} ₽ (РЕКОМЕНДУЕТСЯ)`, tone: "purple" },
  { kind: "button", plan: "full" },
  { kind: "line", text: `> Максимум: ${PLANS.premium.price} ₽` },
  { kind: "button", plan: "premium" },
  { kind: "email" },
];

function useCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let start = Date.now();
    try {
      const saved = window.sessionStorage.getItem("nn_deadline");
      if (saved && Number(saved) > Date.now()) {
        start = Number(saved) - WINDOW_MS;
      } else {
        window.sessionStorage.setItem("nn_deadline", String(Date.now() + WINDOW_MS));
      }
    } catch {
      /* storage unavailable — timer simply restarts */
    }
    const deadline = start + WINDOW_MS;

    const update = () => setRemaining(Math.max(0, deadline - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;
  const totalSeconds = Math.floor(remaining / 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(totalSeconds / 3600))}:${pad(Math.floor((totalSeconds % 3600) / 60))}:${pad(totalSeconds % 60)}`;
}

export function TerminalPricing({ name }: { name: string }) {
  const [visible, setVisible] = useState(0);
  const [typed, setTyped] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const countdown = useCountdown();

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => pendingTimers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (visible >= STEPS.length) return;
    const step = STEPS[visible];

    if (step.kind !== "line") {
      const id = setTimeout(() => setVisible((value) => value + 1), STEP_PAUSE);
      timers.current.push(id);
      return () => clearTimeout(id);
    }

    let index = 0;
    setTyped("");
    const type = () => {
      index += 1;
      setTyped(step.text.slice(0, index));
      if (index < step.text.length) {
        const id = setTimeout(type, TYPE_SPEED);
        timers.current.push(id);
      } else {
        const id = setTimeout(() => setVisible((value) => value + 1), STEP_PAUSE);
        timers.current.push(id);
      }
    };
    type();
  }, [visible]);

  async function choose(plan: PlanId) {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("> Ошибка: укажите корректный e-mail.");
      return;
    }
    setError(null);
    setPending(plan);
    const failure = await startCheckout(plan, trimmed, { name });
    if (failure) {
      setError(`> Ошибка: ${failure}`);
      setPending(null);
    }
  }

  const emailReady = STEPS.findIndex((step) => step.kind === "email") < visible;
  const current: Step | undefined = visible < STEPS.length ? STEPS[visible] : undefined;

  return (
    <div className="terminal">
      {STEPS.slice(0, visible).map((step, index) => {
        if (step.kind === "line") {
          return (
            <p
              key={index}
              className={`terminal-line${step.tone === "muted" ? " terminal-line--muted" : ""}${
                step.tone === "purple" ? " terminal-line--purple" : ""
              }`}
            >
              {step.text}
            </p>
          );
        }

        if (step.kind === "button") {
          const plan = PLANS[step.plan];
          return (
            <button
              key={index}
              type="button"
              className="terminal-btn"
              data-recommended={step.plan === "full"}
              disabled={pending !== null}
              onClick={() => choose(step.plan)}
              title={`${plan.description} — ${formatPrice(plan.price)}`}
            >
              {pending === step.plan ? "> [ОТКРЫВАЕМ ОПЛАТУ...]" : "> [ВЫБРАТЬ]"}
            </button>
          );
        }

        return (
          <div key={index} style={{ marginTop: 8 }}>
            <p className="terminal-line terminal-line--muted">{"> Ваш e-mail для доступа:"}</p>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{
                width: "100%",
                maxWidth: 320,
                padding: "10px 12px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 2,
                color: "var(--accent-neon)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>
        );
      })}

      {current && current.kind === "line" ? (
        <p
          className={`terminal-line${current.tone === "muted" ? " terminal-line--muted" : ""}${
            current.tone === "purple" ? " terminal-line--purple" : ""
          }`}
        >
          {typed}
          <span className="caret">_</span>
        </p>
      ) : null}

      {error ? (
        <p className="terminal-line" style={{ color: "#ff4d6d", marginTop: 10 }}>
          {error}
        </p>
      ) : null}

      {emailReady ? (
        <>
          <p className="terminal-line terminal-line--muted" style={{ marginTop: 16 }}>
            {countdown ? `> Цена действует: ${countdown}` : "> Цена действует: --:--:--"}
          </p>
          <p className="terminal-line terminal-line--muted" style={{ fontSize: 12, marginTop: 10 }}>
            {"> Оплата через ЮKassa. Доступны все подключённые способы оплаты."}
          </p>
          <p className="terminal-line terminal-line--muted" style={{ fontSize: 12 }}>
            {"> Нажимая [ВЫБРАТЬ], вы принимаете "}
            <Link href="/offer">оферту</Link>
            {" и "}
            <Link href="/privacy">политику конфиденциальности</Link>
            {"."}
          </p>
        </>
      ) : null}
    </div>
  );
}
