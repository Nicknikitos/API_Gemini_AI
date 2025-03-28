const websocket = new WebSocket("ws://127.0.0.1:8000/chat");
const chatBox = document.getElementById("chat");
const imageInput = document.getElementById("imageInput");
const messageInput = document.getElementById("messageInput");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const capturedImage = document.getElementById("capturedImage");

let cameraStream = null;

websocket.onopen = () => {
    console.log("WebSocket connected");
};

websocket.onmessage = (event) => {
    const message = event.data;
    console.log("Received message from server: ", message);
    displayMessage(message);
};

websocket.onerror = (error) => {
    console.log(`WebSocket Error: ${error}`);
};

websocket.onclose = () => {
    console.log("WebSocket closed");
};

function sendMessage() {
    const message = messageInput.value.trim();
    const fileInput = imageInput.files[0];
    const capturedImageSrc = capturedImage.src;

    const messageData = {};

    if (message !== "") {
        messageData.message = message;
    }

    if (fileInput) {
        const reader = new FileReader();
        reader.onload = () => {
            messageData.image = reader.result;
            console.log("Sending an image..");
            console.log(messageData);
            sendWebSocketMessage(messageData);
        };
        reader.readAsDataURL(fileInput);
    } else if (capturedImageSrc) {
        messageData.image = capturedImageSrc; // Using the camera image
        console.log("Sending an image from a camera...");
        console.log(messageData);
        sendWebSocketMessage(messageData);
    } else {
        console.log("Send text only...");
        console.log(messageData);
        sendWebSocketMessage(messageData);
    }

    // Clearing the fields after sending
    messageInput.value = "";
    imageInput.value = "";
    capturedImage.src = "";
}


function sendWebSocketMessage(data) {
    console.log("Sending data via WebSocket...");
    websocket.send(JSON.stringify(data));
}

// Function for displaying messages with a "stamp" effect
function displayMessage(message) {
    const newMessage = document.createElement("div");
    chatBox.appendChild(newMessage);

    let index = 0;
    const typingEffect = setInterval(() => {
        newMessage.textContent += message[index];
        index++;
        if (index === message.length) {
            clearInterval(typingEffect);
        }
    }, 20);
}

// Camera
function openCamera() {
    if (cameraStream) {
        return;  // If the camera is already active, do not open it again
    }

    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream;
            cameraStream = stream;
            video.style.display = 'block';
        })
        .catch((err) => {
            console.error("Camera access error: ", err);
        });
}

// Take a photo
function captureImage() {
    if (!cameraStream) return;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageUrl = canvas.toDataURL('image/png');
    capturedImage.src = imageUrl;
    capturedImage.style.display = 'block';

    const byteString = atob(imageUrl.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
        uintArray[i] = byteString.charCodeAt(i);
    }

    const imageBlob = new Blob([uintArray], { type: 'image/png' });
    const file = new File([imageBlob], "captured_image.png", { type: 'image/png' });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    imageInput.files = dataTransfer.files;

    stopCamera();
}

function stopCamera() {
    if (cameraStream) {
        const tracks = cameraStream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
        cameraStream = null;
        video.style.display = 'none';
    }
}

// Cancel shooting
function cancelCapture() {
    stopCamera();
    capturedImage.style.display = 'none';
    capturedImage.src = '';
    video.style.display = 'none';
}

// Enter key handler for sending a message
messageInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});