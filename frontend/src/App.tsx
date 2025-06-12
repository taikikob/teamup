import Navbar from './components/Navbar';
import {Routes, Route} from "react-router-dom";
import Home from './pages/Home';
import Profile from './pages/Profile';

function App() {
  return (
    <>
      <Navbar></Navbar>
      <div className='main-content'>
        <Routes>
          <Route path='/' element={<Home />}/>
          <Route path='/profile' element={<Profile />}/>
        </Routes>
      </div>
    </>
  )
}

export default App
