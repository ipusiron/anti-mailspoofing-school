document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-tab");

      // ボタンの active クラスを更新
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // コンテンツの表示切り替え
      tabContents.forEach((content) => {
        if (content.id === targetId) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });
    });
  });
});
