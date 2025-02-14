
const checkServerStatus = async () => {
    try {
        const response = await fetch("https://api.hj-chat.com/admin/server_check", { method: "GET" });
        if (response.ok) {
            document.getElementById("server-status").innerText = "✅ 서버가 정상 작동 중";
            document.getElementById("server-status").style.color = "green";
        } else {
            throw new Error("서버 오류");
        }
    } catch (error) {
        document.getElementById("server-status").innerText = "🚨 서버가 잠시 중지되었습니다.(오픈시간: 13:00 ~ 18:00)";
        document.getElementById("server-status").style.color = "red";
    }
};

// 5초마다 서버 상태 확인
setInterval(checkServerStatus, 5000);

// 페이지 로드 시에도 즉시 체크
checkServerStatus();
