import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const getAllTasks = async () => {
  const response = await axios.get(
    `${API_URL}/program-tasks/`
  );

  return response.data;
};

export const createTask = async ({
  activity_type,
  subject,
  day,
  start_time,
  duration = 60,
}) => {
  const response = await axios.post(
    `${API_URL}/program-tasks/`,
    {
      activity_type,
      subject: subject || null,
      day,
      start_time,
      duration,
    }
  );

  return response.data;
};

export const updateTask = async (
  taskId,
  updates
) => {
  const response = await axios.put(
    `${API_URL}/program-tasks/${taskId}`,
    updates
  );

  return response.data;
};

export const deleteTask = async (
  taskId
) => {
  const response = await axios.delete(
    `${API_URL}/program-tasks/${taskId}`
  );

  return response.data;
};