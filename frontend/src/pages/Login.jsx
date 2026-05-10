import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthProvider";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false); // UI only

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = await loginUser(formData);

      setUser(data.user); // 🔥 IMPORTANT: update global auth state

      if (data.user.role === "student") {
        navigate("/student-dashboard");
      } else if (data.user.role === "teacher") {
        navigate("/teacher-dashboard");
      } else if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      }

    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-8 text-center">
          Login
        </h1>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border rounded-xl px-4 py-4 mb-5 outline-none focus:ring-2 focus:ring-black"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full border rounded-xl px-4 py-4 mb-6 outline-none focus:ring-2 focus:ring-black"
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-xl font-semibold transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-black text-white hover:opacity-90"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;