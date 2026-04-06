import axios from "../api/axios"

export const getProviderProfile=()=> axios.get("provider/me");

export const updateProviderProfile=(id,data)=> axios.put(`provider/${id}`,data)

export const uploadProviderProfilePhoto=(id,file)=>{
    const formData=new FormData();
    formData.append("file",file);
    return axios.post(`/provider/${id}/photo`,formData,{
        headers:{
            "Content-Type":"multipart/form-data",
        },
    });
};