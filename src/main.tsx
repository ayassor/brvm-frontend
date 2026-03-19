import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { store } from './store'
import { fetchMe } from './store/slices/authSlice'
import './index.css'

// Restore session on page load
if (localStorage.getItem('accessToken')) {
  store.dispatch(fetchMe())
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
