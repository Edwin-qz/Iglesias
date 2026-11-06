import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppStoreProvider, useStore } from './store/AppStore'
import { ToastProvider } from './components/Toast'
import { AppLayout, AccessDenied } from './components/AppLayout'
import type { Permission } from './types'
import Landing from './pages/Landing'
import { Login, Register, Recover } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import AttendancePage from './pages/Attendance'
import Events from './pages/Events'
import Ministries from './pages/Ministries'
import Donations from './pages/Donations'
import Announcements from './pages/Announcements'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Profile from './pages/Profile'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useStore()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <>{children}</>
}

function Guard({ permission, module, children }: { permission: Permission; module: string; children: ReactNode }) {
  const { can } = useStore()
  if (!can(permission)) return <AccessDenied module={module} />
  return <>{children}</>
}

export default function App() {
  return (
    <AppStoreProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/recuperar" element={<Recover />} />

            <Route
              path="/app"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route
                index
                element={
                  <Guard permission="dashboard" module="Panel principal">
                    <Dashboard />
                  </Guard>
                }
              />
              <Route
                path="miembros"
                element={
                  <Guard permission="members.view" module="Miembros">
                    <Members />
                  </Guard>
                }
              />
              <Route
                path="asistencia"
                element={
                  <Guard permission="attendance.view" module="Asistencia">
                    <AttendancePage />
                  </Guard>
                }
              />
              <Route
                path="eventos"
                element={
                  <Guard permission="events.view" module="Eventos">
                    <Events />
                  </Guard>
                }
              />
              <Route
                path="ministerios"
                element={
                  <Guard permission="ministries.view" module="Ministerios">
                    <Ministries />
                  </Guard>
                }
              />
              <Route
                path="donaciones"
                element={
                  <Guard permission="finance.view" module="Donaciones">
                    <Donations />
                  </Guard>
                }
              />
              <Route
                path="anuncios"
                element={
                  <Guard permission="announcements.view" module="Anuncios">
                    <Announcements />
                  </Guard>
                }
              />
              <Route
                path="reportes"
                element={
                  <Guard permission="reports.view" module="Reportes">
                    <Reports />
                  </Guard>
                }
              />
              <Route
                path="usuarios"
                element={
                  <Guard permission="users.manage" module="Usuarios">
                    <Users />
                  </Guard>
                }
              />
              <Route
                path="configuracion"
                element={
                  <Guard permission="settings.view" module="Configuración">
                    <Settings />
                  </Guard>
                }
              />
              <Route path="perfil" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AppStoreProvider>
  )
}
