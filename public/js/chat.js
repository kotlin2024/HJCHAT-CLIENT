let ws = null;
let accessToken = localStorage.getItem('accessToken');
let currentChatRoomId = null;
let pingInterval = null;

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

        startPing()

    }, function (error) {
        console.error("WebSocket 연결 실패:", error);
    });

    socket.onclose = function (event) {
        console.warn(`WebSocket 연결 종료. 코드: ${event.code}, 이유: ${event.reason}`);

        // ✅ Ping Interval 정리
        clearInterval(pingInterval);
        pingInterval = null;

        // ✅ 토큰 만료(4001) 시 Access Token 재발급 시도
        if (event.code === 4001) {
            reissueAccessToken().then(() => {
                console.log("🔑 토큰 재발급 성공, 웹소켓 재연결 시도");
                initializeWebSocket();  // 🔄 웹소켓 재연결
            }).catch(() => {
                alert("세션이 만료되었습니다. 다시 로그인 해주세요.");
                window.location.href = "./sign-in.html";  // ❌ 실패 시 로그인 페이지로 이동
            });
        } else {
            console.error("예상치 못한 웹소켓 종료입니다.");
        }
    };

    // ❗ 에러 발생 시 단순 로그 출력
    socket.onerror = function (error) {
        console.error("WebSocket 오류 발생:", error);
    };

}

// ✅ AccessToken 재발급
async function reissueAccessToken() {
    const response = await fetch('https://localhost:443/api/oauth/reissue', {
        method: 'POST',
        credentials: 'include',  // ✅ HttpOnly 쿠키 전송
    });

    if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);
        accessToken = newAccessToken
        console.log("🔑 AccessToken 갱신 성공");
    } else {
        throw new Error("AccessToken 갱신 실패");
    }
}



// 메시지 전송
function sendMessage() {
    const messageContent = document.getElementById('inputMessage').value;
    const profileImageUrl = localStorage.getItem("profileImageUrl");
    const senderName = localStorage.getItem("userName");
    const senderId = localStorage.getItem("userId")
    console.log(`senderId = ${senderId}`)
    if (messageContent.trim() && ws && currentChatRoomId) {
        ws.send(`/app/send`, {}, JSON.stringify({
            chatRoomId: currentChatRoomId,
            content: messageContent,
            senderName: senderName,
            senderId: senderId,
            profileImageUrl: profileImageUrl
        }));
        document.getElementById('inputMessage').value = '';
    }
}

// ✅ 메시지 화면에 출력
function displayMessage(message) {
    const chatBox = document.getElementById('chatBox');
    const currentUserId = localStorage.getItem("userId")

    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    // ✅ 내가 보낸 메시지인지 확인
    const isMyMessage = String(message.senderId) === String(currentUserId);  // currentUserId는 로그인한 사용자 ID
    console.log(`senderId: ${message.senderId}  , currentUserId: ${currentUserId}`)
    console.log(`${isMyMessage}`)
    if (isMyMessage) {
        messageElement.classList.add('my-message');  // 오른쪽 정렬
    } else {
        messageElement.classList.add('other-message');  // 왼쪽 정렬
    }

    // ✅ 프로필 이미지
    const profileImage = document.createElement('img');
    profileImage.src = message.profileImageUrl || 'default-profile.jpg';
    profileImage.alt = `${message.senderName}의 프로필`;
    profileImage.style.width = '40px';
    profileImage.style.height = '40px';
    profileImage.style.borderRadius = '50%';

    // ✅ 메시지 내용
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.innerHTML = `<strong>${message.senderName}</strong><br>${message.content}`;

    // ✅ 본인 메시지는 오른쪽, 다른 사람 메시지는 왼쪽 정렬
    if (isMyMessage) {
        messageElement.appendChild(messageContent);
        messageElement.appendChild(profileImage);  // 프로필 이미지 오른쪽
    } else {
        messageElement.appendChild(profileImage);  // 프로필 이미지 왼쪽
        messageElement.appendChild(messageContent);
    }

    // ✅ 채팅 박스에 추가
    chatBox.appendChild(messageElement);

    // ✅ 스크롤 자동 이동
    chatBox.scrollTop = chatBox.scrollHeight;
}

<!-- 채팅방  관련  -->

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
        credentials: 'include',
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
        .then(response => {
            // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
            const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
            if (newAccessToken) {
                localStorage.setItem('accessToken', newAccessToken);
                console.log("🔑 AccessToken이 갱신되었습니다.");
            }
            return response.json()
        })
        .then(data => {
            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

            const chatRoom = data.data.createChatRoom;
            alert(`"${chatRoom.roomName}" 채팅방이 ${chatRoom.roomType === 'PUBLIC' ? '공개' : '비공개'}로 생성되었습니다.`);

            hideCreateRoomModal(); // 모달 닫기
            // ✅ 생성 후 채팅방 목록 새로고침
            if (chatRoom.roomType === 'PUBLIC') {
                loadPublicRooms();
            } else {
                loadPrivateRooms();
            }
        })
        .catch(error => {
            console.error('채팅방 생성 실패:', error);
            alert('채팅방 생성 실패: ' + error.message);
        });
}


//채팅방 목록 조회
const roomItems = document.getElementById('roomItems');   // 채팅방 목록 요소

// Public 채팅방 불러오기
function loadPublicRooms() {
    fetch('https://localhost:443/graphql', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            query: `
                query {
                    getChatRooms {
                        id
                        roomName
                        roomType
                    }
                }
            `
        })
    })
        .then(response => {
            // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
            const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
            if (newAccessToken) {
                localStorage.setItem('accessToken', newAccessToken);
                console.log("🔑 AccessToken이 갱신되었습니다.");
            }
            return response.json()
        })
        .then(data => {
            const rooms = data.data.getChatRooms.filter(room => room.roomType === 'PUBLIC');
            displayRooms(rooms);


        })
        .catch(error => {
            console.error('Public 채팅방 목록 로드 실패:', error);
            alert('Public 채팅방 목록 로드 실패: ' + error.message);
        });
}

// Private 채팅방 불러오기
function loadPrivateRooms() {
    fetch('https://localhost:443/graphql', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            query: `
                query {
                    getAccessPrivateChatRoom {
                        id
                        roomName
                        roomType
                    }
                }
            `
        })
    })
        .then(response => {
            // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
            const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
            if (newAccessToken) {
                localStorage.setItem('accessToken', newAccessToken);
                console.log("🔑 AccessToken이 갱신되었습니다.");
            }
            return response.json()
        })
        .then(data => {
            const rooms = data.data.getAccessPrivateChatRoom;
            displayRooms(rooms);
        })
        .catch(error => {
            console.error('Private 채팅방 목록 로드 실패:', error);
            alert('Private 채팅방 목록 로드 실패: ' + error.message);
        });
}

// 채팅방 목록 렌더링
function displayRooms(rooms) {
    roomItems.innerHTML = '';  // 기존 목록 초기화

    if (rooms.length === 0) {
        roomItems.innerHTML = '<li>이용가능한 채팅방이 없습니다.</li>';
        return;
    }

    rooms.forEach(room => {
        const roomElement = document.createElement('li');
        roomElement.innerHTML = `
            <button onclick="joinChatRoom(${room.id}, '${room.roomName}')">
                ${room.roomName} (${room.roomType})
            </button>
        `;
        roomItems.appendChild(roomElement);
    });
}

// ✅ 채팅방 입장
function joinChatRoom(roomId, roomName) {
    fetch(`https://localhost:443/chatRoom/${roomId}/join`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    })
        .then(response => {
            // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
            const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
            if (newAccessToken) {
                localStorage.setItem('accessToken', newAccessToken);
                console.log("🔑 AccessToken이 갱신되었습니다.");
            }
            if (!response.ok) {
                throw new Error("채팅방 입장 실패");
            }
            return response.json();
        })
        .then(data => {
            if (!data.hasAccess) {
                throw new Error("채팅방에 접근 권한이 없습니다.");
            }

            // ✅ 채팅방 이름 업데이트
            document.getElementById('roomName').textContent = roomName;

            alert(`"${roomName}" 채팅방에 입장했습니다.`);
            currentChatRoomId = roomId;

            // ✅ 입장 후 메시지 불러오기
            loadChatRoomMessages(roomId);

            // ✅ WebSocket 구독
            if (ws) {
                ws.subscribe(`/topic/chatroom/${roomId}`, function (message) {
                    const receivedMessage = JSON.parse(message.body);
                    displayMessage(receivedMessage);
                });
            }
        })
        .catch(error => {
            console.error("채팅방 입장 실패:", error);
            alert("채팅방에 입장할 수 없습니다: " + error.message);
        });
}

function loadChatRoomMessages(roomId) {
    fetch(`https://localhost:443/chatroom/${roomId}/messages`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
        .then(response => {
            // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
            const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
            if (newAccessToken) {
                localStorage.setItem('accessToken', newAccessToken);
                console.log("🔑 AccessToken이 갱신되었습니다.");
            }
            return response.json()
        })
        .then(messages => {
            const chatBox = document.getElementById('chatBox');
            chatBox.innerHTML = ''; // 기존 메시지 초기화


            // ✅ 메시지 렌더링
            messages.forEach(message => displayMessage(message));
        })
        .catch(error => {
            console.error('메시지 불러오기 실패:', error);
        });
}



// 친구 초대

// 🔸 모달 열기
function openInviteModal() {
    if (!currentChatRoomId) {
        alert("채팅방을 생성하거나 먼저 입장하세요.");
        return;
    }
    document.getElementById('inviteModal').style.display = 'block';
}

// 🔸 모달 닫기
function closeInviteModal() {
    document.getElementById('inviteModal').style.display = 'none';
}

// 🔸 친구 초대 기능
function sendInvite() {
    const userCode = document.getElementById('inviteUserCode').value;

    if (!userCode) {
        alert("유저 코드를 입력해주세요.");
        return;
    }

    fetch('https://localhost:443/graphql', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            query: `
                mutation {
                    addUser(chatRoomId: ${currentChatRoomId}, userCode: "${userCode}") {
                        id
                        member {
                            id
                            userName
                            email
                        }
                        chatRoom {
                            id
                            roomName
                        }
                        joinedAt
                    }
                }
            `
        })
    })
        .then(response => {
            // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
            const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
            if (newAccessToken) {
                localStorage.setItem('accessToken', newAccessToken);
                console.log("🔑 AccessToken이 갱신되었습니다.");
            }
            return response.json()
        })
        .then(data => {
            if (data.errors) {
                console.error("초대 실패:", data.errors);
                alert("초대 실패: " + data.errors[0].message);
                return;
            }

            const invitedUser = data.data.addUser.member;
            alert(`${invitedUser.userName}님이 채팅방에 초대되었습니다!`);

            closeInviteModal();  // 🔸 모달 닫기
            document.getElementById('inviteUserCode').value = '';  // 입력창 초기화
        })
        .catch(error => {
            console.error("초대 중 오류:", error);
            alert("초대 중 오류 발생: " + error.message);
        });
}

// 🔸 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('inviteModal');
    if (event.target === modal) {
        closeInviteModal();
    }
};



// 채팅방 참여자 조회
function loadParticipants() {
    alert("참여자 목록 조회 기능은 준비 중입니다.");
}

function startPing() {
    if (pingInterval) {
        clearInterval(pingInterval); // 기존 인터벌 제거
    }

    // 새로운 Ping 인터벌 시작
    pingInterval = setInterval(() => {
        sendPing();
    },  1 * 60 * 1000); // 5초마다 Ping
}

function sendPing() {
    if (ws && ws.connected) {
        ws.send("/app/ping", {}, JSON.stringify({ token: accessToken }));
        console.log("서버로 ping 요청을 보냈습니다.");
    } else {
        console.warn("WebSocket이 연결되지 않아 ping 요청을 보낼 수 없습니다.");
    }
}


// ✅ 웹소켓 연결 함수

// ✅ 로그인 상태 확인 후 웹소켓 연결 실행
window.onload = function () {
    onAuthSuccess(initializeWebSocket);
};

//window.onload = initializeWebSocket;

