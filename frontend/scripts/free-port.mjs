import { createServer } from 'node:net'

const DEFAULT_PORT = 3000
const MAX_ATTEMPTS = 10
const PROBED_HOSTS = ['::', '0.0.0.0', '127.0.0.1', '::1']

const isInUse = (port, host) => new Promise(resolve => {
   const server = createServer()
   server.once('error', error => resolve(error.code === 'EADDRINUSE'))
   server.listen(port, host, () => server.close(() => resolve(false)))
})

const isFree = async port => {
   for (const host of PROBED_HOSTS) {
      if (await isInUse(port, host)) {
         return false
      }
   }
   return true
}

const findFreePort = async () => {
   for (let port = DEFAULT_PORT; port < DEFAULT_PORT + MAX_ATTEMPTS; port++) {
      if (await isFree(port)) {
         if (port !== DEFAULT_PORT) {
            console.error(`Port ${DEFAULT_PORT} is in use, using available port ${port} instead.`)
         }
         return port
      }
   }
   throw new Error(`No free port between ${DEFAULT_PORT} and ${DEFAULT_PORT + MAX_ATTEMPTS - 1}`)
}

console.log(process.env.PORT || await findFreePort())
