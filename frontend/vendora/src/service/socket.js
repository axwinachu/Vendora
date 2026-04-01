import socketJS from "socketjs-client"
import {Stomp} from "stompjs"

let stompClient =null;

export const connectSocket=(userId,onMessageRecived)=>{
    const socket=new socketJS("http://localhost:8080/ws");

    stompClient =Stomp.over(socket);

    stompClient.connect({},()=>{
        console.log("connected:",userId);
        stompClient.subscribe(`/user/$userId/queue/message`,(msg)=>{
            const data=JSON.parse(msg.body);
            onMessageRecived(data)
        });
    });
};
export const sendMessage=(msg)=>{
    if(stompClient){
        stompClient.send("/app/chat.send",{},JSON.stringify(msg));
    }
};