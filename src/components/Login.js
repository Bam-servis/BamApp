import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import {
  LoadCanvasTemplate,
  validateCaptcha,
  loadCaptchaEnginge,
} from "react-simple-captcha";

const Login = ({ setAuth }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    setTimeout(() => {
      setPageLoading(false);
    }, 2000);
  }, []);
  useEffect(() => {
    if (!pageLoading) {
      loadCaptchaEnginge(4);
    }
  }, [pageLoading]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    if (!validateCaptcha(captchaValue)) {
      setErrorMessage("Все сломалось! Не верная капча!");
      setFormLoading(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
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
      setErrorMessage(
        "Все сломалось! Не верный логин или пароль. Обнови страницу!"
      );
    } finally {
      setFormLoading(false);
    }
  };
  if (pageLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="login">
      {formLoading ? (
        <LoadingSpinner />
      ) : (
        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <p className="errro" style={{ color: "red" }}>
              {errorMessage}
            </p>
          )}
          <div className="logo-login"></div>
          <h1>Учет и обработка заявок клиентов</h1>
          <h2>Войдите в систему</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Логин"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            required
          />
          <div className="canvas">
            <LoadCanvasTemplate />
            <input
              type="text"
              value={captchaValue}
              onChange={(e) => setCaptchaValue(e.target.value)}
              placeholder="Введите капчу"
              required
            />
          </div>
          <button type="submit">Войти</button>
        </form>
      )}
    </div>
  );
};

export default Login;
