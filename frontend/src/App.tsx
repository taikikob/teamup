import Navbar from './components/Navbar';
import {Routes, Route} from "react-router-dom";
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landingpage from './pages/Landingpage';
import Inbox from './pages/Inbox';
import { UserProvider } from './contexts/UserContext';


function App() {
  return (
    <>
    <UserProvider>
    <Navbar></Navbar>
        <div className='main-content'>
        <Routes>
          <Route path='/' element={<Landingpage />}/>
          <Route path='/profile' element={<Profile />}/>
          <Route path='/login' element={<Login />}/>
          <Route path='/signup' element={<Signup />}/>
          <Route path='/home' element={<Home />}/>
          <Route path='/inbox' element={<Inbox />}/>
        </Routes>
      </div>
    </UserProvider>
    </>
  )
}

export default App
