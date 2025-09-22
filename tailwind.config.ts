import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { poppins: ['var(--font-poppins)'] },
      borderRadius: { xl: "1rem", '2xl': "1.25rem" },
      boxShadow: { soft: "0 2px 10px rgba(0,0,0,0.06)" }
    }
  },
  plugins: []
} satisfies Config;
