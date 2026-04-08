import React from 'react'
import Chat from "./page/Chat"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './page/Home';
import Dashboard from './page/Dashboard';
import Profile from './page/Profile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/'          element={<Home/>}/>
        <Route path='/dashboard' element={<Dashboard/>}/>
        <Route path='/profile'   element={<Profile/>}/>
        <Route path='/chat'      element={<Chat/>}/>
        <Route path='/chat/:userId' element={<Chat/>}/>
      </Routes>
    </Router>
  )
}

export default App