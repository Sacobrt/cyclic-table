"use client";

import { useLocale } from "next-intl";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { setLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "hr", name: "Hrvatski" },
] as const;

export default function LanguageSwitcher() {
    const currentLocale = useLocale();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-neutral-300 hover:bg-neutral-700/60 hover:text-neutral-100">
                    <Globe className="h-3.5 w-3.5" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-30 border-neutral-700 bg-neutral-800/95">
                {LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLocale(lang.code)}
                        className={cn(
                            "flex cursor-pointer items-center gap-2.5 text-sm",
                            currentLocale === lang.code ? "text-emerald-400" : "text-neutral-300 hover:text-neutral-100",
                        )}
                    >
                        <span className="flex-1">{lang.name}</span>
                        {currentLocale === lang.code && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
