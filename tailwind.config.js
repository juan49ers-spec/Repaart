/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                // "Peaceful Brand" - Soft Blue-Purple Gradient Logic
                // Replacing 'indigo' with our custom brand palette to instantly re-theme the app
                indigo: {
                    50: '#f0f4f8',   // Alice Blue
                    100: '#d9e2ec',  // Soft Slate
                    200: '#bcccdc',  // Periwinkle Low
                    300: '#9fb3c8',  // Periwinkle Mid
                    400: '#829ab1',  // Muted Blue
                    500: '#627d98',  // BRAND PRIMARY (Soft) - Was Strong Indigo
                    600: '#486581',  // Darker Muted
                    700: '#334e68',  // Slate Blue
                    800: '#243b53',  // Dark Slate
                    900: '#102a43',  // Night Blue
                    950: '#0a1c2e',
                }
            }
        },
    },
    plugins: [],
}
