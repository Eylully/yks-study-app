import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

// Sınav türüne göre dersleri, konuları ve tur sayılarını getir
export const getSubjectsByExamType = async (examType) => {
  const response = await axios.get(`${API_URL}/subjects/?exam_type=${examType}`);
  return response.data;
};

// Konunun kutucuğuna tıklandığında durumu güncelle ve tur kontrolü yap
export const toggleTopicStatus = async (topicId) => {
  const response = await axios.patch(`${API_URL}/topics/${topicId}/toggle`);
  return response.data;
};