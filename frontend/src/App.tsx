/**
 * NeuroOps AI — App Root
 * Sets up React Router, Lenis smooth scrolling, Neural Core 3D background,
 * and the spatial floating navigation.
 */
import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Lenis from '@studio-freight/lenis'

import { Sidebar } from '@/components/layout/Sidebar'
import { NeuralCore } from '@/components/effects/NeuralCore'

import { Dashboard } from '@/pages/Dashboard'
import { Analytics } from '@/pages/Analytics'
import { Alerts } from '@/pages/Alerts'
import { Assistant } from '@/pages/Assistant'
import { Predictions } from '@/pages/Predictions'
import { Settings } from '@/pages/Settings'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"           element={<Dashboard />}   />
        <Route path="/analytics"  element={<Analytics />}   />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/alerts"     element={<Alerts />}      />
        <Route path="/assistant"  element={<Assistant />}   />
        <Route path="/settings"   element={<Settings />}    />
      </Routes>
    </AnimatePresence>
  )
}

function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <SmoothScroll />
      
      {/* 3D Spatial Background */}
      <NeuralCore />

      {/* Global CSS Noise Overlay via class */}
      <div className="fixed inset-0 pointer-events-none noise-overlay z-50 mix-blend-overlay opacity-30" />

      {/* App shell — Spatial paradigm */}
      <div className="relative flex flex-col min-h-dvh z-10">
        <Sidebar /> {/* This is now a floating pill navigation */}
        
        <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto pb-32">
          <AnimatedRoutes />
        </main>
      </div>
    </BrowserRouter>
  )
}
