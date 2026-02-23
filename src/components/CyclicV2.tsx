"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CyclicService from "@/services/CyclicService";
import { CellData } from "@/app/api/cyclic/route";
import { cn, getColMaxDigits, renderFormattedNumber } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
    Play,
    Pause,
    RotateCcw,
    Zap,
    Clock,
    Grid3x3,
    Target,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    SkipBack,
    SkipForward,
    ChevronsRight,
    AlertCircle,
} from "lucide-react";

type Corner = "tl" | "tr" | "bl" | "br" | "cl" | "cr" | "ct" | "cb";
type Direction = "up" | "down" | "left" | "right";
type Rotation = "cw" | "ccw";

interface HoverInfo {
    x: number;
    y: number;
    data: CellData;
    r: number;
    c: number;
}

interface NeighborMap {
    up: { n: number; r: number; c: number } | null;
    down: { n: number; r: number; c: number } | null;
    left: { n: number; r: number; c: number } | null;
    right: { n: number; r: number; c: number } | null;
}

interface MatrixCellProps {
    cell: CellData;
    r: number;
    c: number;
    rows: number;
    columns: number;
    matrix: CellData[][];
    visible: boolean;
    isCurrent: boolean;
    colMaxDigits: number[];
    total: number;
    onHoverEnter: (e: React.MouseEvent, cell: CellData, r: number, c: number) => void;
    onHoverMove: (e: React.MouseEvent, cell: CellData, r: number, c: number) => void;
    onHoverLeave: () => void;
}

function MatrixCell({ cell, r, c, rows, columns, matrix, visible, isCurrent, colMaxDigits, total, onHoverEnter, onHoverMove, onHoverLeave }: MatrixCellProps) {
    const accent = cell.cellNumber === 1 ? "#808080" : cell.cellBgColor;

    const hasUp = visible && cell.cellUp;
    const hasDown = visible && cell.cellDown;
    const hasLeft = visible && cell.cellLeft;
    const hasRight = visible && cell.cellRight;

    const neighborDown = hasUp && r > 0 && matrix[r - 1][c].cellDown;
    const neighborUp = hasDown && r < rows - 1 && matrix[r + 1][c].cellUp;
    const neighborRight = hasLeft && c > 0 && matrix[r][c - 1].cellRight;
    const neighborLeft = hasRight && c < columns - 1 && matrix[r][c + 1].cellLeft;

    return (
        <div
            role="gridcell"
            aria-label={visible ? `Cell ${cell.cellNumber}` : undefined}
            aria-current={isCurrent ? "true" : undefined}
            tabIndex={visible ? 0 : -1}
            onMouseEnter={visible ? (e) => onHoverEnter(e, cell, r, c) : undefined}
            onMouseMove={visible ? (e) => onHoverMove(e, cell, r, c) : undefined}
            onMouseLeave={visible ? onHoverLeave : undefined}
            onFocus={visible ? (e) => onHoverEnter(e as unknown as React.MouseEvent, cell, r, c) : undefined}
            onBlur={visible ? onHoverLeave : undefined}
            className={cn(
                "relative flex items-center justify-center rounded-2xl select-none",
                "transition-[opacity,transform,box-shadow] duration-300 ease-out",
                visible
                    ? [
                          "opacity-100",
                          "border border-white/10 shadow-sm",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                          "hover:shadow-lg hover:shadow-black/40 cursor-default",
                      ]
                    : "opacity-20 pointer-events-none",
            )}
            style={{
                width: 88,
                height: 88,
                backgroundColor: visible ? accent : "transparent",
                backgroundImage: visible ? `linear-gradient(135deg, ${accent}ee 0%, ${accent}99 100%)` : "none",
            }}
        >
            {visible && (
                <span className="text-4xl font-bold text-white drop-shadow-sm tracking-tight tabular-nums">
                    {renderFormattedNumber(cell.cellNumber, c, colMaxDigits, total)}
                </span>
            )}

            {/* Connector bridges */}
            {hasUp && (
                <div
                    aria-hidden="true"
                    className={cn("absolute -top-3 left-1/2 -translate-x-1/2 w-2.5 h-4 ", "bg-emerald-600", neighborDown ? "rounded-b-sm" : "rounded-sm")}
                />
            )}

            {hasDown && (
                <div
                    aria-hidden="true"
                    className={cn("absolute -bottom-3 left-1/2 -translate-x-1/2 w-2.5 h-4", "bg-emerald-600", neighborUp ? "rounded-t-sm" : "rounded-sm")}
                />
            )}

            {hasLeft && (
                <div
                    aria-hidden="true"
                    className={cn("absolute top-1/2 -left-3 -translate-y-1/2 w-4 h-2.5", "bg-emerald-600", neighborRight ? "rounded-r-sm" : "rounded-sm")}
                />
            )}

            {hasRight && (
                <div
                    aria-hidden="true"
                    className={cn("absolute top-1/2 -right-3 -translate-y-1/2 w-4 h-2.5", "bg-emerald-600", neighborLeft ? "rounded-l-sm" : "rounded-sm")}
                />
            )}
        </div>
    );
}

interface HoverOverlayProps {
    hoverInfo: HoverInfo | null;
    hoverNeighbors: NeighborMap | null;
}

function HoverOverlay({ hoverInfo, hoverNeighbors }: HoverOverlayProps) {
    const tDirection = useTranslations("direction");
    if (!hoverInfo) return null;

    return (
        <div
            aria-live="off"
            role="tooltip"
            className="pointer-events-none fixed z-50"
            style={{
                left: Math.min((hoverInfo.x || 0) + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 240),
                top: Math.max((hoverInfo.y || 0) - 120, 8),
            }}
        >
            <div className="w-52 rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden">
                <div className="p-3.5 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <Badge className="text-neutral-800 bg-accent font-bold text-sm px-2.5 py-0.5 rounded-md">#{hoverInfo.data.cellNumber}</Badge>
                        <span className="text-[11px] text-neutral-500 tabular-nums font-mono">
                            ({hoverInfo.r + 1},{hoverInfo.c + 1})
                        </span>
                    </div>

                    <div className="h-px bg-white/8" />

                    {/* Connection grid */}
                    <div className="grid grid-cols-2 gap-1.5">
                        {(
                            [
                                ["up", <ArrowUp key="u" className="size-3" />, hoverInfo.data.cellUp, hoverNeighbors?.up],
                                ["down", <ArrowDown key="d" className="size-3" />, hoverInfo.data.cellDown, hoverNeighbors?.down],
                                ["left", <ArrowLeft key="l" className="size-3" />, hoverInfo.data.cellLeft, hoverNeighbors?.left],
                                ["right", <ArrowRight key="r" className="size-3" />, hoverInfo.data.cellRight, hoverNeighbors?.right],
                            ] as [string, React.ReactNode, boolean, { n: number } | null | undefined][]
                        ).map(([dir, icon, connected, neighbor]) => (
                            <div
                                key={dir}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px]",
                                    connected ? "bg-emerald-500/10 text-emerald-600" : "text-neutral-600 bg-neutral-500/15",
                                )}
                            >
                                <span className={connected ? "text-emerald-600" : "text-neutral-600"}>{icon}</span>
                                <span className={cn("font-medium", connected ? "text-neutral-200" : "line-through opacity-30")}>
                                    {tDirection(dir as "up" | "down" | "left" | "right")}
                                </span>
                                {neighbor && <span className="ml-auto text-[10px] font-mono text-neutral-500">#{neighbor.n}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface MiniMapProps {
    matrix: CellData[][];
    columns: number;
    currentNumber: number;
    total: number;
    onCellClick: (n: number) => void;
}

function MiniMap({ matrix, columns, currentNumber, total, onCellClick }: MiniMapProps) {
    const rows = matrix.length;
    const dotRowPx = rows * 10 + Math.max(0, rows - 1) * 2;
    const maxGridHeight = Math.min(dotRowPx, 200);

    return (
        <div className="fixed right-6 bottom-6 z-40 rounded-lg border border-neutral-700 bg-neutral-800/60 p-3">
            {/* Header */}
            <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1.5 border-b border-white/8">
                <Grid3x3 className="size-3 shrink-0 text-blue-400" />
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Overview</span>
                <span className="ml-auto text-[10px] text-neutral-600 tabular-nums">
                    {currentNumber}/{total}
                </span>
            </div>

            {/* Dot grid */}
            <div className="p-4 flex justify-center">
                <div
                    role="grid"
                    aria-label="Matrix overview"
                    className="grid gap-0.5 overflow-auto"
                    style={{
                        gridTemplateColumns: `repeat(${columns}, 10px)`,
                        maxHeight: maxGridHeight,
                    }}
                >
                    {matrix.flat().map((cell, idx) => {
                        const r = Math.floor(idx / columns);
                        const c = idx % columns;
                        const isRevealed = cell.cellNumber <= currentNumber;
                        const isCurrent = cell.cellNumber === currentNumber;

                        return (
                            <Tooltip key={`mm-${r}-${c}`}>
                                <TooltipTrigger asChild>
                                    <button
                                        role="gridcell"
                                        aria-label={`Go to cell ${cell.cellNumber}`}
                                        onClick={() => onCellClick(cell.cellNumber)}
                                        className={cn(
                                            "size-2.5 rounded-sm transition-all duration-150",
                                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500",
                                            isCurrent
                                                ? "bg-yellow-400 scale-125 ring-1 ring-yellow-400/40"
                                                : isRevealed
                                                  ? "bg-linear-to-br from-emerald-400 to-blue-500"
                                                  : "bg-neutral-700/60 hover:bg-neutral-600/60",
                                        )}
                                    />
                                </TooltipTrigger>
                                <TooltipContent side="left" className="text-[11px] border-neutral-700 text-neutral-200">
                                    #{cell.cellNumber} ({r + 1},{c + 1})
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function Cyclic() {
    const tMatrix = useTranslations("matrix");
    const tPosition = useTranslations("position");
    const tDirection = useTranslations("direction");
    const tRotation = useTranslations("rotation");
    const tActions = useTranslations("actions");
    const tAnimation = useTranslations("animation");
    const tErrors = useTranslations("errors");

    const [rows, setRows] = useState<number>(5);
    const [columns, setColumns] = useState<number>(5);
    const [matrix, setMatrix] = useState<CellData[][] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentNumber, setCurrentNumber] = useState(0);
    const [speedMs, setSpeedMs] = useState(350);
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const [corner, setCorner] = useState<Corner>("br");
    const [dir, setDir] = useState<Direction>("left");
    const [rotation, setRotation] = useState<Rotation>("cw");

    const total = useMemo(() => rows * columns, [rows, columns]);
    const [jumpTo, setJumpTo] = useState<number>(0);

    const matrixCols = matrix && matrix[0] ? matrix[0].length : 0;
    const colMaxDigits = useMemo(() => getColMaxDigits(matrix), [matrix]);

    const dirVectors: Record<string, [number, number]> = {
        left: [0, -1],
        right: [0, 1],
        up: [-1, 0],
        down: [1, 0],
    };

    // Derive valid directions based on start position
    function getStartPos(cornerVal: Corner): [number, number] {
        switch (cornerVal) {
            case "tl":
                return [0, 0];
            case "tr":
                return [0, columns - 1];
            case "bl":
                return [rows - 1, 0];
            case "br":
                return [rows - 1, columns - 1];
            default:
                return [Math.floor(rows / 2), Math.floor(columns / 2)];
        }
    }

    const [startR, startC] = getStartPos(corner);
    const validDirList = (Object.keys(dirVectors) as Direction[]).filter((d) => {
        const [dr, dc] = dirVectors[d];
        const nr = startR + dr;
        const nc = startC + dc;
        return nr >= 0 && nr < rows && nc >= 0 && nc < columns;
    });

    // Keep dir in sync when corner/dimensions change
    useEffect(() => {
        if (validDirList.length > 0 && !validDirList.includes(dir)) {
            setDir(validDirList[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, columns, corner]);

    // Edge-case: 1×1 center is unsupported
    useEffect(() => {
        if (rows === 1 && columns === 1 && corner === "cl") {
            setCorner("br");
        }
    }, [rows, columns, corner]);

    const showRotation = total > 1 && corner === "cl";

    // Reset matrix when any config changes (before re-generate)
    useEffect(() => {
        setMatrix(null);
    }, [rows, columns, corner, dir, rotation]);

    const load = useCallback(async () => {
        try {
            setError(null);
            const res = await CyclicService.get(rows, columns, { corner, dir, rotation });
            if ((res.data as { message?: string }).message) {
                setError((res.data as { message: string }).message);
                setMatrix(null);
                return;
            }
            setMatrix(res.data as CellData[][]);
            setCurrentNumber(0);
            setIsPlaying(true);
        } catch (e) {
            console.error(e);
            setError(tErrors("failedToLoadMatrix"));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, columns, corner, dir, rotation]);

    // Initial load
    useEffect(() => {
        load();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-play ticker
    useEffect(() => {
        if (!isPlaying || !matrix) return;
        const interval = setInterval(
            () => {
                setCurrentNumber((prev) => (prev < total ? prev + 1 : prev));
            },
            Math.max(50, speedMs),
        );
        return () => clearInterval(interval);
    }, [isPlaying, matrix, speedMs, total]);

    // Auto-stop at the end
    useEffect(() => {
        if (matrix && currentNumber >= total) setIsPlaying(false);
    }, [currentNumber, total, matrix]);

    // Keyboard shortcuts
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
            setError(tErrors("rowsColumnsRange"));
            return;
        }
        load();
    }

    function getNeighborInfo(r: number, c: number): NeighborMap {
        const out: NeighborMap = { up: null, down: null, left: null, right: null };
        if (!matrix) return out;
        if (r > 0) out.up = { n: matrix[r - 1][c].cellNumber, r: r - 1, c };
        if (r < rows - 1) out.down = { n: matrix[r + 1][c].cellNumber, r: r + 1, c };
        if (c > 0) out.left = { n: matrix[r][c - 1].cellNumber, r, c: c - 1 };
        if (c < columns - 1) out.right = { n: matrix[r][c + 1].cellNumber, r, c: c + 1 };
        return out;
    }

    const hoverNeighbors = hoverInfo ? getNeighborInfo(hoverInfo.r, hoverInfo.c) : null;

    const handleHoverEnter = useCallback((e: React.MouseEvent, cell: CellData, r: number, c: number) => {
        setHoverInfo({ x: e.clientX, y: e.clientY, data: cell, r, c });
    }, []);

    const handleHoverMove = useCallback((e: React.MouseEvent, cell: CellData, r: number, c: number) => {
        setHoverInfo({ x: e.clientX, y: e.clientY, data: cell, r, c });
    }, []);

    const handleHoverLeave = useCallback(() => setHoverInfo(null), []);

    const stepsPerSec = Math.round(1000 / Math.max(50, speedMs));

    const dirIcon: Record<Direction, React.ReactNode> = {
        up: <ArrowUp className="size-3.5" />,
        down: <ArrowDown className="size-3.5" />,
        left: <ArrowLeft className="size-3.5" />,
        right: <ArrowRight className="size-3.5" />,
    };
    const dirLabel: Record<Direction, string> = {
        up: tDirection("up"),
        down: tDirection("down"),
        left: tDirection("left"),
        right: tDirection("right"),
    };

    return (
        <div
            className="py-6 px-5 xl:px-0 md:p-6 md:pb-8 space-y-4"
            style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.032) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
            }}
        >
            <div className="mx-auto max-w-6xl space-y-4">
                {/* Control Panel */}
                <Card className="bg-neutral-900 border-neutral-800 p-0">
                    <CardContent className="p-0">
                        {/* Config row */}
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="flex flex-wrap items-center gap-2 px-2 py-3">
                                <div className="w-full flex place-content-center gap-5">
                                    {/* Grid size: [rows] × [cols] */}
                                    <div className="flex items-center gap-1.5">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    id="field-rows"
                                                    type="number"
                                                    min={1}
                                                    max={10}
                                                    value={rows}
                                                    onChange={(e) => setRows(Number(e.target.value))}
                                                    aria-label={tMatrix("rows")}
                                                    className="h-8 w-15 text-center text-sm tabular-nums bg-neutral-800 border-neutral-700 text-neutral-100 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/60"
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="border-neutral-700 text-neutral-200 text-xs">{tMatrix("rows")} (1–10)</TooltipContent>
                                        </Tooltip>

                                        <span className="text-neutral-500 text-sm font-medium select-none" aria-hidden="true">
                                            ×
                                        </span>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    id="field-cols"
                                                    type="number"
                                                    min={1}
                                                    max={10}
                                                    value={columns}
                                                    onChange={(e) => setColumns(Number(e.target.value))}
                                                    aria-label={tMatrix("columns")}
                                                    className="h-8 w-15 text-center text-sm tabular-nums bg-neutral-800 border-neutral-700 text-neutral-100 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/60"
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="border-neutral-700 text-neutral-200 text-xs">{tMatrix("columns")} (1–10)</TooltipContent>
                                        </Tooltip>
                                    </div>

                                    <div aria-hidden="true" className="hidden sm:block w-px h-5 bg-neutral-700 self-center" />

                                    {/* Start position */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Select value={corner} onValueChange={(v: Corner) => setCorner(v)}>
                                                <SelectTrigger
                                                    aria-label={tMatrix("startPosition")}
                                                    className="h-8 text-sm w-fit bg-neutral-800 border-neutral-700 text-neutral-100"
                                                >
                                                    <Target className="size-3 text-neutral-500 shrink-0" />
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
                                                    <SelectItem value="tl">{tPosition("topLeft")}</SelectItem>
                                                    <SelectItem value="tr">{tPosition("topRight")}</SelectItem>
                                                    <SelectItem value="bl">{tPosition("bottomLeft")}</SelectItem>
                                                    <SelectItem value="br">{tPosition("bottomRight")}</SelectItem>
                                                    <SelectItem value="cl">{tPosition("center")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TooltipTrigger>
                                        <TooltipContent className="border-neutral-700 text-neutral-200 text-xs">{tMatrix("startPosition")}</TooltipContent>
                                    </Tooltip>

                                    {/* Direction */}
                                    <Select value={dir} onValueChange={(v: Direction) => setDir(v)} disabled={validDirList.length === 0}>
                                        <SelectTrigger
                                            aria-label={tMatrix("direction")}
                                            className="h-8 text-sm w-fit bg-neutral-800 border-neutral-700 text-neutral-100 disabled:text-neutral-600"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
                                            {validDirList.map((d) => (
                                                <SelectItem key={d} value={d}>
                                                    <span className="flex items-center gap-2">
                                                        {dirIcon[d]}
                                                        {dirLabel[d]}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Rotation */}
                                    {showRotation && (
                                        <Select value={rotation} onValueChange={(v: Rotation) => setRotation(v)}>
                                            <SelectTrigger
                                                aria-label={tMatrix("rotation")}
                                                className="h-8 text-sm w-fit bg-neutral-800 border-neutral-700 text-neutral-100"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
                                                <SelectItem value="cw">{tRotation("clockwise")}</SelectItem>
                                                <SelectItem value="ccw">{tRotation("counterClockwise")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {/* Generate Matrix */}
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={rows < 1 || rows > 10 || columns < 1 || columns > 10}
                                        className="w-fit bg-linear-to-r from-emerald-700 to-blue-500 hover:from-emerald-600 hover:to-blue-700 text-white"
                                    >
                                        <Zap className="size-3.5" />
                                        {tActions("generateMatrix")}
                                    </Button>
                                </div>
                            </div>
                        </form>

                        {/* Playback row */}
                        {matrix && (
                            <>
                                <Separator className="bg-neutral-800" />

                                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3">
                                    {/* Transport buttons */}
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => {
                                                        setCurrentNumber(0);
                                                        setIsPlaying(false);
                                                    }}
                                                    aria-label={tActions("reset")}
                                                    className="text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
                                                >
                                                    <RotateCcw className="size-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="border-neutral-700 text-neutral-200 text-xs">{tActions("reset")}</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => setCurrentNumber((n) => Math.max(0, n - 1))}
                                                    aria-label={tAnimation("previousStep")}
                                                    className="text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
                                                >
                                                    <SkipBack className="size-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className=" border-neutral-700 text-neutral-200 text-xs">
                                                {tAnimation("previousStep")} (←)
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => setIsPlaying((p) => !p)}
                                                    aria-label={isPlaying ? tActions("pause") : tActions("play")}
                                                    aria-pressed={isPlaying}
                                                    className={cn(
                                                        "hover:bg-neutral-800",
                                                        isPlaying
                                                            ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                                                            : "text-neutral-300 hover:text-neutral-100",
                                                    )}
                                                >
                                                    {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="border-neutral-700 text-neutral-200 text-xs">
                                                {isPlaying ? tActions("pause") : tActions("play")} (Space)
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => setCurrentNumber((n) => Math.min(total, n + 1))}
                                                    aria-label={tAnimation("nextStep")}
                                                    className="text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
                                                >
                                                    <SkipForward className="size-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="border-neutral-700 text-neutral-200 text-xs">{tAnimation("nextStep")} (→)</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => setCurrentNumber(total)}
                                                    aria-label="Show all"
                                                    className="text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
                                                >
                                                    <ChevronsRight className="size-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="border-neutral-700 text-neutral-200 text-xs">{tAnimation("showAll")}</TooltipContent>
                                        </Tooltip>
                                    </div>

                                    <div aria-hidden="true" className="hidden sm:block w-px h-5 bg-neutral-700 self-center shrink-0" />

                                    {/* Progress scrubber + step counter */}
                                    <div className="flex items-center bg-neutral-800 rounded-md px-2 py-0.5 gap-2.5 flex-1 min-w-32">
                                        <Slider
                                            value={[currentNumber]}
                                            onValueChange={(v) => setCurrentNumber(v[0])}
                                            min={0}
                                            max={total}
                                            step={1}
                                            aria-label={tAnimation("progress")}
                                            aria-valuenow={currentNumber}
                                            aria-valuemin={0}
                                            aria-valuemax={total}
                                            className="flex-1"
                                        />
                                        <span className="text-xs tabular-nums font-mono text-neutral-400 shrink-0 text-right" style={{ minWidth: "3.5rem" }}>
                                            {currentNumber}
                                            <span className="text-neutral-600">/{total}</span>
                                        </span>
                                    </div>

                                    <div aria-hidden="true" className="hidden sm:block w-px h-5 bg-neutral-700 self-center shrink-0" />

                                    {/* Speed */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center bg-neutral-800 py-1 px-2 rounded-sm gap-1.5 shrink-0 w-28">
                                                <Zap className="size-3 text-amber-400 shrink-0" />
                                                <Slider
                                                    value={[speedMs]}
                                                    onValueChange={(v) => setSpeedMs(v[0])}
                                                    min={50}
                                                    max={1000}
                                                    step={25}
                                                    aria-label={tAnimation("speed")}
                                                    className="flex-1"
                                                />
                                                <Clock className="size-3 text-neutral-600 shrink-0" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="border-neutral-700 text-neutral-200 text-xs">
                                            {tAnimation("speed")}: {stepsPerSec} {tAnimation("stepsPerSec")}
                                        </TooltipContent>
                                    </Tooltip>

                                    <div aria-hidden="true" className="hidden sm:block w-px h-5 bg-neutral-700 self-center shrink-0" />

                                    {/* Jump to */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Input
                                            id="jump-input"
                                            type="number"
                                            min={0}
                                            max={total}
                                            value={jumpTo || ""}
                                            onChange={(e) => setJumpTo(Number(e.target.value))}
                                            placeholder="#..."
                                            aria-label={tAnimation("jumpToNumber")}
                                            className="h-8 w-16 text-center text-sm tabular-nums bg-neutral-800 border-neutral-700 text-neutral-100 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/60"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setCurrentNumber(Math.max(0, Math.min(total, jumpTo)))}
                                            aria-label={tAnimation("go")}
                                            className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            {tAnimation("go")}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Error Banner */}
                {error && (
                    <Card className="border-destructive/50 bg-destructive/5">
                        <CardContent className="pt-6">
                            <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
                                <AlertCircle className="size-4 shrink-0" />
                                {error}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Matrix Grid */}
                {matrix && !error && (
                    <Card className="overflow-hidden bg-neutral-900 border-neutral-800">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="text-neutral-100">{tMatrix("visualization")}</CardTitle>
                                    <CardDescription className="text-neutral-500">
                                        {currentNumber} / {total} {tMatrix("cellsRevealed")}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-8">
                            <div className="overflow-auto">
                                <div
                                    role="grid"
                                    aria-label={`${rows}×${columns} cyclic matrix`}
                                    aria-rowcount={rows}
                                    aria-colcount={matrixCols || columns}
                                    className="grid gap-3 w-fit mx-auto p-4"
                                    style={{ gridTemplateColumns: `repeat(${matrixCols || columns}, 88px)` }}
                                >
                                    {matrix.map((row, rowIndex) => (
                                        <div key={rowIndex} role="row" aria-rowindex={rowIndex + 1} className="contents">
                                            {row.map((cell, cellIndex) => (
                                                <MatrixCell
                                                    key={`${rowIndex}-${cellIndex}`}
                                                    cell={cell}
                                                    r={rowIndex}
                                                    c={cellIndex}
                                                    rows={rows}
                                                    columns={columns}
                                                    matrix={matrix}
                                                    visible={cell.cellNumber <= currentNumber}
                                                    isCurrent={cell.cellNumber === currentNumber}
                                                    colMaxDigits={colMaxDigits}
                                                    total={total}
                                                    onHoverEnter={handleHoverEnter}
                                                    onHoverMove={handleHoverMove}
                                                    onHoverLeave={handleHoverLeave}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Floating Hover Overlay */}
            <HoverOverlay hoverInfo={hoverInfo} hoverNeighbors={hoverNeighbors} />

            {/* Fixed MiniMap */}
            {matrix && <MiniMap matrix={matrix} columns={matrixCols || columns} currentNumber={currentNumber} total={total} onCellClick={setCurrentNumber} />}
        </div>
    );
}
