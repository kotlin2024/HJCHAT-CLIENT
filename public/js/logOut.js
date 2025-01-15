// document.getElementById("logoutButton").addEventListener("click", async () => {
//     try {
//         // AccessToken 가져오기
//         const accessToken = localStorage.getItem("accessToken");
//
//         // 서버에 로그아웃 요청 (RefreshToken은 쿠키에서 자동으로 전송됨)
//         const response = await fetch("https://localhost:443/api/oauth/logout", {
//             method: "POST",
//             headers: {
//                 "Authorization": `Bearer ${accessToken}`,
//                 "Content-Type": "application/json"
//             },
//             credentials: "include"  // 쿠키(RefreshToken)를 함께 전송
//         });
//
//         if (response.ok) {
//             // AccessToken과 RefreshToken 삭제
//             localStorage.clear();
//
//             alert("로그아웃 되었습니다.");
//             window.location.href = "index.html";
//         } else {
//             throw new Error("로그아웃 실패");
//         }
//
//     } catch (error) {
//         console.error("로그아웃 오류:", error);
//         alert("로그아웃 중 오류가 발생했습니다.");
//     }
// });
