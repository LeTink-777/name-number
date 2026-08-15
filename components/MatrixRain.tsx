"use client";

import { useEffect, useState } from "react";

const GLYPHS = "0123456789АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ";

type Column = {
  left: number;
  duration: number;
  delay: number;
  text: string;
};

/**
 * Columns are built after mount only: generating them during render would
 * produce different markup on the server and client.
 */
export function MatrixRain({ intense = false }: { intense?: boolean }) {
  const [columns, setColumns] = useState<Column[]>([]);

  useEffect(() => {
    const count = Math.min(46, Math.max(14, Math.floor(window.innerWidth / 30)));
    const next: Column[] = Array.from({ length: count }, (_, index) => {
      const length = 22 + Math.floor(Math.random() * 26);
      let text = "";
      for (let i = 0; i < length; i += 1) {
        text += GLYPHS[Math.floor(Math.random() * GLYPHS.length)] + "\n";
      }
      return {
        left: (index / count) * 100 + Math.random() * 1.6,
        duration: 7 + Math.random() * 11,
        delay: -Math.random() * 18,
        text,
      };
    });
    setColumns(next);
  }, []);

  return (
    <div className="matrix" data-intense={intense} aria-hidden="true">
      {columns.map((column, index) => (
        <div
          key={index}
          className="matrix-col"
          style={{
            left: `${column.left}%`,
            animationDuration: `${column.duration}s`,
            animationDelay: `${column.delay}s`,
          }}
        >
          {column.text}
        </div>
      ))}
    </div>
  );
}
