import React from 'react'
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import  User from './pages/User'
import Provider from './pages/Provider'
import Booking from './pages/Booking'
function App() {
  return (
    <Router>
        <Routes>
            <Route path='/' element={<Dashboard/>}/>
            <Route path='/users' element={<User/>}/>
            <Route path='/providers' element={<Provider/>}/>
            <Route path='/bookings' element={<Booking/>}/>
        </Routes>
    </Router>
  )
}

export default App