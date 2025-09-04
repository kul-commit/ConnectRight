import "../App.css";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function LandingPage() {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("AuthContext is undefined. Ensure AuthProvider is set up.");
  }

  const { isAuthenticated, logout } = authContext;

  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <img
            src="/public/logo_connect.svg"
            alt="Logo"
            height="100px"
            width="200px"
          />
        </div>
        <div className="navlist">
          {!isAuthenticated ? (
            <>
              <p>Join as guest</p>
              <Link to="/signup">
                <p>Sign up</p>
              </Link>
              <Link to="/login" className="loginBtn">
                <p>Login</p>
              </Link>
            </>
          ) : (
            <>
              <p>Welcome, User</p>
              <button onClick={logout} className="loginBtn">
                <p>Logout</p>
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1 className="heading">
            Limitless connection and collaboration <br /> with ConnectRight
          </h1>

          {!isAuthenticated ? (
            <Link to="/login" className="loginBtn">
              <p>Get Started</p>
            </Link>
          ) : (
            <Link to="/dashboard" className="loginBtn">
              <p>Go to Dashboard</p>
            </Link>
          )}
        </div>

        <div className="heroImg">
          <img src="/public/hero.png" alt="Hero" height="500px" width="800px" />
        </div>
      </div>
    </div>
  );
}
