import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import { AuthProvider } from "./context/AuthContext";
import HomeComponent from "./pages/dashboard";
import History from "./pages/History";
import VideoMeetComponent from "./pages/VideoMeet";
import ProtectedRoute from "../src/components/protectedRoute";
import Signup from "./pages/Signup";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Authentication />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<HomeComponent />} />
            <Route path="/history" element={<History />} />
            <Route path="/meet/:code" element={<VideoMeetComponent />} />
          </Route>

          <Route path=":url" element={<Navigate to="/meet/:url" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
