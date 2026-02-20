import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";
import { CellData } from "@/app/api/cyclic/route";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getColMaxDigits(matrix: CellData[][] | null): number[] {
    if (!matrix || matrix.length === 0) return [];
    const cols = matrix[0].length;
    const result: number[] = new Array(cols).fill(1);
    for (let c = 0; c < cols; c++) {
        let maxNum = 0;
        for (let r = 0; r < matrix.length; r++) {
            maxNum = Math.max(maxNum, matrix[r][c].cellNumber);
        }
        result[c] = String(maxNum).length;
    }
    return result;
}

export function renderFormattedNumber(num: number, colIndex: number, colMaxDigits: number[], fallbackTotal: number) {
    const digits = colMaxDigits[colIndex] ?? String(fallbackTotal).length;
    const numStr = String(num);
    const padded = numStr.padStart(digits, "0");

    return React.createElement(
        "span",
        null,
        padded.split("").map((digit, i) =>
            React.createElement(
                "span",
                {
                    key: i,
                    style: {
                        opacity: i < digits - numStr.length ? 0 : 1,
                    },
                },
                digit,
            ),
        ),
    );
}
