import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

const Profile = () => {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const apiUrl = "https://bam-app-489c6c1370a9.herokuapp.com";

  // Получение данных пользователя и созданных им элементов
  useEffect(() => {
    const fetchData = async () => {
      try {
        const username = localStorage.getItem("username");
        setUser(username);

        const response = await axios.get(`${apiUrl}/api/data`);
        const userItems = response.data.filter(
          (item) => item.user === username
        );
        setItems(userItems);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      }
    };

    fetchData();
  }, []);

  if (!user) {
    return <p>Загрузка...</p>;
  }

  // Вычисляем текущий и предыдущий месяц
  const currentMonth = dayjs().month(); // Текущий месяц
  const previousMonth = dayjs().subtract(1, "month").month(); // Предыдущий месяц

  // Фильтруем заявки за текущий и предыдущий месяцы
  const currentMonthItems = items.filter(
    (item) => dayjs(item.createdAt).month() === currentMonth
  );
  const previousMonthItems = items.filter(
    (item) => dayjs(item.createdAt).month() === previousMonth
  );

  // Вычисляем сумму всех значений price и calcPay
  const totalPrice = items.reduce((total, item) => {
    const price = parseFloat(item.price) || 0;
    return total + price;
  }, 0);

  const totalCalcPay = items.reduce((total, item) => {
    const calcPay = parseFloat(item.calcPay) || 0;
    return total + calcPay;
  }, 0);

  return (
    <div>
      <Link to="/">
        <button>Go to Home</button>
      </Link>
      <h1>Профиль пользователя: {user}</h1>
      <p>Количество созданных элементов: {items.length}</p>
      <p>Общее количество сумм заказов: {totalPrice}</p>
      <p>Общее значение calcPay: {totalCalcPay}</p>
      <p>Количество заявок за текущий месяц: {currentMonthItems.length}</p>
      <p>Количество заявок за предыдущий месяц: {previousMonthItems.length}</p>
    </div>
  );
};

export default Profile;
