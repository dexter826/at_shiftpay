/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#ecb52d',
                surface: {
                    DEFAULT: 'var(--bg-primary)',
                    secondary: 'var(--bg-secondary)',
                    card: 'var(--bg-card)',
                },
                border: {
                    DEFAULT: 'var(--border-color)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)',
                },
            },
            fontFamily: {
                sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'sans-serif'],
            },
            fontSize: {
                '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
