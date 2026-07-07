import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './app/ThemeContext'
import AppLayout from './layouts/AppLayout'
import LoginPage from './features/login/LoginPage'
import DashboardPage from './features/dashboard/DashboardPage'
import CompaniesPage from './features/companies/CompaniesPage'
import PersonnelPage from './features/personnel/PersonnelPage'
import TestsPage from './features/tests/TestsPage'
import EquipmentPage from './features/equipment/EquipmentPage'
import VehiclesPage from './features/vehicles/VehiclesPage'
import QuotesPage from './features/quotes/QuotesPage'
import ScansPage from './features/scans/ScansPage'
import './app/App.css'

function AppShell({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="app-shell">
      <AppLayout onLogout={onLogout}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/personnel" element={<PersonnelPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/equipment" element={<EquipmentPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/scans" element={<ScansPage />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AppLayout>
    </div>
  )
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem('loggedIn') === 'true')

  function handleLogin() {
    localStorage.setItem('loggedIn', 'true')
    setLoggedIn(true)
  }

  function handleLogout() {
    localStorage.removeItem('loggedIn')
    setLoggedIn(false)
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            loggedIn ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />
          } />
          <Route path="/*" element={
            loggedIn ? <AppShell onLogout={handleLogout} /> : <Navigate to="/login" />
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}