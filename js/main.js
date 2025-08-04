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

  // ヘルプモーダルの機能
  const helpButton = document.getElementById("help-button");
  const helpModal = document.getElementById("help-modal");
  const helpClose = document.getElementById("help-close");

  // ヘルプボタンクリックでモーダル表示
  helpButton.addEventListener("click", () => {
    helpModal.classList.add("show");
    document.body.style.overflow = "hidden"; // 背景のスクロール無効化
  });

  // 閉じるボタンクリックでモーダル非表示
  helpClose.addEventListener("click", () => {
    helpModal.classList.remove("show");
    document.body.style.overflow = ""; // スクロール有効化
  });

  // モーダル背景クリックで閉じる
  helpModal.addEventListener("click", (e) => {
    if (e.target === helpModal) {
      helpModal.classList.remove("show");
      document.body.style.overflow = "";
    }
  });

  // ESCキーでモーダルを閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && helpModal.classList.contains("show")) {
      helpModal.classList.remove("show");
      document.body.style.overflow = "";
    }
  });
});
