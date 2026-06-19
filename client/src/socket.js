import { io } from 'socket.io-client'

export const socket = io('http://localhost:3001', {
  reconnectionDelay: 2000,
  reconnectionAttempts: 5
})
