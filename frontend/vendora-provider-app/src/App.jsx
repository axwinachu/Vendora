import React from 'react'
import ChatPage from './page/ChatPage'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<ChatPage/>}/>
      </Routes>
    </Router>
    
  )
}

export default App