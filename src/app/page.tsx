"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Grid3x3, ArrowUpRight, Table, Cog, Layers } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// Animation fill-order generators
function sequentialOrder(rows: number, cols: number): number[] {
    return Array.from({ length: rows * cols }, (_, i) => i);
}

function diagonalOrder(rows: number, cols: number): number[] {
    return Array.from({ length: rows * cols }, (_, i) => i).sort((a, b) => {
        const da = Math.floor(a / cols) + (a % cols);
        const db = Math.floor(b / cols) + (b % cols);
        return da !== db ? da - db : (a % cols) - (b % cols);
    });
}

function spiralOrder(rows: number, cols: number): number[] {
    const result: number[] = [];
    let top = 0,
        bottom = rows - 1,
        left = 0,
        right = cols - 1;

    while (top <= bottom && left <= right) {
        for (let c = left; c <= right; c++) result.push(top * cols + c);
        top++;

        for (let r = top; r <= bottom; r++) result.push(r * cols + right);
        right--;

        if (top <= bottom) {
            for (let c = right; c >= left; c--) result.push(bottom * cols + c);
            bottom--;
        }
        if (left <= right) {
            for (let r = bottom; r >= top; r--) result.push(r * cols + left);
            left++;
        }
    }
    return result;
}

// Random palette generator
function randomPalette(count: number, hues: number[], sRange: [number, number], lRange: [number, number]): string[] {
    return Array.from({ length: count }, (_, i) => {
        const h = hues[i % hues.length];
        const s = Math.round(sRange[0] + Math.random() * (sRange[1] - sRange[0]));
        const l = Math.round(lRange[0] + Math.random() * (lRange[1] - lRange[0]));
        return `hsl(${h} ${s}% ${l}%)`;
    });
}

// Per-variant preview configurations
const PREVIEW_CONFIGS = {
    v0: {
        cols: 5,
        rows: 5,
        speed: 400,
        colors: randomPalette(
            25,
            [130, 138, 145, 152, 160], // green hue band
            [45, 72],
            [14, 46],
        ),
        order: sequentialOrder(5, 5),
        hints: ["Rows × Cols", "500ms step reveal", "Edge connectors", "Cell hover dim"],
    },
    v1: {
        cols: 5,
        rows: 5,
        speed: 250,
        colors: randomPalette(
            25,
            [215, 220, 225, 230], // blue hue band
            [55, 85],
            [16, 52],
        ),
        order: diagonalOrder(5, 5),
        hints: ["8 start corners", "4 directions", "CW / CCW rotation", "Speed control", "⌨ Space · ← →"],
    },
    v2: {
        cols: 5,
        rows: 5,
        speed: 200,
        colors: randomPalette(
            25,
            [265, 160, 272, 155, 278, 165], // violet ↔ emerald alternating hues
            [52, 80],
            [18, 50],
        ),
        order: spiralOrder(5, 5),
        hints: ["Speed scrubber", "Interactive MiniMap", "Progress bar", "Hover tooltips", "Jump-to cell", "⌨ Shortcuts"],
    },
};

type PaletteKey = keyof typeof PREVIEW_CONFIGS;

// Mini animated matrix preview
function MatrixPreview({ paletteKey, active }: { paletteKey: PaletteKey; active: boolean }) {
    const cfg = PREVIEW_CONFIGS[paletteKey];
    const { cols, rows, colors, order, hints, speed } = cfg;
    const total = rows * cols;
    const loopLength = total + 3;

    const [step, setStep] = useState(1);

    useEffect(() => {
        if (!active) return;
        const id = setInterval(() => setStep((s) => (s >= loopLength ? 1 : s + 1)), speed);
        return () => clearInterval(id);
    }, [active, speed, loopLength]);

    const localStep = step - 1; // 0-based filled count
    const filledSet = new Set(order.slice(0, localStep));
    const activeCellIdx = localStep > 0 ? order[localStep - 1] : -1;
    const fillPos = Object.fromEntries(order.map((cellIdx, pos) => [cellIdx, pos + 1]));

    return (
        <div className="space-y-3" aria-hidden="true">
            {/* Matrix grid */}
            <div className="relative select-none" style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "4px" }}>
                {Array.from({ length: total }, (_, i) => {
                    const color = colors[i];
                    const visible = filledSet.has(i);
                    const active = i === activeCellIdx;

                    return (
                        <div
                            key={i}
                            className="aspect-square xl:w-18 xl:h-18 rounded flex items-center justify-center font-mono font-bold"
                            style={{
                                fontSize: "18px",
                                backgroundColor: visible ? `${color}c8` : "rgba(255,255,255,0.03)",
                                border: `1px solid ${visible ? color : "rgba(255,255,255,0.07)"}`,
                                color: visible ? "rgba(255,255,255,0.75)" : "transparent",
                                transform: active ? "scale(1.2)" : visible ? "scale(1)" : "scale(0.8)",
                                opacity: visible ? 1 : 0.15,
                                boxShadow: active ? `0 0 10px ${color}b0` : "none",
                                transition: "all 0.11s ease",
                                zIndex: active ? 1 : 0,
                                position: "relative",
                            }}
                        >
                            {visible ? fillPos[i] : ""}
                        </div>
                    );
                })}
            </div>

            {/* Feature hint chips */}
            <div className="flex flex-wrap gap-1">
                {hints.map((label) => (
                    <span
                        key={label}
                        className="inline-flex items-center rounded px-1.5 py-0.5 font-medium"
                        style={{
                            fontSize: "9px",
                            background: "rgba(255,255,255,0.045)",
                            color: "rgba(255,255,255,0.32)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            letterSpacing: "0.02em",
                        }}
                    >
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
}

// Main page
export default function Home() {
    const t = useTranslations("app");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const id = setTimeout(() => setMounted(true), 60);
        return () => clearTimeout(id);
    }, []);

    // Card definitions
    const cards = [
        {
            key: "v0" as PaletteKey,
            href: "/v0",
            icon: <Table className="h-3.5 w-3.5" />,
            label: "v0",
            desc: t("v0Desc"),
            accent: "#22c55e",
            glow: "#22c55e",
        },
        {
            key: "v1" as PaletteKey,
            href: "/v1",
            icon: <Cog className="h-3.5 w-3.5" />,
            label: "v1",
            desc: t("v1Desc"),
            accent: "#3b82f6",
            glow: "#3b82f6",
        },
        {
            key: "v2" as PaletteKey,
            href: "/v2",
            icon: <Layers className="h-3.5 w-3.5" />,
            label: "v2",
            desc: t("v2Desc"),
            accent: "#a78bfa",
            glow: "#8b5cf6",
        },
    ];

    return (
        <div
            className="flex min-h-screen flex-col text-neutral-100"
            style={{
                backgroundColor: "#03060e",
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.032) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
            }}
        >
            {/* Header */}
            <header className="sticky top-0 z-20 w-full border-b border-white/6 bg-black/25 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-2">
                    <Link href="/" className="flex items-center gap-2">
                        <Grid3x3 className="h-5 w-5 text-emerald-400" />
                        <span className="text-xl font-bold bg-linear-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">cyclic-table</span>
                    </Link>
                    <div className="ml-auto">
                        <LanguageSwitcher />
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1">
                <div className="mx-auto container px-5 xl:px-0 py-20">
                    {/* Hero */}
                    <div className="mb-20 text-center">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/6 px-3.5 py-1.5 text-xs font-medium text-emerald-400">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            {t("interactiveVis")}
                        </div>

                        <h1 className="mb-5 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                            <span className="bg-linear-to-r from-emerald-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">cyclic-table</span>
                        </h1>

                        <p className="mx-auto max-w-lg text-base leading-relaxed text-neutral-400 sm:text-lg">{t("heroSubtitle")}</p>
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                        {cards.map((card, idx) => (
                            <Link
                                key={card.key}
                                href={card.href}
                                className={cn(
                                    "group relative text-left overflow-hidden rounded-2xl",
                                    "border border-white/8 bg-white/2.5 backdrop-blur-sm",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
                                )}
                                style={{
                                    opacity: mounted ? 1 : 0,
                                    transform: mounted ? "none" : "translateY(20px)",
                                    transition: [
                                        `opacity 0.55s ease ${idx * 110}ms`,
                                        `transform 0.55s ease ${idx * 110}ms`,
                                        "border-color 0.25s ease",
                                        "box-shadow 0.25s ease",
                                    ].join(", "),
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = `${card.glow}45`;
                                    e.currentTarget.style.boxShadow = `0 4px 52px ${card.glow}18`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                                aria-label={`Open ${card.label}`}
                            >
                                {/* Top hairline accent */}
                                <div
                                    className="absolute inset-x-0 top-0 h-px opacity-50 transition-opacity duration-300 group-hover:opacity-100"
                                    style={{ background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)` }}
                                />

                                {/* Card body */}
                                <div className="p-6">
                                    <div className="mb-5 flex items-center justify-between">
                                        <div
                                            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                                            style={{ background: `${card.accent}1c`, color: card.accent }}
                                        >
                                            {card.icon}
                                            {card.label}
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-neutral-600 transition-all duration-200 group-hover:text-neutral-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </div>

                                    <MatrixPreview paletteKey={card.key} active={true} />
                                </div>

                                {/* Footer */}
                                <div className="border-t border-white/5 px-6 py-4">
                                    <p className="text-sm leading-relaxed text-neutral-500 transition-colors duration-200 group-hover:text-neutral-300">
                                        {card.desc}
                                    </p>
                                </div>

                                {/* Ambient bottom glow */}
                                <div
                                    className="pointer-events-none absolute inset-x-0 bottom-0 h-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                    style={{ background: `linear-gradient(to top, ${card.glow}1e, transparent)` }}
                                />
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
