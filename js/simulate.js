document.addEventListener("DOMContentLoaded", () => {
  const simulateSection = document.getElementById("simulate");

  simulateSection.innerHTML += `
    <form id="simulate-form">
      <label>
        送信IPアドレス:
        <input type="text" id="ip-input" placeholder="192.0.2.1" required />
      </label><br><br>

      <label>
        SPFレコード:
        <input type="text" id="spf-input" placeholder="v=spf1 ip4:192.0.2.1 -all" required />
      </label><br><br>

      <label>DKIM署名:
        <input type="radio" name="dkim" value="pass" checked /> あり
        <input type="radio" name="dkim" value="fail" /> なし
      </label><br><br>

      <label>DMARCポリシー:
        <select id="dmarc-select">
          <option value="none">none（何もしない）</option>
          <option value="quarantine">quarantine（隔離）</option>
          <option value="reject">reject（拒否）</option>
        </select>
      </label><br><br>

      <button type="submit">認証チェックを実行</button>
    </form>

    <div id="result-area" style="margin-top: 2rem;"></div>
  `;

  const form = document.getElementById("simulate-form");
  const resultArea = document.getElementById("result-area");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const ip = document.getElementById("ip-input").value.trim();
    const spf = document.getElementById("spf-input").value.trim();
    const dkim = document.querySelector('input[name="dkim"]:checked').value;
    const dmarc = document.getElementById("dmarc-select").value;

    // SPF判定：spfレコード中に "ip4:[送信IP]" を含むか
    const spfPass = spf.includes(`ip4:${ip}`);

    // DKIM判定
    const dkimPass = (dkim === "pass");

    // DMARC判定（簡易ルール）
    let dmarcResult = "";
    if (spfPass || dkimPass) {
      dmarcResult = "受信（PASS）";
    } else {
      if (dmarc === "none") {
        dmarcResult = "受信（FAILだがポリシーがnone）";
      } else if (dmarc === "quarantine") {
        dmarcResult = "隔離";
      } else if (dmarc === "reject") {
        dmarcResult = "拒否";
      }
    }

    resultArea.innerHTML = `
      <h3>🔍 認証結果</h3>
      <ul>
        <li>SPF: <strong>${spfPass ? "PASS" : "FAIL"}</strong></li>
        <li>DKIM: <strong>${dkimPass ? "PASS" : "FAIL"}</strong></li>
        <li>DMARC: <strong>${dmarcResult}</strong></li>
      </ul>
    `;
  });
});
