import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import CreatePostPage from './components/CreatePostPage'
import FeedPage from './components/FeedPage'
import MyPostsPage from './components/MyPostsPage'
import WelcomePage from './components/WelcomePage'
import SignUp from './components/SignUp'
import ProfilePage from './components/ProfilePage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route element={<AppLayout />}>
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/my-posts" element={<MyPostsPage />} />
          <Route path="/create-post" element={<CreatePostPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
