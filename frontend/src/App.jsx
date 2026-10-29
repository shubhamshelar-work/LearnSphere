import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import Courses from './pages/Courses'
import CourseDetails from './pages/CourseDetails'
import Learning from './pages/Learning'
import Quiz from './pages/Quiz'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import About from './pages/About'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />

            {/* Signed-in students (and admins) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/learn/:courseId/:lessonId" element={<Learning />} />
              <Route path="/quiz/:courseId/:moduleId" element={<Quiz />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            {/* Admins only */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
