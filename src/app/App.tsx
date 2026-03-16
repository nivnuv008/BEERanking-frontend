import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "../features/auth/pages/SignUp";
import FeedCommentsPage from "../features/posts/pages/FeedCommentsPage";
import FeedPage from "../features/posts/pages/FeedPage";
import AppLayout from "../features/layout/pages/AppLayout";
import CreatePostPage from "../features/posts/pages/CreatePostPage";
import MyPostsPage from "../features/posts/pages/MyPostsPage";
import ProfilePage from "../features/profile/pages/ProfilePage";
import SignIn from "../features/auth/pages/SignIn";
import { AISommelier } from "../features/aisommelier/pages/AISommelier";
import ProtectedRoute from "./ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/feed" element={<FeedPage />} />
            <Route
              path="/posts/:postId/comments"
              element={<FeedCommentsPage />}
            />
            <Route path="/my-posts" element={<MyPostsPage />} />
            <Route path="/create-post" element={<CreatePostPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/ai-sommelier" element={<AISommelier />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
