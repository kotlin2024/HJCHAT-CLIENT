document.getElementById("logoutButton").addEventListener("click", () => {

    localStorage.clear() ;

    alert("로그아웃 되었습니다.")

    window.location.href = "index.html";
});