import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

// Dashboard'un bütün güncel verilerini getirir
export const getDashboardToday = async () => {
  const response = await axios.get(
    `${API_URL}/dashboard/today`
  );

  return response.data;
};

// Sabah / öğleden sonra / akşam sürelerini kaydeder
export const saveDailyTime = async ({
  morning_minutes,
  afternoon_minutes,
  evening_minutes,
}) => {
  const response = await axios.post(
    `${API_URL}/daily-time/`,
    {
      morning_minutes,
      afternoon_minutes,
      evening_minutes,
    }
  );

  return response.data;
};

export async function getMathHistory(days = 7) {
  const res = await axios.get(`${API_URL}/study/math-history`, { params: { days } });
  return res.data;
}

export const getDailyTimeHistory = async (days = 7) => {
  const response = await axios.get(
    `${API_URL}/daily-time/history?days=${days}`
  );

  return response.data;
};