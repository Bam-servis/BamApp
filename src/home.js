import React, { useState, useEffect } from "react";
import axios from "axios";
import { hardcodedData } from "./hardcodedData"; // Убедитесь, что путь правильный
import "./styles.css"; // Импорт стилей для кнопок

const Home = () => {
  const [data, setData] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [newDriver, setNewDriver] = useState("");
  const [newItem, setNewItem] = useState({
    date: new Date().toISOString().split("T")[0],
    brand: "",
    driver: "",
    customer: "",
    routeNumber: "",
    hours: "",
    isTrue: false,
    vehicleNumber: "",
    price: "",
    colorClass: "", // Добавлен colorClass
  });
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Получение данных с сервера
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/data");
        setData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchDrivers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/drivers");
        setDrivers(response.data);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };

    fetchData();
    fetchDrivers();
  }, []);

  // Сортировка данных по дате
  const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Функция для добавления строк на каждый новый день
  const addEntriesForSelectedDate = async () => {
    try {
      const newEntries = hardcodedData.map((item, index) => ({
        ...item,
        date: selectedDate,
      }));

      // Добавление новых записей
      await Promise.all(
        newEntries.map((entry) =>
          axios.post("http://localhost:5000/api/data", entry)
        )
      );

      // Перезагрузка данных с сервера для синхронизации
      const response = await axios.get("http://localhost:5000/api/data");
      setData(response.data);
    } catch (error) {
      console.error("Error adding entries:", error);
    }
  };

  // Добавление одной строки данных
  const addNewItem = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/data",
        newItem
      );
      setData([...data, response.data]);
    } catch (error) {
      console.error("Error adding data:", error);
    }
  };

  // Добавление строки с определенным классом
  const addNewItemWithClass = async (className) => {
    try {
      const response = await axios.post("http://localhost:5000/api/data", {
        ...newItem,
        colorClass: className, // Добавляем класс
      });
      setData([...data, response.data]);
    } catch (error) {
      console.error("Error adding data with class:", error);
    }
  };

  const handleInputChange = (e, itemId, fieldName) => {
    const { value, type, checked } = e.target;
    const updatedValue = type === "checkbox" ? checked : value;

    setData(
      data.map((item) =>
        item._id === itemId ? { ...item, [fieldName]: updatedValue } : item
      )
    );

    axios
      .put(`http://localhost:5000/api/data/${itemId}`, {
        ...data.find((item) => item._id === itemId),
        [fieldName]: updatedValue,
      })
      .catch((error) => console.error("Error saving data:", error));
  };

  const handleDateChange = (e, itemId) => {
    const { value } = e.target;

    setData(
      data.map((item) =>
        item._id === itemId ? { ...item, date: value } : item
      )
    );

    axios
      .put(`http://localhost:5000/api/data/${itemId}`, {
        ...data.find((item) => item._id === itemId),
        date: value,
      })
      .catch((error) => console.error("Error updating date:", error));
  };

  const handleAddNewDriver = async () => {
    if (newDriver.trim() === "") return;

    try {
      const response = await axios.post("http://localhost:5000/api/drivers", {
        name: newDriver,
      });
      setDrivers([...drivers, response.data]);
      setNewDriver("");
    } catch (error) {
      console.error("Error adding driver:", error);
    }
  };

  // Функция для группировки данных по месяцам и дням
  const groupByMonthAndDay = (data) => {
    return data.reduce((groups, item) => {
      const date = new Date(item.date);
      const monthYear = date.toLocaleString("default", { month: "long" });
      const day = date.getDate();

      if (!groups[monthYear]) {
        groups[monthYear] = {};
      }

      if (!groups[monthYear][day]) {
        groups[monthYear][day] = [];
      }

      groups[monthYear][day].push(item);
      return groups;
    }, {});
  };

  return (
    <div>
      <h1>Data Table</h1>
      <button onClick={addEntriesForSelectedDate}>
        Add 37 Entries for Selected Date
      </button>
      <button onClick={addNewItem}>Add New Item</button>
      <button onClick={() => addNewItemWithClass("highlight")}>
        Add New Item with Highlight
      </button>

      <div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <input
          type="text"
          value={newDriver}
          onChange={(e) => setNewDriver(e.target.value)}
          placeholder="Enter new driver name"
        />
        <button onClick={handleAddNewDriver}>Add New Driver</button>
      </div>

      {Object.entries(groupByMonthAndDay(sortedData)).map(([month, days]) => (
        <div key={month}>
          <h2>{month}</h2>
          {Object.entries(days).map(([day, items]) => (
            <div key={day}>
              <h3>Day {day}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Brand</th>
                    <th>Driver</th>
                    <th>Customer</th>
                    <th>Route Number</th>
                    <th>Hours</th>
                    <th>True/False</th>
                    <th>Vehicle Number</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id} className={item.colorClass || ""}>
                      <td>
                        <input
                          type="date"
                          value={
                            new Date(item.date).toISOString().split("T")[0]
                          }
                          onChange={(e) => handleDateChange(e, item._id)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.brand || ""}
                          onChange={(e) =>
                            handleInputChange(e, item._id, "brand")
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={item.driver || ""}
                          onChange={(e) =>
                            handleInputChange(e, item._id, "driver")
                          }
                        >
                          <option value="">Select a driver</option>
                          {drivers.map((driver) => (
                            <option key={driver._id} value={driver._id}>
                              {driver.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
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
                          value={item.routeNumber || ""}
                          onChange={(e) =>
                            handleInputChange(e, item._id, "routeNumber")
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.hours || ""}
                          onChange={(e) =>
                            handleInputChange(e, item._id, "hours")
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={item.isTrue || false}
                          onChange={(e) =>
                            handleInputChange(e, item._id, "isTrue")
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
                        <input
                          type="text"
                          value={item.price || ""}
                          onChange={(e) =>
                            handleInputChange(e, item._id, "price")
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Home;
