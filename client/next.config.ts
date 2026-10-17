import type { NextConfig } from "next";
import {withConsentManifest} from "c15t/next/build"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
} satisfies NextConfig;

export default withConsentManifest(nextConfig);
