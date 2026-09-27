import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // an easy address to give out for the resume
    return [{ source: "/resume", destination: "/M-Ahmad-Malik-Resume.pdf", permanent: false }];
  },
};

export default nextConfig;
