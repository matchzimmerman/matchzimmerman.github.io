/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
     colors: {
       rust: {
         50:  "#fff3e6",
         100: "#fde4cc",
         200: "#f8cda5",
         300: "#f3b47d",
         400: "#ea9452",
         500: "#d97832",   // accent
         600: "#b35f27",
         700: "#8a4b20",
         800: "#5b3116",          900: "#371e0e"        }
     },
     fontFamily: {
       mono: ["var(--font-plex-mono)","ui-monospace","SFMono-Regular","Menlo","monospace"]
     },
      boxShadow: { soft: "0 10px 30px rgba(0,0,0,0.08)" }
    },
  },
  plugins: [],
}