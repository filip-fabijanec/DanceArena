import { useState } from "react";
import "./CreateUser.css";

function CreateUser() {
  const [formData, setFormData] = useState({
    role: "voditeljKluba",
    name: "",
    surname: "",
    provider: "google",
    providerId: "",
    email: "",
    clubName: "",
    clubLocation: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://localhost:3500/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      const data = await response.json();
      console.log("User created:", data);
      
      setMessage(`Korisnik uspješno kreiran! ID: ${data._id}`);
      setIsError(false);

      // Reset form
      setFormData({
        role: "voditeljKluba",
        name: "",
        surname: "",
        provider: "google",
        providerId: "",
        email: "",
        clubName: "",
        clubLocation: "",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      setMessage(`Greška: ${error.message}`);
      setIsError(true);
    }
  };

  return (
    <div className="create-user-container">
      <h2>Kreiranje novog korisnika</h2>
      
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-group">
          <label htmlFor="role">Uloga *</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="organizator">Organizator</option>
            <option value="sudac">Sudac</option>
            <option value="voditeljKluba">Voditelj kluba</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="name">Ime *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Unesite ime"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="surname">Prezime *</label>
          <input
            type="text"
            id="surname"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            placeholder="Unesite prezime"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="provider">Provider *</label>
          <input
            type="text"
            id="provider"
            name="provider"
            value={formData.provider}
            onChange={handleChange}
            placeholder="npr. google"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="providerId">Provider ID *</label>
          <input
            type="text"
            id="providerId"
            name="providerId"
            value={formData.providerId}
            onChange={handleChange}
            placeholder="Google ID korisnika"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="korisnik@example.com"
            required
          />
        </div>

        {/* Opciona polja za voditelja kluba */}
        <div className="form-group">
          <label htmlFor="clubName">Naziv kluba (opciono)</label>
          <input
            type="text"
            id="clubName"
            name="clubName"
            value={formData.clubName}
            onChange={handleChange}
            placeholder="Naziv plesnog kluba"
          />
        </div>

        <div className="form-group">
          <label htmlFor="clubLocation">Lokacija kluba (opciono)</label>
          <input
            type="text"
            id="clubLocation"
            name="clubLocation"
            value={formData.clubLocation}
            onChange={handleChange}
            placeholder="Grad, Država"
          />
        </div>

        <button type="submit" className="submit-button">
          Kreiraj korisnika
        </button>
      </form>

      {message && (
        <div className={`message ${isError ? "error" : "success"}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default CreateUser;