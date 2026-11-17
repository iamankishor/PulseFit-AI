import { io } from 'socket.io-client';
export const connectSocket = () => io((import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, ''), {
  auth: {
    token: localStorage.getItem('pulsefit_token')
  }
});
