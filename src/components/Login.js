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
  const [formLoading, setFormLoading] = useState(false); // Состояние загрузки при отправке формы
  const [pageLoading, setPageLoading] = useState(true); // Состояние загрузки страницы
  const navigate = useNavigate();

  const apiUrl = "https://bam-app-489c6c1370a9.herokuapp.com";

  useEffect(() => {
    // Имитируем задержку для загрузки страницы (например, 2 секунды)
    setTimeout(() => {
      setPageLoading(false); // После завершения загрузки убираем спиннер
    }, 2000);
  }, []);
  useEffect(() => {
    if (!pageLoading) {
      loadCaptchaEnginge(4); // Загружаем капчу только когда спиннер исчезнет
    }
  }, [pageLoading]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true); // Устанавливаем состояние загрузки для формы

    if (!validateCaptcha(captchaValue)) {
      setErrorMessage("Invalid captcha. Please try again.");
      setFormLoading(false); // Устанавливаем загрузку на false при ошибке
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Имитируем задержку
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
    } finally {
      setFormLoading(false); // Сбрасываем состояние загрузки формы
    }
  };

  // Если страница еще загружается, отображаем спиннер
  if (pageLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="login">
      {formLoading ? (
        <LoadingSpinner />
      ) : (
        <form onSubmit={handleSubmit}>
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

      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
    </div>
  );
};

export default Login;
