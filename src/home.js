import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { hardcodedData } from "./hardcodedData";
import "./styles.css";
import { format, addMonths, subMonths } from "date-fns";
import { ru } from "date-fns/locale";

const Home = () => {
  const [data, setData] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [newDriver, setNewDriver] = useState("");
  const [selectedRows, setSelectedRows] = useState({});
  const [totalRecords, setTotalRecords] = useState(0);
  const apiUrl = "https://bam-app-489c6c1370a9.herokuapp.com";

  const [newItem, setNewItem] = useState({
    doneCheck: false,
    date: new Date().toISOString().split("T")[0],
    brand: "",
    driver: "",
    customer: "",
    routeNumber: "",
    hours: "",
    isTrue: false,
    vehicleNumber: "",
    price: "",
    comment: "",
    user: "",
    colorClass: "",
  });
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const currentDayRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/data`);
        setData(response.data);
        const totalCount = response.data.length;
        console.log("Total records count fetched:", totalCount); // Логируем количество
        setTotalRecords(totalCount);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchDrivers = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/drivers`);
        setDrivers(response.data);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/users`);

        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching setUsers:", error);
      }
    };
    fetchUsers();
    fetchData();
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (currentDayRef.current) {
      currentDayRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start", // Или "nearest"
      });
    }
  }, [data]);

  const addEntriesForSelectedDate = async () => {
    try {
      const newEntries = hardcodedData.map((item) => ({
        ...item,
        date: selectedDate,
      }));

      await Promise.all(
        newEntries.map((entry) => axios.post(`${apiUrl}/api/data`, entry))
      );

      const response = await axios.get(`${apiUrl}/api/data`);

      // Сортировка данных по порядку добавления на основе `hardcodedData`
      const orderedData = response.data.sort((a, b) => {
        const indexA = hardcodedData.findIndex(
          (item) => item.driver === a.driver
        );
        const indexB = hardcodedData.findIndex(
          (item) => item.driver === b.driver
        );
        return indexA - indexB; // Сортировка по порядку из `hardcodedData`
      });

      setData(orderedData);
    } catch (error) {
      console.error("Error adding entries:", error);
    }
  };

  const addNewItem = async () => {
    try {
      const response = await axios.post(`${apiUrl}/api/data`, {
        ...newItem,
        updatedBy: localStorage.getItem("username"),
        createdBy: localStorage.getItem("username"),
      });
      setData([...data, response.data]);
    } catch (error) {
      console.error("Error adding data:", error);
    }
  };

  const handleInputChange = (e, itemId, fieldName) => {
    const { value, type, checked } = e.target;
    const updatedValue = type === "checkbox" ? checked : value;
    const username = localStorage.getItem("username");
    const itemUser = "manager-tanya";
    // Проверка для поля с часами
    if (fieldName === "hours" || fieldName === "routeNumber") {
      if (username !== itemUser) {
        alert(`У вас нет прав!. Узнать - ${"manager-tanya"}`);
        return;
      }
    }

    const updatedData = data.map((item) =>
      item._id === itemId ? { ...item, [fieldName]: updatedValue } : item
    );
    setData(updatedData);

    axios
      .put(`${apiUrl}/api/data/${itemId}`, {
        ...updatedData.find((item) => item._id === itemId),
        [fieldName]: updatedValue,
        updatedBy: username,
      })
      .catch((error) => console.error("Error saving data:", error));
  };

  const addNewItemWithClass = async (className) => {
    try {
      const response = await axios.post(`${apiUrl}/api/data`, {
        ...newItem,
        colorClass: className,
        updatedBy: localStorage.getItem("username"),
      });
      setData([...data, response.data]);
    } catch (error) {
      console.error("Error adding data with class:", error);
    }
  };
  const handleRowSelection = async (e, itemId) => {
    const { checked } = e.target;

    // Обновляем состояние чекбоксов
    setSelectedRows((prevSelectedRows) => ({
      ...prevSelectedRows,
      [itemId]: checked,
    }));

    // Обновляем данные в состоянии
    const updatedData = data.map((item) =>
      item._id === itemId ? { ...item, doneCheck: checked } : item
    );
    setData(updatedData);

    try {
      await axios.put(`${apiUrl}/api/data/${itemId}`, {
        ...updatedData.find((item) => item._id === itemId),
        doneCheck: checked,
      });
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };
  const handleCheckboxChange = async (e, itemId) => {
    const { checked } = e.target;
    const username = localStorage.getItem("username");
    if (!checked) {
      const isConfirmed = window.confirm();
      if (!isConfirmed) {
        return;
      }

      if (username !== "manager-tanya") {
        alert(
          `У вас нет прав на снятие флажка! Обратитесь к ${"manager-tanya"}`
        );
        return;
      }
    }
    const updatedData = data.map((item) =>
      item._id === itemId ? { ...item, isTrue: checked } : item
    );
    setData(updatedData);

    try {
      await axios.put(`${apiUrl}/api/data/${itemId}`, {
        ...updatedData.find((item) => item._id === itemId),
        isTrue: checked,
      });
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };

  const handleDeleteWithConfirmation = async (id) => {
    const isConfirmed = window.confirm("Точно удалить?");
    if (isConfirmed) {
      try {
        await axios.delete(`${apiUrl}/api/data/${id}`);
        setData(data.filter((item) => item._id !== id));
      } catch (error) {
        console.error("Error deleting data:", error);
      }
    }
  };

  const handleDateChange = (e, itemId) => {
    const { value } = e.target;
    const username = localStorage.getItem("username");

    if (username !== "manager-olya") {
      alert(`У вас нет прав!. Узнать - ${"manager-olya"}`);
      return;
    }
    const updatedData = data.map((item) =>
      item._id === itemId ? { ...item, date: value } : item
    );
    setData(updatedData);

    axios
      .put(`${apiUrl}/api/data/${itemId}`, {
        ...updatedData.find((item) => item._id === itemId),
        date: value,
        updatedBy: username,
      })
      .catch((error) => console.error("Error updating date:", error));
  };

  const handleAddNewDriver = async () => {
    if (newDriver.trim() === "") return;

    try {
      const response = await axios.post(`${apiUrl}/api/drivers`, {
        name: newDriver,
      });
      setDrivers([...drivers, response.data]);
      setNewDriver("");
    } catch (error) {
      console.error("Error adding driver:", error);
    }
  };

  const groupByDay = (data) => {
    return data.reduce((groups, item) => {
      const date = new Date(item.date);
      const day = date.getDate();

      if (!groups[day]) groups[day] = [];
      groups[day].push(item);
      return groups;
    }, {});
  };

  const getMonthName = (date) => {
    const monthNamesInGenitive = {
      январь: "января",
      февраль: "февраля",
      март: "марта",
      апрель: "апреля",
      май: "мая",
      июнь: "июня",
      июль: "июля",
      август: "августа",
      сентябрь: "сентября",
      октябрь: "октября",
      ноябрь: "ноября",
      декабрь: "декабря",
    };
    const monthName = format(date, "MMMM", { locale: ru });
    return monthNamesInGenitive[monthName] || monthName;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleMonthChange = (direction) => {
    const newMonth =
      direction === "prev"
        ? subMonths(currentMonth, 1)
        : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  const sortedData = data
    .reduce((acc, item) => {
      const index = acc.findIndex((accItem) => accItem.driver === item.driver);

      if (index === -1) {
        acc.push(item);
      } else {
        acc.splice(index + 1, 0, item); // Вставляем после первого вхождения
      }

      return acc;
    }, [])
    .sort((a, b) => {
      // Если обе строки выделены, оставляем их в том же порядке
      if (a.colorClass === "highlight" && b.colorClass === "highlight")
        return 0;

      // Если одна из строк выделена, она должна быть внизу
      if (a.colorClass === "highlight" && b.colorClass !== "highlight")
        return 1;
      if (a.colorClass !== "highlight" && b.colorClass === "highlight")
        return -1;

      return 0; // Оставляем порядок добавления
    });

  // Фильтрация данных по текущему месяцу и сортировка по дням внутри месяца
  const filteredData = sortedData.filter((item) => {
    const itemDate = new Date(item.date);
    return (
      itemDate.getMonth() === currentMonth.getMonth() &&
      itemDate.getFullYear() === currentMonth.getFullYear()
    );
  });

  const groupedData = groupByDay(filteredData);

  const getColor = (value) => {
    switch (value) {
      case "Оплачен":
        return "green";
      case "Частично":
        return "gold";
      case "Нет":
        return "red";
      case "Отсрочка":
        return "yellow";
      default:
        return "transporent"; // цвет по умолчанию, если ничего не выбрано
    }
  };

  const getBackColor = (value) => {
    switch (value) {
      case "Оплачен":
        return "black";
      case "Частично":
        return "black";
      case "Нет":
        return "black";
      case "Отсрочка":
        return "black";
      default:
        return "transporent"; // цвет по умолчанию, если ничего не выбрано
    }
  };
  const isPreviousDay = (date) => {
    // Проверяем, что date действительно является объектом Date
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    const today = new Date();

    const previousDay = new Date(today);
    previousDay.setDate(previousDay.getDate() - 1);

    // Сравниваем только год, месяц и день
    return (
      previousDay.getDate() === date.getDate() &&
      previousDay.getMonth() === date.getMonth() &&
      previousDay.getFullYear() === date.getFullYear()
    );
  };
  const today = new Date();
  const formattedToday = format(today, "dd"); // Форматируем только число
  const countEntriesForMonth = (data, date) => {
    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getFullYear() === date.getFullYear()
      );
    }).length;
  };
  const getPreviousMonth = (date) => {
    return subMonths(date, 1);
  };
  const currentMonthEntriesCount = countEntriesForMonth(data, currentMonth);
  const previousMonthEntriesCount = countEntriesForMonth(
    data,
    getPreviousMonth(currentMonth)
  );

  return (
    <div>
      <div className="bam-servis">"ООО Бам-Сервис гарант"</div>
      <div className="wrapper">
        <div className="data">
          <div className="month">
            <button onClick={() => handleMonthChange("prev")}>
              Пред. Месяц
            </button>
            <button onClick={() => handleMonthChange("next")}>
              След. Месяц
            </button>
            <button onClick={() => setCurrentMonth(new Date())}>
              Текущий Месяц
            </button>
          </div>

          <div className="sybarenda">
            <span className="title">Добавить суб аренду</span>
            <button onClick={() => addNewItemWithClass("highlight")}>
              Добавить
            </button>
          </div>
          <div className="baza">
            <span className="title">Добавить базу</span>
            <button onClick={addEntriesForSelectedDate} className="add-entries">
              Добавить
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="entrys">
            <span className="title">Добавить Обьект</span>
            <button onClick={addNewItem}>Добавить</button>
          </div>
          <div className="driv">
            <span className="title">Добавить нового водителя</span>
            <button onClick={handleAddNewDriver}>Добавить</button>
            <input
              type="text"
              className="drivers-new"
              placeholder="Новый Водитель"
              value={newDriver}
              onChange={(e) => setNewDriver(e.target.value)}
            />
          </div>
        </div>
        <div className="statistic">
          <div className="time">
            За все время: <span className="total">{totalRecords}</span>
          </div>
          <div className="time">
            За текущий месяц:
            <span className="total">{currentMonthEntriesCount}</span>
          </div>
          <div className="time">
            За предыдущий месяц:
            <span className="total"> {previousMonthEntriesCount}</span>
          </div>
        </div>
        <div className="entry-block">
          <div className="green">
            <p>Оплачен</p>
            <span className="green-span"></span>
          </div>
          <div className="gold">
            <p>Частично</p>
            <span className="gold-span"></span>
          </div>
          <div className="red">
            <p>Нет оплаты</p>
            <span className="red-span"></span>
          </div>
          <div className="yellow">
            <p>Отсрочка</p>
            <span className="yellow-span"></span>
          </div>
        </div>
      </div>
      <h1>
        {getMonthName(currentMonth)} {currentMonth.getFullYear()}
      </h1>
      <div className="table">
        {Object.keys(groupedData).map((day) => (
          <div key={day}>
            <h2 className={formattedToday === day ? "is-today" : ""}>
              {day} {getMonthName(currentMonth)}
            </h2>
            <table>
              <thead className="sticky">
                <tr>
                  <th>Заявка готова</th>
                  <th>Дата</th>
                  <th>Марка</th>
                  <th>Гос №</th>
                  <th>Водитель</th>
                  <th>Заказчик</th>
                  <th>№ Путевого</th>
                  <th>Часы</th>
                  <th>Потверждение</th>
                  <th>Стоимость Заказа</th>
                  <th>Оплата</th>
                  <th>Сумма Оплаты</th>
                  <th>Комментарий</th>
                  <th>Менeджер</th>
                  <th>Последнее ред.</th>
                  <th>Удалить запись</th>
                </tr>
              </thead>
              <tbody>
                {groupedData[day].map((item) => (
                  <tr
                    key={item._id}
                    ref={isPreviousDay(item.date) ? currentDayRef : null} //prev
                    className={`${item.colorClass} ${
                      item.doneCheck ? "highlight-row" : ""
                    }`}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={item.doneCheck || false}
                        onChange={(e) =>
                          handleRowSelection(e, item._id, "doneCheck")
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={formatDate(item.date) || ""}
                        onChange={(e) => handleDateChange(e, item._id)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        style={{
                          width: "180px",
                        }}
                        value={item.brand || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "brand")
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.vehicleNumber || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "vehicleNumber")
                        }
                      />
                    </td>
                    <td>
                      <select
                        style={{
                          width: "130px",
                        }}
                        value={item.driver || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "driver")
                        }
                      >
                        <option value="">Выбрать</option>
                        {drivers.map((driver) => (
                          <option key={driver._id} value={driver.name}>
                            {driver.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <textarea
                        style={{ resize: "none" }}
                        type="text"
                        value={item.customer || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "customer")
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        style={{
                          width: "50px",
                        }}
                        value={item.routeNumber || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "routeNumber")
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        style={{
                          width: "50px",
                        }}
                        value={item.hours || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "hours")
                        }
                      />
                    </td>
                    <td
                      style={{
                        height: "40px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.isTrue || false}
                        onChange={(e) =>
                          handleCheckboxChange(e, item._id, "checkbox")
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.price || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "price")
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={item.colorData || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "colorData")
                        }
                        style={{
                          color: getBackColor(item.colorData),
                          backgroundColor: getColor(item.colorData),
                          fontWeight: "bold",
                        }} // Используйте item.colorData здесь
                      >
                        <option value="">Выбрать</option>
                        <option
                          value="Оплачен"
                          style={{ color: "green", fontWeight: "bold" }}
                        >
                          Оплачен
                        </option>
                        <option
                          value="Частично"
                          style={{ color: "gold", fontWeight: "bold" }}
                        >
                          Частично
                        </option>
                        <option
                          value="Нет"
                          style={{ color: "red", fontWeight: "bold" }}
                        >
                          Нет
                        </option>
                        <option
                          value="Отсрочка"
                          style={{ color: "yellow", fontWeight: "bold" }}
                        >
                          Отсрочка
                        </option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.calcPay || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "calcPay")
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.comment || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "comment")
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={item.user || ""}
                        onChange={(e) => handleInputChange(e, item._id, "user")}
                      >
                        <option value="">Выбрать</option>
                        {users.map((user) => (
                          <option key={user._id} value={user.username}>
                            {user.username}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span>{item.updatedBy || "Не указано"}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteWithConfirmation(item._id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
