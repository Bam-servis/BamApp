import React from "react";
import "../styles.css"; // Импортируем CSS

const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner">
        <span>APCR</span> {/* Текст внутри спиннера */}
      </div>
    </div>
  );
};

export default LoadingSpinner;
