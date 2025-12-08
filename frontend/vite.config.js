import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all interfaces (needed for Docker)
    port: parseInt(process.env.VITE_PORT || '5173', 10),
    watch: {
      usePolling: true, // Needed for Docker with mounted volumes
    },
  },
  preview: {
    port: parseInt(process.env.VITE_PORT || '5173', 10),
  },
});
