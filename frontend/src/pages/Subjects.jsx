import { useEffect, useState } from "react";
import { getSubjectsByExamType, toggleTopicStatus } from "../services/subjectService";
import axios from "axios";
import "./Subjects.css";

export default function Subjects() {
  const [examType, setExamType] = useState("TYT");
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [celebrationMessage, setCelebrationMessage] = useState(null);

  // YENİ: Konu arama çubuğu için state
  const [topicSearchTerm, setTopicSearchTerm] = useState("");

  const fetchSubjects = async (type) => {
    setLoading(true);
    try {
      const data = await getSubjectsByExamType(type);
      setSubjects(data);
      
      if (selectedSubject) {
        const updatedSelected = data.find(s => s.id === selectedSubject.id);
        if (updatedSelected) setSelectedSubject(updatedSelected);
      }
    } catch (error) {
      console.error("Dersler yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects(examType);
  }, [examType]);

  const handleTopicToggle = async (topicId) => {
    try {
      const result = await toggleTopicStatus(topicId);
      await fetchSubjects(examType);

      if (result.message) {
        setCelebrationMessage(result.message);
        setTimeout(() => {
          setCelebrationMessage(null);
        }, 4000);
      }
    } catch (error) {
      console.error("Konu durumu güncellenemedi:", error);
    }
  };

  const handleRoundChange = async (change) => {
    if (!selectedSubject) return;
    const newRounds = Math.max(0, selectedSubject.completed_rounds + change);
    
    try {
      await axios.patch(`http://127.0.0.1:8000/subjects/${selectedSubject.id}/rounds`, {
        completed_rounds: newRounds
      });
      setSelectedSubject(prev => ({ ...prev, completed_rounds: newRounds }));
      await fetchSubjects(examType);
    } catch (error) {
      console.error("Tur sayısı güncellenemedi:", error);
    }
  };

  const calculateProgress = (topics) => {
    if (!topics || topics.length === 0) return 0;
    const completedCount = topics.filter(t => t.is_completed).length;
    return Math.round((completedCount / topics.length) * 100);
  };

  // Seçilen dersin konularını arama terimine göre filtrele
  const filteredTopics = selectedSubject 
    ? selectedSubject.topics.filter(topic => 
        topic.name.toLowerCase().includes(topicSearchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="subjects-container">

      {celebrationMessage && (
        <div className="celebration-toast">
          {celebrationMessage}
        </div>
      )}

      <div className="exam-type-selector">
        <button 
          className={`exam-tab ${examType === "TYT" ? "active tyt" : ""}`}
          onClick={() => { setExamType("TYT"); setSelectedSubject(null); setTopicSearchTerm(""); }}
        >
          📘 TYT Dersleri
        </button>
        <button 
          className={`exam-tab ${examType === "AYT" ? "active ayt" : ""}`}
          onClick={() => { setExamType("AYT"); setSelectedSubject(null); setTopicSearchTerm(""); }}
        >
          📙 AYT Dersleri
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Dersler yükleniyor...</div>
      ) : !selectedSubject ? (
        <div className="subjects-grid">
          {subjects.map((sub) => {
            const progress = calculateProgress(sub.topics);
            return (
              <div key={sub.id} className="subject-card" onClick={() => { setSelectedSubject(sub); setTopicSearchTerm(""); }}>
                <div className="subject-card-header">
                  <h3>📘 {sub.name}</h3>
                  <span className="round-badge">🏆 {sub.completed_rounds} Tam Tur</span>
                </div>

                <div className="progress-section">
                  <div className="progress-info">
                    <span>İlerleme</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                <div className="card-footer">
                  <span>Konuları Gör & Düzenle →</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="topics-detail-view">
          <div className="topics-header">
            <button className="back-btn" onClick={() => { setSelectedSubject(null); setTopicSearchTerm(""); }}>
              ← Derslere Dön
            </button>
            <div className="topics-title-area">
              <div>
                <h2>{selectedSubject.name} Konuları</h2>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>
                  Yanlışlıkla işaretlediğin bir konuya tekrar tıklayarak işareti kaldırabilirsin.
                </p>
              </div>
              
              <div className="round-control-area" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="round-badge large">🏆 {selectedSubject.completed_rounds} Tam Tur</span>
                <div className="round-buttons" style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => handleRoundChange(-1)} title="Tur Sayısını Azalt" style={{ padding: "4px 10px", cursor: "pointer" }}>-</button>
                  <button onClick={() => handleRoundChange(1)} title="Tur Sayısını Artır" style={{ padding: "4px 10px", cursor: "pointer" }}>+</button>
                </div>
              </div>
            </div>

            {/* ARAMA ÇUBUĞU */}
            <div className="topic-search-box" style={{ marginTop: "15px" }}>
              <input 
                type="text"
                placeholder="🔍 Konularda ara"
                value={topicSearchTerm}
                onChange={(e) => setTopicSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#1f2937",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div className="topics-list-grid">
            {filteredTopics.length === 0 ? (
              <p style={{ color: "#6b7280", gridColumn: "1 / -1", textAlign: "center", padding: "20px" }}>
                Aradığın kritere uygun konu bulunamadı.
              </p>
            ) : (
              filteredTopics.map((topic) => (
                <label key={topic.id} className={`topic-checkbox-card ${topic.is_completed ? "checked" : ""}`}>
                  <input 
                    type="checkbox" 
                    checked={topic.is_completed}
                    onChange={() => handleTopicToggle(topic.id)}
                  />
                  <span className="custom-checkbox"></span>
                  <span className="topic-name">{topic.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}