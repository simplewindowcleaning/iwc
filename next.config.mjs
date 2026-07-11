/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // book.simplewindowcleaning.com/ lands on the booking page.
      // Host-scoped and listed first — every other domain keeps the
      // existing behavior below, unchanged.
      {
        source: '/',
        has: [{ type: 'host', value: 'book.simplewindowcleaning.com' }],
        destination: '/book',
        permanent: false,
      },
      {
        source: '/',
        destination: 'https://simplewindows.vercel.app',
        permanent: false,
      },
      {
        source: '/simple',
        destination: 'https://simplewindows.vercel.app',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
