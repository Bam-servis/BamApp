import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  LoadCanvasTemplate,
  LoadCanvasTemplateNoReload,
  validateCaptcha,
  loadCaptchaEnginge,
} from "react-simple-captcha"; // Исправляем название

const Login = ({ setAuth }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");
  const navigate = useNavigate();
  const apiUrl = "https://bam-app-489c6c1370a9.herokuapp.com";

  useEffect(() => {
    loadCaptchaEnginge(6); // Загружаем капчу с 6 символами
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCaptcha(captchaValue)) {
      setErrorMessage("Invalid captcha. Please try again.");
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/api/login`, {
        username,
        password,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
      setAuth({
        isAuthenticated: true,
        user: { username },
      });
      setErrorMessage("");
      navigate("/");
    } catch (error) {
      setErrorMessage("Invalid username or password. Please try again.");
    }
  };

  return (
    <div className="login">
      <h1>APCR</h1>
      <h2>Войдите в систему</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <div>
          <LoadCanvasTemplate />
          <input
            type="text"
            value={captchaValue}
            onChange={(e) => setCaptchaValue(e.target.value)}
            placeholder="Enter captcha"
          />
        </div>
        <button type="submit">Войти</button>
      </form>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
    </div>
  );
};

export default Login;
