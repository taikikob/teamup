import Navbar from './components/Navbar';
import {Routes, Route} from "react-router-dom";
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landingpage from './pages/Landingpage';


function App() {
  return (
    <>
      <Navbar></Navbar>
      <div className='main-content'>
        <Routes>
          <Route path='/' element={<Landingpage />}/>
          <Route path='/profile' element={<Profile />}/>
          <Route path='/login' element={<Login />}/>
          <Route path='/signup' element={<Signup />}/>
          <Route path='/home' element={<Home />}/>
        </Routes>
      </div>
    </>
  )
}

export default App
