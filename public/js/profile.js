
document.addEventListener('DOMContentLoaded', async function () {
    let accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
        // Access Token이 없으면 로그인 페이지로 리다이렉트
        window.location.href = "./sign-in.html";
    } else {
        try {
            // ✅ 사용자 정보 및 친구 목록 한 번에 불러오기
            await loadUserProfile();
            await loadReceivedFriendRequests();
            await loadSentFriendRequests();
            await getMyFriendsList();
        } catch (error) {
            console.error('Error loading data:', error.message);
            alert('데이터를 불러오지 못했습니다. 다시 시도해주세요.');
        }
    }

    // ✅ 프로필 이미지 업로드 이벤트 연결
    document.getElementById('uploadForm').addEventListener('submit', uploadProfileImage);
});


// ✅ 사용자 프로필 정보 로드
async function loadUserProfile() {
    let accessToken = localStorage.getItem("accessToken");

    const response = await fetch('https://api.hj-chat.com/member/get_user', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) throw new Error('사용자 정보를 불러오지 못했습니다.');

    // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
    const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
    if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken);
        console.log("🔑 AccessToken이 갱신되었습니다.");
    }


    const userInfo = await response.json();

    // 프로필 이미지 업데이트
    const profileImageElement = document.querySelector('.profile-image img');
    profileImageElement.src = userInfo.profileImageUrl
        ? `${userInfo.profileImageUrl}?timestamp=${new Date().getTime()}`
        : 'default-profile.jpg';

    // 사용자 정보 업데이트
    document.getElementById('username').textContent = userInfo.userName;
    document.getElementById('email').textContent = userInfo.email;
    document.getElementById('userCode').textContent = userInfo.userCode;
}


// ✅ 프로필 이미지 업로드 로직
async function uploadProfileImage(event) {
    event.preventDefault();

    let accessToken = localStorage.getItem("accessToken");
    const fileInput = document.getElementById('profileImage');
    const file = fileInput.files[0];

    if (!file) {
        alert('업로드할 파일을 선택해주세요.');
        return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB 제한
    if (file.size > maxSize) {
        alert('5MB 이하의 이미지만 업로드가 가능합니다.');
        return;
    }

    try {
        const response = await fetch(`https://api.hj-chat.com/api/s3/upload/url?fileName=${file.name}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) throw new Error('Presigned URL 요청 실패');
        // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
        const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
        if (newAccessToken) {
            localStorage.setItem('accessToken', newAccessToken);
            console.log("🔑 AccessToken이 갱신되었습니다.");
        }


        const presignedUrl = await response.text();

        const uploadResponse = await fetch(presignedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file
        });

        if (!uploadResponse.ok) throw new Error('S3 업로드 실패');

        await loadUserProfile();  // 업로드 후 프로필 새로고침
        alert("프로필 사진이 업데이트되었습니다!");

    } catch (error) {
        console.error('프로필 업로드 실패:', error);
        alert('프로필 업로드 실패: ' + error.message);
    }
}


// ✅ 친구 추가 요청
function sendFriendRequest() {
    let accessToken = localStorage.getItem("accessToken");
    const friendUserCode = document.getElementById('friendUsername').value;

    if (!friendUserCode) {
        alert('친구의 UserCode를 입력하세요.');
        return;
    }

    const parts = friendUserCode.split('#');
    if (parts.length !== 2 || isNaN(parts[1])) {
        alert('올바른 형식의 UserCode를 입력하세요. (예: LEE#9)');
        return;
    }

    const friendId = parseInt(parts[1]);

    fetch('https://api.hj-chat.com/friends/request', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ friendId })
    })
        .then(response => {
            if (!response.ok) throw new Error('친구 요청 실패');
            return response.json();
        })
        .then(() => {
            // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
            const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
            if (newAccessToken) {
                localStorage.setItem('accessToken', newAccessToken);
                console.log("🔑 AccessToken이 갱신되었습니다.");
            }

            alert(`${friendUserCode}님께 친구 요청을 보냈습니다.`);
            loadSentFriendRequests();  // 보낸 요청 목록 갱신
        })
        .catch(error => {
            console.error('친구 요청 실패:', error);
            alert('친구 요청 실패: ' + error.message);
        });
}


// ✅ 친구 요청 수락/거절
function respondToFriendRequest(senderId, accept) {
    let accessToken = localStorage.getItem("accessToken");
    const endpoint = accept ? 'accept' : 'reject';

    fetch(`https://api.hj-chat.com/friends/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ friendId: senderId })
    })
        .then(response => {
            if (!response.ok) throw new Error('친구 요청 처리 실패');
            return response.json();
        })
        .then(() => {
            // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
            const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
            if (newAccessToken) {
                localStorage.setItem('accessToken', newAccessToken);
                console.log("🔑 AccessToken이 갱신되었습니다.");
            }

            alert(`친구 요청을 ${accept ? '수락' : '거절'}했습니다.`);

            getMyFriendsList();
            loadReceivedFriendRequests();
        })
        .catch(error => {
            console.error('친구 요청 처리 실패:', error);
            alert('친구 요청 처리 실패: ' + error.message);
        });
}


// ✅ 받은 친구 요청 조회
async function loadReceivedFriendRequests() {
    let accessToken = localStorage.getItem("accessToken");

    const response = await fetch('https://api.hj-chat.com/friends/request', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) throw new Error('받은 친구 요청 조회 실패');

    // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
    const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
    if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken);
        console.log("🔑 AccessToken이 갱신되었습니다.");
    }

    const data = await response.json();
    const container = document.getElementById('receivedRequests');
    container.innerHTML = '';

    data.forEach(request => {
        container.innerHTML += `
            <p>${request.senderName}님이 친구 요청을 보냈습니다.</p>
            <button onclick="respondToFriendRequest(${request.friendId}, true)">수락</button>
            <button onclick="respondToFriendRequest(${request.friendId}, false)">거절</button>
        `;
    });
}


// ✅ 보낸 친구 요청 조회
async function loadSentFriendRequests() {
    let accessToken = localStorage.getItem("accessToken");

    const response = await fetch('https://api.hj-chat.com/friends/my_request', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) throw new Error('보낸 친구 요청 조회 실패');

    // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
    const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
    if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken);
        console.log("🔑 AccessToken이 갱신되었습니다.");
    }

    const data = await response.json();
    const container = document.getElementById('sentRequests');
    container.innerHTML = '';

    data.forEach(request => {
        container.innerHTML += `<p>${request.senderName}님에게 친구 요청을 보냈습니다. 상태: ${request.status}</p>`;
    });
}

async function getMyFriendsList() {
    let accessToken = localStorage.getItem("accessToken");

    try {
        const response = await fetch('https://api.hj-chat.com/friends/get_list', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('친구 목록 조회 실패');

        // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
        const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
        if (newAccessToken) {
            localStorage.setItem('accessToken', newAccessToken);
            console.log("🔑 AccessToken이 갱신되었습니다.");
        }

        const data = await response.json();
        const container = document.getElementById('friendsList');

        container.innerHTML = '';

        data.forEach(friend => {
            container.innerHTML += `
                <div class="card mb-3 shadow-sm">
                    <div class="card-body d-flex align-items-center">
                        <img src="https://hjchat-s3-bucket1.s3.ap-northeast-2.amazonaws.com/uploads/profile/${friend.friendId}/profile" alt="Profile" class="rounded-circle me-3" width="50" height="50"  onerror="this.onerror=null; this.src='https://hjchat-s3-bucket1.s3.ap-northeast-2.amazonaws.com/uploads/profile/Default-profile/max.jpg';">
                        <div>
                            <h5 class="card-title mb-0">${friend.senderName}</h5>
                            <small class="text-muted">친구 코드: ${friend.friendCode}</small>
                        </div>
                        <button class="btn btn-outline-danger btn-sm ms-auto" onclick="removeFriend(${friend.friendId})">
                            삭제
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error('친구 목록 조회 실패:', error);
        alert('친구 목록을 불러오는 데 실패했습니다.');
    }
}
async function removeFriend(friendId) {
    let accessToken = localStorage.getItem("accessToken");

    if (!confirm("정말로 이 친구를 삭제하시겠습니까?")) return;

    try {
        const response = await fetch(`https://api.hj-chat.com/friends/remove/${friendId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('친구 삭제 실패');

        // ✅ Authorization 헤더가 존재하는 경우만 AccessToken 업데이트
        const newAccessToken = response.headers.get('Authorization')?.split(' ')[1];
        if (newAccessToken) {
            localStorage.setItem('accessToken', newAccessToken);
            console.log("🔑 AccessToken이 갱신되었습니다.");
        }

        alert('친구가 삭제되었습니다.');
        getMyFriendsList();  // ✅ 목록 새로고침

    } catch (error) {
        console.error('친구 삭제 실패:', error);
        alert('친구 삭제에 실패했습니다.');
    }
}

