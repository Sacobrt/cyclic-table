"use client";

import { useEffect, useState } from "react";
import CyclicService from "@/services/CyclicService";
import { CellData } from "@/app/api/cyclic/route";
import { getColMaxDigits, renderFormattedNumber } from "@/lib/utils";

export default function OriginalCyclic() {
    const [cyclic, setCyclic] = useState<CellData[][] | null>(null);
    const [formData, setFormData] = useState({ rows: 5, columns: 5 });
    const [submittedColumns, setSubmittedColumns] = useState<number>(5);
    const [error, setError] = useState<string | null>(null);
    const [currentNumber, setCurrentNumber] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const colMaxDigits = getColMaxDigits(cyclic);

    async function getCyclic() {
        try {
            const response = await CyclicService.get(formData.rows, formData.columns);
            if ((response.data as any).message) {
                setError((response.data as any).message);
            } else {
                setError(null);
                setCyclic(response.data as CellData[][]);
                setCurrentNumber(0);
                setIsAnimating(true);
            }
        } catch (e) {
            console.error(e);
            setError("Failed to load cyclic matrix");
        }
    }

    useEffect(() => {
        if (isAnimating && cyclic) {
            const totalNumbers = formData.rows * formData.columns;
            const interval = setInterval(() => {
                setCurrentNumber((prevNumber) => (prevNumber < totalNumbers ? prevNumber + 1 : prevNumber));
            }, 500);
            return () => clearInterval(interval);
        }
    }, [isAnimating, cyclic, formData]);

    useEffect(() => {
        setSubmittedColumns(formData.columns);
        getCyclic();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittedColumns(formData.columns);
        getCyclic();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: Number(value) }));
    };

    return (
        <div className="min-h-screen bg-[#333]">
            <div className="ml-10 flex flex-col items-start justify-center md:flex-row">
                {/* INPUT SECTION */}
                <div className="relative mt-10 ml-10 grid grid-flow-row items-start justify-center">
                    <span className="absolute top-[50px] -left-40 ml-10 -rotate-90 text-5xl font-bold text-[#525252]">INPUT</span>
                    <form onSubmit={handleSubmit} className="-mr-5 space-y-5">
                        {["rows", "columns"].map((field, index) => (
                            <div key={index} className="grid text-xl text-[#c8c8c8]">
                                <label className="font-semibold" htmlFor={field}>
                                    {field === "rows" ? "Number of rows" : "Number of columns"}
                                </label>
                                <input
                                    type="number"
                                    id={field}
                                    value={(formData as any)[field]}
                                    onChange={handleInputChange}
                                    className="mt-5 h-[60px] w-[220px] rounded-lg border-[4px] border-[#c8c8c8] bg-[#525252] text-center text-4xl font-semibold outline-0 focus:ring-0"
                                />
                            </div>
                        ))}
                        <button
                            type="submit"
                            style={{ marginTop: "80px" }}
                            className="w-[260px] rounded-lg bg-[#48ac47] py-4 text-2xl font-semibold text-[#c8c8c8]"
                        >
                            CREATE TABLE
                        </button>
                    </form>
                </div>

                {/* OUTPUT SECTION */}
                <div className="mt-10 ml-10 flex flex-col items-start justify-center md:ml-40 md:flex-row">
                    <div className="relative grid grid-flow-row">
                        {error && (
                            <div className="mt-2 mr-10 font-bold text-[#c8c8c8]">
                                <div className="bg-opacity-70 flex animate-bounce items-center gap-1 rounded-lg bg-red-600 p-3">
                                    <p>{error}</p>
                                </div>
                            </div>
                        )}
                        {cyclic && !error && (
                            <>
                                <span className="absolute top-[80px] -left-40 ml-5 -rotate-90 text-5xl font-bold text-[#525252]">OUTPUT</span>
                                <div className="mt-2 grid overflow-x-auto" style={{ gridTemplateColumns: `repeat(${submittedColumns}, 123px)` }}>
                                    {cyclic.map((row, rowIndex) =>
                                        row.map(({ cellNumber, cellBgColor, cellUp, cellDown, cellLeft, cellRight }, cellIndex) => {
                                            const isVisible = cellNumber <= currentNumber;

                                            return (
                                                <div
                                                    key={`${rowIndex}-${cellIndex}`}
                                                    className={`relative flex cursor-pointer items-center justify-center rounded-lg border-[2px] border-[#c7c7c7] transition-all duration-500 ease-in-out ${
                                                        isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0"
                                                    }`}
                                                    style={{
                                                        backgroundColor: isVisible ? cellBgColor : "transparent",
                                                        width: "120px",
                                                        height: "120px",
                                                        margin: "1.5px",
                                                    }}
                                                    onMouseEnter={(e) => isVisible && (e.currentTarget.style.backgroundColor = "#525252")}
                                                    onMouseLeave={(e) => isVisible && (e.currentTarget.style.backgroundColor = cellBgColor)}
                                                >
                                                    {isVisible && (
                                                        <span className="text-5xl font-semibold text-[#c7c7c7]">
                                                            {renderFormattedNumber(cellNumber, cellIndex, colMaxDigits, formData.rows * formData.columns)}
                                                        </span>
                                                    )}
                                                    {cellUp && isVisible && (
                                                        <div className="absolute -top-1.5 left-1/2 h-3 w-2 -translate-x-1/2 transform bg-[#48ac47]" />
                                                    )}
                                                    {cellDown && isVisible && (
                                                        <div className="absolute -bottom-1.5 left-1/2 h-3 w-2 -translate-x-1/2 transform bg-[#48ac47]" />
                                                    )}
                                                    {cellLeft && isVisible && (
                                                        <div className="absolute top-1/2 -left-1.5 h-2 w-3.5 -translate-y-1/2 transform bg-[#48ac47]" />
                                                    )}
                                                    {cellRight && isVisible && (
                                                        <div className="absolute top-1/2 -right-1.5 h-2 w-3.5 -translate-y-1/2 transform bg-[#48ac47]" />
                                                    )}
                                                </div>
                                            );
                                        }),
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
