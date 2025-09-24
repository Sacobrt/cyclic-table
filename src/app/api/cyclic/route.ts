import { NextApiRequest, NextApiResponse } from "next";

export type CellData = {
    cellNumber: number;
    cellUp: boolean;
    cellDown: boolean;
    cellLeft: boolean;
    cellRight: boolean;
    cellBgColor: string;
};

const handler = (req: NextApiRequest, res: NextApiResponse) => {
    const { rows, columns } = req.query;

    const rowStr = Array.isArray(rows) ? rows[0] : rows;
    const colStr = Array.isArray(columns) ? columns[0] : columns;

    const rowNumber = parseInt(rowStr as string, 10);
    const columnNumber = parseInt(colStr as string, 10);

    if (Number.isNaN(rowNumber) || Number.isNaN(columnNumber)) {
        return res.status(400).json({ message: "Rows and columns must be valid numbers!" });
    }
    if (rowNumber <= 0 || rowNumber > 10 || columnNumber <= 0 || columnNumber > 10) {
        return res.status(400).json({ message: "Whoops! Rows and columns should be between 1 and 10!" });
    }

    const matrix = createCyclic(rowNumber, columnNumber);
    return res.status(200).json(matrixToLists(matrix));
};

export default handler;

function matrixToLists(matrix: CellData[][]) {
    return matrix;
}

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

function createCyclic(rows: number, columns: number): CellData[][] {
    const table: CellData[][] = Array.from({ length: rows }, () => Array.from({ length: columns }, () => createEmptyCell()));

    let num = 1;
    const total = rows * columns;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const cell = createEmptyCell(num);

            cell.cellUp = r > 0;
            cell.cellDown = r < rows - 1;
            cell.cellLeft = c > 0;
            cell.cellRight = c < columns - 1;

            if (num === 1) {
                cell.cellBgColor = "#808080";
                cell.cellUp = false;
                cell.cellDown = false;
                cell.cellLeft = false;
                cell.cellRight = false;
            }

            if (num === total) {
                cell.cellBgColor = "#ff9800";
            }

            table[r][c] = cell;
            num++;
        }
    }

    return table;
}
