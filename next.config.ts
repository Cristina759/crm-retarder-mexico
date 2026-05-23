import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript activado — el build fallará si hay errores de tipos
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
