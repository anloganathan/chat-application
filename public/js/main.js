const chatForm=document.getElementById('chat-form');
const chatMessages=document.querySelector('.chat-messages');
const roomName=document.getElementById('room-name');
const userList=document.getElementById('users');
//get user name from URL

const {username,room}=Qs.parse(location.search,{
    ignoreQueryPrefix:true
});
console.log({username,room});


const socket = io();

//join room
socket.emit('joinRoom',{username,room});

//get Room and users daTA
socket.on('roomUsers',({room,users})=>{
    outputRoomName(room);
    outputUsers(users);
});

//message from server
socket.on('message',message =>{
    console.log(message);
    outputMessage(message);

    chatMessages.scrollTop=chatMessages.scrollHeight;
});

socket.on('chatMsgs',msgs=>{
    console.log(msgs);
    msgs.forEach(function(msg){
    const div=document.createElement('div');
    div.classList.add('message');
    div.innerHTML=`<p class="meta">${msg.username} <span>${msg.time}</span></p>
    <p class="text">
       ${msg.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
    });
});

chatForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    //chat message container
    const msg=e.target.elements.msg.value;

    //emit msg to server
    socket.emit('chatMessage',msg);

    //clear input
    e.target.elements.msg.value='';
    e.target.elements.msg.focus();
});

function outputMessage(message){
    const div=document.createElement('div');
    div.classList.add('message');
    div.innerHTML=`<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
       ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}


//room name
function outputRoomName(room){
    roomName.innerText=room;
}

//current users in the room
function outputUsers(users){
    console.log(users);
    userList.innerHTML=
    `${users.map(user=>`<li>${user.username}</li>`).join('')}`;
}

window.addEventListener('load',(e)=>{
    //emit request to server
    console.log("requesting msgs...")
    socket.emit('chatMsgsReq',room);
});

