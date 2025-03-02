const connection = new signalR.HubConnectionBuilder()
    .withUrl("/callHub")
    .withAutomaticReconnect()  // Auto-reconnects on disconnect
    .build();

let userName = localStorage.getItem("userName") || "";

// Ensure user enters a name
document.addEventListener("DOMContentLoaded", () => {
    if (!userName) {
        document.getElementById("setNameButton").addEventListener("click", () => {
            userName = document.getElementById("nameInput").value.trim();
            if (!userName) return alert("Enter a valid name!");
            localStorage.setItem("userName", userName);
            startConnection();
        });
    } else {
        startConnection();
    }
});

async function startConnection() {
    try {
        await connection.start();
        console.log(`✅ Connected as ${userName}`);
        await connection.invoke("RegisterUser", userName);
    } catch (err) {
        console.error("❌ Connection failed, retrying in 5s...");
        setTimeout(startConnection, 5000);
    }
}

// Play Button Click & Notification Sounds
function playSound(type) {
    let sound = new Audio();
    let soundMap = {
        mute: "/sounds/mute.mp3",
        deafen: "/sounds/deafen.mp3",
        chat: "/sounds/message.mp3",
        ring: "/sounds/ringtone.mp3"
    };
    sound.src = soundMap[type] || "";
    sound.play().catch(err => console.error(`⚠️ Sound error: ${err}`));
}

// Send Chat Message
document.getElementById("sendButton").addEventListener("click", async () => {
    const message = document.getElementById("messageInput").value.trim();
    if (!message) return;

    try {
        await connection.invoke("SendMessage", userName, message);
        document.getElementById("messageInput").value = "";
        playSound("chat");
    } catch (err) {
        console.error("❌ Failed to send message:", err);
    }
});

// Receive Messages
connection.on("ReceiveMessage", (user, message) => {
    document.getElementById("chatBox").innerHTML += `<div><strong>${user}</strong>: ${message}</div>`;
    playSound("chat");
});

// WebRTC Setup
let peerConnection;
let localStream;

// Start Call
document.getElementById("startCallButton").addEventListener("click", async () => {
    const targetUser = prompt("Enter the name of the user you want to call:");
    if (!targetUser || targetUser === userName) return alert("Invalid user!");

    peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            connection.invoke("SendIceCandidate", targetUser, JSON.stringify(event.candidate)).catch(console.error);
        }
    };

    peerConnection.ontrack = (event) => {
        document.getElementById("remoteAudio").srcObject = event.streams[0];
    };

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    document.getElementById("localAudio").srcObject = localStream;

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    connection.invoke("SendOffer", targetUser, JSON.stringify(offer), userName);

    playSound("ring");
});

// Receive Incoming Call
connection.on("ReceiveOffer", async (offerJson, callerName) => {
    if (!confirm(`${callerName} is calling you. Accept?`)) return;

    peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            connection.invoke("SendIceCandidate", callerName, JSON.stringify(event.candidate)).catch(console.error);
        }
    };

    peerConnection.ontrack = (event) => {
        document.getElementById("remoteAudio").srcObject = event.streams[0];
    };

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    document.getElementById("localAudio").srcObject = localStream;

    const offer = JSON.parse(offerJson);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    connection.invoke("SendAnswer", callerName, JSON.stringify(answer));

    playSound("ring");
});

// Handle Answer & ICE Candidates
connection.on("ReceiveAnswer", async (answerJson) => {
    const answer = JSON.parse(answerJson);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

connection.on("ReceiveIceCandidate", async (candidateJson) => {
    const candidate = JSON.parse(candidateJson);
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// Mute/Unmute
document.getElementById("muteButton").addEventListener("click", () => {
    if (!localStream) return;
    let audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    playSound("mute");
    document.getElementById("muteButton").innerText = audioTrack.enabled ? "Mute" : "Unmute";
});

// Deafen/Undeafen
document.getElementById("deafenButton").addEventListener("click", () => {
    const remoteAudio = document.getElementById("remoteAudio");
    if (remoteAudio) {
        remoteAudio.muted = !remoteAudio.muted;
        playSound("deafen");
        document.getElementById("deafenButton").innerText = remoteAudio.muted ? "Undeafen" : "Deafen";
    }
});
