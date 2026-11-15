import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const empty = {
  name: "",
  email: "",
  phone: "",
  student_id: "",
  password: "",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/find");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card form narrow" onSubmit={submit}>
      <h1>Sign up</h1>
      <p className="hint">Use your J.C. Bose University student ID. An admin will verify it.</p>
      <label className="field">
        <span>Name</span>
        <input value={form.name} onChange={(event) => update("name", event.target.value)} required />
      </label>
      <label className="field">
        <span>Email</span>
        <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
      </label>
      <label className="field">
        <span>Phone</span>
        <input value={form.phone} onChange={(event) => update("phone", event.target.value)} required />
      </label>
      <label className="field">
        <span>Student ID</span>
        <input value={form.student_id} onChange={(event) => update("student_id", event.target.value)} required />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          type="password"
          value={form.password}
          onChange={(event) => update("password", event.target.value)}
          minLength={8}
          required
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn" type="submit">
        Create account
      </button>
      <p>
        Already registered? <Link to="/login">Login</Link>
      </p>
    </form>
  );
}
