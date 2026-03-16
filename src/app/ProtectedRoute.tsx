import { Navigate, Outlet } from "react-router-dom";
import { getAuthToken } from "../features/auth/api/authApi";

function ProtectedRoute() {
  if (!getAuthToken()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
