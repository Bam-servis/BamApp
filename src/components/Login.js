import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = ({ setAuth }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // Для хранения ошибки
  const navigate = useNavigate();
  const apiUrl = "https://bam-app-489c6c1370a9.herokuapp.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${apiUrl}/api/data`, {
        username,
        password,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
      setAuth({
        isAuthenticated: true,
        user: { username },
      });
      setErrorMessage(""); // Очистка ошибки при успешном логине
      navigate("/");
    } catch (error) {
      // Если логин неудачен, устанавливаем сообщение об ошибке
      setErrorMessage("Invalid username or password. Please try again.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
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
        <button type="submit">Login</button>
      </form>
      {/* Вывод сообщения об ошибке */}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
    </div>
  );
};

export default Login;
