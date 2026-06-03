import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Inbox from "./pages/Inbox"
import TemplateManagement from "./components/TemplateManagement"
import TemplateCreator from "./components/TemplateCreator"
import { TooltipProvider } from "./components/ui/tooltip"

function RootRedirect() {
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token")
  return <Navigate to={hasToken ? "/inbox" : "/login"} replace />
}

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <TemplateManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates/new"
          element={
            <ProtectedRoute>
              <TemplateCreator />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </BrowserRouter>
    </TooltipProvider>
  )
}
