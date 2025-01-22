document.addEventListener("DOMContentLoaded", function () {
    const authContainer = document.getElementById('authButtonContainer');
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
        // ✅ 로그인 상태: 로그아웃 버튼 추가
        authContainer.innerHTML = `
            <button id="logoutButton" class="btn btn-outline-danger btn-sm">Logout</button>
        `;

        // 기존 로그아웃 로직 연결
        document.getElementById("logoutButton").addEventListener("click", async () => {
            try {
                // AccessToken 가져오기
                const accessToken = localStorage.getItem("accessToken");

                // 서버에 로그아웃 요청 (RefreshToken은 쿠키에서 자동으로 전송됨)
                const response = await fetch("https://localhost:443/api/oauth/logout", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    },
                    credentials: "include"  // 쿠키(RefreshToken)를 함께 전송
                });

                if (response.ok) {
                    // AccessToken과 RefreshToken 삭제
                    localStorage.clear();

                    alert("로그아웃 되었습니다.");
                    window.location.href = "index.html";
                } else {
                    localStorage.clear();
                    alert("로그아웃 되었습니다.");
                    window.location.href = "index.html";
                    throw new Error("토큰 블랙리스트 저장 실패 ");
                }

            } catch (error) {
                console.error("로그아웃 오류:", error);
                alert("로그아웃 중 오류가 발생했습니다.");
            }
        });

    } else {
        // ❌ 비로그인 상태: 로그인 버튼 추가
        authContainer.innerHTML = `
            <a href="sign-in.html" class="btn btn-outline-primary btn-sm">Login</a>
        `;
    }
});

// ✅ 로그인 상태 확인 함수
function checkLogin() {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
        alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
        window.location.href = "./sign-in.html";
    }
}

// ✅ 페이지 로드 시 로그인 확인 후 콜백 실행
function onAuthSuccess(callback) {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
        alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
        window.location.href = "./sign-in.html";
    } else {
        callback();  // 로그인 상태 확인 후 웹소켓 연결
    }
}
