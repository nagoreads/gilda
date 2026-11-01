import ErrorBoundary from './components/ErrorBoundary';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ClubProvider } from './context/ClubContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClubProvider>
      <ErrorBoundary><App /></ErrorBoundary>
    </ClubProvider>
  </React.StrictMode>,
)