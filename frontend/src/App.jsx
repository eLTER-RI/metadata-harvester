import './App.css'
import { ToastProvider } from "./components/common/display/toast/toast-provider.tsx"
import { Router } from "./Router.tsx";

function App() {
  return (
    <>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </>
  )
}

export default App
