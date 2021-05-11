require('dotenv').config();
const express=require('express');
const path=require('path');
const app=express();
const http=require('http');
const socketio=require('socket.io');
const mongoose=require('mongoose');
const db=process.env.DB_URL;

const moment=require('moment');

//*****************************************
const connect = mongoose
  .connect(db, { useFindAndModify: false,useUnifiedTopology:true,useNewUrlParser:true })
  .then(() => {
      console.log("Mondo db connected....")
      Users.deleteMany({},function(err,res){
        if(err){
            console.log("Error clearing Users collection in DB");
        }
        else{
            console.log("Cleared Users Collection")
        }
    });

    msgs.deleteMany({},function(err,res){
        if(err){
            console.log("Error clearing msgs collection in DB");
        }
        else{
            console.log("Cleared msgs Collection")
        }
    });
})
  .catch((err) => console.log(err));

  const UserSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    room:{
        type:String,
        required:true
    },
    id:{
        type:String,
        required:true
    }
});
const msgSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    time:{
        type:String,
        required:true
    },
    text:{
        type:String,
        required:true
    },
    room:{
        type:String,
        required:true
    }
});

const Users=mongoose.model('Users',UserSchema);
const msgs=mongoose.model('msgs',msgSchema);

//*****************************************

const server=http.createServer(app);
const io=socketio(server);

//static folder
app.use(express.static(path.join(__dirname,'public')));

const bot='Chat bot';

//Run when client connects
io.on('connection',socket => {
    socket.on('joinRoom',({username,room})=>{
        var User=new Users({
            username:username,
            room:room,
            id:socket.id
        });
        User.save(function(err,res){
            if(err){
                console.log("Error pushing data to DB");
            }
            else{
                console.log("New User added to the Room");

                socket.join(User.room);

                var botmsg1=new msgs({
                    username:bot,
                    time: moment().format('h:mm a'),
                    text:`Hai ${User.username}! `,
                    room:User.room
                });
                //welcome user 
                socket.emit('message',botmsg1);
                /*botmsg1.save(function(err,res){
                    if(err){
                        console.log(err);
                    }
                });*/

                var botmsg2=new msgs({
                    username:bot,
                    time: moment().format('h:mm a'),
                    text:`${User.username} joined the chat`,
                    room:User.room
                });
                //Broadcast 
                socket.broadcast.to(User.room).emit('message',botmsg2);
                botmsg2.save(function(err,res){
                    if(err){
                        console.log(err);
                    }
                });
                
                //console.log("New user connected...");

                Users.find({room:User.room},function(err,res){
                    if(err){
                        console.log("error in finding users of current room");
                    }
                    else{
                        console.log("returned users of this room");
                        //users and room info
                        //console.log(res,room);
                        io.to(User.room).emit('roomUsers',{
                            room:User.room,
                            users:res
                        });
                        
                    }
                });
            }
        });
});

socket.on('chatMessage',(message)=>{
    Users.find({id:socket.id},function(err,res){
        if(err){
            console.log("error in finding current user");
        }
        else{
            console.log("returned current user");
            const user=res[0];
            var msg=new msgs({
                username:user.username,
                time: moment().format('h:mm a'),
                text:message,
                room:user.room
            });
            io.to(user.room).emit('message',msg);
            msg.save(function(err,res){
                if(err){
                    console.log(err);
                }
            });
        }
    })
});

//client disconnect
socket.on('disconnect',()=>{
    Users.find({id:socket.id},function(err,res){
        if(err){
            console.log("error in finding current user");
        }
        else{
            console.log("returned current user");
            const user=res[0];

            var botmsg3=new msgs({
                username:bot,
                time: moment().format('h:mm a'),
                text:`${user.username} left the chat`,
                room:user.room
            });
            if(user){
                io.to(user.room).emit('message',botmsg3);
                botmsg3.save(function(err,res){
                    if(err){
                        console.log(err);
                    }
                })
            }

            Users.deleteOne({id:socket.id},function(err,res){
                if(err){
                    console.log("Error deleting user from DB");
                }
                else{
                    console.log("removed user");

                    Users.find({room:user.room},function(err,res){
                        if(err){
                            console.log("error in finding users of current room");
                        }
                        else{
                            console.log("returned users of this room");
                            //users and room info
                            //console.log(res,room);
                            io.to(user.room).emit('roomUsers',{
                                room:user.room,
                                users:res
                            });
                            
                        }
                    });
                    
                    
                    Users.find({room:user.room},function(err,res){
                        if(err){
                            console.log(err);
                        }
                        else{
                            console.log("cleaning msgs of this room....");
                            if(res.length===0){
                                msgs.deleteMany({room:user.room},function(err,res){
                                    if(err){
                                        console.log(err);
                                    }
                                    else{
                                        console.log("deleted msgs of this room")
                                    }
                                });
                               
                            }  
                        }
                    });     
                }
            });
        }
    });
    
});

socket.on('chatMsgsReq',(room)=>{
    console.log("Got request")
    msgs.find({room:room},function(err,res){
        if(err){
            console.log(err);
        }
        else{
            //console.log(res);
            socket.emit('chatMsgs',res);
        }
    });
});

});


const PORT=9989 || process.env.PORT || 80;
server.listen(PORT,'0.0.0.0',()=>{
    console.log(`Server Running At Port ${PORT}`);
});