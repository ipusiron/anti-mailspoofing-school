document.addEventListener("DOMContentLoaded", () => {
  const challengeSection = document.getElementById("challenge");

  // 仮の1問（拡張可能な構造）
  const quiz = {
    id: 1,
    log: {
      spf: "FAIL",
      dkim: "FAIL",
      dmarc: "ポリシー: reject"
    },
    correctAnswer: "reject",
    explanation: `
      SPFもDKIMも失敗しており、DMARCポリシーが<strong>reject</strong>のため、<strong>拒否</strong>するのが正しい判断です。
    `
  };

  challengeSection.innerHTML += `
    <div class="quiz-box">
      <h3>🧩 クイズに挑戦！</h3>
      <p><strong>以下の認証ログを見て、どう処理すべきかを選んでください。</strong></p>
      <pre>
SPF 検証: ${quiz.log.spf}
DKIM 検証: ${quiz.log.dkim}
DMARC: ${quiz.log.dmarc}
      </pre>

      <form id="quiz-form">
        <label><input type="radio" name="answer" value="accept" /> 受信（accept）</label><br>
        <label><input type="radio" name="answer" value="quarantine" /> 隔離（quarantine）</label><br>
        <label><input type="radio" name="answer" value="reject" /> 拒否（reject）</label><br><br>
        <button type="submit">判定する</button>
      </form>

      <div id="quiz-result" style="margin-top: 1rem;"></div>
    </div>
  `;

  const form = document.getElementById("quiz-form");
  const resultBox = document.getElementById("quiz-result");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const selected = document.querySelector('input[name="answer"]:checked');
    if (!selected) {
      alert("いずれかの選択肢を選んでください。");
      return;
    }

    const answer = selected.value;
    const isCorrect = answer === quiz.correctAnswer;

    resultBox.innerHTML = `
      <p><strong>あなたの選択:</strong> ${answer}</p>
      <p style="color: ${isCorrect ? "green" : "red"};">
        ${isCorrect ? "✅ 正解です！" : "❌ 不正解です。"}
      </p>
      <div>${quiz.explanation}</div>
    `;
  });
});
