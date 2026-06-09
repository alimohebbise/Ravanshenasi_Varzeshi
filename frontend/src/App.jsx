import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ArticleList from './pages/ArticleList'
import ArticleDetail from './pages/ArticleDetail'
import CoachApplication from './pages/CoachApplication'
import AdminPanel from './pages/AdminPanel'
import CoachDashboard from './pages/CoachDashboard'
import CoachPage from './pages/CoachPage'
import CoachesList from './pages/CoachesList'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/fa/articles" replace />} />
        <Route path="/:lang/articles" element={<ArticleList />} />
        <Route path="/:lang/articles/:slug" element={<ArticleDetail />} />
        <Route path="/coach-application" element={<CoachApplication />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/coach-dashboard" element={<CoachDashboard />} />
        <Route path="/coaches" element={<CoachesList />} />
        <Route path="/coaches/:coachId" element={<CoachPage />} />
        <Route path="*" element={<Navigate to="/fa/articles" replace />} />
      </Routes>
    </>
  )
}
