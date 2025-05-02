import React from "react";
import { Navigate } from "react-router-dom";

// Type definition for component props
const PrivateRoute: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const token = sessionStorage.getItem("token");

  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
