import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  return (
    <div className="app-top-navbar">
      <div className="navbar-logo">
        <h2>YKS Asistanı</h2>
      </div>
      <nav className="navbar-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          🏠 Ana Sayfa / Hedefler
        </NavLink>
        <NavLink to="/program" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          📅 Haftalık Program
        </NavLink>
        {/* Rota /studies olarak güncellendi */}
        <NavLink to="/studies" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          ⏱️ Çalışmalarım
        </NavLink>
        <NavLink to="/exams" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          📊 Deneme ve Analiz
        </NavLink>
        <NavLink to="/subjects" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          📖 Dersler ve Konular
        </NavLink>
      </nav>
    </div>
  );
}

export default Sidebar;