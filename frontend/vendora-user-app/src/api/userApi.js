import api from "./axios";

export const getCurrentUser = () => api.get("/user/me");

export const updateUser = (id, data) =>
  api.patch(`/user/${id}`, data);

export const uploadProfileImage = (id, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(`/user/${id}/photo`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};