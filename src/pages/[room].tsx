import type { NextPage } from 'next'
import { Router, withRouter } from 'next/router'
import { ChangeEventHandler, FormEvent, KeyboardEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { useWebSocketContext } from '../contexts/WebSocket'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import useDetectKeyboardOpen from 'use-detect-keyboard-open'

const Room: NextPage<Props> = ({ router }) => {
  const socket = useWebSocketContext()
  const [scrollTop, setScrollTop] = useState<number>(0)
  const [room, setRoom] = useState<string>('')
  const [alias, setAlias] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [messages, setMessages] = useState<ReceivedMessage[]>([])
  const [typing, setTyping] = useState<boolean>(false)
  const keyboardOpen = useDetectKeyboardOpen()
  const containerRef = useRef<HTMLDivElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)

  const handleDisconnection = () => {
    alert('Oh snap! You\'ve been disconnected :(')
    window.location.reload()
  }

  const handleMessageReceived = useCallback((message: ReceivedMessage) => {
    setMessages([...messages, message])
    const top = containerRef.current?.scrollTop || scrollTop
    setTimeout(() => {
      if (top === scrollTop || keyboardOpen) {
        setTimeout(() => { containerRef.current?.scrollTo(0, Number.MAX_SAFE_INTEGER) }, 10)
        return
      }
    })
  }, [messages, containerRef, scrollTop, keyboardOpen])

  const generateNonUserMessage = useCallback((content: string) => {
    const message: ReceivedMessage = {
      id: uuidv4(),
      color: '',
      dateCreated: new Date(),
      content,
      sender: { id: '', alias: '' }
    }
    setMessages([...messages, message])
    setTimeout(() => { containerRef.current?.scrollTo(0, Number.MAX_SAFE_INTEGER) }, 10)
  }, [messages, containerRef])

  const handleJoinedRoom = useCallback((alias: string) => {
    generateNonUserMessage(`${alias} joined the conversation`)
  }, [generateNonUserMessage])

  const handleDisconnectedUser = useCallback((message: string) => {
    generateNonUserMessage(message)
  }, [generateNonUserMessage])

  const handleScrollListen = useCallback((e: Event) => {
    const top = containerRef.current?.scrollTop || 0
    if (top > scrollTop) setScrollTop(top)
  }, [containerRef, scrollTop])

  const handleTypingStatus = useCallback(() => {
    if (typing) return
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
    }, 1000)
  }, [typing])

  const handleInputFocus = useCallback(() => {
    setTimeout(() => { containerRef.current?.scrollTo(0, Number.MAX_SAFE_INTEGER) }, 10)
  }, [containerRef])

  const handleTyping = useCallback(() => {
    socket.emit('typing')
    setMessage(textAreaRef.current?.value || '')
  }, [socket, textAreaRef])

  useEffect(() => {
    const { room, alias } = router.query
    if (
      router.asPath === '/[room]' ||
      typeof room !== 'string' ||
      typeof alias !== 'string' ||
      !room || !alias
    ) {
      router.push('/')
      return
    }
    setRoom(room)
    setAlias(alias)
    socket.emit('join-room', { room, alias })
    textAreaRef.current?.focus()
  }, []) // eslint-disable-line

  useEffect(() => {
    const message: ReceivedMessage = {
      id: uuidv4(),
      color: '',
      dateCreated: new Date(),
      content: 'You joined the conversation',
      sender: { id: '', alias: '' }
    }
    setMessages([message])
  }, [socket])

  useEffect(() => {
    socket.on('disconnect', handleDisconnection)
    socket.on('message-received', handleMessageReceived)
    socket.on('joined-room', handleJoinedRoom)
    socket.on('disconnected-user', handleDisconnectedUser)
    socket.on('typing', handleTypingStatus)
    return () => {
      socket.removeListener('disconnect', handleDisconnection)
      socket.removeListener('message-received', handleMessageReceived)
      socket.removeListener('joined-room', handleJoinedRoom)
      socket.removeListener('disconnected-user', handleDisconnectedUser)
      socket.removeListener('typing', handleTypingStatus)
    }
  }, [socket, handleMessageReceived, handleJoinedRoom, handleDisconnectedUser, handleTypingStatus])

  useEffect(() => {
    const container = containerRef
    container.current?.addEventListener('scroll', handleScrollListen)
    return () => {
      container.current?.removeEventListener('scroll', handleScrollListen)
    }
  }, [containerRef, handleScrollListen])

  const sendMessage = useCallback((e: FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    const data: Message = {
      dateCreated: new Date(),
      content: message.trim(),
      sender: { id: socket.id, alias }
    }
    socket.emit('send-message', data)
    setMessage('')
    textAreaRef.current?.focus()
  }, [message, socket, alias, textAreaRef])

  const handleMessageInput = useCallback((e: KeyboardEvent) => {
    if (!message || e.shiftKey || e.key !== 'Enter' || keyboardOpen) return
    submitButtonRef.current?.click()
    setTimeout(() => {
      setMessage('')
    }, 1)
  }, [submitButtonRef, keyboardOpen, message])

  return (
    <div className='container h-screen flex flex-col overflow-hidden'>
      <header className='bg-blue-500 text-white p-4 flex justify-between items-center sticky top-0 shadow'>
        <h1 className='font-bold overflow-x-hidden text-ellipsis w-2/3'>
          {room}
        </h1>
        <span className={`w-auto text-sm px-4 ${typing ? '' : 'invisible'}`}>
          Someone is typing..
        </span>
      </header>
      <div className='min-h-[calc(100vh-8rem)] bg-gray-100 overflow-y-auto pt-2' ref={containerRef}>
        {
          messages.map(message => (
            <div key={message.id}>
              {
                socket.id === message.sender.id ? (
                  <div className='flex m-4 flex-row-reverse'>
                    <div className='shadow pb-4 rounded-lg w-5/6 bg-blue-500 text-white'>
                      <p className='p-4 flex justify-between items-center font-bold gap-x-4'>
                        <span className='text-ellipsis overflow-x-hidden'>
                          You
                        </span>
                        <span className='text-sm text-white'>{moment(message.dateCreated).format('HH:mm')}</span>
                      </p>
                      <div className='px-4'>
                        <pre className='font-poppins w-full overflow-x-hidden text-ellipsis whitespace-pre-wrap'>{message.content}</pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  message.sender.id === '' ? (
                    <div className='text-center text-gray-400 font-bold my-2'>{message.content}</div>
                  ) : (
                    <div className='flex m-4'>
                      <div className='bg-gray-100 shadow pb-4 rounded-lg w-5/6'>
                        <p className='p-4 pl-0 flex justify-between items-center font-bold gap-x-4'>
                          <span className='text-ellipsis overflow-x-hidden border-l-4 pl-4' style={{ borderColor: message.color }}>
                            {message.sender.alias}
                          </span>
                          <span className='text-sm text-gray-400'>{moment(message.dateCreated).format('HH:mm')}</span>
                        </p>
                        <div className='px-4'>
                          <pre className='font-poppins w-full overflow-x-hidden text-ellipsis whitespace-pre-wrap'>{message.content}</pre>
                        </div>
                      </div>
                    </div>)
                )
              }
            </div>
          ))
        }
      </div>
      <form className='flex mt-auto' onSubmit={sendMessage}>
        <div className='w-5/6 h-full bg-gray-100'>
          <textarea
            className='w-full h-full leading-12 resize-none p-2'
            placeholder='Aa'
            value={message}
            autoComplete='off'
            ref={textAreaRef}
            onChange={handleTyping as () => ChangeEventHandler}
            onFocus={handleInputFocus}
            onKeyDown={handleMessageInput as () => KeyboardEventHandler}
          />
        </div>
        <button className='bg-blue-500 hover:bg-blue-600 font-bold text-white p-4 grow' type='submit' title='Send message' ref={submitButtonRef}>
          Send
        </button>
      </form>
    </div>
  )
}

type Props = {
  router: Router
}

type Message = {
  dateCreated: Date,
  content: string,
  sender: {
    id: string,
    alias: string
  }
}

type ReceivedMessage = Message & {
  id: string,
  color: string
}

export default withRouter<Props>(Room)