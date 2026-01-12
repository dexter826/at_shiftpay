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
            },
            fontFamily: {
                retro: ['Coiny', 'cursive'],
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
