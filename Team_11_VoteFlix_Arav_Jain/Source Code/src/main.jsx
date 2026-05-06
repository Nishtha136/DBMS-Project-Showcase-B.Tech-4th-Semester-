// react library imports
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// main css file
import './index.css'
// our main app component
import App from './App.jsx'

// rendering the app in the 'root' div
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
