let ws = null;
let accessToken = localStorage.getItem('accessToken');
let currentChatRoomId = null;

// WebSocket 초기화
function initializeWebSocket() {
    const socket = new SockJS(`https://localhost:443/ws?token=${accessToken}`);
    ws = Stomp.over(socket);

    ws.connect({}, function (frame) {
        console.log("WebSocket 연결 성공:", frame);
        if (currentChatRoomId) {
            ws.subscribe(`/topic/chatroom/${currentChatRoomId}`, function (message) {
                displayMessage(JSON.parse(message.body));
            });
        }
    }, function (error) {
        console.error("WebSocket 연결 실패:", error);
    });
}

// 메시지 전송
function sendMessage() {
    const messageContent = document.getElementById('inputMessage').value;
    const profileImageUrl = localStorage.getItem("profileImageUrl");
    const senderName = localStorage.getItem("userName");
    if (messageContent.trim() && ws && currentChatRoomId) {
        ws.send(`/app/send`, {}, JSON.stringify({
            chatRoomId: currentChatRoomId,
            content: messageContent,
            senderName: senderName,
            profileImageUrl: profileImageUrl
        }));
        document.getElementById('inputMessage').value = '';
    }
}

// 메시지 표시
// function displayMessage(message) {
//     const chatBox = document.getElementById('chatBox');
//     const messageElement = document.createElement('div');
//     messageElement.innerText = `${message.senderName}: ${message.content}`;
//     chatBox.appendChild(messageElement);
//     chatBox.scrollTop = chatBox.scrollHeight;
// }
function displayMessage(message) {
    const chatBox = document.getElementById('chatBox');

    // 프로필 이미지와 메시지 생성
    const messageElement = document.createElement('div');
    messageElement.style.display = 'flex'; // 이미지와 텍스트를 수평으로 정렬
    messageElement.style.alignItems = 'center'; // 정렬

    // 프로필 이미지
    const profileImage = document.createElement('img');
    profileImage.alt = `${message.senderName}'s profile`;
    profileImage.style.width = '40px'; // 이미지 크기 설정
    profileImage.style.height = '40px';
    profileImage.style.borderRadius = '50%'; // 원형으로 표시
    profileImage.style.marginRight = '10px';

    console.log(message.profileImageUrl)
    if (message.profileImageUrl) {
        profileImage.src = message.profileImageUrl;
    } else {
        profileImage.src = 'default-profile.jpg'; // 기본 이미지
    }
    // 메시지 텍스트
    const messageText = document.createElement('div');
    messageText.innerHTML = `<strong>${message.senderName}:</strong> ${message.content}`;

    // 이미지와 메시지를 하나의 요소로 추가
    messageElement.appendChild(profileImage);
    messageElement.appendChild(messageText);

    // 채팅 박스에 메시지 추가
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // 스크롤 자동 이동
}

<!-- 채팅방 생성  관련  -->

function showCreateRoomModal() {
    document.getElementById('createRoomModal').style.display = 'block';
}

// ✅ 모달 닫기
function hideCreateRoomModal() {
    document.getElementById('createRoomModal').style.display = 'none';
}
// 외부 클릭하면 모달 닫아지게 하기
window.onclick = function(event) {
    const modal = document.getElementById('createRoomModal');
    if (event.target === modal) {
        hideCreateRoomModal();
    }
}

// 채팅방 생성
function createChatRoom() {
    const roomName = document.getElementById('roomNameInput').value;
    const roomType = document.querySelector('input[name="roomType"]:checked').value;

    if (!roomName || !roomType) {
        alert('채팅방 이름과 유형을 입력해주세요.');
        return;
    }

    fetch(`https://localhost:443/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            query: `
                mutation {
                    createChatRoom(roomName: "${roomName}", roomType: "${roomType}") {
                        id
                        roomName
                        roomType
                    }
                }
            `
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

            const chatRoom = data.data.createChatRoom;
            alert(`"${chatRoom.roomName}" 채팅방이 ${chatRoom.roomType === 'PUBLIC' ? '공개' : '비공개'}로 생성되었습니다.`);

            hideCreateRoomModal(); // 모달 닫기
        })
        .catch(error => {
            console.error('채팅방 생성 실패:', error);
            alert('채팅방 생성 실패: ' + error.message);
        });
}

// 채팅방 선택
function selectRoom(roomName) {
    document.getElementById('roomName').textContent = roomName;
    document.getElementById('chatBox').innerHTML = "";  // 기존 메시지 초기화
}


// 친구 초대
function inviteUser() {
    const friendName = prompt("초대할 친구 이름을 입력하세요:");
    if (friendName) {
        alert(`${friendName}님이 채팅방에 초대되었습니다.`);
    }
}


// 채팅방 참여자 조회
function loadParticipants() {
    alert("참여자 목록 조회 기능은 준비 중입니다.");
}


window.onload = initializeWebSocket;
