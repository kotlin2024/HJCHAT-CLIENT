//
//
// window.onload = async function () {
//     const accessToken = localStorage.getItem("accessToken");
//
//     if (!accessToken) {
//         // Access Token이 없으면 로그인 페이지로 리다이렉트
//         window.location.href = "./sign-in.html"; // 로그인 페이지로 이동
//     }
//     else{
//         const profileImageUrl = localStorage.getItem("profileImageUrl");
//         if (profileImageUrl) {
//             // 프로필 이미지를 동적으로 설정
//             const profileImageElement = document.querySelector('.profile-image img');
//             profileImageElement.src = profileImageUrl;
//         }
//         try {
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
//             // UI 업데이트
//             document.getElementById('username').textContent = userInfo.userName;
//             document.getElementById('email').textContent = userInfo.email;
//
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
//     const accessToken=localStorage.getItem("accessToken")
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
//                 'Authorization': `Bearer ${accessToken}` // Presigned URL 요청 시에만 Authorization 헤더 포함
//             }
//         });
//
//         if (!response.ok) {
//             throw new Error('Failed to get Presigned URL.');
//         }
//
//         const presignedUrl = await response.text();
//
//         // Step 2: Presigned URL을 사용해 S3에 파일 업로드 (Authorization 헤더 제거)
//         const uploadResponse = await fetch(presignedUrl, {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': file.type // MIME 타입만 설정
//             },
//             body: file
//         });
//         if (uploadResponse.ok) {
//             document.getElementById('uploadResult').innerHTML = `<p style="color: green;">File uploaded successfully!</p>`;
//             alert("로그아웃 후 재 로그인시 새로바뀐 프로필이 적용됩니다!")
//         } else {
//             throw new Error('Failed to upload file to S3.');
//         }
//     } catch (error) {
//         console.error(error);
//         document.getElementById('uploadResult').innerHTML = `<p style="color: red;">${error.message}</p>`;
//     }
// });

window.onload = async function () {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
        // Access Token이 없으면 로그인 페이지로 리다이렉트
        window.location.href = "./sign-in.html";
    } else {
        try {
            // 서버에서 최신 사용자 정보 및 프로필 이미지 URL 요청
            const response = await fetch('https://localhost:443/member/get_user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user information.');
            }

            const userInfo = await response.json();

            // 최신 프로필 이미지 URL 적용
            const profileImageElement = document.querySelector('.profile-image img');
            if (userInfo.profileImageUrl) {
                // 캐시 무효화를 위해 쿼리 파라미터 추가
                profileImageElement.src = `${userInfo.profileImageUrl}?timestamp=${new Date().getTime()}`;
            } else {
                profileImageElement.src = 'default-profile.jpg';  // 기본 이미지
            }

            // UI 업데이트
            document.getElementById('username').textContent = userInfo.userName;
            document.getElementById('email').textContent = userInfo.email;

        } catch (error) {
            console.error('Error fetching user information:', error.message);
            alert('Failed to load user information. Please try again.');
        }
    }
};

// 프로필 이미지 업로드 로직
document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const accessToken = localStorage.getItem("accessToken");
    const fileInput = document.getElementById('profileImage');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file.');
        return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        alert('5MB 이하의 이미지만 업로드가 가능합니다.');
        return;
    }

    try {
        // Step 1: Presigned URL 요청
        const response = await fetch(`https://localhost:443/api/s3/upload/url?fileName=${file.name}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get Presigned URL.');
        }

        const presignedUrl = await response.text();

        // Step 2: Presigned URL을 사용해 S3에 파일 업로드
        const uploadResponse = await fetch(presignedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type
            },
            body: file
        });

        if (uploadResponse.ok) {
            document.getElementById('uploadResult').innerHTML = `<p style="color: green;">File uploaded successfully!</p>`;

            // 업로드 후 서버에서 최신 프로필 이미지 URL 가져오기
            const profileUpdateResponse = await fetch('https://localhost:443/member/get_user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (profileUpdateResponse.ok) {
                const updatedUserInfo = await profileUpdateResponse.json();
                const profileImageElement = document.querySelector('.profile-image img');
                profileImageElement.src = `${updatedUserInfo.profileImageUrl}?timestamp=${new Date().getTime()}`;
            }

            alert("프로필 사진이 업데이트되었습니다!");

        } else {
            throw new Error('Failed to upload file to S3.');
        }
    } catch (error) {
        console.error(error);
        document.getElementById('uploadResult').innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
});
