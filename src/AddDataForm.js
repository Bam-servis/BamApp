import React, { useState } from "react";
import axios from "axios";

const AddDataForm = () => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/data", {
        name,
        age: parseInt(age, 10),
      });
      console.log("Data added:", response.data);
      setName("");
      setAge("");
    } catch (error) {
      console.error("Error adding data:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
      />
      <input
        type="number"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        placeholder="Age"
        required
      />
      <button type="submit">Add Data</button>
    </form>
  );
};

export default AddDataForm;
