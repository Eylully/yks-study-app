import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./Dashboard.css";

import {
  getDashboardToday,
  saveDailyTime,
  getMathHistory,
  getDailyTimeHistory,
} from "../services/dashboardService";

const API_URL = "http://127.0.0.1:8000";

export default function Dashboard() {

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [mathHistory, setMathHistory] = useState([]);

  // Günlük toplam çalışma trendi için state
  const [dailyTrendData, setDailyTrendData] = useState([]);

  const [goals, setGoals] = useState({
    target_profession: "",
    daily_study_hours: "",
    target_ranking: "",
    target_tyt_net: "",
    target_ayt_net: "",
  });

  const [isEditingGoals, setIsEditingGoals] = useState(false);

  const [timeInputs, setTimeInputs] = useState({
    morning: "",
    afternoon: "",
    evening: "",
  });

  const [isEditingTime, setIsEditingTime] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDashboardToday();
      setDashboard(data);

      setGoals({
        target_profession: data.goals.target_profession || "",
        daily_study_hours: data.goals.daily_study_hours ?? "",
        target_ranking: data.goals.target_ranking ?? "",
        target_tyt_net: data.goals.target_tyt_net ?? "",
        target_ayt_net: data.goals.target_ayt_net ?? "",
      });

      setTimeInputs({
        morning: minutesToHours(data.time_distribution.morning_minutes),
        afternoon: minutesToHours(data.time_distribution.afternoon_minutes),
        evening: minutesToHours(data.time_distribution.evening_minutes),
      });

    } catch (err) {
      console.error("Dashboard yüklenemedi:", err);
      setError("Dashboard verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };
  const loadMathHistory = async () => {
    try {
      const historyData = await getMathHistory(7);
      setMathHistory(historyData);
    } catch (err) {
      console.error("Matematik geçmişi yüklenemedi:", err);
      setError("Matematik geçmişi yüklenemedi.");
    }
  };
  const loadDailyTrend = async () => {
  try {
    const historyData = await getDailyTimeHistory(7);

    const chartData = historyData.map((item) => {
      const date = new Date(`${item.date}T00:00:00`);

      return {
        date: date.toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
        }),
        saat: Number((item.total_minutes / 60).toFixed(1)),
      };
    });

    setDailyTrendData(chartData);
  } catch (err) {
    console.error("Günlük çalışma geçmişi yüklenemedi:", err);
    setError("Günlük çalışma geçmişi yüklenemedi.");
  }
};

  useEffect(() => {
    loadDashboard();
    loadMathHistory();
    loadDailyTrend();
  }, []);
  const minutesToHours = (minutes) => {
    if (!minutes) return "";
    return minutes / 60;
  };

  const hoursToMinutes = (hours) => {
    const numericValue = Number(hours);
    if (Number.isNaN(numericValue) || numericValue < 0) return 0;
    return Math.round(numericValue * 60);
  };

  const handleGoalChange = (field, value) => {
    setGoals((previous) => ({ ...previous, [field]: value }));
  };

  const handleGoalSubmit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setMessage("");

      const goalData = {
        target_profession: goals.target_profession,
        daily_study_hours: Number(goals.daily_study_hours),
        target_ranking: Number(goals.target_ranking),
        target_tyt_net: Number(goals.target_tyt_net),
        target_ayt_net: Number(goals.target_ayt_net),
      };

      const response = await axios.post(`${API_URL}/goals`, goalData);
      setMessage(response.data.message || "Hedefler başarıyla kaydedildi.");
      setIsEditingGoals(false);
      await loadDashboard();
    } catch (err) {
      console.error("Hedefler kaydedilemedi:", err);
      setError("Hedefler kaydedilirken bir hata oluştu.");
    }
  };

  const handleTimeChange = (field, value) => {
    setTimeInputs((previous) => ({ ...previous, [field]: value }));
  };

  const handleTimeSubmit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setMessage("");

    await saveDailyTime({
      morning_minutes: hoursToMinutes(timeInputs.morning),
      afternoon_minutes: hoursToMinutes(timeInputs.afternoon),
      evening_minutes: hoursToMinutes(timeInputs.evening),
    });

    setMessage("Günlük çalışma dağılımı kaydedildi.");
    setIsEditingTime(false);

    await loadDashboard();
    await loadDailyTrend();
    } catch (err) {
      console.error("Çalışma dağılımı kaydedilemedi:", err);
      setError("Çalışma dağılımı kaydedilirken bir hata oluştu.");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">Dashboard yükleniyor...</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">Dashboard verileri bulunamadı.</div>
      </div>
    );
  }

  const {
    goals: dashboardGoals,
    today,
    time_distribution,
  } = dashboard;

  const {
    morning_percentage,
    afternoon_percentage,
    evening_percentage,
  } = time_distribution;

  const pieStyle = {
    background: `conic-gradient(
      #4a6cf7 0% ${morning_percentage}%,
      #63b3ed ${morning_percentage}% ${morning_percentage + afternoon_percentage}%,
      #9f7aea ${morning_percentage + afternoon_percentage}% 100%
    )`,
  };

  const mathChartData = mathHistory.map((d) => ({
    day: new Date(d.date + "T00:00:00").toLocaleDateString("tr-TR", { weekday: "short" }),
    Saat: d.hours,
  }));

  const todayHours = mathHistory.length ? mathHistory[mathHistory.length - 1].hours : 0;
  const yesterdayHours = mathHistory.length > 1 ? mathHistory[mathHistory.length - 2].hours : 0;
  const diffHours = Number((todayHours - yesterdayHours).toFixed(1));

  // YKS Kalan Gün Hesaplaması
  const targetDate = new Date("2027-06-21T10:00:00");
  const currentDate = new Date();
  const diffTime = targetDate - currentDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">
        <div>
          <h1>🎯 YKS Hedeflerim ve Analiz Paneli</h1>
          <p>Bugünkü çalışma durumunu dijital denge analizleriyle buradan takip edebilirsin.</p>
        </div>
      </div>

      {/* YKS'YE KALAN SÜRE KARTI */}
      <section className="dashboard-card" style={{ background: "linear-gradient(135deg, #4a6cf7 0%, #63b3ed 100%)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", marginBottom: "20px" }}>
        <div>
          <h2 style={{ color: "white", margin: 0, fontSize: "18px" }}>⏳ YKS'ye Kalan Süre</h2>
          <p style={{ margin: "5px 0 0 0", opacity: 0.9, fontSize: "14px" }}>Zaman akıp geçiyor, hedefe her gün biraz daha yakınsın!</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "32px", fontWeight: "bold" }}>{diffDays > 0 ? diffDays : 0}</span>
          <span style={{ fontSize: "14px", display: "block", opacity: 0.9 }}>Gün Kaldı</span>
        </div>
      </section>

      {message && <div className="dashboard-success">{message}</div>}
      {error && <div className="dashboard-error">{error}</div>}

      {/* HEDEF KARTI */}
      {!isEditingGoals ? (
        <section className="dashboard-card goal-card">
          <div className="card-header">
            <div>
              <h2>🎯 Hedeflerim</h2>
              <p>YKS hedeflerin</p>
            </div>
            <button className="btn btn-primary" onClick={() => setIsEditingGoals(true)}>
              Hedefleri Düzenle
            </button>
          </div>

          <div className="goal-grid">
            <div className="goal-item">
              <span className="goal-label">Meslek / Bölüm Hedefi</span>
              <strong className="goal-value">{dashboardGoals.target_profession || "Henüz girilmedi"}</strong>
            </div>
            <div className="goal-item">
              <span className="goal-label">Günlük Çalışma Hedefi</span>
              <strong className="goal-value">{dashboardGoals.daily_study_hours || 0} saat</strong>
            </div>
            <div className="goal-item">
              <span className="goal-label">Hedef Sıralama</span>
              <strong className="goal-value">{dashboardGoals.target_ranking || 0}</strong>
            </div>
            <div className="goal-item">
              <span className="goal-label">TYT Deneme Net Hedefi</span>
              <strong className="goal-value">{dashboardGoals.target_tyt_net || 0} net</strong>
            </div>
            <div className="goal-item">
              <span className="goal-label">AYT Deneme Net Hedefi</span>
              <strong className="goal-value">{dashboardGoals.target_ayt_net || 0} net</strong>
            </div>
          </div>
        </section>
      ) : (
        <section className="dashboard-card">
          <div className="card-header">
            <div><h2>🎯 Hedeflerini Düzenle</h2></div>
          </div>
          <form onSubmit={handleGoalSubmit} className="goal-form">
            <div className="form-group">
              <label>Meslek / Bölüm Hedefin</label>
              <input
                type="text"
                value={goals.target_profession}
                onChange={(event) => handleGoalChange("target_profession", event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Günlük Çalışma Hedefi</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={goals.daily_study_hours}
                onChange={(event) => handleGoalChange("daily_study_hours", event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Hedef Sıralama</label>
              <input
                type="number"
                min="1"
                value={goals.target_ranking}
                onChange={(event) => handleGoalChange("target_ranking", event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>TYT Deneme Net Hedefi</label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={goals.target_tyt_net}
                onChange={(event) => handleGoalChange("target_tyt_net", event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>AYT Deneme Net Hedefi</label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={goals.target_ayt_net}
                onChange={(event) => handleGoalChange("target_ayt_net", event.target.value)}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-success">Kaydet</button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditingGoals(false)}>İptal</button>
            </div>
          </form>
        </section>
      )}

      {/* İKİYE BÖLÜNMÜŞ YAPI: SOL TARAF GÜNLÜK ÇALIŞMA DAĞILIMI, SAĞ TARAF GÜNLÜK ÇALIŞMA İLERLEYİŞ GRAFİĞİ */}
      <div className="dashboard-grid-2">

        {/* SOL: GÜNLÜK ÇALIŞMA DAĞILIMI & HEDEF */}
        <section className="dashboard-card time-distribution-card" style={{ margin: 0 }}>
          <div className="card-header">
            <div>
              <h2>📊 Günlük Çalışma Dağılımı</h2>
              <p>Gün içerisindeki çalışma zamanını takip et</p>
            </div>
            {!isEditingTime && (
              <button className="btn btn-primary" onClick={() => setIsEditingTime(true)}>
                Süreleri Gir
              </button>
            )}
          </div>

          {isEditingTime ? (
            <form onSubmit={handleTimeSubmit} className="time-form">
              <div className="time-input">
                <label>🌅 Sabah</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={timeInputs.morning}
                  onChange={(event) => handleTimeChange("morning", event.target.value)}
                  placeholder="Örn. 2"
                />
                <span>saat</span>
              </div>
              <div className="time-input">
                <label>☀️ Öğleden Sonra</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={timeInputs.afternoon}
                  onChange={(event) => handleTimeChange("afternoon", event.target.value)}
                  placeholder="Örn. 3"
                />
                <span>saat</span>
              </div>
              <div className="time-input">
                <label>🌙 Akşam</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={timeInputs.evening}
                  onChange={(event) => handleTimeChange("evening", event.target.value)}
                  placeholder="Örn. 1.5"
                />
                <span>saat</span>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">Kaydet</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditingTime(false)}>İptal</button>
              </div>
            </form>
          ) : (
            <div className="distribution-content">
              <div className="pie-chart" style={pieStyle}>
                <div className="pie-center">
                  <strong>{time_distribution.total_minutes > 0 ? `${Math.round(time_distribution.total_minutes / 60)}s` : "0s"}</strong>
                  <span>toplam</span>
                </div>
              </div>

              <div className="distribution-legend">
                <div className="legend-item">
                  <span className="legend-dot morning-dot" />
                  <div>
                    <strong>Sabah</strong>
                    <span>{formatMinutes(time_distribution.morning_minutes)} {" · "} %{time_distribution.morning_percentage}</span>
                  </div>
                </div>
                <div className="legend-item">
                  <span className="legend-dot afternoon-dot" />
                  <div>
                    <strong>Öğleden Sonra</strong>
                    <span>{formatMinutes(time_distribution.afternoon_minutes)} {" · "} %{time_distribution.afternoon_percentage}</span>
                  </div>
                </div>
                <div className="legend-item">
                  <span className="legend-dot evening-dot" />
                  <div>
                    <strong>Akşam</strong>
                    <span>{formatMinutes(time_distribution.evening_minutes)} {" · "} %{time_distribution.evening_percentage}</span>
                  </div>
                </div>
              </div>

              <div className="today-summary" style={{ marginTop: "15px", paddingTop: "10px", borderTop: "1px solid #edf0f5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "14px", color: "#4b5563" }}>🎯 Günlük Hedef</h3>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>{dashboardGoals.daily_study_hours || 0} saat hedef</span>
                  </div>
                  <strong style={{ fontSize: "16px", color: "#4a6cf7" }}>%{today.goal_percentage}</strong>
                </div>
                <div className="progress-bar" style={{ margin: "8px 0" }}>
                  <div className="progress-fill" style={{ width: `${today.goal_percentage}%` }} />
                </div>
                <div className="today-summary-time" style={{ fontSize: "15px", fontWeight: "bold" }}>{today.formatted_time}</div>
              </div>
            </div>
          )}
        </section>

        {/* SAĞ: GÜNLÜK TOPLAM ÇALIŞMA İLERLEYİŞİ (LINE CHART - GİRİLEN SÜRELERLE HESAPLANAN) */}
        <section className="dashboard-card chart-mini-card" style={{ margin: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="card-header" style={{ marginBottom: "10px" }}>
              <div>
                <h2>📈 Günlük Toplam Çalışma İlerlemesi</h2>
                <p>Girdiğin günlük çalışma sürelerinin değişimi</p>
              </div>
            </div>
          </div>
          <div style={{ width: "100%", height: "230px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip formatter={(value) => [`${value} saat`, "Toplam Süre"]} />
                <Line type="monotone" dataKey="saat" stroke="#4a6cf7" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

      </div>

      {/* EN ALTTA MATEMATİK & GEOMETRİ ÇALIŞMA SÜRESİ (BAR CHART) */}
      <section className="dashboard-card subject-card" style={{ marginTop: "25px" }}>
        <div className="card-header">
          <div>
            <h2>📐 Matematik & Geometri Çalışma Süresi</h2>
            <p>Son 7 günde matematik ve geometri derslerine ayırdığın toplam süre</p>
          </div>
        </div>

        <div className="compare-box" style={{ margin: "10px 0", fontSize: "14px" }}>
          <strong>Bugün: {todayHours} saat</strong>
          <span style={{ color: "#6b7280" }}> · Dün: {yesterdayHours} saat</span>
          <div style={{ color: diffHours >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600, marginTop: "4px" }}>
            {diffHours > 0 && `📈 Dünden ${diffHours} saat fazla`}
            {diffHours < 0 && `📉 Dünden ${Math.abs(diffHours)} saat az`}
            {diffHours === 0 && "➖ Dünle aynı süre"}
          </div>
        </div>

        <div style={{ width: "100%", height: "220px", marginTop: "16px" }}>
          <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={mathChartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
            <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip formatter={(value) => [`${value} saat`, "Çalışma Süresi"]} />
            <Bar
              dataKey="Saat"
              fill="#4a6cf7"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

    </div>
  );
}

function formatMinutes(totalMinutes) {
  if (!totalMinutes) return "0 dakika";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} dakika`;
  if (minutes === 0) return `${hours} saat`;
  return `${hours} saat ${minutes} dakika`;
}