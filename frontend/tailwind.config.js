/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3EDE0",
        cream: "#FBF7EC",
        ink: "#15130F",
        mist: "#DAD2BF",
        signal: "#E2461F",
        pine: "#1E5A45",
        brass: "#C9973F",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Space Grotesk"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        hard: "4px 4px 0 0 #15130F",
        "hard-lg": "7px 7px 0 0 #15130F",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { rise: "rise 220ms cubic-bezier(0.16, 1, 0.3, 1) both" },
    },
  },
  plugins: [],
};
