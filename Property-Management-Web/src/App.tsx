import './App.css'
import { AppShell } from './app/AppShell'
import { ToastProvider } from './shared/ui/ToastProvider'

function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  )
}

export default App
