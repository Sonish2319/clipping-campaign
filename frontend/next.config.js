/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "images.unsplash.com",
      "img.youtube.com",
      "i.ytimg.com",
      "lh3.googleusercontent.com",
    ],
  },
};

module.exports = nextConfig;
