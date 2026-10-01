import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

// Tüm denemeleri getir
export const getAllExams = async () => {
  const response = await axios.get(`${API_URL}/exams/`);
  return response.data;
};

// Yeni deneme oluştur
export const createExam = async (examData) => {
  const response = await axios.post(`${API_URL}/exams/`, examData);
  return response.data;
};

// Belirli bir denemenin sonuçlarını getir
export const getExamResults = async (examId) => {
  const response = await axios.get(`${API_URL}/exams/${examId}/results`);
  return response.data;
};

// Bir denemeye ders sonucu ekle (Netler backend'de otomatik hesaplanıyor)
export const createExamResult = async (examId, resultData) => {
  const response = await axios.post(`${API_URL}/exams/${examId}/results`, resultData);
  return response.data;
};

// Denemeyi sil
export const deleteExam = async (examId) => {
  const response = await axios.delete(`${API_URL}/exams/${examId}`);
  return response.data;
};