import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { hardcodedData } from "./hardcodedData";
import "./styles.css";
import { format, addMonths, subMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { debounce } from "lodash";
import Select from "react-select";
const Home = () => {
  const [data, setData] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [newDriver, setNewDriver] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const [isVisibleBlock, setIsVisibleBlock] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL;
  const userNameRoot = localStorage.getItem("username");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const currentDayRef = useRef(null);
  const initialRender = useRef(true);
  const today = new Date();
  const formattedToday = format(today, "dd");
  const debouncedUpdateRef = useRef(null);
  const [inputValues, setInputValues] = useState({});
  const socket = useRef(null);
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
  const inputs = Array.from(document.querySelectorAll("#inputTable input"));

  inputs.forEach((input, index) => {
    input.addEventListener("keydown", (event) => {
      let newIndex;

      switch (event.key) {
        case "ArrowRight":
          newIndex = index + 1;
          break;
        case "ArrowLeft":
          newIndex = index - 1;
          break;
        default:
          return;
      }

      // Проверяем, что новый индекс в пределах массива
      if (newIndex >= 0 && newIndex < inputs.length) {
        inputs[newIndex].focus();
        event.preventDefault(); // Предотвращаем стандартное поведение клавиши
      }
    });
  });
  const toggleVisibilityBlock = () => {
    setIsVisibleBlock(!isVisibleBlock);
  };
  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/data`);
      setData(response.data);
      const totalCount = response.data.length;
      setTotalRecords(totalCount);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [apiUrl]);

  useEffect(() => {
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
    fetchData();
    fetchUsers();
    fetchDrivers();
    const connectWebSocket = () => {
      socket.current = new WebSocket(`${apiUrl.replace(/^http/, "ws")}/ws`);
      socket.current.onopen = () => {
        console.log("WebSocket connected");
      };
      socket.current.onmessage = (event) => {
        const messageData = JSON.parse(event.data);
        setData((prevData) => {
          switch (messageData.action) {
            case "update":
              console.log("Processing update for item:", messageData.item);
              // Проверка на изменения
              const updatedItem = prevData.find(
                (item) => item._id === messageData.item._id
              );
              if (
                updatedItem &&
                JSON.stringify(updatedItem) === JSON.stringify(messageData.item)
              ) {
                return prevData; // Нет изменений, не обновляем состояние
              }
              return prevData.map((item) =>
                item._id === messageData.item._id
                  ? { ...item, ...messageData.item }
                  : item
              );
            case "delete":
              return prevData.filter((item) => item._id !== messageData.id); // Удаляем элемент
            default:
              return prevData;
          }
        });
      };

      socket.current.onclose = () => {
        setTimeout(connectWebSocket, 1000); // Переподключаемся
      };

      socket.current.onerror = () => {
        setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [fetchData, apiUrl]);
  const handleBatchUpdateOrder = async (updates) => {
    try {
      await Promise.all(
        updates.map(({ itemId, newOrderIndex }) =>
          axios.put(`${apiUrl}/api/data/${itemId}`, {
            orderIndex: newOrderIndex,
          })
        )
      );
      fetchData(); // Перезагрузка данных после всех обновлений
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };
  // Функция для перемещения элемента вверх
  const moveItemUp = (itemId, currentOrderIndex, day) => {
    const itemsInCurrentDay = groupedByDayData[day].filter(
      (item) => item.colorClass === "highlight"
    );
    const currentIndexInHighlightedItems = itemsInCurrentDay.findIndex(
      (item) => item._id === itemId
    );

    if (currentIndexInHighlightedItems > 0) {
      const itemAbove = itemsInCurrentDay[currentIndexInHighlightedItems - 1];
      handleBatchUpdateOrder([
        { itemId, newOrderIndex: currentOrderIndex - 1 },
        { itemId: itemAbove._id, newOrderIndex: currentOrderIndex },
      ]);
    }
  };

  // Функция для перемещения элемента вниз
  const moveItemDown = (itemId, currentOrderIndex, day) => {
    const itemsInCurrentDay = groupedByDayData[day].filter(
      (item) => item.colorClass === "highlight"
    );
    const currentIndexInHighlightedItems = itemsInCurrentDay.findIndex(
      (item) => item._id === itemId
    );

    if (currentIndexInHighlightedItems < itemsInCurrentDay.length - 1) {
      const itemBelow = itemsInCurrentDay[currentIndexInHighlightedItems + 1];
      handleBatchUpdateOrder([
        { itemId, newOrderIndex: currentOrderIndex + 1 },
        { itemId: itemBelow._id, newOrderIndex: currentOrderIndex },
      ]);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      if (initialRender.current && currentDayRef.current) {
        currentDayRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        initialRender.current = false;
      }
    }, 1000);
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
  const addSingleItemWithClass = async (className) => {
    try {
      // Устанавливаем таймаут перед выполнением основной логики

      const itemsWithClass = data.filter(
        (item) => item.colorClass === className
      );
      const newIndex = itemsWithClass.length > 0 ? itemsWithClass.length : 0;

      // Отправляем запрос на добавление одного элемента
      const response = await axios.post(`${apiUrl}/api/data`, {
        ...newItem,
        colorClass: className,
        updatedBy: localStorage.getItem("username"),
        date: selectedDate,
        orderIndex: newIndex, // Используем новый индекс
      });

      // Обновляем состояние, добавляя только что созданный элемент
      setData((prevData) => [...prevData, response.data]);
    } catch (error) {
      console.error("Error adding single data with class:", error);
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
  const updateData = useCallback(
    async (itemId, fieldName, updatedValue) => {
      const username = localStorage.getItem("username");

      try {
        const response = await axios.put(`${apiUrl}/api/data/${itemId}`, {
          [fieldName]: updatedValue,
          updatedBy: username,
        });
        return response.data; // Возвращаем обновленные данные
      } catch (error) {
        console.error("Error saving data:", error);
        throw error; // Пробрасываем ошибку
      }
    },
    [apiUrl]
  );

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
        setData((prevData) => prevData.filter((item) => item._id !== id));
      } catch (error) {
        console.error("Error deleting data:", error);
      }
    }
    setHighlightId(null);
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

  const handleMonthChange = (direction) => {
    const newMonth =
      direction === "prev"
        ? subMonths(currentMonth, 1)
        : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };
  // Обрабатываем данные
  const processedData = useMemo(() => {
    const highlightedItems = data
      .filter((item) => item.colorClass === "highlight")
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const regularItems = data.filter((item) => item.colorClass !== "highlight");

    const groupedByDate = regularItems.reduce((acc, item) => {
      const itemDate = new Date(item.date);
      const itemDay = format(itemDate, "dd");
      const itemMonth = itemDate.getMonth();
      const itemYear = itemDate.getFullYear();
      const formattedItemDate = `${itemYear}-${itemMonth + 1}-${itemDay}`;

      if (!acc[formattedItemDate]) {
        acc[formattedItemDate] = [];
      }
      acc[formattedItemDate].push(item);
      return acc;
    }, {});

    const sortedGroupedByDate = Object.keys(groupedByDate).map((dateKey) => {
      const items = groupedByDate[dateKey];

      const driverGroupedData = items.reduce((acc, item) => {
        const driverGroup = acc.find(
          (group) => group[0].driver === item.driver
        );
        if (driverGroup) {
          driverGroup.push(item);
        } else {
          acc.push([item]);
        }
        return acc;
      }, []);

      return driverGroupedData
        .map((group) => group.sort((a, b) => a.orderIndex - b.orderIndex))
        .flat();
    });

    return [...sortedGroupedByDate.flat(), ...highlightedItems];
  }, [data]); // Здесь только data как зависимость

  // Фильтрация данных в зависимости от выбранного месяца
  const filteredData = useMemo(() => {
    return processedData.filter((item) => {
      const itemDate = new Date(item.date);
      const isCurrentMonth =
        itemDate.getMonth() === currentMonth.getMonth() &&
        itemDate.getFullYear() === currentMonth.getFullYear();
      // Логируем только когда происходит фильтрация
      if (isCurrentMonth) {
        console.log(itemDate);
      }
      return isCurrentMonth;
    });
  }, [processedData, currentMonth]);

  const groupedByDayData = useMemo(
    () => groupByDay(filteredData),
    [filteredData]
  );

  useEffect(() => {
    debouncedUpdateRef.current = debounce(
      async (itemId, fieldName, updatedValue) => {
        try {
          const responseData = await updateData(
            itemId,
            fieldName,
            updatedValue
          );
          setData((prevData) =>
            prevData.map((item) => (item._id === itemId ? responseData : item))
          );
        } catch (error) {
          console.error("Error updating data:", error);
        }
      },
      500
    );

    return () => {
      debouncedUpdateRef.current.cancel();
    };
  }, [updateData]);

  const handleInputChange = useCallback(
    (e, itemId, fieldName) => {
      const { value, type, checked } = e.target;
      const updatedValue = type === "checkbox" ? checked : value;

      // Проверяем, изменилось ли значение
      if (inputValues[itemId]?.[fieldName] !== updatedValue) {
        setInputValues((prevValues) => ({
          ...prevValues,
          [itemId]: {
            ...prevValues[itemId],
            [fieldName]: updatedValue,
          },
        }));

        // Вызываем дебаунс-функцию обновления
        debouncedUpdateRef.current(itemId, fieldName, updatedValue);
      }
    },
    [inputValues] // Можно заменить на [] для уменьшения перерасчетов
  );

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

  const sortedDrivers = useMemo(() => {
    return drivers.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [drivers]);
  const memoizedUsers = useMemo(() => {
    return users;
  }, [users]);
  const options = sortedDrivers.map((driver) => ({
    value: driver.name,
    label: driver.name,
  }));

  return (
    <div>
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
              rel="noopener noreferrer"
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/200t.pdf"
              target="_blank"
            >
              Liebherr 200 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              rel="noopener noreferrer"
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/liebherrltm1160-5.1.pdf"
              target="_blank"
            >
              Liebherr 160 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              rel="noopener noreferrer"
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/zomlion-30t.pdf"
              target="_blank"
            >
              ZOOMLION-30 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              rel="noopener noreferrer"
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/zoomli-80t.pdf"
              target="_blank"
            >
              ZOOMLION-80 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              rel="noopener noreferrer"
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/d122dbec6fe3c9fa32ee283d44045e973bc8ebaf.pdf"
              target="_blank"
            >
              ZOOMLION-55 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              rel="noopener noreferrer"
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/GMK3050-1-1.oc.ru.pdf"
              target="_blank"
            >
              GROVE-50 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              rel="noopener noreferrer"
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/zoomlion-90.pdf"
              target="_blank"
            >
              ZOOMLION-90 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              rel="noopener noreferrer"
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/klinz-25t.pdf"
              target="_blank"
            >
              Клинцы 25 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              rel="noopener noreferrer"
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/Klinz-32t.pdf"
              target="_blank"
            >
              Клинцы 32 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              rel="noopener noreferrer"
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/masheka-25.pdf"
              target="_blank"
            >
              Машека 25 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              rel="noopener noreferrer"
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/maz-16t.pdf"
              target="_blank"
            >
              МАЗ 16 Тонн
            </a>
          </div>
          <div style={{ border: "2px solid black", padding: "2px 10px" }}>
            <a
              rel="noopener noreferrer"
              style={{ color: "#fff", fontWeight: "bold" }}
              href="https://bam-servis.by/25-31 klinz.pdf"
              target="_blank"
            >
              Клинцы 25/31 Тонн
            </a>
          </div>
        </div>
      )}

      <div className="hide">
        <div className="bam-servis">"ООО Бам-Сервис гарант"</div>
        <div className="wrapper">
          {userNameRoot !== "Andrey" && (
            <div className="data">
              <div className="sybarenda">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <span className="title">Добавить суб аренду</span>
                <button onClick={() => addSingleItemWithClass("highlight")}>
                  Добавить Суб Аренду
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
          )}
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
            <table id="inputTable">
              <thead className="sticky">
                <tr>
                  <th></th>
                  <th>Статус</th>
                  <th>Марка</th>
                  <th>Гос №</th>
                  <th>Водитель</th>
                  <th>Заказчик</th>
                  {userNameRoot === "Tanya" && <th>№ Путевого</th>}
                  {userNameRoot === "Tanya" && <th>Часы</th>}
                  {userNameRoot === "Tanya" && <th>Статус</th>}
                  <th className="disabled">Стоимость Заказа</th>
                  <th className="disabled">Оплата</th>
                  <th className="disabled">Сумма Оплаты</th>
                  <th className="disabled">Комментарий</th>
                  <th>Менeджер</th>
                  <th>Последнее ред.</th>
                  <th>Удалить запись</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {groupedByDayData[day].map((item, index) => (
                  <tr
                    key={item._id}
                    ref={isPreviousDay(item.date) ? currentDayRef : null}
                    className={`${item.colorClass} ${
                      item.doneCheck === "inCompleted"
                        ? "row-inCompleted"
                        : item.doneCheck === "completed"
                        ? "row-completed"
                        : item.doneCheck === "inStay"
                        ? "row-in-stay"
                        : item.doneCheck === "comand"
                        ? "row-comand"
                        : item.doneCheck === "comand-inComlp"
                        ? "comand-inComlp"
                        : item.doneCheck === "weekend"
                        ? "weekend"
                        : item.doneCheck === "inProgress"
                        ? "row-in-progress"
                        : "row-pending"
                    } ${highlightId === item._id ? "highlight-delete" : ""}`}
                  >
                    <td>
                      {item.colorClass === "highlight" && (
                        <>
                          <button
                            type="button"
                            className="arrow"
                            onMouseEnter={() => setHighlightId(item._id)}
                            onMouseLeave={() => setHighlightId(null)}
                            onClick={(event) => {
                              event.preventDefault();
                              moveItemUp(item._id, item.orderIndex, day);
                            }}
                            disabled={index === 0} // Отключить кнопку, если это первый элемент
                          >
                            ↑
                          </button>
                        </>
                      )}
                    </td>
                    <td>
                      <select
                        className="select-rem"
                        value={item.doneCheck || "Выбрать"}
                        onChange={(e) => handleSelectChange(e, item._id)}
                      >
                        <option value="pending">Выбрать</option>
                        <option value="comand-inComlp">Команд./Ожидании</option>
                        <option value="inProgress">ТО/Ремонт</option>
                        <option value="comand">Командировка</option>
                        <option value="inCompleted">В Ожидании</option>
                        <option value="completed">Свободный</option>
                        <option value="inStay">Не закрыта</option>
                        <option value="weekend">Выходной</option>
                      </select>
                    </td>

                    <td className="row-row">
                      <input
                        type="text"
                        style={{
                          width: "150px",
                        }}
                        value={inputValues[item._id]?.brand || item.brand || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "brand")
                        }
                      />
                    </td>
                    <td>
                      <input
                        style={{
                          width: "75px",
                        }}
                        type="text"
                        value={
                          inputValues[item._id]?.vehicleNumber ||
                          item.vehicleNumber ||
                          ""
                        }
                        onChange={(e) =>
                          handleInputChange(e, item._id, "vehicleNumber")
                        }
                      />
                    </td>
                    <td>
                      <Select
                        styles={{
                          control: (base) => ({
                            ...base,
                            width: "110px", // Устанавливаем ширину на 130px
                            height: "22px",
                            minHeight: "22px",
                            padding: "0",
                            margin: "0",
                            display: "flex",
                            alignItems: "center",
                            backgroundColor: "#f0f8ff", // Яркий цвет фона
                            border: "1px solid #007bff", // Яркая граница
                            boxShadow: "none", // Убираем тени
                            "&:hover": {
                              border: "1px solid #0056b3", // Цвет границы при наведении
                            },
                          }),
                          dropdownIndicator: (base) => ({
                            ...base,
                            display: "none", // Убираем стрелочку
                          }),
                          indicatorSeparator: (base) => ({
                            ...base,
                            display: "none", // Убираем разделитель
                          }),
                          singleValue: (base) => ({
                            ...base,
                            margin: "0", // Убираем отступы у выбранного значения
                            lineHeight: "22px", // Устанавливаем высоту строки
                            fontSize: "12px", // Устанавливаем размер шрифта
                          }),
                          placeholder: (base) => ({
                            ...base,
                            lineHeight: "22px", // Устанавливаем высоту строки
                            fontSize: "12px", // Устанавливаем размер шрифта
                          }),
                          input: (base) => ({
                            ...base,
                            margin: "0", // Убираем отступы у инпута
                            lineHeight: "22px", // Устанавливаем высоту строки
                            fontSize: "12px", // Устанавливаем размер шрифта
                          }),
                          option: (base) => ({
                            ...base,
                            lineHeight: "22px", // Устанавливаем высоту строки для опций
                            fontSize: "12px", // Устанавливаем размер шрифта для опций
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 9999, // Убедитесь, что выпадающее меню отображается над другими элементами
                          }),
                        }}
                        options={options}
                        value={
                          options.find(
                            (option) =>
                              option.value ===
                              (inputValues[item._id]?.driver || item.driver)
                          ) || null
                        }
                        onChange={(selectedOption) => {
                          handleInputChange(
                            { target: { value: selectedOption.value } },
                            item._id,
                            "driver"
                          );
                        }}
                        placeholder="Выбрать"
                        isClearable={false} // Отключаем крестик отмены
                      />
                    </td>
                    <td className="tow-table-td">
                      <input
                        className="hover"
                        style={{
                          width: "100%",
                          minWidth: "300px",
                          fontWeight: "bold",
                          fontSize: "14.5px",
                        }}
                        type="text"
                        value={
                          inputValues[item._id]?.customer || item.customer || ""
                        }
                        onChange={(e) =>
                          handleInputChange(e, item._id, "customer")
                        }
                      />
                    </td>
                    {userNameRoot === "Tanya" && (
                      <>
                        <td>
                          <input
                            type="text"
                            style={{ width: "50px" }}
                            value={
                              inputValues[item._id]?.routeNumber ||
                              item.routeNumber ||
                              ""
                            }
                            onChange={(e) =>
                              handleInputChange(e, item._id, "routeNumber")
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            style={{ width: "50px" }}
                            value={
                              inputValues[item._id]?.hours || item.hours || ""
                            }
                            onChange={(e) =>
                              handleInputChange(e, item._id, "hours")
                            }
                          />
                        </td>
                        <td style={{ height: "40px" }}>
                          <input
                            type="checkbox"
                            checked={item.isTrue || false}
                            onChange={(e) =>
                              handleCheckboxChange(e, item._id, "checkbox")
                            }
                          />
                        </td>
                      </>
                    )}
                    <td className="disabled">
                      <input
                        type="number"
                        value={inputValues[item._id]?.price || item.price || ""}
                        onChange={(e) =>
                          handleInputChange(e, item._id, "price")
                        }
                      />
                    </td>
                    <td className="disabled">
                      <select
                        value={
                          inputValues[item._id]?.colorData ||
                          item.colorData ||
                          ""
                        }
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
                    <td className="disabled">
                      <input
                        type="text"
                        value={
                          inputValues[item._id]?.calcPay || item.calcPay || ""
                        }
                        onChange={(e) =>
                          handleInputChange(e, item._id, "calcPay")
                        }
                      />
                    </td>
                    <td className="disabled">
                      <input
                        type="text"
                        value={
                          inputValues[item._id]?.comment || item.comment || ""
                        }
                        onChange={(e) =>
                          handleInputChange(e, item._id, "comment")
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={inputValues[item._id]?.user || item.user || ""}
                        onChange={(e) => handleInputChange(e, item._id, "user")}
                      >
                        <option value="">Выбрать</option>
                        {memoizedUsers.map((user) => (
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
                        onClick={() => handleDeleteWithConfirmation(item._id)}
                        onMouseEnter={() => setHighlightId(item._id)}
                        onMouseLeave={() => setHighlightId(null)}
                        onTouchStart={() => setHighlightId(item._id)}
                      >
                        Удалить
                      </button>
                    </td>

                    <td>
                      {item.colorClass === "highlight" && (
                        <>
                          <button
                            type="button"
                            className="arrow"
                            onMouseEnter={() => setHighlightId(item._id)}
                            onMouseLeave={() => setHighlightId(null)}
                            onClick={(event) => {
                              event.preventDefault();
                              moveItemDown(item._id, item.orderIndex, day);
                            }}
                            disabled={
                              index === groupedByDayData[day].length - 1
                            } // Отключить кнопку, если это последний элемент
                          >
                            ↓
                          </button>
                        </>
                      )}
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
