// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },

                // Кастомные цвета для D&D темы
                fantasy: {
                    gold: '#FFD700',
                    bronze: '#CD7F32',
                    silver: '#C0C0C0',
                    copper: '#B87333',
                },
                dice: {
                    d4: '#FF6B6B',
                    d6: '#4ECDC4',
                    d8: '#45B7D1',
                    d10: '#96CEB4',
                    d12: '#FFEAA7',
                    d20: '#DDA0DD',
                },
                hp: {
                    full: '#10B981',
                    half: '#F59E0B',
                    quarter: '#EF4444',
                    zero: '#7F1D1D',
                }
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: 0 },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: 0 },
                },
                'dice-roll': {
                    '0%': { transform: 'rotate(0deg) scale(1)' },
                    '25%': { transform: 'rotate(90deg) scale(1.2)' },
                    '50%': { transform: 'rotate(180deg) scale(1)' },
                    '75%': { transform: 'rotate(270deg) scale(1.2)' },
                    '100%': { transform: 'rotate(360deg) scale(1)' },
                },
                'health-pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                },
                'spell-cast': {
                    '0%': { transform: 'scale(1) rotate(0deg)', opacity: 1 },
                    '50%': { transform: 'scale(1.1) rotate(180deg)', opacity: 0.8 },
                    '100%': { transform: 'scale(1) rotate(360deg)', opacity: 1 },
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'dice-roll': 'dice-roll 0.6s ease-in-out',
                'health-pulse': 'health-pulse 2s ease-in-out infinite',
                'spell-cast': 'spell-cast 1s ease-in-out',
            },
            fontFamily: {
                'fantasy': ['Cinzel', 'serif'],
                'medieval': ['UnifrakturMaguntia', 'cursive'],
            },
            backgroundImage: {
                'parchment': "url('/images/parchment-bg.jpg')",
                'leather': "url('/images/leather-bg.jpg')",
                'stone': "url('/images/stone-bg.jpg')",
            },
            boxShadow: {
                'inset-light': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)',
                'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
                'dice': '0 4px 12px rgba(0, 0, 0, 0.3)',
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        require('tailwindcss-animate'),
    ],
}