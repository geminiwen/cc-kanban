import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mysql2", "ws", "@modelcontextprotocol/sdk"],
};

export default nextConfig;
