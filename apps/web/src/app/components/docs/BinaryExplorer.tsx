"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useDictionary } from "@/i18n/context";

function toBits(value: number, width: number): number[] {
  const wrapped = ((value % 2 ** width) + 2 ** width) % 2 ** width;
  return Array.from({ length: width }, (_, index) => (wrapped >> (width - 1 - index)) & 1);
}

/** Click bits to flip them and watch the denary (and hex) value follow. */
export function BinaryExplorer({
  value,
  bits: width = 8,
  mode = "unsigned",
  showHex = false,
  showShifts = false,
}: {
  value: number;
  bits?: number;
  mode?: "unsigned" | "twos";
  showHex?: boolean;
  showShifts?: boolean;
}) {
  const t = useDictionary().docs.visual;
  const [bits, setBits] = useState(() => toBits(value, width));
  const [lost, setLost] = useState<{ bit: number; side: "left" | "right" } | null>(null);

  const places = bits.map((_, index) => {
    const place = 2 ** (width - 1 - index);
    return mode === "twos" && index === 0 ? -place : place;
  });
  const total = bits.reduce((sum, bit, index) => sum + bit * places[index], 0);
  const terms = places.filter((_, index) => bits[index] === 1);
  const nibbles = Array.from({ length: Math.ceil(width / 4) }, (_, index) =>
    parseInt(bits.slice(index * 4, index * 4 + 4).join(""), 2),
  );

  function flip(index: number) {
    setLost(null);
    setBits((current) => current.map((bit, i) => (i === index ? 1 - bit : bit)));
  }

  function shift(side: "left" | "right") {
    setLost({ bit: side === "left" ? bits[0] : bits[width - 1], side });
    setBits(side === "left" ? [...bits.slice(1), 0] : [0, ...bits.slice(0, -1)]);
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <div className="mx-auto flex w-max gap-1.5">
          {bits.map((bit, index) => (
            <div key={index} className={`flex flex-col items-center gap-1.5 ${showHex && index % 4 === 3 && index < width - 1 ? "mr-3" : ""}`}>
              <span className={`text-[11px] tabular-nums ${places[index] < 0 ? "font-semibold text-[var(--orange)]" : "text-[var(--text3)]"}`}>
                {places[index]}
              </span>
              <button
                type="button"
                onClick={() => flip(index)}
                className="doc-bit"
                data-on={bit === 1}
                aria-label={`${t.bit} ${places[index]}: ${bit}`}
                aria-pressed={bit === 1}
              >
                {bit}
              </button>
            </div>
          ))}
        </div>
        {showHex ? (
          <div className="mx-auto mt-2 flex w-max gap-[1.125rem]">
            {nibbles.map((nibble, index) => (
              <div key={index} className="flex w-[11.125rem] flex-col items-center">
                <span className="h-2 w-full rounded-t border-x border-t border-[var(--separator)]" />
                <span className="mt-1 font-mono text-lg font-semibold text-[var(--accent)]">
                  {nibble.toString(16).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-baseline justify-center gap-x-6 gap-y-2 text-sm">
        <span>
          <span className="text-[var(--text3)]">{t.denary} </span>
          <span className="font-mono text-xl font-semibold tabular-nums">{total}</span>
        </span>
        {showHex ? (
          <span>
            <span className="text-[var(--text3)]">{t.hex} </span>
            <span className="font-mono text-xl font-semibold">
              {nibbles.map((nibble) => nibble.toString(16).toUpperCase()).join("")}
            </span>
          </span>
        ) : null}
      </div>
      <div className="text-center font-mono text-xs text-[var(--text2)]">
        {terms.length ? `${terms.join(" + ").replace(/\+ -/g, "- ")} = ${total}` : `0 = 0`}
      </div>

      {showShifts ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" className="doc-ctl" onClick={() => shift("left")}>
            {t.shiftLeft}
          </button>
          <button type="button" className="doc-ctl" onClick={() => shift("right")}>
            {t.shiftRight}
          </button>
          <button
            type="button"
            className="doc-ctl"
            onClick={() => {
              setBits(toBits(value, width));
              setLost(null);
            }}
            aria-label={t.reset}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      ) : null}
      {lost ? (
        <div className="text-center text-xs" role="status">
          {lost.bit === 1 ? (
            <span className="font-semibold text-[var(--red)]">
              {lost.side === "left" ? t.shiftLostLeft : t.shiftLostRight}
            </span>
          ) : (
            <span className="text-[var(--text3)]">{lost.side === "left" ? t.shiftedLeft : t.shiftedRight}</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
