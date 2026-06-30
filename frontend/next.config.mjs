/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle (`.next/standalone`) that traces only
  // the node_modules actually used at runtime. Drives the slim prod image.
  output: "standalone",
};

export default nextConfig;
