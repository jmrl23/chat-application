import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useForm, SubmitHandler } from 'react-hook-form'
import { ErrorMessage } from '@hookform/error-message'

const Home: NextPage = () => {

  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>()
  const router = useRouter()
  const onSubmit: SubmitHandler<Inputs> = data => {
    router.push(`/${data.room}?alias=${data.alias}`)
  }

  return (
    <div className='container mt-8'>
      <form className='shadow mx-4 rounded-lg' onSubmit={handleSubmit(onSubmit)}>
        <h1 className='text-center font-bold text-2xl pt-4 mb-2'>Chat App</h1>
        <div className='flex flex-col gap-2 m-4'>
          <div className='flex flex-col'>
            <label className='text-blue-500 text-sm font-bold' htmlFor="room-input">Room</label>
            <ErrorMessage
              errors={errors}
              name={'room'}
              render={({ message }) => (
                <span className='text-xs text-red-500 py-2'>{message}</span>
              )}
            />
            <input
              className='bg-white border-4 rounded-lg px-4 py-2 focus:border-blue-400'
              placeholder='Lobby'
              id='room-input'
              autoComplete='off'
              {
              ...register('room', {
                required: 'Required',
                minLength: {
                  value: 3,
                  message: 'Should have at least 3 characters'
                },
                maxLength: {
                  value: 32,
                  message: 'Limit is 32 characters'
                },
                pattern: {
                  value: /^[a-zA-Z0-9-_\s]{2,32}$/,
                  message: 'Invalid'
                }
              })
              }
            />
          </div>
          <div className='flex flex-col'>
            <label className='text-blue-500 text-sm font-bold' htmlFor="alias-input">Alias</label>
            <ErrorMessage
              errors={errors}
              name={'alias'}
              render={({ message }) => (
                <span className='text-xs text-red-500 py-2'>{message}</span>
              )}
            />
            <input className='bg-white border-4 rounded-lg px-4 py-2 focus:border-blue-400'
              type="text"
              placeholder='John'
              id='alias-input'
              autoComplete='off'
              {
              ...register('alias', {
                required: 'Required',
                minLength: {
                  value: 2,
                  message: 'Should have at least 2 characters'
                },
                maxLength: {
                  value: 32,
                  message: 'Limit is 32 characters'
                },
                pattern: {
                  value: /^[a-zA-Z0-9-_\s]{2,32}$/,
                  message: 'Invalid'
                }
              })
              }
            />
          </div>
        </div>
        <button className='mt-4 rounded-b-lg p-4 bg-blue-500 text-white font-bold w-full hover:bg-blue-600' type='submit' title='Join'>
          Join room
        </button>
      </form>
    </div>
  )

}

type Inputs = {
  room: string,
  alias: string,
}

export default Home
