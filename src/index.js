import React from "react";
import ReactDOM from "react-dom/client"; // Используйте новый импорт
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root")); // Создайте корень
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
