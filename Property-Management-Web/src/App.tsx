import './App.css'
import { AppShell } from './app/AppShell'
import { AuthProvider } from './core/auth/AuthContext'
import { ToastProvider } from './shared/ui/ToastProvider'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
