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
  const [totalRecords, setTotalRecords] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleBlock, setIsVisibleBlock] = useState(false);

  const [highlightId, setHighlightId] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;

  const [newItem, setNewItem] = useState({
    doneCheck: "",
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
    orderIndex: Number,
  });
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const currentDayRef = useRef(null);
  const initialRender = useRef(true);
  const [rowCount, setRowCount] = useState(1); // По умолчанию 1 строка

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  const toggleVisibilityBlock = () => {
    setIsVisibleBlock(!isVisibleBlock);
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/data`);
        setData(response.data);
        const totalCount = response.data.length;
        console.log("Total records count fetched:", totalCount);
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
    if (initialRender.current && currentDayRef.current) {
      setTimeout(() => {
        currentDayRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
      initialRender.current = false;
    }
  }, [data]);

  const addEntriesForSelectedDate = async () => {
    try {
      const newEntries = hardcodedData.map((item, index) => ({
        ...item,
        date: selectedDate,
        orderIndex: index,
      }));

      await Promise.all(
        newEntries.map((entry) => axios.post(`${apiUrl}/api/data`, entry))
      );

      const response = await axios.get(`${apiUrl}/api/data`);

      const orderedData = response.data.sort(
        (a, b) => a.orderIndex - b.orderIndex
      );

      setData(orderedData);
    } catch (error) {
      console.error("Error adding entries:", error);
    }
  };

  const addNewItem = async () => {
    try {
      const newIndex = data.length;
      const response = await axios.post(`${apiUrl}/api/data`, {
        ...newItem,
        updatedBy: localStorage.getItem("username"),
        createdBy: localStorage.getItem("username"),
        orderIndex: newIndex,
        date: selectedDate,
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
    const itemUser = "Tanya";
    if (fieldName === "hours" || fieldName === "routeNumber") {
      if (username !== itemUser) {
        alert(`У вас нет прав!. Узнать - ${"Tanya"}`);
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

  const addMultipleItemsWithClass = async (className, count) => {
    try {
      for (let i = 0; i < count; i++) {
        const response = await axios.post(`${apiUrl}/api/data`, {
          ...newItem,
          colorClass: className,
          updatedBy: localStorage.getItem("username"),
          date: selectedDate,
        });
        setData((prevData) => [...prevData, response.data]);
      }
    } catch (error) {
      console.error("Error adding multiple data with class:", error);
    }
  };
  const handleSelectChange = async (e, itemId) => {
    const { value } = e.target;

    const updatedData = data.map((item) =>
      item._id === itemId ? { ...item, doneCheck: value } : item
    );
    setData(updatedData);

    try {
      await axios.put(`${apiUrl}/api/data/${itemId}`, {
        ...updatedData.find((item) => item._id === itemId),
        doneCheck: value,
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

      if (username !== "Tanya") {
        alert(`У вас нет прав на снятие флажка! Обратитесь к ${"Tanya"}`);
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
    setHighlightId(id);

    const isConfirmed = window.confirm("Точно удалить?");
    if (isConfirmed) {
      try {
        await axios.delete(`${apiUrl}/api/data/${id}`);

        setData(data.filter((item) => item._id !== id));
      } catch (error) {
        console.error("Error deleting data:", error);
      }
    }
    setTimeout(() => {
      setHighlightId(null);
    }, 1000);
  };

  const handleDateChange = (e, itemId) => {
    const { value } = e.target;
    const username = localStorage.getItem("username");

    if (username !== "Olya") {
      alert(`У вас нет прав!. Узнать - ${"Olya"}`);
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
    const driverExists = drivers.some(
      (driver) => driver.name === newDriver.trim()
    );

    if (driverExists) {
      alert("Этот водитель уже существует!");
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/api/drivers`, {
        name: newDriver.trim(),
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

  const highlightedItems = data.filter(
    (item) => item.colorClass === "highlight"
  );
  const regularItems = data.filter((item) => item.colorClass !== "highlight");

  const groupedData = regularItems.reduce((acc, item) => {
    const driverGroup = acc.find((group) => group[0].driver === item.driver);

    if (driverGroup) {
      driverGroup.push(item);
    } else {
      acc.push([item]);
    }

    return acc;
  }, []);

  const sortedGroups = groupedData.map((group) =>
    group.sort((a, b) => a.orderIndex - b.orderIndex)
  );

  const finalSortedData = sortedGroups.flat();

  finalSortedData.sort((a, b) => new Date(a.date) - new Date(b.date));

  const completeSortedData = [...finalSortedData, ...highlightedItems];

  const filteredData = completeSortedData.filter((item) => {
    const itemDate = new Date(item.date);
    return (
      itemDate.getMonth() === currentMonth.getMonth() &&
      itemDate.getFullYear() === currentMonth.getFullYear()
    );
  });

  const groupedByDayData = groupByDay(filteredData);

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
        return "transporent";
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
        return "transporent";
    }
  };
  const isPreviousDay = (date) => {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    const today = new Date();

    const previousDay = new Date(today);
    previousDay.setDate(previousDay.getDate() - 1);

    return (
      previousDay.getDate() === date.getDate() &&
      previousDay.getMonth() === date.getMonth() &&
      previousDay.getFullYear() === date.getFullYear()
    );
  };
  const today = new Date();
  const formattedToday = format(today, "dd");
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
      <button onClick={toggleVisibility}>
        {isVisible ? "Скрыть" : "Показать"}
      </button>
      <button onClick={toggleVisibilityBlock}>
        {isVisibleBlock ? "Скрыть" : "Характеристики"}
      </button>
      {isVisibleBlock && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
            fontSize: "25px",
            lineHeight: "45px",
            width: "90%",
            margin: "0 auto 20px auto",
            flexWrap: "wrap",
            background: "radial-gradient(black, transparent",
          }}
        >
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/200t.pdf"
              target="_blank"
            >
              Liebherr 200 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/liebherrltm1160-5.1.pdf"
              target="_blank"
            >
              Liebherr 160 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/zomlion-30t.pdf"
              target="_blank"
            >
              ZOOMLION-30 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/zoomli-80t.pdf"
              target="_blank"
            >
              ZOOMLION-80 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/d122dbec6fe3c9fa32ee283d44045e973bc8ebaf.pdf"
              target="_blank"
            >
              ZOOMLION-55 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/GMK3050-1-1.oc.ru.pdf"
              target="_blank"
            >
              GROVE-50 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/zoomlion-90.pdf"
              target="_blank"
            >
              ZOOMLION-90 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/klinz-25t.pdf"
              target="_blank"
            >
              Клинцы 25 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/Klinz-32t.pdf"
              target="_blank"
            >
              Клинцы 32 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/masheka-25.pdf"
              target="_blank"
            >
              Машека 25 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/maz-16t.pdf"
              target="_blank"
            >
              МАЗ 16 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/25-31 klinz.pdf"
              target="_blank"
            >
              Клинцы 25/31 Тонн
            </a>
          </div>
        </div>
      )}
      {isVisible && (
        <div className="hide">
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
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <span className="title">Добавить суб аренду</span>
                <input
                  type="number"
                  value={rowCount}
                  onChange={(e) => setRowCount(Number(e.target.value))}
                  min="1"
                  placeholder="Введите количество строк"
                />
                <button
                  onClick={() =>
                    addMultipleItemsWithClass("highlight", rowCount)
                  }
                >
                  Добавить {rowCount} строк
                </button>
              </div>
              <div className="baza">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <span className="title">Добавить базу</span>
                <button
                  onClick={addEntriesForSelectedDate}
                  className="add-entries"
                >
                  Добавить
                </button>
              </div>
              <div className="entrys">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
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
                <span className="total">{previousMonthEntriesCount}</span>
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
        </div>
      )}
      <h1>
        {getMonthName(currentMonth)} {currentMonth.getFullYear()}
      </h1>
      <div className="table">
        {Object.keys(groupedByDayData).map((day) => (
          <div className="table-flex" key={day}>
            <h2
              className={`${
                formattedToday === day ? "is-today" : ""
              } sticky-h1`}
            >
              {day} {getMonthName(currentMonth)}
            </h2>
            <table>
              <thead className="sticky">
                <tr>
                  <th>Статус</th>
                  <th>Марка</th>
                  <th>Гос №</th>
                  <th>Водитель</th>
                  <th>Заказчик</th>
                  {users.username === "Tanya" && <th>№ Путевого</th>}
                  {users.username === "Tanya" && <th>Часы</th>}
                  {users.username === "Tanya" && <th>Статус</th>}
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
                {groupedByDayData[day].map((item) => (
                  <tr
                    key={item._id}
                    ref={isPreviousDay(item.date) ? currentDayRef : null}
                    className={`${item.colorClass} ${
                      item.doneCheck === "inCompleted"
                        ? "row-inCompleted"
                        : item.doneCheck === "completed"
                        ? "row-completed"
                        : item.doneCheck === "comand"
                        ? "row-comand"
                        : item.doneCheck === "inProgress"
                        ? "row-in-progress"
                        : "row-pending"
                    } ${highlightId === item._id ? "highlight-delete" : ""}`}
                  >
                    <td>
                      <select
                        className="select-rem"
                        value={item.doneCheck || "Выбрать"}
                        onChange={(e) => handleSelectChange(e, item._id)}
                      >
                        <option value="pending">Выбрать</option>
                        <option value="inProgress">ТО/Ремонт</option>
                        <option value="comand">Командировка</option>
                        <option value="inCompleted">В Ожидании</option>
                        <option value="completed">Свободный</option>
                      </select>
                    </td>

                    <td>
                      <input
                        type="text"
                        style={{
                          width: "150px",
                        }}
                        value={item.brand || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "brand")
                        }
                      />
                    </td>
                    <td>
                      <input
                        disabled
                        style={{
                          width: "75px",
                        }}
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
                          fontWeight: "600",
                          fontSize: "12.5px",
                        }}
                        value={item.driver || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "driver")
                        }
                      >
                        <option value="">Выбрать</option>
                        {drivers
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((driver) => (
                            <option key={driver._id} value={driver.name}>
                              {driver.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="tow-table-td">
                      <input
                        style={{
                          width: "100%",
                          minWidth: "300px",
                          fontWeight: "bold",
                          fontSize: "14.5px",
                        }}
                        type="text"
                        value={item.customer || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "customer")
                        }
                      />
                    </td>
                    {users.username === "Tanya" && (
                      <>
                        <td>
                          <input
                            type="text"
                            style={{ width: "50px" }}
                            value={item.routeNumber || ""}
                            onChange={(e) =>
                              handleInputChange(e, item.id, "routeNumber")
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            style={{ width: "50px" }}
                            value={item.hours || ""}
                            onChange={(e) =>
                              handleInputChange(e, item.id, "hours")
                            }
                          />
                        </td>
                        <td style={{ height: "40px" }}>
                          <input
                            type="checkbox"
                            checked={item.isTrue || false}
                            onChange={(e) =>
                              handleCheckboxChange(e, item.id, "checkbox")
                            }
                          />
                        </td>
                      </>
                    )}
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
                        }}
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
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span>{item.updatedBy || "-"}</span>
                    </td>
                    <td>
                      <button
                        className="btn-del"
                        onMouseEnter={() => setHighlightId(item._id)} // Подсветка при наведении
                        onMouseLeave={() => setHighlightId(null)} // Убираем подсветку при уходе курсора
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
