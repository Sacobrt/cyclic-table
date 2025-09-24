import axios from "axios";

type GetOptions = {
    corner?: "tl" | "tr" | "bl" | "br" | "cl" | "cr" | "ct" | "cb";
    dir?: "up" | "down" | "left" | "right";
    rotation?: "cw" | "ccw";
};

const CyclicService = {
    get: (rows: number, columns: number, opts: GetOptions = {}) => {
        const params = new URLSearchParams();
        if (opts.corner) params.set("corner", opts.corner);
        if (opts.dir) params.set("dir", opts.dir);
        if (opts.rotation) params.set("rotation", opts.rotation);
        const qs = params.toString();
        const url = `/api/cyclic/${rows}/${columns}${qs ? `?${qs}` : ""}`;
        return axios.get(url);
    },
};

export default CyclicService;
