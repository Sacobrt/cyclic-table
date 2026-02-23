import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points to the per-request i18n configuration
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default withNextIntl(nextConfig);
