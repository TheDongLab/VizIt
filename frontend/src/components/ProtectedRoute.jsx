import { Navigate } from "react-router-dom";
import userStore from "../store/UserStore.js";

const ProtectedRoute = ({ children, roles }) => {
  const user = userStore((state) => state.user);

  if (!user) {
    // User is not logged in
    return <Navigate to="/login" replace />;
  }

  if (roles && (!roles.includes(user.role))) {
    // User doesn't have the required role, redirect to unauthorized page or home
    return <Navigate to="/unauthorized" replace />;
  }

  // User is logged in and has the required role, render the children
  return children;
};

export default ProtectedRoute;
