import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";
import "./newYearPopup.css"; // Путь к вашему стилю

const NewYearPopup = () => {
  const [showPopup, setShowPopup] = useState(false); // Изначально попап скрыт
  const [confetti, setConfetti] = useState(false);
  const [confettiPosition, setConfettiPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Проверяем, был ли попап уже показан в текущей сессии
    const popupShown = sessionStorage.getItem("popupShown");

    // Если попап еще не был показан, показываем его
    if (!popupShown) {
      setShowPopup(true);
      sessionStorage.setItem("popupShown", "true"); // Сохраняем в sessionStorage, что попап был показан
    }
  }, []);

  const handleClick = (event) => {
    // Сохраняем координаты клика
    const { clientX, clientY } = event;
    setConfettiPosition({ x: clientX, y: clientY });

    setConfetti(true);

    // Закрываем попап через 3 секунды, но продолжаем показывать конфетти
    setTimeout(() => {
      setShowPopup(false); // Закрываем попап через 3 секунды
      setConfetti(false); // Скрываем конфетти через 30 секунд
    }, 10000);
  };

  return (
    <>
      {showPopup && (
        <div className="popup-overlay">
          {confetti && (
            <Confetti
              width={window.innerWidth} // Устанавливаем ширину конфетти в зависимости от ширины экрана
              height={window.innerHeight} // Устанавливаем высоту конфетти в зависимости от высоты экрана
              recycle={true} // Конфетти не повторяются
              numberOfPieces={500} // Количество конфетти
              gravity={0.2} // Гравитация для конфетти
              initialVelocityY={15} // Начальная скорость по оси Y
              confettiSource={{ x: confettiPosition.x, y: confettiPosition.y }}
            />
          )}
          <div className="popup-content">
            <h2>С Наступающим Новым годом!</h2>
            <p>Пусть этот год принесет счастье и радость!</p>

            {/* Пример иконки с Font Awesome */}
            <div className="icon-container">
              <i className="fas fa-snowflake"></i>{" "}
              {/* Замените на другую иконку, если нужно */}
            </div>

            <button className="popup-button" onClick={handleClick}>
              Жмакни по мне
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default NewYearPopup;
