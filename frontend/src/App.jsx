import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ArticleList from './pages/ArticleList'
import ArticleDetail from './pages/ArticleDetail'
import CoachApplication from './pages/CoachApplication'
import AdminPanel from './pages/AdminPanel'
import CoachDashboard from './pages/CoachDashboard'
import CoachPage from './pages/CoachPage'
import CoachesList from './pages/CoachesList'
import MyProfile from './pages/MyProfile'
import PostFeed from './pages/PostFeed'
import SavedPosts from './pages/SavedPosts'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import PaymentSimulation from './pages/PaymentSimulation'
import MyOrders from './pages/MyOrders'
import OrderDetail from './pages/OrderDetail'
import CoachProducts from './pages/CoachProducts'
import CoachSales from './pages/CoachSales'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/articles" replace />} />
        <Route path="/articles" element={<ArticleList />} />
        <Route path="/articles/:slug" element={<ArticleDetail />} />
        <Route path="/coach-application" element={<CoachApplication />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/coach-dashboard" element={<CoachDashboard />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/coaches" element={<CoachesList />} />
        <Route path="/coaches/:coachId" element={<CoachPage />} />
        <Route path="/posts" element={<PostFeed />} />
        <Route path="/saved" element={<SavedPosts />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/payment/:orderId" element={<PaymentSimulation />} />
        <Route path="/orders" element={<MyOrders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/coach-products" element={<CoachProducts />} />
        <Route path="/coach-sales" element={<CoachSales />} />
        <Route path="*" element={<Navigate to="/articles" replace />} />
      </Routes>
    </>
  )
}
