import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import svgToDataUri from "mini-svg-data-uri";
import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";

export default {
darkMode: ["class"],
content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
prefix: "",
theme: {
	container: {
		center: true,
		padding: '2rem',
		screens: {
			'2xl': '1400px'
		}
	},
	extend: {
			transitionTimingFunction: {
				'apple-ease': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'concierge': 'cubic-bezier(0.16, 1, 0.3, 1)'
			},
			colors: {
			border: 'hsl(var(--border) / 0.15)', /* Ghost Border Default */
			input: 'hsl(var(--input))',
			ring: 'hsl(var(--ring))',
			background: 'hsl(var(--background))',
			foreground: 'hsl(var(--foreground))',
			primary: {
				DEFAULT: 'hsl(var(--primary))',
				foreground: 'hsl(var(--primary-foreground))'
			},
			secondary: {
				DEFAULT: 'hsl(var(--secondary))',
				foreground: 'hsl(var(--secondary-foreground))'
			},
			destructive: {
				DEFAULT: 'hsl(var(--destructive))',
				foreground: 'hsl(var(--destructive-foreground))'
			},
			muted: {
				DEFAULT: 'hsl(var(--muted))',
				foreground: 'hsl(var(--muted-foreground))'
			},
			accent: {
				DEFAULT: 'hsl(var(--accent))',
				foreground: 'hsl(var(--accent-foreground))'
			},
			popover: {
				DEFAULT: 'hsl(var(--popover))',
				foreground: 'hsl(var(--popover-foreground))'
			},
			card: {
				DEFAULT: 'hsl(var(--card))',
				foreground: 'hsl(var(--card-foreground))'
			}
		},
		borderRadius: {
			xl: 'var(--radius)',
			lg: 'calc(var(--radius) - 2px)',
			md: 'calc(var(--radius) - 4px)',
			sm: 'calc(var(--radius) - 8px)'
		},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
			'accordion-up': {
				from: { height: 'var(--radix-accordion-content-height)' },
				to: { height: '0' }
			},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(8px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				shimmer: {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				},
				float: {
					'0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
					'50%': { transform: 'translate3d(0, -20px, 0) scale(1.05)' }
				},
				reveal: {
					from: { opacity: '0', transform: 'translateY(18px) scale(0.985)' },
					to: { opacity: '1', transform: 'translateY(0) scale(1)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out',
				shimmer: 'shimmer 2.6s linear infinite',
				float: 'float 16s ease-in-out infinite',
				reveal: 'reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) both'
			},
			boxShadow: {
				sm: '0 1px 2px rgba(25, 28, 29, 0.05)',
        md: '0 4px 12px rgba(25, 28, 29, 0.08)',
				float: '0 12px 32px rgba(25, 28, 29, 0.12), 0 0 0 1px rgba(25, 28, 29, 0.05)',
			},
			fontFamily: {
				sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				display: ['"Manrope"', 'sans-serif'],
				mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
			}
		}
	},
	plugins: [
    tailwindcssAnimate,
    addVariablesForColors,
function ({ matchUtilities, theme }: import('tailwindcss/types/config').PluginAPI) {
matchUtilities(
        {
          "bg-grid": (value: string) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          "bg-grid-small": (value: string) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="8" height="8" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          "bg-dot": (value: string) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="10" cy="10" r="1.6257413380501518"></circle></svg>`
            )}")`,
}),
        },
        { values: flattenColorPalette(theme("backgroundColor") as Record<string, string>), type: "color" }
);
    },
],
} satisfies Config;

// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }: import('tailwindcss/types/config').PluginAPI) {
const allColors = flattenColorPalette(theme("colors") as Record<string, string>);
const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
);

addBase({
    ":root": newVars as Record<string, string>,
});
}
