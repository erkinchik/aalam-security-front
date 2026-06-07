import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Header } from '../components/layout/Header'
import { AlarmBanner } from '../components/AlarmBanner'
import { useEmergencySocket } from '../hooks/useEmergencySocket'
import { useAlarmStore } from '../stores/alarmStore'

export function Layout() {
  useEmergencySocket()

  const [isMobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onInteraction = () => {
      const { isRinging, isAudioUnlocked, dismiss, unlock } = useAlarmStore.getState()
      if (!isAudioUnlocked) {
        void unlock()
        return
      }
      if (isRinging) dismiss()
    }
    document.addEventListener('click', onInteraction)
    document.addEventListener('keydown', onInteraction)
    return () => {
      document.removeEventListener('click', onInteraction)
      document.removeEventListener('keydown', onInteraction)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <Header onMobileMenuOpen={() => setMobileNavOpen(true)} />
        <AlarmBanner />
        <main className="flex-1 p-3 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
