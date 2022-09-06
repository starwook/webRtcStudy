const express = require("express");
const socket = require("socket.io");
const app = express();



let server = app.listen(4000, function () {
  console.log("Server is running");
});

app.use(express.static("public"));



let io = socket(server);


io.on("connection", function (socket) { //여기서 socket으로 보내는 방법?에 대해서 현식님과 토론
  console.log("User Connected :" + socket.id);

  socket.on("join", function (roomName) {
    let rooms = io.sockets.adapter.rooms;
    let room = rooms.get(roomName);
    if (room == undefined) {
      console.log("없는 톡방입니다");
    }
    else if (room.size <= 3) { //여기서 최대인원수
      socket.join(roomName);
      socket.emit("joined");
      console.log("방 입장")
      console.log(rooms);
      console.log("roomName =");
      console.log(roomName);
    } else {
      socket.emit("full");
    }

  });
  socket.on("create",function(roomName){
    let rooms = io.sockets.adapter.rooms;
    let room = rooms.get(roomName);
    if(room !=undefined){
      console.log("이미 있는 화상채팅방입니다");
    }
    else{
      socket.join(roomName);
      socket.emit("created");
      console.log("방 생성");
      console.log(rooms);
      console.log("roomName =");
      console.log(roomName);
    }
  });
  socket.on("ready", function (roomName) {
    socket.broadcast.to(roomName).emit("ready");
  });

  socket.on("candidate", function (candidate, roomName) {
    console.log(candidate);
    socket.broadcast.to(roomName).emit("candidate", candidate);
  });

  socket.on("offer", function (offer, roomName) {
    socket.broadcast.to(roomName).emit("offer", offer);
  });

  socket.on("answer", function (answer, roomName) {
    socket.broadcast.to(roomName).emit("answer", answer);
  });
});
