"use client";

import Link from "next/link";
import { Grid3x3, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";

interface ViewShellProps {
    showKbHints?: boolean;
    bgColor?: string;
    children: React.ReactNode;
}

export default function ViewShell({ showKbHints = false, bgColor = "#0a0a0a", children }: ViewShellProps) {
    const t = useTranslations("app");

    return (
        <div className="flex min-h-screen flex-col text-neutral-100" style={{ backgroundColor: bgColor }}>
            {/* Header */}
            <header className="sticky top-0 z-20 w-full border-b border-white/6 bg-black/25 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-2">
                    {/* Logo → home */}
                    <Link href="/" className="flex items-center gap-2">
                        <Grid3x3 className="h-5 w-5 text-emerald-400" />
                        <span className="text-xl font-bold bg-linear-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">cyclic-table</span>
                    </Link>

                    {/* Right controls */}
                    <div className="ml-auto flex items-center gap-4">
                        <Link
                            href="/"
                            className="group flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
                            aria-label="Back to home"
                        >
                            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                            <span className="hidden sm:inline">{t("back")}</span>
                        </Link>

                        <LanguageSwitcher />
                    </div>
                </div>
            </header>

            {/* Optional keyboard-shortcut strip */}
            {showKbHints && (
                <div className="flex place-items-center justify-center gap-4 py-2">
                    <Separator orientation="vertical" className="h-6 bg-white/10" />
                    <div className="hidden lg:flex items-center gap-4 text-xs text-neutral-500">
                        {(
                            [
                                { key: "Space", label: t("playPause") },
                                { key: "←", label: t("prev") },
                                { key: "→", label: t("next") },
                            ] as const
                        ).map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-1.5">
                                <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 font-mono text-[10px]">{key}</kbd>
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Page content */}
            <main className="flex-1">{children}</main>
        </div>
    );
}
