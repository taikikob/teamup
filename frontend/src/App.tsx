import PublicNavbar from './components/PublicNavbar';
import Navbar from './components/Navbar';
import { Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landingpage from './pages/Landingpage';
import InboxPage from './pages/InboxPage';
import Team from './pages/Team';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path='/' element={<><PublicNavbar /><Landingpage /></>} />
        <Route path='/login' element={<><PublicNavbar /><Login /></>} />
        <Route path='/signup' element={<><PublicNavbar /><Signup /></>} />
        <Route path='/verify-email' element={<><PublicNavbar /><VerifyEmail /></>} />
        <Route path='/forgot-password' element={<><PublicNavbar /><ForgotPassword /></>} />

        {/* Authenticated routes */}
        <Route
          path='/profile'
          element={
            <UserProvider>
              <NotificationProvider>
                <Navbar />
                <Profile />
              </NotificationProvider>
            </UserProvider>
          }
        />
        <Route
          path='/settings'
          element={
            <UserProvider>
              <NotificationProvider>
                <Navbar />
                <Settings />
              </NotificationProvider>
            </UserProvider>
          }
        />
        <Route
          path='/home'
          element={
            <UserProvider>
              <NotificationProvider>
                <Navbar />
                <Home />
              </NotificationProvider>
            </UserProvider>
          }
        />
        <Route
          path='/inbox'
          element={
            <UserProvider>
              <NotificationProvider>
                <Navbar />
                <InboxPage />
              </NotificationProvider>
            </UserProvider>
          }
        />
        <Route
          path='/teams/:team_id/*'
          element={
            <UserProvider>
              <NotificationProvider>
                <Navbar />
                <Team />
              </NotificationProvider>
            </UserProvider>
          }
        />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
