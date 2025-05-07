import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'


// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)), // ① alias "@": "src"
        },
    },
    css: { devSourcemap: false },   // ⬅️ coupe les .map générés par Tailwind
    build: { sourcemap: false }     // idem pour le build prod
})
