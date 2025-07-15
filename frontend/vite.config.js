import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({mode}) => {
    const env = loadEnv(mode, 'env');

    return {
        plugins: [react()],
        envDir: './env', // ⬅️ 指定 .env 文件夹
        server: {
            // proxy: {
            //   '/api': {
            //     target: 'http://localhost:8000',
            //     changeOrigin: true,
            //     secure: false,
            //   },
            // },
            host: '0.0.0.0',
            port: parseInt(env.VITE_PORT) || 5172,
        },
    };
})
