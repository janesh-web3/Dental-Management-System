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
        selectedTooth: "hsl(221 83% 53%)", // Primary blue
        defaultTooth: "hsl(220 14% 96%)", // Secondary gray
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
            light: "hsl(221 83% 96%)", // blue
            dark: "hsl(221 83% 20%)", 
          },
          doctors: {
            light: "hsl(174 84% 96%)", // teal
            dark: "hsl(174 84% 20%)", 
          },
          appointments: {
            light: "hsl(262 83% 96%)", // purple
            dark: "hsl(262 83% 20%)", 
          },
          revenue: {
            light: "hsl(150 84% 96%)", // green
            dark: "hsl(150 84% 20%)", 
          },
          financials: {
            light: "hsl(199 89% 96%)", // cyan
            dark: "hsl(199 89% 20%)", 
          },
          documents: {
            light: "hsl(232 23% 96%)", // slate
            dark: "hsl(232 23% 20%)", 
          },
          performance: {
            light: "hsl(43 96% 96%)", // amber
            dark: "hsl(43 96% 20%)", 
          },
          todaysAppointments: {
            light: "hsl(187 75% 96%)", // sky
            dark: "hsl(187 75% 20%)", 
          },
          treatments: {
            light: "hsl(336 84% 96%)", // pink
            dark: "hsl(336 84% 20%)", 
          },
          progress: {
            light: "hsl(142 71% 96%)", // emerald
            dark: "hsl(142 71% 20%)", 
          },
          transactions: {
            light: "hsl(0 84% 96%)", // red
            dark: "hsl(0 84% 20%)", 
          },
          reports: {
            light: "hsl(280 87% 96%)", // violet
            dark: "hsl(280 87% 20%)", 
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