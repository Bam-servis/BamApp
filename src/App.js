import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./home";
import Profile from "./components/Profile";

const App = () => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const userName = localStorage.getItem("username");
      if (token) {
        try {
          setAuth({
            isAuthenticated: true,
            user: userName,
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          setAuth({
            isAuthenticated: false,
            user: null,
          });
        }
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setAuth({ isAuthenticated: false, user: null });
  };

  return (
    <Router>
      <div>
        {auth.isAuthenticated && (
          <nav className="nav-profile">
            <span className="username">{localStorage.getItem("username")}</span>
            <Link to="/profile">
              <button>Перейти в профиль</button>
            </Link>
            <button onClick={handleLogout}>Выйти</button>
          </nav>
        )}
        <Routes>
          <Route
            path="/login"
            element={
              auth.isAuthenticated ? (
                <Navigate to="/" />
              ) : (
                <Login setAuth={setAuth} />
              )
            }
          />
          {/* <Route
            path="/register"
            element={auth.isAuthenticated ? <Navigate to="/" /> : <Register />}
          /> */}
          <Route
            path="/"
            element={auth.isAuthenticated ? <Home /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={
              auth.isAuthenticated ? <Profile /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </div>
      <div className="developer">
        <a href="https://t.me/web_gpy" target="_blanc">
          &copy; Web-GPY Software.
        </a>{" "}
        2024 Все права защищены.
      </div>
    </Router>
  );
};

export default App;
