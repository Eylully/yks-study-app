import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Program from "./pages/Program";
import Studies from "./pages/Studies"; // YENİ EKLENDİ
import Exams from "./pages/Exams";

import "./App.css";
import Subjects from "./pages/Subjects";
function App() {
  return (
    <Router>
      <div className="app-layout">

        {/* ÜST YATAY MENÜ */}
        <Sidebar />

        {/* SAYFA İÇERİĞİ */}
        <main className="app-content">
          <Routes>

            {/* ANA SAYFA */}
            <Route
              path="/"
              element={<Dashboard />}
            />

            {/* HAFTALIK PROGRAM */}
            <Route
              path="/program"
              element={<Program />}
            />

            {/* ÇALIŞMALARIM */}
            <Route
              path="/studies"
              element={<Studies />}
            />
            {/* Denemeler */}
            <Route
              path="/exams"
              element={<Exams />}
            />
            {/* Konular */}
            <Route
              path="/subjects"
              element={<Subjects />}
            />

          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;