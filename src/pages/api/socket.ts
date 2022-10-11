import type { NextApiRequest } from 'next'
import { NextApiResponseServerIO } from '../../types'
import { Server } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

const generateColor = (brightness: number = 50): string => {
  const randomChannel = (brightness: number) => {
    const r = 255 - brightness
    const n = 0 | ((Math.random() * r) + brightness)
    const s = n.toString(16)
    return (s.length == 1) ? '0' + s : s
  }
  return '#' + randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness)
}

function socketHandler(_request: NextApiRequest, response: NextApiResponseServerIO) {
  if (response.socket.server.io) return response.end('OK')

  const httpServer = response.socket.server as any
  const io = new Server(httpServer, { path: '/api/socket' })

  response.socket.server.io = io

  io.on('connection', socket => {

    const memory = new Map()

    socket.on('join-room', (data) => {
      const { room, alias } = data
      memory.set('room', room)
      memory.set('alias', alias)
      memory.set('color', generateColor())
      socket.join(room)
      socket.to(memory.get('room')).emit('joined-room', memory.get('alias'))
    })

    socket.on('typing', () => {
      socket.to(memory.get('room')).emit('typing')
    })

    socket.on('send-message', (message) => {
      const messageId = uuidv4()
      message.id = messageId
      message.color = memory.get('color')
      io.in(memory.get('room')).emit('message-received', message)
    })

    socket.on('disconnect', () => {
      io.in(memory.get('room')).emit('disconnected-user', `${memory.get('alias')} left the conversation`)
    })

  })

  response.end()
}

export const config = {
  api: { bodyParser: false }
}

export default socketHandler