import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './page/Home';
import Dashboard from './page/Dashboard';
import Profile from './page/Profile';
import ProviderNavbar from './components/Navbar';
import ProviderChatPage from './page/ProviderChatPage';

function App() {
  return (
    <Router>
      <ProviderNavbar/>
      <Routes>
        <Route path='/'          element={<Home/>}/>
        <Route path='/dashboard' element={<Dashboard/>}/>
        <Route path='/profile'   element={<Profile/>}/>
        <Route path='/chat'      element={<ProviderChatPage/>}/>
        <Route path='/chat/:userId' element={<ProviderChatPage/>}/>
      </Routes>
    </Router>
  )
}

export default App