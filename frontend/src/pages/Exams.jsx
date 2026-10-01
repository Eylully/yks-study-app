import { useEffect, useState } from "react";
import { getAllExams, createExam, getExamResults, createExamResult, deleteExam } from "../services/examService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./Exams.css";

const TYT_SUBJECTS = ["Türkçe", "Sosyal Bilgiler", "Temel Matematik", "Fen Bilimleri"];
const AYT_SUBJECTS = ["Matematik (AYT)", "Edebiyat", "Tarih-1", "Coğrafya-1"];

const ALL_SUBJECTS_LIST = [
  "Türkçe", "Sosyal Bilgiler", "Temel Matematik", "Fen Bilimleri",
  "Matematik (AYT)", "Edebiyat", "Tarih-1", "Coğrafya-1"
];

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  
  const [examChartData, setExamChartData] = useState([]);
  const [allExamResults, setAllExamResults] = useState([]);
  const [selectedSubjectForChart, setSelectedSubjectForChart] = useState("Türkçe");

  // Ders bazlı grafik için açılır-kapanır state (Varsayılan açık: true)
  const [isSubjectChartOpen, setIsSubjectChartOpen] = useState(true);

  const [notification, setNotification] = useState(null);
  const [examToDelete, setExamToDelete] = useState(null);

  const [formData, setFormData] = useState({
    exam_type: "TYT",
    name: "",
    date: "",
    note: "",
  });

  const [subjectResults, setSubjectResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedExam, setSelectedExam] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const showToast = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await getAllExams();
      setExams(data);

      let allResultsAccumulator = [];

      const chartDataPromises = data.map(async (exam) => {
        try {
          const results = await getExamResults(exam.id);
          const totalNet = results.reduce((sum, r) => sum + r.net, 0);

          results.forEach(res => {
            allResultsAccumulator.push({
              examId: exam.id,
              examName: exam.name,
              date: exam.date,
              subject: res.subject,
              net: res.net
            });
          });

          return {
            name: exam.name,
            date: exam.date,
            type: exam.exam_type,
            net: parseFloat(totalNet.toFixed(2))
          };
        } catch {
          return { name: exam.name, date: exam.date, type: exam.exam_type, net: 0 };
        }
      });

      const resolvedChartData = await Promise.all(chartDataPromises);
      resolvedChartData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setExamChartData(resolvedChartData);
      setAllExamResults(allResultsAccumulator);

    } catch (error) {
      console.error("Denemeler alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleTypeChange = (type) => {
    setFormData(prev => ({ ...prev, exam_type: type }));
    const subjects = type === "TYT" ? TYT_SUBJECTS : AYT_SUBJECTS;
    const initialResults = {};
    subjects.forEach(sub => {
      initialResults[sub] = { correct: "", wrong: "", blank: "" };
    });
    setSubjectResults(initialResults);
  };

  const toggleForm = () => {
    if (showForm) {
      setEditingExamId(null);
      setFormData({ exam_type: "TYT", name: "", date: "", note: "" });
    } else {
      const initialResults = {};
      TYT_SUBJECTS.forEach(sub => {
        initialResults[sub] = { correct: "", wrong: "", blank: "" };
      });
      setSubjectResults(initialResults);
    }
    setShowForm(!showForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectResultChange = (subject, field, value) => {
    setSubjectResults(prev => ({
      ...prev,
      [subject]: { ...prev[subject], [field]: value }
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.date) {
      showToast("⚠️ Lütfen deneme adını ve tarihini gir.");
      return;
    }

    setSaving(true);
    try {
      if (editingExamId) {
        await deleteExam(editingExamId);
      }

      const newExam = await createExam(formData);
      const activeSubjects = formData.exam_type === "TYT" ? TYT_SUBJECTS : AYT_SUBJECTS;
      
      for (const sub of activeSubjects) {
        const resData = subjectResults[sub];
        if (resData && (resData.correct !== "" || resData.wrong !== "" || resData.blank !== "")) {
          await createExamResult(newExam.id, {
            subject: sub,
            correct: parseInt(resData.correct) || 0,
            wrong: parseInt(resData.wrong) || 0,
            blank: parseInt(resData.blank) || 0
          });
        }
      }

      setFormData({ exam_type: "TYT", name: "", date: "", note: "" });
      setEditingExamId(null);
      setShowForm(false);
      await fetchExams();
      
      showToast(editingExamId ? "✏️ Deneme başarıyla güncellendi!" : "🎉 Yeni deneme başarıyla kaydedildi!");
    } catch (error) {
      console.error("İşlem başarısız:", error);
      showToast("❌ İşlem sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteExam = async () => {
    if (!examToDelete) return;
    try {
      await deleteExam(examToDelete.id);
      setExamToDelete(null);
      await fetchExams();
      showToast("🗑️ Deneme başarıyla silindi.");
    } catch (error) {
      console.error("Deneme silinemedi:", error);
      showToast("❌ Silme işlemi sırasında hata oluştu.");
      setExamToDelete(null);
    }
  };

  const handleEditExam = async (exam) => {
    setEditingExamId(exam.id);
    setFormData({
      exam_type: exam.exam_type,
      name: exam.name,
      date: exam.date ? exam.date.split("T")[0] : "",
      note: exam.note || "",
    });

    const activeSubjects = exam.exam_type === "TYT" ? TYT_SUBJECTS : AYT_SUBJECTS;
    const loadedResults = {};
    activeSubjects.forEach(sub => {
      loadedResults[sub] = { correct: "", wrong: "", blank: "" };
    });

    try {
      const results = await getExamResults(exam.id);
      results.forEach(res => {
        if (loadedResults[res.subject] !== undefined) {
          loadedResults[res.subject] = {
            correct: res.correct,
            wrong: res.wrong,
            blank: res.blank
          };
        }
      });
    } catch (err) {
      console.error("Sonuçlar yüklenemedi:", err);
    }

    setSubjectResults(loadedResults);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openExamDetails = async (exam) => {
    setSelectedExam(exam);
    setLoadingResults(true);
    try {
      const results = await getExamResults(exam.id);
      setExamResults(results);
    } catch (error) {
      console.error("Sonuçlar alınamadı:", error);
    } finally {
      setLoadingResults(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR");
  };

  const modalTotalNet = examResults.reduce((sum, item) => sum + item.net, 0).toFixed(2);
  const currentSubjects = formData.exam_type === "TYT" ? TYT_SUBJECTS : AYT_SUBJECTS;

  const tytChartData = examChartData.filter(d => d.type === "TYT");
  const aytChartData = examChartData.filter(d => d.type === "AYT");

  const subjectChartData = allExamResults
    .filter(item => item.subject === selectedSubjectForChart)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(item => ({
      name: item.examName,
      net: parseFloat(item.net.toFixed(2))
    }));

  return (
    <div className="exams-container">

      {/* ŞIK BİLDİRİM (TOAST) */}
      {notification && (
        <div className="custom-toast-notification">
          {notification}
        </div>
      )}

      {/* BAŞLIK */}
      <div className="exams-header">
        <div>
          <h1>📊 Deneme ve Analiz</h1>
          <p>Çözdüğün TYT ve AYT denemelerini takip et, netlerini grafiklerle analiz et.</p>
        </div>
        <button className="new-exam-button" onClick={toggleForm}>
          {showForm ? "✕ Formu Kapat" : "+ Yeni Deneme"}
        </button>
      </div>

      {/* YENİ DENEME / DÜZENLEME FORMU */}
      {showForm && (
        <div className="exam-form-card">
          <div className="form-title">
            <h2>{editingExamId ? "Denemeyi Düzenle" : "Yeni Deneme ve Sonuçları Ekle"}</h2>
            <p>Deneme bilgilerini gir ve derslere ait Doğru, Yanlış, Boş sayılarını yaz.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Deneme Türü</label>
              <div className="exam-type-buttons">
                <button
                  type="button"
                  className={formData.exam_type === "TYT" ? "type-button active" : "type-button"}
                  onClick={() => handleTypeChange("TYT")}
                >
                  TYT
                </button>
                <button
                  type="button"
                  className={formData.exam_type === "AYT" ? "type-button active" : "type-button"}
                  onClick={() => handleTypeChange("AYT")}
                >
                  AYT
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="exam-name">Deneme Adı</label>
              <input
                id="exam-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Örn. 3D TYT Deneme 1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="exam-date">Deneme Tarihi</label>
              <input
                id="exam-date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Ders Netleri Girişi</label>
              <div className="subjects-input-grid">
                {currentSubjects.map((sub) => {
                  const d = parseFloat(subjectResults[sub]?.correct) || 0;
                  const y = parseFloat(subjectResults[sub]?.wrong) || 0;
                  const calculatedNet = (d - (y / 4)).toFixed(2);

                  return (
                    <div key={sub} className="subject-input-row">
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span className="sub-name">{sub}</span>
                        <span style={{ fontSize: "11px", color: "#059669", fontWeight: 600 }}>
                          Net: {calculatedNet}
                        </span>
                      </div>
                      <div className="inputs-group">
                        <input
                          type="number"
                          placeholder="D"
                          min="0"
                          value={subjectResults[sub]?.correct ?? ""}
                          onChange={(e) => handleSubjectResultChange(sub, "correct", e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Y"
                          min="0"
                          value={subjectResults[sub]?.wrong ?? ""}
                          onChange={(e) => handleSubjectResultChange(sub, "wrong", e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="B"
                          min="0"
                          value={subjectResults[sub]?.blank ?? ""}
                          onChange={(e) => handleSubjectResultChange(sub, "blank", e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="exam-note">Not <span>(İsteğe bağlı)</span></label>
              <textarea
                id="exam-note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="Denemeyle ilgili kısa bir not..."
                rows="2"
              />
            </div>

            <button type="submit" className="save-exam-button" disabled={saving}>
              {saving ? "Kaydediliyor..." : (editingExamId ? "Değişiklikleri Güncelle" : "Denemeyi ve Sonuçları Kaydet")}
            </button>
          </form>
        </div>
      )}

      {/* GRAFİKLER BÖLÜMÜ (YAN YANA DENGELİ) */}
      <div className="analytics-section">
        <div className="chart-card">
          <h3>📈 TYT Net Gelişimi</h3>
          {tytChartData.length === 0 ? (
            <p className="no-chart-data">Henüz TYT deneme verisi bulunmuyor.</p>
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={tytChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="net" name="TYT Net" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="chart-card">
          <h3>📈 AYT Net Gelişimi</h3>
          {aytChartData.length === 0 ? (
            <p className="no-chart-data">Henüz AYT deneme verisi bulunmuyor.</p>
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={aytChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="net" name="AYT Net" stroke="#7c3aed" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* DERS BAZLI NET GELİŞİM ANALİZİ (AÇILIR - KAPANIR) */}
      <div className="subject-analysis-card">

        <div className="subject-analysis-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", justifyContent: "space-between" }}>
            <div className="subject-analysis-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="subject-analysis-icon">🎯</span>
              <div>
                <h3>Ders Bazlı Net Gelişimi</h3>
                <p>Seçtiğin dersin denemeler arasındaki ilerlemesini takip et.</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <select
                className="subject-select-dropdown"
                value={selectedSubjectForChart}
                onChange={(e) => setSelectedSubjectForChart(e.target.value)}
              >
                {ALL_SUBJECTS_LIST.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>

              {/* AÇ / KAPA BUTONU */}
              <button 
                onClick={() => setIsSubjectChartOpen(!isSubjectChartOpen)}
                style={{
                  background: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                  color: "#374151",
                  transition: "all 0.2s"
                }}
              >
                {isSubjectChartOpen ? "▲ Gizle" : "▼ Göster"}
              </button>
            </div>
          </div>
        </div>

        {/* EĞER AÇIKSA İÇERİĞİ GÖSTER */}
        {isSubjectChartOpen && (
          <>
            {subjectChartData.length === 0 ? (
              <div className="subject-empty-state">
                <div className="subject-empty-icon">📈</div>
                <h4>Henüz veri bulunmuyor</h4>
                <p>
                  Bu ders için deneme sonucu eklediğinde gelişimini burada
                  grafik üzerinden görebileceksin.
                </p>
              </div>
            ) : (
              <>
                {/* ÖZET BİLGİLER */}
                <div className="subject-stats">

                  <div className="subject-stat-card">
                    <span>Son Net</span>
                    <strong>
                      {subjectChartData[subjectChartData.length - 1].net.toFixed(2)}
                    </strong>
                  </div>

                  <div className="subject-stat-card">
                    <span>Önceki Net</span>
                    <strong>
                      {subjectChartData.length > 1
                        ? subjectChartData[subjectChartData.length - 2].net.toFixed(2)
                        : "-"}
                    </strong>
                  </div>

                  <div className="subject-stat-card">
                    <span>Değişim</span>

                    {subjectChartData.length > 1 ? (
                      (() => {
                        const last =
                          subjectChartData[subjectChartData.length - 1].net;

                        const previous =
                          subjectChartData[subjectChartData.length - 2].net;

                        const difference = last - previous;

                        return (
                          <strong
                            className={
                              difference > 0
                                ? "positive-change"
                                : difference < 0
                                ? "negative-change"
                                : "neutral-change"
                            }
                          >
                            {difference > 0 ? "↑ " : difference < 0 ? "↓ " : ""}
                            {difference > 0 ? "+" : ""}
                            {difference.toFixed(2)}
                          </strong>
                        );
                      })()
                    ) : (
                      <strong>-</strong>
                    )}
                  </div>

                  <div className="subject-stat-card">
                    <span>Deneme Sayısı</span>
                    <strong>{subjectChartData.length}</strong>
                  </div>

                </div>

                {/* GRAFİK */}
                <div className="subject-chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={subjectChartData}
                      margin={{
                        top: 15,
                        right: 20,
                        left: 0,
                        bottom: 10
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#eef2f7"
                      />

                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
                        }}
                        formatter={(value) => [
                          `${Number(value).toFixed(2)} Net`,
                          selectedSubjectForChart
                        ]}
                      />

                      <Line
                        type="monotone"
                        dataKey="net"
                        name={`${selectedSubjectForChart} Neti`}
                        stroke="#059669"
                        strokeWidth={3}
                        dot={{
                          r: 5,
                          strokeWidth: 2,
                          fill: "#ffffff"
                        }}
                        activeDot={{
                          r: 7
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </>
        )}

      </div>

      {/* DENEME LİSTESİ */}
      <div className="exam-list-section">
        <div className="section-title">
          <h2>Son Denemeler</h2>
          <span>{exams.length} deneme</span>
        </div>

        {loading ? (
          <div className="empty-state">Denemeler yükleniyor...</div>
        ) : exams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>Henüz deneme eklenmemiş</h3>
            <p>İlk denemeni ekleyerek sonuçlarını takip etmeye başlayabilirsin.</p>
          </div>
        ) : (
          <div className="exam-list">
            {exams.map((exam) => (
              <div className="exam-card" key={exam.id}>
                <div className="exam-card-left">
                  <div className={exam.exam_type === "TYT" ? "exam-type-badge tyt" : "exam-type-badge ayt"}>
                    {exam.exam_type}
                  </div>
                  <div className="exam-info">
                    <h3>{exam.name}</h3>
                    <span>📅 {formatDate(exam.date)}</span>
                    {exam.note && <p>{exam.note}</p>}
                  </div>
                </div>

                <div className="exam-card-right-buttons">
                  <button className="detail-btn" onClick={() => openExamDetails(exam)}>
                    🔍 İncele
                  </button>
                  <button className="edit-btn" onClick={() => handleEditExam(exam)}>
                    ✏️ Düzenle
                  </button>
                  <button className="delete-btn" onClick={() => setExamToDelete(exam)}>
                    🗑️ Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SİLME ONAY MODALI */}
      {examToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "400px", padding: "24px" }}>
            <h3 style={{ margin: "0 0 10px", color: "#1f2937" }}>Denemeyi Sil</h3>
            <p style={{ color: "#4b5563", fontSize: "14px", marginBottom: "20px" }}>
              <strong>"{examToDelete.name}"</strong> adlı denemeyi ve tüm sonuçlarını silmek istediğine emin misin? Bu işlem geri alınamaz.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="detail-btn" onClick={() => setExamToDelete(null)}>
                Vazgeç
              </button>
              <button className="delete-btn" style={{ background: "#dc2626", color: "white" }} onClick={confirmDeleteExam}>
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* İNCELE MODALI */}
      {selectedExam && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <span className={`exam-type-badge ${selectedExam.exam_type.toLowerCase()}`}>
                  {selectedExam.exam_type}
                </span>
                <h2>{selectedExam.name}</h2>
                <span className="modal-date">📅 {formatDate(selectedExam.date)}</span>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedExam(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="net-summary-card">
                <span>Toplam Net</span>
                <h2>{modalTotalNet}</h2>
              </div>

              <div className="results-table-container">
                <h3>Ders Analizleri</h3>
                {loadingResults ? (
                  <p>Sonuçlar yükleniyor...</p>
                ) : examResults.length === 0 ? (
                  <p className="no-results-text">Bu deneme için kaydedilmiş ders sonucu bulunmuyor.</p>
                ) : (
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Ders</th>
                        <th>D</th>
                        <th>Y</th>
                        <th>B</th>
                        <th>Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examResults.map((res) => (
                        <tr key={res.id}>
                          <td><strong>{res.subject}</strong></td>
                          <td style={{ color: "#16a34a" }}>{res.correct}</td>
                          <td style={{ color: "#dc2626" }}>{res.wrong}</td>
                          <td style={{ color: "#6b7280" }}>{res.blank}</td>
                          <td><strong>{res.net.toFixed(2)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}