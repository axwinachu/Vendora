import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',  // required by sockjs-client / @stomp/stompjs in browser
  },
  server: {
    port: 5174
  }
})
