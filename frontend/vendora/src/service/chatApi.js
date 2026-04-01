import axios from axios;

const API=axios.create({
    baseURL:"http://localhost:8080",
});
export const getMessage=(userId,providerId)=>API.get(`/messages/${userId}/${providerId}`);