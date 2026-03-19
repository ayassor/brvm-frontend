import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import Layout from './components/layout/Layout'
import LayoutFull from './components/layout/LayoutFull'
import PrivateRoute from './components/common/PrivateRoute'
import BrvmSimulator from './pages/BrvmSimulator'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Market from './pages/Market'
import CompanyDetail from './pages/CompanyDetail'
import Bonds from './pages/Bonds'
import News from './pages/News'
import NewsArticle from './pages/NewsArticle'
import AssetManagers from './pages/AssetManagers'
import Portfolio from './pages/Portfolio'
import Education from './pages/Education'
import BrvmPackage from './pages/BrvmPackage'
import LiveChart from './pages/LiveChart'
import ApiDebug from './pages/ApiDebug'
import LiveApiDebug from './pages/LiveApiDebug'
import Ai from './pages/Ai'
import DataImport from './pages/DataImport'
import Admin from './pages/Admin'
import AdminEducation from './pages/AdminEducation'
import AdminEducationCourse from './pages/AdminEducationCourse'

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/market" element={<Market />} />
            <Route path="/market/:id" element={<CompanyDetail />} />
            <Route path="/bonds" element={<Bonds />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<NewsArticle />} />
            <Route path="/asset-managers" element={<AssetManagers />} />
            <Route path="/education" element={<Education />} />
            <Route path="/brvm-package" element={<BrvmPackage />} />
            <Route path="/live" element={<LiveChart />} />
            <Route path="/api-debug" element={<ApiDebug />} />
            <Route path="/live-debug" element={<LiveApiDebug />} />
            <Route path="/ai" element={<Ai />} />
            <Route path="/data-import" element={<DataImport />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route path="/portfolio" element={<Portfolio />} />
          </Route>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/education" element={<AdminEducation />} />
          <Route path="/admin/education/:courseId" element={<AdminEducationCourse />} />
          <Route element={<LayoutFull />}>
            <Route path="/simulator/portfolio" element={<BrvmSimulator />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}
