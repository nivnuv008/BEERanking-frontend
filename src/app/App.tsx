import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SignUp from '../features/auth/pages/SignUp'
import FeedPage from '../features/feed/pages/FeedPage'
import AppLayout from '../features/layout/pages/AppLayout'
import CreatePostPage from '../features/posts/pages/CreatePostPage'
import MyPostsPage from '../features/posts/pages/MyPostsPage'
import ProfilePage from '../features/profile/pages/ProfilePage'
import WelcomePage from '../features/welcome/pages/WelcomePage'

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
