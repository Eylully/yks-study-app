import { useState, useEffect, useRef } from "react";
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../services/taskService";
import "./Program.css";

const DAYS = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

const HOURS = Array.from(
  { length: 16 }, // 8'den 23'e kadar toplam 16 saat var
  (_, i) => `${String(i + 8).padStart(2, "0")}:00` // i + 8 ile 8'den başlatıyoruz
);


const ACTIVITIES = [
  { type: "topic", label: "Konu Çalışması", requiresSubject: true },
  { type: "video", label: "Video Ders", requiresSubject: true },
  { type: "test", label: "Test", requiresSubject: true },
  { type: "branch_exam", label: "Branş Denemesi", requiresSubject: true },
  { type: "break", label: "Mola", requiresSubject: false },
  { type: "general_exam", label: "Genel Deneme", requiresSubject: false },
  { type: "book", label: "Kitap Okuma", requiresSubject: false },
];

const SUBJECTS = [
  "Matematik TYT",
  "Matematik AYT",
  "Türkçe TYT",
  "Geometri",
  "Tarih TYT",
  "Tarih AYT",
  "Coğrafya TYT",
  "Coğrafya AYT",
  "Edebiyat AYT",
  "Fizik TYT",
  "Kimya TYT",
  "Biyoloji TYT",
];

function Program() {
  const [tasks, setTasks] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // REFERANSLARI SADECE BİR KERE BURADA TANIMLIYORUZ
  const tableWrapperRef = useRef(null);
  const panelRef = useRef(null);

  // 1. İlk Yükleme
  useEffect(() => {
    loadTasks();
  }, []);

  // 2. Tabloyu İstenen Saate Kaydırma
  useEffect(() => {
    if (!loading && tableWrapperRef.current) {
      const hourRowHeight = 48;
      const targetHour = 7;

      tableWrapperRef.current.scrollTop = targetHour * hourRowHeight;
    }
  }, [loading]);

  // 3. Boşluğa Tıklanınca Menüyü Kapatma (YENİ)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Eğer tıklanan yer aktivite panelinin dışındaysa menüyü kapat
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setActiveCategory(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);

      const data = await getAllTasks();

      setTasks(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Program yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const getTaskAt = (day, hour) => {
    return tasks.find(
      (task) =>
        task.day === day &&
        task.start_time === hour
    );
  };

  const handleDragStart = (
    e,
    activityType,
    subject = null
  ) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        source: "panel",
        activity_type: activityType,
        subject,
      })
    );
  };

  const handlePlacedDragStart = (e, task) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        source: "placed",
        taskId: task.id,
      })
    );
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, day, hour) => {
    e.preventDefault();

    const raw = e.dataTransfer.getData("application/json");

    if (!raw) return;

    const data = JSON.parse(raw);
    const existingAtTarget = getTaskAt(day, hour);

    // EĞER SAAT DOLUYSA ÇALIŞACAK KISIM
    if (
      existingAtTarget &&
      (data.source !== "placed" || existingAtTarget.id !== data.taskId)
    ) {
      // Çirkin alert yerine kendi şık hata state'imizi kullanıyoruz
      setError("⚠️ Bu saat zaten dolu! Lütfen boş bir saate sürükleyin.");
      
      // 3 saniye sonra hatayı ekrandan otomatik sil
      setTimeout(() => setError(null), 3000); 
      return;
    }

    try {
      if (data.source === "panel") {
        const created = await createTask({
          activity_type: data.activity_type,
          subject: data.subject,
          day,
          start_time: hour,
          duration: 60,
        });

        setTasks((prev) => [...prev, created]);
      }

      if (data.source === "placed") {
        const updated = await updateTask(data.taskId, {
          day,
          start_time: hour,
        });

        setTasks((prev) =>
          prev.map((task) => (task.id === updated.id ? updated : task))
        );
      }
    } catch (err) {
      console.error(err);
      setError("❌ Görev kaydedilirken hata oluştu.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteTask = async (task) => {
    try {
      await deleteTask(task.id);

      setTasks((prev) => prev.filter((item) => item.id !== task.id));
    } catch (err) {
      console.error(err);
      setError("❌ Görev silinirken hata oluştu.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const getActivityLabel = (type) => {
    const activity = ACTIVITIES.find(
      (item) => item.type === type
    );

    return activity
      ? activity.label
      : type;
  };

  if (loading) {
    return (
      <div className="program-container">
        <div className="program-loading">
          Program yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="program-container">
      <h1>Haftalık Program</h1>

      {error && (
        <div className="program-error">
          {error}
        </div>
      )}

      {/* AKTİVİTE PANELİ */}
      <div className="top-activity-panel" ref={panelRef}> {/* ref eklendi */}
        <div className="activity-row">
          {ACTIVITIES.map((activity) => {
            const isSelected = activeCategory === activity.type;

            return (
              <div
                key={activity.type}
                className={`activity-card-block ${isSelected ? "expanded" : ""}`}
              >
                <div
                  className={`top-activity-chip ${isSelected ? "active" : ""}`}
                  draggable={!activity.requiresSubject}
                  onDragStart={(e) => {
                    if (!activity.requiresSubject) {
                      handleDragStart(e, activity.type, null);
                      setActiveCategory(null); // Sürüklerken diğer açık menüleri kapat
                    }
                  }}
                  onClick={() => {
                    if (activity.requiresSubject) {
                      setActiveCategory(isSelected ? null : activity.type);
                    } else {
                      // YENİ: Mola vb. tıklanınca açık olan menüyü kapat
                      setActiveCategory(null); 
                    }
                  }}
                >
                  <span>
                    {activity.type === "test" && "📝 "}
                    {activity.type === "topic" && "📖 "}
                    {activity.type === "video" && "🎥 "}
                    {activity.type === "branch_exam" && "🎯 "}
                    {activity.type === "break" && "☕ "}
                    {activity.type === "general_exam" && "📝 "}
                    {activity.type === "book" && "📚 "}
                    {activity.label}
                  </span>

                  {activity.requiresSubject && (
                    <span className="arrow">
                      {isSelected ? "▲" : "▼"}
                    </span>
                  )}
                </div>

                {activity.requiresSubject && isSelected && (
                  <div className="inline-subjects-container">
                    {SUBJECTS.map((subject) => (
                      <div
                        key={subject}
                        className="subject-chip-item"
                        draggable
                        onDragStart={(e) => {
                          handleDragStart(e, activity.type, subject);
                          
                          // YENİ KOD: Tarayıcı elementi hafızaya aldıktan hemen sonra paneli kapatır. 
                          // Böylece sürüklerken alt taraftaki tabloyu görebilirsin!
                          setTimeout(() => {
                            setActiveCategory(null);
                          }, 0);
                        }}
                      >
                        {subject}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PROGRAM TABLOSU */}
      <div
        className="program-table-wrapper"
        ref={tableWrapperRef}
      >
        <table className="program-table">
          <thead>
            <tr>
              <th className="hour-col">
                Saat
              </th>

              {DAYS.map((day) => (
                <th key={day}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="hour-col">
                  {hour}
                </td>

                {DAYS.map((day) => {
                  const task = getTaskAt(
                    day,
                    hour
                  );

                  return (
                    <td
                      key={`${day}-${hour}`}
                      className="program-cell"
                      onDragOver={
                        handleDragOver
                      }
                      onDrop={(e) =>
                        handleDrop(
                          e,
                          day,
                          hour
                        )
                      }
                    >
                      {task && (
                        <div
                          className="placed-task"
                          draggable
                          onDragStart={(e) =>
                            handlePlacedDragStart(
                              e,
                              task
                            )
                          }
                        >
                          <div className="placed-task-content">
                            <span className="task-type-badge">
                              {getActivityLabel(
                                task.activity_type
                              )}
                            </span>

                            {task.subject && (
                              <span className="placed-task-subject">
                                {task.subject}
                              </span>
                            )}
                          </div>

                          <button
                            className="placed-task-delete"
                            onClick={() =>
                              handleDeleteTask(
                                task
                              )
                            }
                            title="Görevi sil"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Program;