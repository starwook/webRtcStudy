let socket = io.connect("http://localhost:4000");
let divVideoChatLobby = document.getElementById("video-chat-lobby");
let divVideoChat = document.getElementById("video-chat-room");
let joinButton = document.getElementById("join");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");
let roomInput = document.getElementById("roomName");
let roomName;
let creator = false;
let rtcPeerConnection;
let userStream;
let roomMake = document.getElementById("makeRoom");
let makeBtn = document.getElementById("makeBtn");
let roomList = document.getElementById("roomList");

let iceServers = {
    iceServers: [
        {
            urls: "stun:stun.services.mozilla.com"
        }, {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

joinButton.addEventListener("click", function () {
    if (roomInput.value == "") {
        alert("잘못된 입력입니다");
    }
    else {
        roomName = roomInput.value;
      socket.emit("join", roomName);
    }
});

makeBtn.addEventListener("click", function () {
    if (roomMake.value == "") {
        alert("방에 이름이 있어야합니다");
    } else {
        roomName = roomMake.value;

        socket.emit("create", roomName);
    }
})
socket.on("created", function (roomName) {
    creator = true; //방장을 뜻함
    navigator
        .mediaDevices //화장채팅을 위한 것
        .getUserMedia({
            audio: true,
            video: {
                width: 640,
                height: 360
            }
        })
        .then(function (stream) {

            userStream = stream;
            divVideoChatLobby.style = "display:none";
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function (e) {
                console.log("채널 송출중");
                userVideo.play();
            };
        })
        .catch(function (err) {

            alert("Couldn't Access User Media");
        });

});

socket.on("joined", function () {
    creator = false;
    navigator
        .mediaDevices
        .getUserMedia({
            audio: true,
            video: {
                width: 320,
                height: 180
            }
        })
        .then(function (stream) {

            userStream = stream;
            divVideoChatLobby.style = "display:none";
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function (e) {
                userVideo.play();
            };
            socket.emit("ready", roomName);
        })
        .catch(function (err) {
            /* handle the error */
            alert("Couldn't Access User Media");
        });
});



socket.on("full", function () {
    alert("방이 꽉 찼습니다");
});



socket.on("ready", function () {
    if (creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection
            .createOffer()
            .then((offer) => {
                rtcPeerConnection.setLocalDescription(offer);
                socket.emit("offer", offer, roomName);
            })
            .catch((error) => {
                console.log(error);
            });
    }
});



socket.on("candidate", function (candidate) {
    let icecandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(icecandidate);
});



socket.on("offer", function (offer) {
    if (!creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.setRemoteDescription(offer); //offer를 remoteDecsription에 등록함
        rtcPeerConnection
            .createAnswer()
            .then((answer) => { //
                rtcPeerConnection.setLocalDescription(answer); //본인의 로컬메시지에 등록
                socket.emit("answer", answer, roomName); //시그널링 서버로 전달
            })
            .catch((error) => {
                console.log(error);
            });
    }
});

socket.on("answer", function (answer) {
    rtcPeerConnection.setRemoteDescription(answer);
});

function OnIceCandidateFunction(event) {
    console.log("Candidate");
    if (event.candidate) {
        socket.emit("candidate", event.candidate, roomName);
    }
}

function OnTrackFunction(event) {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function (e) {
        peerVideo.play();
    };
}
