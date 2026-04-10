import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Home } from './pages/Home'
import { Game } from './pages/Game'
import { Lobby } from './pages/Lobby'
import { Tournament } from './pages/Tournament'
import './index.css'

// Random favicon — one of 4 card suits
;(() => {
  const suits = [
    // Heart
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 56 C16 42 2 30 2 18 2 8 10 2 18 2 24 2 29 5 32 10 35 5 40 2 46 2 54 2 62 8 62 18 62 30 48 42 32 56Z" fill="%23e74c3c"/></svg>`,
    // Diamond
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><polygon points="32,2 58,32 32,62 6,32" fill="%23e74c3c"/></svg>`,
    // Club
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="16" r="13" fill="%23d4af37"/><circle cx="17" cy="32" r="13" fill="%23d4af37"/><circle cx="47" cy="32" r="13" fill="%23d4af37"/><rect x="28" y="38" width="8" height="16" rx="2" fill="%23d4af37"/><polygon points="22,56 32,46 42,56" fill="%23d4af37"/></svg>`,
    // Spade
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 2 C32 2 2 28 2 40 2 50 10 54 18 52 24 50 28 46 32 40 36 46 40 50 46 52 54 54 62 50 62 40 62 28 32 2 32 2Z" fill="%23d4af37"/><rect x="28" y="44" width="8" height="14" rx="2" fill="%23d4af37"/><polygon points="22,58 32,50 42,58" fill="%23d4af37"/></svg>`,
  ]
  const svg = suits[Math.floor(Math.random() * suits.length)]
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (link) link.href = `data:image/svg+xml,${svg}`
})()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/solo-normal" element={<Game />} />
        <Route path="/solo-hard" element={<Game />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/tournament" element={<Tournament />} />
        <Route path="/battle-royale" element={<Tournament />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
)
