//
//
// window.onload = async function () {
//     const accessToken = localStorage.getItem("accessToken");
//
//     if (!accessToken) {
//         // Access Token이 없으면 로그인 페이지로 리다이렉트
//         window.location.href = "./sign-in.html";
//     } else {
//         try {
//             // 서버에서 최신 사용자 정보 및 프로필 이미지 URL 요청
//             const response = await fetch('https://localhost:443/member/get_user', {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${accessToken}`
//                 }
//             });
//
//             if (!response.ok) {
//                 throw new Error('Failed to fetch user information.');
//             }
//
//             const userInfo = await response.json();
//
//             // 최신 프로필 이미지 URL 적용
//             const profileImageElement = document.querySelector('.profile-image img');
//             if (userInfo.profileImageUrl) {
//                 // 캐시 무효화를 위해 쿼리 파라미터 추가
//                 profileImageElement.src = `${userInfo.profileImageUrl}?timestamp=${new Date().getTime()}`;
//             } else {
//                 profileImageElement.src = 'default-profile.jpg';  // 기본 이미지
//             }
//
//             // UI 업데이트
//             document.getElementById('username').textContent = userInfo.userName;
//             document.getElementById('email').textContent = userInfo.email
//             document.getElementById('userCode').textContent = userInfo.userCode;
//
//         } catch (error) {
//             console.error('Error fetching user information:', error.message);
//             alert('Failed to load user information. Please try again.');
//         }
//     }
// };
//
// // 프로필 이미지 업로드 로직
// document.getElementById('uploadForm').addEventListener('submit', async (event) => {
//     event.preventDefault();
//
//     const accessToken = localStorage.getItem("accessToken");
//     const fileInput = document.getElementById('profileImage');
//     const file = fileInput.files[0];
//
//     if (!file) {
//         alert('Please select a file.');
//         return;
//     }
//
//     const maxSize = 5 * 1024 * 1024; // 5MB
//     if (file.size > maxSize) {
//         alert('5MB 이하의 이미지만 업로드가 가능합니다.');
//         return;
//     }
//
//     try {
//         // Step 1: Presigned URL 요청
//         const response = await fetch(`https://localhost:443/api/s3/upload/url?fileName=${file.name}`, {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${accessToken}`
//             }
//         });
//
//         if (!response.ok) {
//             throw new Error('Failed to get Presigned URL.');
//         }
//
//         const presignedUrl = await response.text();
//
//         // Step 2: Presigned URL을 사용해 S3에 파일 업로드
//         const uploadResponse = await fetch(presignedUrl, {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': file.type
//             },
//             body: file
//         });
//
//         if (uploadResponse.ok) {
//             document.getElementById('uploadResult').innerHTML = `<p style="color: green;">File uploaded successfully!</p>`;
//
//             // 업로드 후 서버에서 최신 프로필 이미지 URL 가져오기
//             const profileUpdateResponse = await fetch('https://localhost:443/member/get_user', {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${accessToken}`
//                 }
//             });
//
//             if (profileUpdateResponse.ok) {
//                 const updatedUserInfo = await profileUpdateResponse.json();
//                 const profileImageElement = document.querySelector('.profile-image img');
//                 profileImageElement.src = `${updatedUserInfo.profileImageUrl}?timestamp=${new Date().getTime()}`;
//             }
//
//             alert("프로필 사진이 업데이트되었습니다!");
//
//         } else {
//             throw new Error('Failed to upload file to S3.');
//         }
//     } catch (error) {
//         console.error(error);
//         document.getElementById('uploadResult').innerHTML = `<p style="color: red;">${error.message}</p>`;
//     }
// });
//
//
// // 친구 관련 로직
//
// // ✅ 친구 추가 요청
// function sendFriendRequest() {
//     const friendUserCode = document.getElementById('friendUsername').value;
//
//     if (!friendUserCode) {
//         alert('친구의 UserCode를 입력하세요.');
//         return;
//     }
//
//     // ✅ '#' 기준으로 분리 후 뒤의 숫자만 추출
//     const parts = friendUserCode.split('#');
//     if (parts.length !== 2 || isNaN(parts[1])) {
//         alert('올바른 형식의 UserCode를 입력하세요. (예: LEE#9)');
//         return;
//     }
//
//     const friendId = parseInt(parts[1]);
//
//     fetch('https://localhost:443/friends/request', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${accessToken}`
//         },
//         body: JSON.stringify({
//             friendId: parseInt(friendId)  // ✅ friendId를 Long 타입으로 변환
//         })
//     })
//         .then(response => {
//             if (!response.ok) {
//                 return response.json().then(err => {
//                     throw new Error(err.message || '친구 요청에 실패했습니다.');
//                 });
//             }
//             return response.json();
//         })
//         .then(() => {
//             alert(` ${friendUserCode}님께 친구 요청을 보냈습니다.`);
//             document.getElementById('friendUsername').value = '';
//             loadSentFriendRequests();  // 보낸 요청 목록 갱신
//         })
//         .catch(error => {
//             console.error('친구 요청 실패:', error);
//             alert('친구 요청 실패: ' + error.message);
//         });
// }
//
//
// // ✅ 친구 요청 수락/거절
// function respondToFriendRequest(senderId, accept) {
//     const endpoint = accept ? 'accept' : 'reject';
//
//     fetch(`https://localhost:443/friends/${endpoint}`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${accessToken}`
//         },
//         body: JSON.stringify({ friendId: senderId })
//     })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error(`친구 요청 ${accept ? '수락' : '거절'} 실패`);
//             }
//             return response.json();
//         })
//         .then(() => {
//             alert(`친구 요청을 ${accept ? '수락' : '거절'}했습니다.`);
//             loadFriendRequests();  // 친구 요청 목록 갱신
//         })
//         .catch(error => {
//             console.error(`친구 요청 ${accept ? '수락' : '거절'} 실패:`, error);
//             alert(`친구 요청 ${accept ? '수락' : '거절'} 실패: ${error.message}`);
//         });
// }
//
// // ✅ 받은 친구 요청 조회
// function loadReceivedFriendRequests() {
//     fetch('https://localhost:443/friends/request', {
//         method: 'GET',
//         headers: {
//             'Authorization': `Bearer ${accessToken}`
//         }
//     })
//         .then(response => response.json())
//         .then(data => {
//             console.log('받은 친구 요청:', data);
//             const requestContainer = document.getElementById('receivedRequests');
//             requestContainer.innerHTML = '';
//
//             data.forEach(request => {
//                 const requestElement = document.createElement('div');
//                 requestElement.innerHTML = `
//                 <p>${request.senderName}님이 친구 요청을 보냈습니다.</p>
//                 <button onclick="respondToFriendRequest(${request.friendId}, true)">수락</button>
//                 <button onclick="respondToFriendRequest(${request.friendId}, false)">거절</button>
//             `;
//                 requestContainer.appendChild(requestElement);
//             });
//         })
//         .catch(error => {
//             console.error('받은 친구 요청 조회 실패:', error);
//             alert('받은 친구 요청을 불러오지 못했습니다.');
//         });
// }
//
//
// // ✅ 보낸 친구 요청 조회
// function loadSentFriendRequests() {
//     fetch('https://localhost:443/friends/my_request', {
//         method: 'GET',
//         headers: {
//             'Authorization': `Bearer ${accessToken}`,
//             'Content-Type': 'application/json'
//         }
//     })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error(`서버 응답 실패: ${response.status}`);
//             }
//             return response.json();
//         })
//         .then(data => {
//             const requestContainer = document.getElementById('sentRequests');
//             requestContainer.innerHTML = '';
//
//             if (data.length === 0) {
//                 requestContainer.innerHTML = '<p>보낸 친구 요청이 없습니다.</p>';
//                 return;
//             }
//
//             data.forEach(request => {
//                 const requestElement = document.createElement('div');
//                 requestElement.innerHTML = `
//                 <p>${request.senderName}님에게 친구 요청을 보냈습니다. 상태: ${request.status}</p>
//             `;
//                 requestContainer.appendChild(requestElement);
//             });
//         })
//         .catch(error => {
//             console.error('보낸 친구 요청 조회 실패:', error);
//             alert('보낸 친구 요청을 불러오지 못했습니다.');
//         });
// }
//
//
// // ✅ 친구 목록 조회
// function getMyFriendsList() {
//     console.log("📥 친구 목록 조회 함수 호출됨");
//     fetch('https://localhost:443/friends/get_list', {
//         method: 'GET',
//         headers: {
//             'Authorization': `Bearer ${accessToken}`
//         }
//     })
//         .then(response => response.json())
//         .then(data => {
//             const friendsContainer = document.getElementById('friendsList');
//             friendsContainer.innerHTML = '';
//
//             data.forEach(friend => {
//                 const friendElement = document.createElement('div');
//                 friendElement.innerHTML = `<p>${friend.senderName} (친구 코드: ${friend.friendCode})</p>`;
//                 friendsContainer.appendChild(friendElement);
//             });
//         })
//         .catch(error => {
//             console.error('친구 목록 조회 실패:', error);
//             alert('친구 목록 조회 실패: ' + error.message);
//         });
// }
//

document.addEventListener('DOMContentLoaded', async function () {
    const accessToken = localStorage.getItem("accessToken");

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
    const accessToken = localStorage.getItem("accessToken");

    const response = await fetch('https://localhost:443/member/get_user', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) throw new Error('사용자 정보를 불러오지 못했습니다.');

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

    const accessToken = localStorage.getItem("accessToken");
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
        const response = await fetch(`https://localhost:443/api/s3/upload/url?fileName=${file.name}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) throw new Error('Presigned URL 요청 실패');

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
    const accessToken = localStorage.getItem("accessToken");
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

    fetch('https://localhost:443/friends/request', {
        method: 'POST',
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
    const accessToken = localStorage.getItem("accessToken");
    const endpoint = accept ? 'accept' : 'reject';

    fetch(`https://localhost:443/friends/${endpoint}`, {
        method: 'POST',
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
    const accessToken = localStorage.getItem("accessToken");

    const response = await fetch('https://localhost:443/friends/request', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) throw new Error('받은 친구 요청 조회 실패');

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
    const accessToken = localStorage.getItem("accessToken");

    const response = await fetch('https://localhost:443/friends/my_request', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) throw new Error('보낸 친구 요청 조회 실패');

    const data = await response.json();
    const container = document.getElementById('sentRequests');
    container.innerHTML = '';

    data.forEach(request => {
        container.innerHTML += `<p>${request.senderName}님에게 친구 요청을 보냈습니다. 상태: ${request.status}</p>`;
    });
}


// ✅ 친구 목록 조회
async function getMyFriendsList() {
    const accessToken = localStorage.getItem("accessToken");

    const response = await fetch('https://localhost:443/friends/get_list', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) throw new Error('친구 목록 조회 실패');

    const data = await response.json();
    const container = document.getElementById('friendsList');
    container.innerHTML = '';

    data.forEach(friend => {
        container.innerHTML += `<p>${friend.senderName} (친구 코드: ${friend.friendCode})</p>`;
    });
}
