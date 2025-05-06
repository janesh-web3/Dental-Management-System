/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        selectedTooth: "#3b82f6", // Tailwind blue
        defaultTooth: "#e5e7eb", // Tailwind gray
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        dashboard1 : {
          DEFAULT: "hsl(var(--dashboard1))",
        },
        dashboard2 : {
          DEFAULT: "hsl(var(--dashboard2))",
        },
        dashboard3 : {
          DEFAULT: "hsl(var(--dashboard3))",
        },
        dashboard4 : {
          DEFAULT: "hsl(var(--dashboard4))",
        },
        dashboard5 : {
          DEFAULT: "hsl(var(--dashboard5))",
        },
        dashboard6 : {
          DEFAULT: "hsl(var(--dashboard6))",
        },
        dashboard7 : {
          DEFAULT: "hsl(var(--dashboard7))",
        },
        dashboard8 : {
          DEFAULT: "hsl(var(--dashboard8))",
        },
        dashboard: {
          patients: {
            light: "#ebf5ff", // blue-50
            dark: "#0c2544", // blue-950
          },
          doctors: {
            light: "#ecfdf5", // green-50
            dark: "#052e16", // green-950
          },
          appointments: {
            light: "#f5f3ff", // purple-50
            dark: "#2e1065", // purple-950
          },
          revenue: {
            light: "#f0fdfa", // teal-50
            dark: "#042f2e", // teal-950
          },
          financials: {
            light: "#eef2ff", // indigo-50
            dark: "#1e1b4b", // indigo-950
          },
          documents: {
            light: "#f9fafb", // gray-50
            dark: "#111827", // gray-900
          },
          performance: {
            light: "#fffbeb", // amber-50
            dark: "#451a03", // amber-950
          },
          todaysAppointments: {
            light: "#ecfeff", // cyan-50
            dark: "#083344", // cyan-950
          },
          treatments: {
            light: "#fdf2f8", // pink-50
            dark: "#4a044e", // pink-950
          },
          progress: {
            light: "#f7fee7", // lime-50
            dark: "#1a2e05", // lime-950
          },
          transactions: {
            light: "#fff1f2", // rose-50
            dark: "#4c0519", // rose-950
          },
          reports: {
            light: "#f5f3ff", // violet-50
            dark: "#2e1065", // violet-950
          }
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}