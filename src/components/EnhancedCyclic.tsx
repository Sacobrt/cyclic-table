"use client";

import React, { useEffect, useMemo, useState } from "react";
import CyclicService from "@/services/CyclicService";
import { CellData } from "@/app/api/cyclic/route";

export default function EnhancedCyclic() {
    const [rows, setRows] = useState<number>(5);
    const [columns, setColumns] = useState<number>(5);
    const [matrix, setMatrix] = useState<CellData[][] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentNumber, setCurrentNumber] = useState(0);
    const [speedMs, setSpeedMs] = useState(350);
    const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; data: CellData; r: number; c: number } | null>(null);
    const [corner, setCorner] = useState<"tl" | "tr" | "bl" | "br" | "cl" | "cr" | "ct" | "cb">("br");
    const [dir, setDir] = useState<"up" | "down" | "left" | "right">("left");
    const [rotation, setRotation] = useState<"cw" | "ccw">("cw");

    const total = useMemo(() => rows * columns, [rows, columns]);
    const [jumpTo, setJumpTo] = useState<number>(0);

    const matrixCols = matrix && matrix[0] ? matrix[0].length : 0;

    const dirVectors: Record<string, [number, number]> = {
        left: [0, -1],
        right: [0, 1],
        up: [-1, 0],
        down: [1, 0],
    };

    function getStartPos(cornerVal: typeof corner) {
        let sr = 0;
        let sc = 0;
        switch (cornerVal) {
            case "tl":
                sr = 0;
                sc = 0;
                break;
            case "tr":
                sr = 0;
                sc = columns - 1;
                break;
            case "bl":
                sr = rows - 1;
                sc = 0;
                break;
            case "br":
                sr = rows - 1;
                sc = columns - 1;
                break;
            case "cl":
            case "cr":
            case "ct":
            case "cb":
                sr = Math.floor(rows / 2);
                sc = Math.floor(columns / 2);
                break;
            default:
                sr = rows - 1;
                sc = columns - 1;
                break;
        }
        return [sr, sc];
    }

    const [startR, startC] = getStartPos(corner);
    const validDirList = Object.keys(dirVectors).filter((d) => {
        const [dr, dc] = dirVectors[d];
        const nr = startR + dr;
        const nc = startC + dc;
        return nr >= 0 && nr < rows && nc >= 0 && nc < columns;
    }) as Array<"left" | "right" | "up" | "down">;

    useEffect(() => {
        if (validDirList.length === 0) {
            return;
        }
        if (!validDirList.includes(dir)) {
            setDir(validDirList[0]);
        }
    }, [rows, columns, corner]);

    useEffect(() => {
        if ((rows === 2 || columns === 2) && corner === "cl") {
            setCorner("br");
        }
    }, [rows, columns, corner]);

    const showRotation = rows > 1 && columns > 1 && total > 1 && corner == "cl";

    async function load() {
        try {
            setError(null);
            const res = await CyclicService.get(rows, columns, { corner, dir, rotation });
            if ((res.data as any).message) {
                setError((res.data as any).message);
                setMatrix(null);
                return;
            }
            setMatrix(res.data as CellData[][]);
            setCurrentNumber(0);
            setIsPlaying(true);
        } catch (e) {
            console.error(e);
            setError("Failed to load cyclic matrix");
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isPlaying || !matrix) return;
        const interval = setInterval(() => {
            setCurrentNumber((prev) => (prev < total ? prev + 1 : prev));
        }, Math.max(50, speedMs));
        return () => clearInterval(interval);
    }, [isPlaying, matrix, speedMs, total]);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.code === "Space") {
                e.preventDefault();
                setIsPlaying((s) => !s);
            } else if (e.code === "ArrowRight") {
                setCurrentNumber((n) => Math.min(total, n + 1));
            } else if (e.code === "ArrowLeft") {
                setCurrentNumber((n) => Math.max(0, n - 1));
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [total]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (rows < 1 || rows > 10 || columns < 1 || columns > 10) {
            setError("Rows and columns must be between 1 and 10");
            return;
        }
        load();
    }

    useEffect(() => {
        setMatrix(null);
    }, [rows, columns, corner, dir, rotation]);

    function renderCell(cell: CellData, r: number, c: number) {
        const visible = cell.cellNumber <= currentNumber;
        const accent = cell.cellNumber === 1 ? "#808080" : cell.cellBgColor;

        const handlers = visible
            ? {
                  role: "button" as const,
                  tabIndex: 0,
                  onMouseEnter: (e: React.MouseEvent) => setHoverInfo({ x: e.clientX, y: e.clientY, data: cell, r, c }),
                  onMouseMove: (e: React.MouseEvent) => setHoverInfo({ x: e.clientX, y: e.clientY, data: cell, r, c }),
                  onMouseLeave: () => setHoverInfo(null),
                  onFocus: () => setHoverInfo({ x: 0, y: 0, data: cell, r, c }),
                  onBlur: () => setHoverInfo(null),
              }
            : {};

        return (
            <div
                key={`${r}-${c}`}
                {...handlers}
                aria-hidden={!visible}
                className={`relative flex items-center justify-center rounded-lg transition-transform duration-300 ease-in-out ${
                    visible
                        ? "scale-100 border border-neutral-600 opacity-100 shadow-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                        : "pointer-events-none scale-90 opacity-40 shadow-none"
                }`}
                style={{ width: 100, height: 100, backgroundColor: visible ? accent : "transparent" }}
            >
                {visible && <span className="text-3xl font-semibold text-neutral-100">{cell.cellNumber}</span>}

                {/* connectors (tiny bars) */}
                {visible &&
                    cell.cellUp &&
                    (() => {
                        const neighborDown = matrix && r > 0 && matrix[r - 1][c].cellDown;
                        return (
                            <div
                                className={`${
                                    neighborDown ? "rounded-b-sm" : "rounded-sm"
                                } absolute -top-2 left-1/2 h-3 w-2 -translate-x-1/2 bg-emerald-500 shadow`}
                            />
                        );
                    })()}
                {visible &&
                    cell.cellDown &&
                    (() => {
                        const neighborUp = matrix && r < rows - 1 && matrix[r + 1][c].cellUp;
                        return (
                            <div
                                className={`${
                                    neighborUp ? "rounded-t-sm" : "rounded-sm"
                                } absolute -bottom-2 left-1/2 h-3 w-2 -translate-x-1/2 bg-emerald-500 shadow`}
                            />
                        );
                    })()}
                {visible &&
                    cell.cellLeft &&
                    (() => {
                        const neighborRight = matrix && c > 0 && matrix[r][c - 1].cellRight;
                        return (
                            <div
                                className={`${
                                    neighborRight ? "rounded-r-sm" : "rounded-sm"
                                } absolute top-1/2 -left-2 h-2 w-3 -translate-y-1/2 bg-emerald-500 shadow`}
                            />
                        );
                    })()}
                {visible &&
                    cell.cellRight &&
                    (() => {
                        const neighborLeft = matrix && c < columns - 1 && matrix[r][c + 1].cellLeft;
                        return (
                            <div
                                className={`${
                                    neighborLeft ? "rounded-l-sm" : "rounded-sm"
                                } absolute top-1/2 -right-2 h-2 w-3 -translate-y-1/2 bg-emerald-500 shadow`}
                            />
                        );
                    })()}
            </div>
        );
    }

    function getNeighborInfo(r: number, c: number) {
        if (!matrix) return {} as Record<string, { n: number; r: number; c: number } | null>;
        const out: Record<string, { n: number; r: number; c: number } | null> = { up: null, down: null, left: null, right: null };
        if (r > 0) out.up = { n: matrix[r - 1][c].cellNumber, r: r - 1, c };
        if (r < rows - 1) out.down = { n: matrix[r + 1][c].cellNumber, r: r + 1, c };
        if (c > 0) out.left = { n: matrix[r][c - 1].cellNumber, r, c: c - 1 };
        if (c < columns - 1) out.right = { n: matrix[r][c + 1].cellNumber, r, c: c + 1 };
        return out;
    }

    const hoverNeighbors = hoverInfo ? getNeighborInfo(hoverInfo.r, hoverInfo.c) : null;

    return (
        <div className="flex items-center min-h-screen flex-col bg-neutral-900 p-0 text-neutral-100">
            {/* Top navbar */}
            <header className="z-20 w-full border-b border-neutral-800 bg-neutral-900/70 p-4 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center gap-4">
                    <form onSubmit={handleSubmit} className="flex w-full flex-wrap items-center gap-3">
                        <label className="flex flex-col">
                            <span className="text-xs text-neutral-400">Rows</span>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={rows}
                                onChange={(e) => setRows(Number(e.target.value))}
                                className="mt-1 w-20 rounded-lg bg-neutral-800 px-2 py-1 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </label>

                        <label className="flex flex-col">
                            <span className="text-xs text-neutral-400">Cols</span>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={columns}
                                onChange={(e) => setColumns(Number(e.target.value))}
                                className="mt-1 w-20 rounded-lg bg-neutral-800 px-2 py-1 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </label>

                        <label className="flex flex-col">
                            <span className="text-xs text-neutral-400">Start</span>
                            <select
                                value={corner}
                                onChange={(e) => setCorner(e.target.value as any)}
                                className="mt-1 w-36 rounded-lg bg-neutral-800 px-2 py-1 text-sm"
                            >
                                <option value="tl">Top Left</option>
                                <option value="tr">Top Right</option>
                                <option value="bl">Bottom Left</option>
                                <option value="br">Bottom Right</option>
                                <option value="cl" disabled={rows === 2 || columns === 2}>
                                    Center
                                </option>
                            </select>
                        </label>

                        <label className="flex flex-col">
                            <span className="text-xs text-neutral-400">Dir</span>
                            <select value={dir} onChange={(e) => setDir(e.target.value as any)} className="mt-1 w-28 rounded-lg bg-neutral-800 px-2 py-1 text-sm">
                                {validDirList.map((d) => (
                                    <option key={d} value={d}>
                                        {d.charAt(0).toUpperCase() + d.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {showRotation && (
                            <label className="flex flex-col">
                                <span className="text-xs text-neutral-400">Rot</span>
                                <select
                                    value={rotation}
                                    onChange={(e) => setRotation(e.target.value as any)}
                                    className="mt-1 w-36 rounded-lg bg-neutral-800 px-2 py-1 text-sm"
                                >
                                    <option value="cw">Clockwise</option>
                                    <option value="ccw">Counter-clockwise</option>
                                </select>
                            </label>
                        )}

                        <div className="ml-auto flex items-center gap-2">
                            <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-semibold">
                                Apply
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setRows(5);
                                    setColumns(5);
                                    setCorner("br");
                                    setDir("left");
                                    setRotation("cw");
                                    load();
                                }}
                                className="rounded-lg border border-neutral-700 px-3 py-1 text-sm"
                            >
                                Reset
                            </button>

                            <button type="button" onClick={() => setIsPlaying((s) => !s)} className="rounded-lg bg-emerald-500 px-3 py-1 text-sm">
                                {isPlaying ? "Pause" : "Play"}
                            </button>

                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={total}
                                    value={jumpTo}
                                    onChange={(e) => setJumpTo(Number(e.target.value))}
                                    className="w-20 rounded bg-neutral-800 px-2 py-1 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setCurrentNumber(Math.max(0, Math.min(total, Math.floor(jumpTo))))}
                                    className="rounded-md border px-3 py-1 text-sm"
                                >
                                    Go
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </header>

            {/* Grid */}
            <main className="flex-1 overflow-auto bg-neutral-900 p-6">
                <div className="mx-auto max-w-7xl">
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${matrixCols || columns}, 100px)` }}>
                        {matrix &&
                            (() => {
                                const cols = matrixCols || columns;
                                return matrix.flat().map((cell, idx) => {
                                    const r = Math.floor(idx / cols);
                                    const c = idx % cols;
                                    return renderCell(cell, r, c);
                                });
                            })()}
                    </div>
                </div>
            </main>

            {/* Hover tooltip */}
            {hoverInfo && (
                <div
                    className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-neutral-700 bg-neutral-800/80 p-3 text-sm text-neutral-100 backdrop-blur"
                    style={{ left: Math.min(hoverInfo.x + 12, window.innerWidth - 280), top: Math.max(hoverInfo.y - 80, 12) }}
                >
                    <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold">#{hoverInfo.data.cellNumber}</div>
                        <div className="text-xs text-neutral-400">
                            {hoverInfo.r + 1}×{hoverInfo.c + 1}
                        </div>
                    </div>
                    <div className="mt-2 text-sm text-neutral-300">
                        <div>
                            Up: <strong className="text-emerald-400">{hoverInfo?.data.cellUp ? "yes" : "no"}</strong>
                            {hoverNeighbors?.up && (
                                <span className="ml-2 text-xs text-neutral-400">
                                    ({hoverNeighbors.up.n} r{hoverNeighbors.up.r} c{hoverNeighbors.up.c})
                                </span>
                            )}
                        </div>
                        <div>
                            Down: <strong className="text-emerald-400">{hoverInfo?.data.cellDown ? "yes" : "no"}</strong>
                            {hoverNeighbors?.down && (
                                <span className="ml-2 text-xs text-neutral-400">
                                    ({hoverNeighbors.down.n} r{hoverNeighbors.down.r} c{hoverNeighbors.down.c})
                                </span>
                            )}
                        </div>
                        <div>
                            Left: <strong className="text-emerald-400">{hoverInfo?.data.cellLeft ? "yes" : "no"}</strong>
                            {hoverNeighbors?.left && (
                                <span className="ml-2 text-xs text-neutral-400">
                                    ({hoverNeighbors.left.n} r{hoverNeighbors.left.r} c{hoverNeighbors.left.c})
                                </span>
                            )}
                        </div>
                        <div>
                            Right: <strong className="text-emerald-400">{hoverInfo?.data.cellRight ? "yes" : "no"}</strong>
                            {hoverNeighbors?.right && (
                                <span className="ml-2 text-xs text-neutral-400">
                                    ({hoverNeighbors.right.n} r{hoverNeighbors.right.r} c{hoverNeighbors.right.c})
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-neutral-400">
                        Position: row {hoverInfo?.r! + 1}, col {hoverInfo?.c! + 1}
                    </div>
                </div>
            )}

            {/* Mini-map */}
            {matrix && (
                <div className="fixed right-6 bottom-6 z-40 rounded-lg border border-neutral-700 bg-neutral-800/60 p-3">
                    <div className="mb-2 text-xs text-neutral-300">Mini-map</div>
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 10px)`, gap: 4 }}>
                        {matrix.flat().map((cell, idx) => {
                            const cols = matrixCols || columns;
                            const r = Math.floor(idx / cols);
                            const c = idx % cols;
                            return <div key={`${r}-${c}`} style={{ width: 10, height: 10 }} className={cell.cellNumber <= currentNumber ? "bg-emerald-400" : ""} />;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
