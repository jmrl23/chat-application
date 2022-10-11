import { Html, Head, Main, NextScript } from 'next/document'

const Document = () => {
  return (
    <Html lang='en'>
      <Head>
        <meta name='theme-color' content='#3b82f6' />
        <meta name='description' content='Chat application created by Jomariel Gaitera' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='true' />
        <link rel='stylesheet' href='https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;700&display=swap' />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

export default Document