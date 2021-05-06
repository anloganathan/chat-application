const express=require('express');
const path=require('path');
const app=express();
const http=require('http');
const socketio=require('socket.io');
const formatMessage =require('./utils/messages');
const {userJoin, getCurrentUser,getRoomUsers,userLeave}=require('./utils/users')

const server=http.createServer(app);
const io=socketio(server);

//static folder
app.use(express.static(path.join(__dirname,'public')));

const bot='Chat bot';

//Run when client connects
io.on('connection',socket => {
    socket.on('joinRoom',({username,room})=>{
    const user=userJoin(socket.id,username,room);

    socket.join(user.room);

         //welcome user 
    socket.emit('message',formatMessage(bot,'Welcome to Chat App'));

    //Broadcast 
    socket.broadcast.to(user.room).emit('message',formatMessage(bot,`${user.username} joined the chat`));
    //console.log("New user connected...");

    //users and room info
    io.to(user.room).emit('roomUsers',{
        room:user.room,
        users:getRoomUsers(user.room)
    });
});

socket.on('chatMessage',(msg)=>{
    const user=getCurrentUser(socket.id);

    //console.log(msg);
    io.to(user.room).emit('message',formatMessage(`${user.username}`,msg));
});

//client disconnect
socket.on('disconnect',()=>{
    const user=userLeave(socket.id);

    if(user){
    io.to(user.room).emit('message',formatMessage(bot,`${user.username} left the chat`));
    }

    //users and room info
    io.to(user.room).emit('roomUsers',{
        room:user.room,
        users:getRoomUsers(user.room)
    });
});

});

const PORT=3000 || process.env.PORT;
server.listen(PORT,()=>{
    console.log(`Server Running At Port ${PORT}`);
});