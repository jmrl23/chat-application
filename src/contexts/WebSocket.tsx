import { createContext, useContext } from 'react'
import io, { Socket } from 'socket.io-client'

const socket = io({ path: '/api/socket' })
const WebSocketContext = createContext<Socket>(socket)

export const useWebSocketContext = () => useContext(WebSocketContext)