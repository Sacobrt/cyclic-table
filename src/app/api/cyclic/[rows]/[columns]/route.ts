import { NextResponse } from "next/server";

export type CellData = {
    cellNumber: number;
    cellUp: boolean;
    cellDown: boolean;
    cellLeft: boolean;
    cellRight: boolean;
    cellBgColor: string;
};

function createEmptyCell(num = 0): CellData {
    return {
        cellNumber: num,
        cellUp: false,
        cellDown: false,
        cellLeft: false,
        cellRight: false,
        cellBgColor: "#333",
    };
}

type Corner = "tl" | "tr" | "bl" | "br" | "cl" | "cr" | "ct" | "cb";
type Direction = "up" | "down" | "left" | "right";
type Rotation = "cw" | "ccw";

function createCyclic(rows: number, columns: number, corner: Corner = "br", dir: Direction = "left", rotation: Rotation = "cw"): CellData[][] {
    const table: CellData[][] = Array.from({ length: rows }, () => Array.from({ length: columns }, () => createEmptyCell()));

    const total = rows * columns;
    let currentNum = 1;

    const dirOrder: Direction[] = ["right", "down", "left", "up"];
    const dirVectors: Record<Direction, [number, number]> = {
        right: [0, 1],
        down: [1, 0],
        left: [0, -1],
        up: [-1, 0],
    };

    let r = 0;
    let c = 0;
    switch (corner) {
        case "tl":
            r = 0;
            c = 0;
            break;
        case "tr":
            r = 0;
            c = columns - 1;
            break;
        case "bl":
            r = rows - 1;
            c = 0;
            break;
        case "br":
            r = rows - 1;
            c = columns - 1;
            break;
        case "cl":
        case "cr":
        case "ct":
        case "cb":
            r = Math.floor(rows / 2);
            c = Math.floor(columns / 2);
            break;
        default:
            r = rows - 1;
            c = columns - 1;
            break;
    }

    let dirIdx = dirOrder.indexOf(dir);
    if (dirIdx === -1) dirIdx = 0;

    const turnStep = rotation === "cw" ? 1 : 3;
    const isCenterStart = corner === "cl" || corner === "cr" || corner === "ct" || corner === "cb";

    if (isCenterStart) {
        table[r][c].cellNumber = currentNum++;

        let stepLen = 1;
        while (currentNum <= total) {
            for (let leg = 0; leg < 2 && currentNum <= total; leg++) {
                const [dr, dc] = dirVectors[dirOrder[dirIdx]];
                for (let s = 0; s < stepLen && currentNum <= total; s++) {
                    r += dr;
                    c += dc;
                    if (r < 0 || r >= rows || c < 0 || c >= columns) {
                        currentNum = total + 1;
                        break;
                    }
                    table[r][c].cellNumber = currentNum++;
                }
                dirIdx = (dirIdx + turnStep) % 4;
            }
            stepLen++;
        }
    } else {
        const visited = Array.from({ length: rows }, () => Array.from({ length: columns }, () => false));

        while (currentNum <= total) {
            table[r][c].cellNumber = currentNum++;
            visited[r][c] = true;

            if (currentNum > total) break;

            let [dr, dc] = dirVectors[dirOrder[dirIdx]];
            let nr = r + dr;
            let nc = c + dc;

            let attempts = 0;
            while (attempts < 4 && (nr < 0 || nr >= rows || nc < 0 || nc >= columns || visited[nr][nc])) {
                dirIdx = (dirIdx + turnStep) % 4;
                [dr, dc] = dirVectors[dirOrder[dirIdx]];
                nr = r + dr;
                nc = c + dc;
                attempts++;
            }

            r = nr;
            c = nc;
        }
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const cell = table[r][c];
            const n = cell.cellNumber;

            cell.cellUp = r > 0 && (table[r - 1][c].cellNumber === n + 1 || table[r - 1][c].cellNumber === n - 1);
            cell.cellDown = r < rows - 1 && (table[r + 1][c].cellNumber === n + 1 || table[r + 1][c].cellNumber === n - 1);
            cell.cellLeft = c > 0 && (table[r][c - 1].cellNumber === n + 1 || table[r][c - 1].cellNumber === n - 1);
            cell.cellRight = c < columns - 1 && (table[r][c + 1].cellNumber === n + 1 || table[r][c + 1].cellNumber === n - 1);

            if (n === 1) {
                cell.cellBgColor = "#808080";
                cell.cellUp = false;
                cell.cellDown = false;
                cell.cellLeft = false;
                cell.cellRight = false;
            }
        }
    }

    return table;
}

export async function GET(_request: Request, context: { params?: { rows?: string; columns?: string } | Promise<{ rows?: string; columns?: string }> }) {
    const params = await context.params;
    const rowStr = params?.rows;
    const colStr = params?.columns;

    const rowNumber = parseInt(rowStr ?? "", 10);
    const columnNumber = parseInt(colStr ?? "", 10);

    if (Number.isNaN(rowNumber) || Number.isNaN(columnNumber)) {
        return NextResponse.json({ message: "Rows and columns must be valid numbers!" }, { status: 400 });
    }
    if (rowNumber <= 0 || rowNumber > 10 || columnNumber <= 0 || columnNumber > 10) {
        return NextResponse.json({ message: "Whoops! Rows and columns should be between 1 and 10!" }, { status: 400 });
    }

    const url = new URL(_request.url);
    const cornerParam = (url.searchParams.get("corner") ?? "br") as Corner;
    const dirParam = (url.searchParams.get("dir") ?? "left") as Direction;
    const rotParam = (url.searchParams.get("rotation") ?? "cw") as Rotation;

    const validCorners: Corner[] = ["tl", "tr", "bl", "br", "cl", "cr", "ct", "cb"];
    const validDirs: Direction[] = ["up", "down", "left", "right"];
    const validRots: Rotation[] = ["cw", "ccw"];

    const corner = validCorners.includes(cornerParam) ? cornerParam : "br";
    const dir = validDirs.includes(dirParam) ? dirParam : "left";
    const rotation = validRots.includes(rotParam) ? rotParam : "cw";

    const matrix = createCyclic(rowNumber, columnNumber, corner, dir, rotation);
    return NextResponse.json(matrix, { status: 200 });
}
