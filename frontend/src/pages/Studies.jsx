import { useEffect, useState } from "react";
import axios from "axios";
import "./Studies.css"; 

const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export default function Studies() {
  const [selectedDay, setSelectedDay] = useState("");
  const [todayDate, setTodayDate] = useState("");
  const [dailyTasks, setDailyTasks] = useState([]); 
  const [missedTasks, setMissedTasks] = useState([]); 
  const [loading, setLoading] = useState(false);
  
  // Şık bildirim için state
  const [notification, setNotification] = useState(null);

  // 1. Sayfa açıldığında otomatik GÜN ve TARİH tespiti
  useEffect(() => {
    const dateObj = new Date();
    const currentDayName = DAY_NAMES[dateObj.getDay()];
    const formattedDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    
    setSelectedDay(currentDayName);
    setTodayDate(formattedDate);
    fetchMissedTasks(); 
  }, []);

  // 2. Seçili Gün veya Tarih değiştiğinde Backend'den o günün programını çek
  useEffect(() => {
    if (selectedDay && todayDate) {
      fetchDailyTasks();
    }
  }, [selectedDay, todayDate]);

  const fetchDailyTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/studies/daily?day=${selectedDay}&date_str=${todayDate}`);
      setDailyTasks(response.data);
    } catch (error) {
      console.error("Görevler çekilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  // 7 Günlük Eksikleri Çekme
  const fetchMissedTasks = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/studies/missed`);
      setMissedTasks(response.data);
    } catch (error) {
      console.error("Eksik görevler yüklenemedi:", error);
    }
  };

  const handleDayClick = (targetDayName) => {
    setSelectedDay(targetDayName);

    const todayObj = new Date();
    const currentDayIndex = todayObj.getDay(); 
    const targetDayIndex = DAY_NAMES.indexOf(targetDayName);

    let diffDays = targetDayIndex - currentDayIndex;
    if (diffDays > 0) diffDays -= 7;   

    const targetDateObj = new Date();
    targetDateObj.setDate(todayObj.getDate() + diffDays);

    const formattedTargetDate = new Date(targetDateObj.getTime() - (targetDateObj.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    setTodayDate(formattedTargetDate);
  };

  // Göreve tıklandığında Backend'e bildir
  const toggleTask = async (taskId, currentStatus) => {
    const newStatus = !currentStatus;
    
    setDailyTasks(prev => 
      prev.map(task => task.id === taskId ? { ...task, completed: newStatus } : task)
    );

    try {
      await axios.post('http://127.0.0.1:8000/studies/toggle', {
        task_id: taskId,
        record_date: todayDate,
        is_completed: newStatus
      });
      fetchMissedTasks(); 
    } catch (error) {
      console.error("Görev durumu kaydedilemedi:", error);
      setDailyTasks(prev => 
        prev.map(task => task.id === taskId ? { ...task, completed: currentStatus } : task)
      );
    }
  };

  // Eksikler panosundan "Yaptım!" butonuna basıldığında
  const completeMissedTask = async (taskId, taskDate) => {
    try {
      await axios.post('http://127.0.0.1:8000/studies/toggle', {
        task_id: taskId,
        record_date: taskDate,
        is_completed: true
      });
      setMissedTasks(prev => prev.filter(item => !(item.task_id === taskId && item.date === taskDate)));
    } catch (error) {
      console.error("Eksik görev tamamlanamadı:", error);
    }
  };

  // Şık bildirim gösteren fonksiyon
  const handleSave = () => {
    setNotification("🎉 Günün çalışmaları başarıyla kaydedildi!");
    setTimeout(() => {
      setNotification(null);
    }, 3500); // 3.5 saniye sonra otomatik kaybolur
  };

  const formatTaskName = (type, subject) => {
    const labels = {
      "topic": "📖 Konu Çalışması",
      "video": "🎥 Video Ders",
      "test": "📝 Test",
      "branch_exam": "🎯 Branş Denemesi",
      "break": "☕ Mola",
      "general_exam": "📝 Genel Deneme",
      "book": "📚 Kitap Okuma"
    };
    
    const typeLabel = labels[type] || type;
    if (type === "break" || type === "general_exam" || type === "book") {
      return typeLabel;
    }
    return `${typeLabel} - ${subject}`;
  };

  return (
    <div className="studies-container">
      
      {/* ŞIK BAŞARI BİLDİRİMİ (TOAST) */}
      {notification && (
        <div className="custom-toast-notification">
          {notification}
        </div>
      )}

      {/* ÜST GÜN SEÇİCİ */}
      <div className="day-selector">
        {DAY_NAMES.map(day => {
          if (day === "Pazar") return null; 
          return (
            <button 
              key={day} 
              className={`day-btn ${selectedDay === day ? "active" : ""}`}
              onClick={() => handleDayClick(day)}
            >
              {day}
            </button>
          );
        })}
        <button 
          className={`day-btn ${selectedDay === "Pazar" ? "active" : ""}`}
          onClick={() => handleDayClick("Pazar")}
        >
          Pazar
        </button>
      </div>

      <div className="studies-content">
        
        {/* SOL TARAF: GÜNLÜK PROGRAM */}
        <div className="daily-program-panel">
          <div className="panel-header">
            <h2>📅 {selectedDay} Programı</h2>
            <span className="date-badge">{todayDate}</span>
          </div>

          <div className="tasks-list">
            {loading ? (
              <p style={{ color: "#6c757d" }}>Görevler yükleniyor...</p>
            ) : dailyTasks.length === 0 ? (
              <p style={{ color: "#6c757d", fontStyle: "italic" }}>Bu gün için planlanmış bir görev yok. Program sekmesinden ekleme yapabilirsin!</p>
            ) : (
              dailyTasks.map(task => (
                <div key={task.id} className={`task-item ${task.completed ? "completed" : ""}`}>
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={task.completed}
                      onChange={() => toggleTask(task.id, task.completed)} 
                    />
                    <span className="checkmark"></span>
                    <div className="task-info">
                      <span className="task-subject">{formatTaskName(task.type, task.subject)}</span>
                      <span className="task-time">⏰ {task.time}</span>
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>

          <button className="save-btn" onClick={handleSave}>
            💾 Günü Kaydet
          </button>
        </div>

        {/* SAĞ TARAF: 7 GÜNLÜK EKSİKLER PANOSU */}
        <div className="missed-tasks-panel">
          <div className="missed-header">
            <h3>⚠️ 7 Günlük Eksikler</h3>
            <p>Son bir haftada atladığın görevler burada birikir.</p>
          </div>
          <div className="missed-list">
            {missedTasks.length === 0 ? (
              <div className="no-missed" style={{ color: "#2b8a3e", fontWeight: "500", textAlign: "center", padding: "15px" }}>
                Harika! Son 1 haftada hiç eksiğin yok 🎉
              </div>
            ) : (
              missedTasks.map((item, index) => (
                <div key={`${item.task_id}-${item.date}-${index}`} className="missed-item">
                  <div className="missed-info">
                    <span className="missed-subject">{formatTaskName(item.type, item.subject)}</span>
                    <span className="missed-time">📅 {item.date} ({item.day})</span>
                  </div>
                  <button 
                    className="complete-missed-btn"
                    onClick={() => completeMissedTask(item.task_id, item.date)}
                  >
                    Yaptım! ✓
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}