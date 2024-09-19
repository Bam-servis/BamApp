import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { hardcodedData } from "./hardcodedData";
import "./styles.css";
import { format, addMonths, subMonths } from "date-fns";
import { ru } from "date-fns/locale";
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
      currentDayRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [data]);

  const sortedData = data.sort((a, b) => {
    if (a.colorClass === "highlight" && b.colorClass !== "highlight") return 1;
    if (a.colorClass !== "highlight" && b.colorClass === "highlight") return -1;

    const driverComparison = a.driver.localeCompare(b.driver);
    if (driverComparison !== 0) return driverComparison;

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
      const response = await axios.post("http://localhost:5000/api/data", {
        ...newItem,
        updatedBy: localStorage.getItem("username"),
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

    const updatedData = data.map((item) =>
      item._id === itemId ? { ...item, [fieldName]: updatedValue } : item
    );
    setData(updatedData);

    axios
      .put(`http://localhost:5000/api/data/${itemId}`, {
        ...updatedData.find((item) => item._id === itemId),
        [fieldName]: updatedValue,
        updatedBy: username,
      })
      .catch((error) => console.error("Error saving data:", error));
  };

  const addNewItemWithClass = async (className) => {
    try {
      const response = await axios.post("http://localhost:5000/api/data", {
        ...newItem,
        colorClass: className,
        updatedBy: localStorage.getItem("username"),
      });
      setData([...data, response.data]);
    } catch (error) {
      console.error("Error adding data with class:", error);
    }
  };

  const handleCheckboxChange = async (e, itemId) => {
    const { checked } = e.target;

    const isConfirmed = window.confirm(
      "Вы уверены, что хотите изменить состояние этого чекбокса?"
    );
    if (!isConfirmed) {
      return;
    }

    const updatedData = data.map((item) =>
      item._id === itemId ? { ...item, isTrue: checked } : item
    );
    setData(updatedData);

    try {
      await axios.put(`http://localhost:5000/api/data/${itemId}`, {
        ...updatedData.find((item) => item._id === itemId),
        isTrue: checked,
      });
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };

  const handleDeleteWithConfirmation = async (id) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );
    if (isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/data/${id}`);
        setData(data.filter((item) => item._id !== id));
      } catch (error) {
        console.error("Error deleting data:", error);
      }
    }
  };

  const handleDateChange = (e, itemId) => {
    const { value } = e.target;
    const username = localStorage.getItem("username");

    const updatedData = data.map((item) =>
      item._id === itemId ? { ...item, date: value } : item
    );
    setData(updatedData);

    axios
      .put(`http://localhost:5000/api/data/${itemId}`, {
        ...updatedData.find((item) => item._id === itemId),
        date: value,
        updatedBy: username,
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
      const monthYear = format(date, "MMMM yyyy", { locale: ru });
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

  const handleMonthChange = (direction) => {
    const newMonth =
      direction === "prev"
        ? subMonths(currentMonth, 1)
        : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };
  const filteredData = sortedData.filter((item) => {
    const itemDate = new Date(item.date);
    return (
      itemDate.getMonth() === currentMonth.getMonth() &&
      itemDate.getFullYear() === currentMonth.getFullYear()
    );
  });

  return (
    <div className="home">
      <div className="header">
        <div className="month-controls">
          <button onClick={() => handleMonthChange("prev")}>
            Previous Month
          </button>
          <button onClick={() => handleMonthChange("next")}>Next Month</button>
          <button onClick={() => setCurrentMonth(new Date())}>
            Current Month
          </button>
        </div>
        <h2>
          {getMonthName(currentMonth)} {currentMonth.getFullYear()}
        </h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Brand</th>
            <th>Driver</th>
            <th>Customer</th>
            <th>Route Number</th>
            <th>Hours</th>
            <th>True</th>
            <th>Vehicle Number</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item) => (
            <tr
              key={item._id}
              ref={isToday(item.date) ? currentDayRef : null}
              className={item.colorClass}
            >
              <td>
                <input
                  type="date"
                  value={item.date || ""}
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
                    <option key={driver._id} value={driver.name}>
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
                  onChange={(e) =>
                    handleInputChange(e, item._id, "routeNumber")
                  }
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
                  onChange={(e) =>
                    handleInputChange(e, item._id, "vehicleNumber")
                  }
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
                <button onClick={() => handleDeleteWithConfirmation(item._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="add-item-form">
        <h3>Add New Item</h3>
        <input
          type="date"
          placeholder="Date"
          value={formatDateForInput(newItem.date)}
          onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
        />
        <input
          type="text"
          placeholder="Brand"
          value={newItem.brand}
          onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
        />
        <input
          type="text"
          placeholder="Driver"
          value={newItem.driver}
          onChange={(e) => setNewItem({ ...newItem, driver: e.target.value })}
        />
        <input
          type="text"
          placeholder="Customer"
          value={newItem.customer}
          onChange={(e) => setNewItem({ ...newItem, customer: e.target.value })}
        />
        <input
          type="text"
          placeholder="Route Number"
          value={newItem.routeNumber}
          onChange={(e) =>
            setNewItem({ ...newItem, routeNumber: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Hours"
          value={newItem.hours}
          onChange={(e) => setNewItem({ ...newItem, hours: e.target.value })}
        />
        <input
          type="text"
          placeholder="Vehicle Number"
          value={newItem.vehicleNumber}
          onChange={(e) =>
            setNewItem({ ...newItem, vehicleNumber: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Price"
          value={newItem.price}
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
        />
        <button onClick={addNewItem}>Add Item</button>
        <button onClick={() => addNewItemWithClass("highlight")}>
          Add Highlighted Item
        </button>
        <button onClick={addEntriesForSelectedDate}>
          Add 37 Entries for Selected Date
        </button>
      </div>
    </div>
  );
};

export default Home;
