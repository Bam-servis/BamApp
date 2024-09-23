import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

const Profile = () => {
  const [items, setItems] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [allItems, setAllItems] = useState([]);

  const apiUrl = "https://bam-app-489c6c1370a9.herokuapp.com";

  // Получение всех данных с сервера
  useEffect(() => {
    const fetchData = async () => {
      try {
        const username = localStorage.getItem("username");
        setUser(username);

        const response = await axios.get(`${apiUrl}/api/data`);
        setAllItems(response.data);

        // Фильтруем данные по текущему пользователю
        const userItems = response.data.filter(
          (item) => item.user === username
        );
        setItems(userItems);

        const allDrivers = [
          ...new Set(
            response.data.map((item) => item.driver).filter((driver) => driver)
          ),
        ];
        setDrivers(allDrivers);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      }
    };

    fetchData();
  }, []);

  // Вычисляем текущий и предыдущий месяц
  const currentMonth = dayjs().month();
  const previousMonth = dayjs().subtract(1, "month").month();

  // Фильтруем заявки за текущий и предыдущий месяцы для текущего пользователя
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

  // Фильтрация заявок по выбранному водителю
  useEffect(() => {
    if (selectedDriver) {
      const ordersForSelectedDriver = allItems.filter(
        (item) =>
          item.driver === selectedDriver && item.colorClass === "highlight" // Убедитесь, что проверка colorClass правильная
      );
      setFilteredOrders(ordersForSelectedDriver);
    } else {
      setFilteredOrders([]);
    }
  }, [selectedDriver, allItems]);

  const handleDriverChange = (e) => {
    setSelectedDriver(e.target.value);
  };

  return (
    <div>
      <Link to="/">
        <button>Go to Home</button>
      </Link>
      <h1>Профиль: {user}</h1>

      <p>Общее количество заказов: {items.length}</p>
      <p>Общее количество сумм заказов: {totalPrice}</p>
      <p>Общее значение оплаты: {totalCalcPay}</p>
      <p>Количество заявок за текущий месяц: {currentMonthItems.length}</p>
      <p>Количество заявок за предыдущий месяц: {previousMonthItems.length}</p>

      <div className="orderZa">
        <h2>Выберите Заказчика:</h2>
        <select onChange={handleDriverChange} value={selectedDriver}>
          <option value="">Выберите Заказчика</option>
          {drivers.map((driver, index) => (
            <option key={index} value={driver}>
              {driver}
            </option>
          ))}
        </select>
      </div>

      <h2 className="arenda">Информация об суб Аренде</h2>
      {filteredOrders.length > 0 ? (
        <ul>
          {filteredOrders.map((order) => (
            <li key={order._id} className="order">
              <p>
                Дата: <span>{dayjs(order.date).format("DD.MM.YYYY")}</span>
              </p>
              <p>
                Заказчик: <span>{order.customer}</span>
              </p>
              <p>
                № Путевого: <span>{order.vehicleNumber}</span>
              </p>
              <p>
                Часы: <span>{order.hours}</span>
              </p>
              <p>
                Подтверждение:{" "}
                <span>{order.isTrue ? "Подтверждено" : "Не подтверждено"}</span>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          Нет заказов для выбранного водителя или записи не содержат `Суб
          Аренду`.
        </p>
      )}
    </div>
  );
};

export default Profile;
