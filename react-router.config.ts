import type { Config } from "@react-router/dev/config";

export default {
  // Disable SSR during local development to avoid dev-only hydration mismatches
  // Enable SSR in production by checking import.meta.env.PROD
  ssr: !!import.meta.env.PROD,
} satisfies Config;
