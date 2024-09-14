import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { hardcodedData } from "./hardcodedData";
import "./styles.css";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from "react-router-dom";

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
    colorClass: "",
  });
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const navigate = useNavigate();
  const currentDayRef = useRef(null);

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

  useEffect(() => {
    if (currentDayRef.current) {
      currentDayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [data]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };
  const replaceSoftSign = (str) => {
    // Пример замены мягкого знака
    return str.replace(/ъ/g, '');
  };
  const sortedData = data
  .sort((a, b) => {
    // Сначала перемещаем строки с классом 'highlight' в конец
    if (a.colorClass === 'highlight' && b.colorClass !== 'highlight') return 1;
    if (a.colorClass !== 'highlight' && b.colorClass === 'highlight') return -1;

    // Затем сортируем по водителям
    const driverComparison = a.driver.localeCompare(b.driver);
    if (driverComparison !== 0) return driverComparison;

    // И наконец сортируем по дате
    return new Date(a.date) - new Date(b.date);
  });


  const addEntriesForSelectedDate = async () => {
    try {
      const newEntries = hardcodedData.map((item) => ({
        ...item,
        date: selectedDate,
      }));

      await Promise.all(
        newEntries.map((entry) =>
          axios.post("http://localhost:5000/api/data", entry)
        )
      );

      const response = await axios.get("http://localhost:5000/api/data");
      setData(response.data);
    } catch (error) {
      console.error("Error adding entries:", error);
    }
  };

  const addNewItem = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/data", newItem);
      setData([...data, response.data]);
    } catch (error) {
      console.error("Error adding data:", error);
    }
  };

  
  const handleInputChange = (e, itemId, fieldName) => {
    const { value, type, checked } = e.target;
    const updatedValue = type === "checkbox" ? checked : value;
  
    // Обновление состояния данных
    const updatedData = data.map((item) =>
      item._id === itemId ? { ...item, [fieldName]: updatedValue } : item
    );
    setData(updatedData);
  
    // Отправка обновленных данных на сервер
    axios
      .put(`http://localhost:5000/api/data/${itemId}`, {
        ...updatedData.find((item) => item._id === itemId),
        [fieldName]: updatedValue,
      })
      .catch((error) => console.error("Error saving data:", error));
  };
  
  const addNewItemWithClass = async (className) => {
    try {
      const response = await axios.post("http://localhost:5000/api/data", {
        ...newItem,
        colorClass: className,
      });
      setData([...data, response.data]);
    } catch (error) {
      console.error("Error adding data with class:", error);
    }
  };



  const handleCheckboxChange = async (e, itemId) => {
    const { checked } = e.target;
  
    // Показываем предупреждение перед изменением состояния чекбокса
    const isConfirmed = window.confirm("Вы уверены, что хотите изменить состояние этого чекбокса?");
    if (!isConfirmed) {
      // Если пользователь отменил, ничего не делаем
      return;
    }
  
    // Обновление состояния данных
    const updatedData = data.map((item) =>
      item._id === itemId ? { ...item, isTrue: checked } : item
    );
    setData(updatedData);
  
    try {
      // Отправка обновленного значения на сервер
      await axios.put(`http://localhost:5000/api/data/${itemId}`, {
        ...updatedData.find((item) => item._id === itemId),
        isTrue: checked,
      });
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };
  

  
  const handleDeleteWithConfirmation = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this item?");
    if (isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/data/${id}`);
        setData(data.filter(item => item._id !== id));
      } catch (error) {
        console.error("Error deleting data:", error);
      }
    }
  };
  

  

  const handleDateChange = (e, itemId) => {
    const { value } = e.target;

    const updatedData = data.map((item) =>
      item._id === itemId ? { ...item, date: value } : item
    );
    setData(updatedData);

    axios
      .put(`http://localhost:5000/api/data/${itemId}`, {
        ...updatedData.find((item) => item._id === itemId),
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

  const groupByMonthAndDay = (data) => {
    return data.reduce((groups, item) => {
      const date = new Date(item.date);
      const monthYear = date.toLocaleString("default", { month: "long" });
      const day = date.getDate();

      if (!groups[monthYear]) groups[monthYear] = {};
      if (!groups[monthYear][day]) groups[monthYear][day] = [];

      groups[monthYear][day].push(item);
      return groups;
    }, {});
  };

  const isToday = (itemDate) => {
    const today = new Date();
    const itemDay = new Date(itemDate);
    return (
      today.getDate() === itemDay.getDate() &&
      today.getMonth() === itemDay.getMonth() &&
      today.getFullYear() === itemDay.getFullYear()
    );
  };


  const getMonthName = (date) => {
    const monthNamesInGenitive = {
      январь: 'января',
      февраль: 'февраля',
      март: 'марта',
      апрель: 'апреля',
      май: 'мая',
      июнь: 'июня',
      июль: 'июля',
      август: 'августа',
      сентябрь: 'сентября',
      октябрь: 'октября',
      ноябрь: 'ноября',
      декабрь: 'декабря'
    };
    
    // Проверяем, что date - это объект Date
    const monthName = format(date, 'MMMM', { locale: ru });
    return monthNamesInGenitive[monthName] || monthName;
  };
  
  // Пример использования
  const date = new Date(); // или любой другой объект Date

  return (
    <div>
      <div className="header">
        <h1>Data Table</h1>
        <div className="buttons">
          <button onClick={addEntriesForSelectedDate}>
            Add 37 Entries for Selected Date
          </button>
          <button onClick={addNewItem}>Add New Item</button>
          <button onClick={() => addNewItemWithClass("highlight")}>
            Add New Item with Highlight
          </button>
        </div>
      </div>
      <div className="controls">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <input
          type="text"
          value={newDriver}
          onChange={(e) => setNewDriver(e.target.value)}
          placeholder="New Driver"
        />
        <button onClick={handleAddNewDriver}>Add New Driver</button>
      </div>
      <div className="data">
        {Object.entries(groupByMonthAndDay(sortedData)).map(([month, days]) => (
          <div key={month}>
            <h2>{replaceSoftSign(month)}</h2>
            {Object.entries(days).map(([day, items]) => (
              <div key={day} ref={isToday(items[0].date) ? currentDayRef : null}>
                <h3 className={isToday(items[0].date) ? 'today-class' : ''}>
                  {day} {replaceSoftSign(getMonthName(new Date(items[0].date)))}
                </h3>
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
      <th>Last Edited By</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {items.map((item) => (
      <tr key={item._id} className={item.colorClass || ""}>
        <td>
          <input
            type="date"
            value={new Date(item.date).toISOString().split("T")[0]}
            onChange={(e) => handleDateChange(e, item._id)}
          />
        </td>
        <td>
          <input
            type="text"
            value={item.brand || ""}
            onChange={(e) => handleInputChange(e, item._id, "brand")}
          />
        </td>
        <td>
          <select
            value={item.driver || ""}
            onChange={(e) => handleInputChange(e, item._id, "driver")}
          >
            <option value="">Select Driver</option>
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
            onChange={(e) => handleInputChange(e, item._id, "customer")}
          />
        </td>
        <td>
          <input
            type="text"
            value={item.routeNumber || ""}
            onChange={(e) => handleInputChange(e, item._id, "routeNumber")}
          />
        </td>
        <td>
          <input
            type="text"
            value={item.hours || ""}
            onChange={(e) => handleInputChange(e, item._id, "hours")}
          />
        </td>
        <td>
          <input
            type="checkbox"
            checked={item.isTrue || false}
            onChange={(e) => handleCheckboxChange(e, item._id)}
          />
        </td>
        <td>
          <input
            type="text"
            value={item.vehicleNumber || ""}
            onChange={(e) => handleInputChange(e, item._id, "vehicleNumber")}
          />
        </td>
        <td>
          <input
            type="text"
            value={item.price || ""}
            onChange={(e) => handleInputChange(e, item._id, "price")}
          />
        </td>
        <td>
          <span>{item.updatedBy || "N/A"}</span>
        </td>
        <td>
          <button onClick={() => handleDeleteWithConfirmation(item._id)}>Delete</button>
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
    </div>
  );
};

export default Home;
