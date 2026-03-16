import { Navigate, Outlet } from "react-router-dom";
import {
  getAuthRedirectPath,
  isAuthenticated,
} from "../features/auth/api/authApi";

function GuestRoute() {
  if (isAuthenticated()) {
    return <Navigate to={getAuthRedirectPath()} replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
