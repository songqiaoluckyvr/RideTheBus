import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Home } from './pages/Home'
import { Game } from './pages/Game'
import { Lobby } from './pages/Lobby'
import { Tournament } from './pages/Tournament'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/tournament" element={<Tournament />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
)
