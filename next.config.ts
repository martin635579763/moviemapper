
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ["https://8002-firebase-studio-1747892384797.cluster-zumahodzirciuujpqvsniawo3o.cloudworkstations.dev"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com', // Added this entry
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com', 
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https', // Added for placehold.co as it's used in GridCell
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
