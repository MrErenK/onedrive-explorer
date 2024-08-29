/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_AZURE_AD_CLIENT_ID: process.env.AZURE_AD_CLIENT_ID,
    NEXT_PUBLIC_AZURE_AD_TENANT_ID: process.env.AZURE_AD_TENANT_ID,
    NEXT_PUBLIC_GRAPH_API_ENDPOINT: process.env.GRAPH_API_ENDPOINT,
    NEXT_PUBLIC_REDIRECT_URI: process.env.REDIRECT_URI,
    NEXT_PUBLIC_APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_LOGIN_PASSWORD: process.env.LOGIN_PASSWORD,
  },
};

export default nextConfig;
