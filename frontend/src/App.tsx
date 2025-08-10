import Navbar from './components/Navbar';
import {Routes, Route} from "react-router-dom";
import Home from './pages/Home';
import Profile from './pages/Profile';
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
    <UserProvider>
      <NotificationProvider>
        <Navbar></Navbar>
        <div className='main-content'>
        <Routes>
          <Route path='/' element={<Landingpage />}/>
          <Route path='/profile' element={<Profile />}/>
          <Route path='/login' element={<Login />}/>
          <Route path='/forgot-password' element={<ForgotPassword />}/>
          <Route path='/signup' element={<Signup />}/>
          <Route path='/verify-email' element={<VerifyEmail />}/>
          <Route path='/home' element={<Home />}/>
          <Route path='/inbox' element={<InboxPage />}/>
          {/* Setting up a parent route at /teams/:teamId, will handle nested routes 
              inside the team component */}
          <Route path="/teams/:team_id/*" element={<Team />} />
        </Routes>
        <ToastContainer />
      </div>
      </NotificationProvider>
    </UserProvider>
    </>
  )
}

export default App
