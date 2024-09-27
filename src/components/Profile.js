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

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const username = localStorage.getItem("username");
        setUser(username);

        const response = await axios.get(`${apiUrl}/api/data`);
        setAllItems(response.data);

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

  const currentMonth = dayjs().month();
  const previousMonth = dayjs().subtract(1, "month").month();

  const currentMonthItems = items.filter(
    (item) => dayjs(item.createdAt).month() === currentMonth
  );
  const previousMonthItems = items.filter(
    (item) => dayjs(item.createdAt).month() === previousMonth
  );

  const totalPrice = items.reduce((total, item) => {
    const price = parseFloat(item.price) || 0;
    return total + price;
  }, 0);

  const totalCalcPay = items.reduce((total, item) => {
    const calcPay = parseFloat(item.calcPay) || 0;
    return total + calcPay;
  }, 0);

  useEffect(() => {
    if (selectedDriver) {
      const ordersForSelectedDriver = allItems.filter(
        (item) =>
          item.driver === selectedDriver && item.colorClass === "highlight"
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
      <h1 className="login-profile"> {user}</h1>
      <Link className="link-home" to="/">
        <button>Вернутся на главную</button>
      </Link>
      <div className="flex">
        <div className="statistic">
          {" "}
          <p className="time-profile">
            Общее количество заказов:{" "}
            <span className="total">{items.length}</span>
          </p>
          <p className="time-profile">
            Общее количество сумм заказов:{" "}
            <span className="total">{totalPrice}</span>
          </p>
          <p className="time-profile">
            Общее значение оплаты: <span className="total">{totalCalcPay}</span>
          </p>
          <p className="time-profile">
            Количество заявок за текущий месяц:{" "}
            <span className="total">{currentMonthItems.length}</span>
          </p>
          <p className="time-profile">
            Количество заявок за предыдущий месяц:
            <span className="total"> {previousMonthItems.length}</span>
          </p>
        </div>

        <div className="orderZa">
          <h2>Выберите Заказчика:</h2>
          <select
            className="select"
            onChange={handleDriverChange}
            value={selectedDriver}
          >
            <option value="">Выберите Заказчика</option>
            {drivers.map((driver, index) => (
              <option key={index} value={driver}>
                {driver}
              </option>
            ))}
          </select>
        </div>
      </div>
      <h2 className="arenda">Информация об суб Аренде</h2>
      {filteredOrders.length > 0 ? (
        <ul className="ula">
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
        <p className="no-order">
          Нет заказов для выбранного Заказчика или записи не содержат `Суб
          Аренду`.
        </p>
      )}
    </div>
  );
};

export default Profile;
