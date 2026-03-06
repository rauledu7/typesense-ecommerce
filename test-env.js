import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config()

console.log('Variables de entorno:')
console.log('TYPESENSE_HOST:', process.env.TYPESENSE_HOST)
console.log('TYPESENSE_PORT:', process.env.TYPESENSE_PORT)
console.log('TYPESENSE_PROTOCOL:', process.env.TYPESENSE_PROTOCOL)
console.log('TYPESENSE_API_KEY length:', process.env.TYPESENSE_API_KEY ? process.env.TYPESENSE_API_KEY.length : 0)
console.log('TYPESENSE_API_KEY:', process.env.TYPESENSE_API_KEY ? '***' : 'no definida') 