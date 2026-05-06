// express is our web server framework
import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import apiRoutes from './routes/apiRoutes.js'

// creating the app instance
const app = express()
// adding cors and json body parser
app.use(cors())
app.use(express.json())

// using the api routes we defined in routes folder
app.use('/api', apiRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ ok: false, message: err.message || 'Internal server error' })
})

// function to start the server
async function start() {
  app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}`)
  })
}

start().catch((error) => {
  console.error('Failed to start backend:', error)
  process.exit(1)
})
