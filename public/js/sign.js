function login() {
    const userName = document.getElementById('userName').value; // 닉네임 가져오기
    const password = document.getElementById('password').value;

    fetch('https://localhost:443/api/oauth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: userName, password }),
        credentials: "include",
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`로그인 실패: 서버 응답 상태 ${response.status}`);
            }

            const accessToken = response.headers.get('Authorization')?.split(' ')[1];
            if (!accessToken) {
                throw new Error('로그인 실패: Authorization 헤더가 비어있음');
            }
            localStorage.setItem('accessToken', accessToken);

            // 사용자 정보 로드
            return fetch('https://localhost:443/member/get_user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`사용자 정보 가져오기 실패: ${response.status}`);
                }
                return response.json();
            });
        })
        .then(data => {
            // 사용자 정보를 로컬 스토리지에 저장
            localStorage.setItem('userName', data.userName);
            localStorage.setItem('profileImageUrl', data.profileImageUrl);
            localStorage.setItem('userId', data.userId);
            // console.log("Logged in user ID:", data.userId);
            // console.log("Logged in user name:", data.userName);

            // 메인 홈페이지로 이동
            window.location.href = '/index.html'; // 메인 페이지 URL
        })
        .catch(error => {
            console.error('로그인 실패:', error);
            alert(error.message);
        });
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function signUp(){
    const email = document.getElementById('email').value;
    const username = document.getElementById('userName').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    fetch('https://localhost:443/api/oauth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            username,
            password,
            confirmPassword,
        }),
    })
        .then(response => {
            if (!response.ok) {
                // 서버 응답을 JSON으로 파싱하여 오류 메시지 추출
                return response.json().then(errorData => {
                    throw new Error(errorData.message || "An unknown error occurred.");
                });
            }
            return response.text();
        })
        .then(data => {
            // 성공 메시지 표시
            alert("Sign-up successful! Please verify your email.");
            console.log("Response from server:", data);

            // 회원가입 완료 후 로그인 페이지로 리다이렉트
            window.location.href = '/sign-in.html';
        })
        .catch(error => {
            // 서버에서 받은 오류 메시지 표시
            console.error("Sign-up failed:", error.message);
            alert(`Sign-up failed: ${error.message}`);
        });
}

// 이메일 입력 이벤트 처리
document.getElementById('email').addEventListener('input', function () {
    const email = this.value;
    const emailError = document.getElementById('emailError');

    if (!validateEmail(email)) {
        emailError.style.display = 'block'; // 오류 메시지 표시
    } else {
        emailError.style.display = 'none'; // 오류 메시지 숨김
    }
});

// 비밀번호 확인 입력 이벤트 처리
document.getElementById('confirm_password').addEventListener('input', function () {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;
    const confirmPasswordError = document.getElementById('confirmPasswordError');

    if (password !== confirmPassword) {
        confirmPasswordError.style.display = 'block'; // 오류 메시지 표시
    } else {
        confirmPasswordError.style.display = 'none'; // 오류 메시지 숨김
    }
});

document.getElementById('password').addEventListener('input', function () {
    const password = this.value;
    const passwordError = document.getElementById('passwordError');
    const passwordPattern = /^[0-9a-zA-Z]{4,10}$/; // 비밀번호 형식: 4~10자의 영문자와 숫자만 허용

    // 비밀번호 형식 검증
    if (!passwordPattern.test(password)) {
        passwordError.style.display = 'block'; // 오류 메시지 표시
    } else {
        passwordError.style.display = 'none'; // 오류 메시지 숨김
    }
});