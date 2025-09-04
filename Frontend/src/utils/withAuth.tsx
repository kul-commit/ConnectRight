import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const AuthComponent: React.FC<P> = (props) => {
    const navigate = useNavigate();
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth");
      }
    }, [navigate]);
    return <WrappedComponent {...props} />;
  };
  return AuthComponent;
};
export default withAuth;
