import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import WelcomePage from './components/WelcomePage'
import SignUp from './components/SignUp'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  )
}

export default App
