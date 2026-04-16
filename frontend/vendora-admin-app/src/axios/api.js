import axios from 'axios'
import keycloak from '../keycloak/keycloak';
const API =axios.create({
    baseURL: "http://localhost:8888",
});
API.interceptors.request.use(async(config)=>{
    if(keycloak.token){
        config.headers.Authorization=`Bearer ${keycloak.token}`;
    }
    return config;
},(error)=>Promise.reject(error));
export default API;