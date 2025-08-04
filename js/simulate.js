document.addEventListener("DOMContentLoaded", () => {
  const simulateSection = document.getElementById("simulate");

  // プリセットシナリオの定義
  const scenarios = [
    {
      id: "custom",
      name: "📝 カスタム入力",
      description: "独自の値を手動で設定",
      values: null
    },
    {
      id: "normal",
      name: "🟢 正常なメール配送",
      description: "すべての認証が成功する理想的なケース",
      values: {
        ip: "192.0.2.1",
        spf: "v=spf1 ip4:192.0.2.1 -all",
        dkim: "pass",
        dmarc: "none"
      }
    },
    {
      id: "spf-fail",
      name: "🔴 SPF失敗（なりすまし）",
      description: "不正なIPからの送信を検知",
      values: {
        ip: "203.0.113.5",
        spf: "v=spf1 ip4:192.0.2.1 -all",
        dkim: "fail",
        dmarc: "reject"
      }
    },
    {
      id: "dkim-fail",
      name: "🟡 DKIM失敗（改ざん検知）",
      description: "電子署名の検証に失敗",
      values: {
        ip: "192.0.2.1",
        spf: "v=spf1 ip4:192.0.2.1 -all",
        dkim: "fail",
        dmarc: "quarantine"
      }
    },
    {
      id: "both-fail-none",
      name: "🔵 両方失敗でもPASS",
      description: "SPF/DKIM失敗だがDMARCポリシーがnone",
      values: {
        ip: "203.0.113.5",
        spf: "v=spf1 ip4:192.0.2.1 -all",
        dkim: "fail",
        dmarc: "none"
      }
    },
    {
      id: "complete-fail",
      name: "⚫ 完全失敗（reject）",
      description: "すべての認証が失敗し拒否される",
      values: {
        ip: "203.0.113.5",
        spf: "v=spf1 ip4:192.0.2.1 -all",
        dkim: "fail",
        dmarc: "reject"
      }
    },
    {
      id: "config-error",
      name: "🔧 設定ミスパターン",
      description: "SPF設定ミスでもDKIMにより救済される例",
      values: {
        ip: "192.0.2.1",
        spf: "v=spf1 ip4:192.0.2.2 -all",
        dkim: "pass",
        dmarc: "quarantine"
      }
    }
  ];

  simulateSection.innerHTML += `
    <div class="simulate-container">
      <div class="simulate-input-section">
        <h3>📝 メール設定を入力</h3>
        
        <div class="scenario-selection">
          <label for="scenario-select">シナリオを選択</label>
          <select id="scenario-select">
            ${scenarios.map(scenario => 
              `<option value="${scenario.id}">${scenario.name}</option>`
            ).join('')}
          </select>
          <p id="scenario-description" class="scenario-description">${scenarios[0].description}</p>
        </div>
        
        <form id="simulate-form">
          <div class="input-group">
            <label for="ip-input">送信IPアドレス</label>
            <input type="text" id="ip-input" placeholder="192.0.2.1" required />
            <small>メールを送信するサーバーのIPアドレス</small>
          </div>

          <div class="input-group">
            <label for="spf-input">SPFレコード</label>
            <input type="text" id="spf-input" placeholder="v=spf1 ip4:192.0.2.1 -all" required />
            <small>ドメインのDNSに登録されたSPFレコード</small>
          </div>

          <div class="input-group">
            <label>DKIM署名</label>
            <div class="radio-group">
              <label><input type="radio" name="dkim" value="pass" checked /> あり（PASS）</label>
              <label><input type="radio" name="dkim" value="fail" /> なし（FAIL）</label>
            </div>
            <small>メールに電子署名が付いているか</small>
          </div>

          <div class="input-group">
            <label for="dmarc-select">DMARCポリシー</label>
            <select id="dmarc-select">
              <option value="none">none（何もしない）</option>
              <option value="quarantine">quarantine（隔離）</option>
              <option value="reject">reject（拒否）</option>
            </select>
            <small>認証失敗時の処理方針</small>
          </div>

          <button type="submit" class="simulate-btn">🔍 ステップ実行で検証開始</button>
        </form>
      </div>

      <div class="simulate-result-section">
        <div id="progress-bar" class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        
        <div id="dns-visualization" class="dns-visualization"></div>
        
        <div id="verification-steps" class="verification-steps"></div>
        
        <div id="explanation-mode" class="explanation-mode"></div>
        
        <div id="recommendations" class="recommendations"></div>
        
        <div id="final-result" class="final-result"></div>
      </div>
    </div>
  `;

  const form = document.getElementById("simulate-form");
  const scenarioSelect = document.getElementById("scenario-select");
  const scenarioDescription = document.getElementById("scenario-description");
  const progressBar = document.querySelector(".progress-fill");
  const dnsVisualization = document.getElementById("dns-visualization");
  const verificationSteps = document.getElementById("verification-steps");
  const explanationMode = document.getElementById("explanation-mode");
  const recommendations = document.getElementById("recommendations");
  const finalResult = document.getElementById("final-result");

  // シナリオ選択時のイベントハンドラ
  scenarioSelect.addEventListener("change", (e) => {
    const selectedScenario = scenarios.find(s => s.id === e.target.value);
    
    // 説明文を更新
    scenarioDescription.textContent = selectedScenario.description;
    
    // フォームに値を設定
    if (selectedScenario.values) {
      document.getElementById("ip-input").value = selectedScenario.values.ip;
      document.getElementById("spf-input").value = selectedScenario.values.spf;
      document.querySelector(`input[name="dkim"][value="${selectedScenario.values.dkim}"]`).checked = true;
      document.getElementById("dmarc-select").value = selectedScenario.values.dmarc;
      
      // 入力欄を読み取り専用に
      setInputReadOnly(false);
    } else {
      // カスタム入力の場合は編集可能に
      clearForm();
      setInputReadOnly(true);
    }
  });

  function setInputReadOnly(editable) {
    const inputs = form.querySelectorAll("input, select");
    inputs.forEach(input => {
      if (input.type !== "submit") {
        input.readOnly = !editable;
        input.disabled = !editable;
        input.style.backgroundColor = editable ? "" : "#f7fafc";
        input.style.cursor = editable ? "" : "not-allowed";
      }
    });
  }

  function clearForm() {
    document.getElementById("ip-input").value = "";
    document.getElementById("spf-input").value = "";
    document.querySelector(`input[name="dkim"][value="pass"]`).checked = true;
    document.getElementById("dmarc-select").value = "none";
  }

  // 初期化：最初のシナリオを適用
  scenarioSelect.dispatchEvent(new Event('change'));

  // 検証ステップの定義
  const steps = [
    {
      id: "spf",
      name: "SPF認証",
      icon: "🌐",
      description: "送信IPアドレスがDNSに登録されているか確認"
    },
    {
      id: "dkim", 
      name: "DKIM認証",
      icon: "🔐",
      description: "メールの電子署名を検証"
    },
    {
      id: "dmarc",
      name: "DMARC判定",
      icon: "📋", 
      description: "SPF/DKIMの結果に基づいてポリシーを適用"
    }
  ];

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const ip = document.getElementById("ip-input").value.trim();
    const spf = document.getElementById("spf-input").value.trim();
    const dkim = document.querySelector('input[name="dkim"]:checked').value;
    const dmarc = document.getElementById("dmarc-select").value;

    // 結果をリセット
    dnsVisualization.innerHTML = "";
    verificationSteps.innerHTML = "";
    explanationMode.innerHTML = "";
    recommendations.innerHTML = "";
    finalResult.innerHTML = "";
    progressBar.style.width = "0%";

    // DNSレコード可視化を表示
    displayDNSVisualization(ip, spf, dmarc);

    // ステップ実行開始
    executeStepByStep(ip, spf, dkim, dmarc);
  });

  async function executeStepByStep(ip, spf, dkim, dmarc) {
    const results = {};
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // プログレスバー更新
      const progress = ((i + 1) / steps.length) * 100;
      progressBar.style.width = `${progress}%`;
      
      // ステップ実行
      const result = await executeStep(step, ip, spf, dkim, dmarc, results);
      results[step.id] = result;
      
      // ステップ結果表示
      displayStepResult(step, result);
      
      // 次のステップまで少し待機
      if (i < steps.length - 1) {
        await sleep(800);
      }
    }
    
    // 解説モード表示
    displayExplanationMode(results, ip, spf, dkim, dmarc);
    
    // 推奨設定表示
    displayRecommendations(results, ip, spf, dkim, dmarc);
    
    // 最終結果表示
    displayFinalResult(results, dmarc);
  }

  function displayDNSVisualization(ip, spf, dmarc) {
    dnsVisualization.innerHTML = `
      <div class="dns-viz-container">
        <h4>🌐 DNSレコード照会シミュレーション</h4>
        <div class="dns-query-flow">
          <div class="dns-query-step">
            <div class="query-icon">📧</div>
            <div class="query-label">送信メール</div>
            <div class="query-detail">From: sender@example.com<br>IP: ${ip}</div>
          </div>
          
          <div class="dns-arrow">→</div>
          
          <div class="dns-query-step">
            <div class="query-icon">🔍</div>
            <div class="query-label">DNS照会</div>
            <div class="query-detail">dig TXT example.com</div>
          </div>
          
          <div class="dns-arrow">→</div>
          
          <div class="dns-query-step">
            <div class="query-icon">📋</div>
            <div class="query-label">レコード取得</div>
            <div class="query-detail">
              <div class="dns-record spf-record">SPF: ${spf}</div>
              <div class="dns-record dmarc-record">DMARC: v=DMARC1; p=${dmarc};</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function displayExplanationMode(results, ip, spf, dkim, dmarc) {
    const spfResult = results.spf.status === "PASS";
    const dkimResult = results.dkim.status === "PASS";
    
    const explanations = [];
    
    // SPF解説
    explanations.push({
      title: "SPF認証の仕組み",
      content: spfResult 
        ? `✅ 送信IP「${ip}」がSPFレコードに含まれているため認証成功。送信者が正当であることが確認できました。`
        : `❌ 送信IP「${ip}」がSPFレコードに含まれていないため認証失敗。なりすましの可能性があります。`,
      technical: `SPFレコード「${spf}」を解析し、許可されたIPアドレスリストと送信IPを照合しました。`
    });
    
    // DKIM解説
    explanations.push({
      title: "DKIM認証の仕組み", 
      content: dkimResult
        ? "✅ メールに有効なDKIM署名が付与されており、内容の改ざんがないことが確認できました。"
        : "❌ DKIM署名がないか無効なため、メールの完全性を保証できません。",
      technical: "DNSから公開鍵を取得し、メールヘッダの署名を検証しました。"
    });
    
    // DMARC解説
    const dmarcStatus = results.dmarc.status;
    explanations.push({
      title: "DMARC判定の仕組み",
      content: `DMARC認証結果: ${dmarcStatus}。SPF(${spfResult ? 'PASS' : 'FAIL'})とDKIM(${dkimResult ? 'PASS' : 'FAIL'})の結果を総合的に判断しました。`,
      technical: `DMARCポリシー「${dmarc}」に従って最終的な処理方針を決定しました。`
    });

    explanationMode.innerHTML = `
      <div class="explanation-container">
        <h4>📚 詳細解説モード</h4>
        ${explanations.map(exp => `
          <div class="explanation-item">
            <h5>${exp.title}</h5>
            <p class="explanation-content">${exp.content}</p>
            <details class="technical-details">
              <summary>技術的詳細を表示</summary>
              <p>${exp.technical}</p>
            </details>
          </div>
        `).join('')}
      </div>
    `;
  }

  function displayRecommendations(results, ip, spf, dkim, dmarc) {
    const recommendations = [];
    const spfResult = results.spf.status === "PASS";
    const dkimResult = results.dkim.status === "PASS";
    
    // SPF推奨事項
    if (!spfResult) {
      recommendations.push({
        type: "error",
        title: "SPF設定の改善",
        content: `送信IP「${ip}」をSPFレコードに追加してください。`,
        action: `推奨SPFレコード: v=spf1 ip4:${ip} include:${spf.split(' ').find(s => s.startsWith('ip4:'))?.replace('ip4:', '') || 'your-domain.com'} -all`
      });
    }
    
    // DKIM推奨事項
    if (!dkimResult) {
      recommendations.push({
        type: "warning", 
        title: "DKIM署名の実装",
        content: "メールにDKIM署名を追加することで、改ざん検知とブランド保護が向上します。",
        action: "メールサーバーでDKIM署名を有効にし、DNSにDKIMレコードを登録してください。"
      });
    }
    
    // DMARC推奨事項
    if (dmarc === "none") {
      recommendations.push({
        type: "info",
        title: "DMARCポリシーの強化",
        content: "現在のポリシー「none」は監視のみです。段階的に「quarantine」→「reject」に強化することを推奨します。",
        action: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com から始めることをお勧めします。"
      });
    }
    
    // セキュリティレベル評価
    const securityLevel = (spfResult ? 1 : 0) + (dkimResult ? 1 : 0) + (dmarc !== "none" ? 1 : 0);
    const levelText = securityLevel === 3 ? "高" : securityLevel === 2 ? "中" : "低"; 
    const levelClass = securityLevel === 3 ? "high" : securityLevel === 2 ? "medium" : "low";

    recommendations.innerHTML = `
      <div class="recommendations-container">
        <h4>💡 セキュリティ改善提案</h4>
        <div class="security-level ${levelClass}">
          <span>現在のセキュリティレベル: <strong>${levelText}</strong> (${securityLevel}/3)</span>
        </div>
        ${recommendations.length > 0 ? `
          <div class="recommendation-list">
            ${recommendations.map(rec => `
              <div class="recommendation-item ${rec.type}">
                <h5>${rec.title}</h5>
                <p>${rec.content}</p>
                <div class="recommendation-action">
                  <strong>推奨アクション:</strong> ${rec.action}
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="all-good">
            <p>✅ 現在の設定は適切です。メールセキュリティが十分に確保されています。</p>
          </div>
        `}
      </div>
    `;
  }

  async function executeStep(step, ip, spf, dkim, dmarc, previousResults) {
    await sleep(400); // アニメーション効果
    
    switch (step.id) {
      case "spf":
        const spfPass = spf.includes(`ip4:${ip}`);
        return {
          status: spfPass ? "PASS" : "FAIL",
          reason: spfPass 
            ? `送信IP ${ip} はSPFレコードに登録されています`
            : `送信IP ${ip} はSPFレコードに登録されていません`,
          details: `SPFレコード: ${spf}`
        };
        
      case "dkim":
        const dkimPass = (dkim === "pass");
        return {
          status: dkimPass ? "PASS" : "FAIL", 
          reason: dkimPass
            ? "メールにDKIM署名が付与されており、検証に成功しました"
            : "DKIM署名がないか、検証に失敗しました",
          details: dkimPass ? "署名検証: 成功" : "署名検証: 失敗"
        };
        
      case "dmarc":
        const spfResult = previousResults.spf.status === "PASS";
        const dkimResult = previousResults.dkim.status === "PASS";
        
        let dmarcResult, reason;
        if (spfResult || dkimResult) {
          dmarcResult = "PASS";
          reason = "SPFまたはDKIMが成功したため、DMARC認証をパスしました";
        } else {
          if (dmarc === "none") {
            dmarcResult = "PASS (Policy: none)";
            reason = "SPF/DKIM共に失敗しましたが、DMARCポリシーがnoneのため受信します";
          } else if (dmarc === "quarantine") {
            dmarcResult = "QUARANTINE";
            reason = "SPF/DKIM共に失敗し、DMARCポリシーによりメールを隔離します";
          } else {
            dmarcResult = "REJECT";
            reason = "SPF/DKIM共に失敗し、DMARCポリシーによりメールを拒否します";
          }
        }
        
        return {
          status: dmarcResult,
          reason: reason,
          details: `DMARCポリシー: ${dmarc}`
        };
    }
  }

  function displayStepResult(step, result) {
    const stepDiv = document.createElement("div");
    stepDiv.className = `verification-step ${result.status.toLowerCase().includes('pass') ? 'success' : 'failure'}`;
    
    stepDiv.innerHTML = `
      <div class="step-header">
        <span class="step-icon">${step.icon}</span>
        <h4>${step.name}</h4>
        <span class="step-status status-${result.status.toLowerCase().replace(/[^a-z]/g, '')}">${result.status}</span>
      </div>
      <p class="step-description">${step.description}</p>
      <div class="step-details">
        <p><strong>判定理由:</strong> ${result.reason}</p>
        <p><strong>詳細:</strong> ${result.details}</p>
      </div>
    `;
    
    verificationSteps.appendChild(stepDiv);
  }

  function displayFinalResult(results, dmarcPolicy) {
    const dmarcResult = results.dmarc.status;
    const spfResult = results.spf.status === "PASS";
    const dkimResult = results.dkim.status === "PASS";
    
    let finalStatus, finalMessage, finalClass, additionalInfo = "";
    
    if (dmarcResult.includes("PASS")) {
      finalStatus = "メール受信";
      finalClass = "success";
      
      // 状況に応じた詳細メッセージ
      if (spfResult && dkimResult) {
        finalMessage = "SPF・DKIM共に認証成功。理想的な状態です。";
      } else if (spfResult && !dkimResult) {
        finalMessage = "SPF認証により受信。DKIMがあればより安全です。";
        additionalInfo = "💡 DKIMを設定すると、メールの改ざん検知も可能になります。";
      } else if (!spfResult && dkimResult) {
        finalMessage = "DKIM認証により受信。SPF設定に問題がある可能性があります。";
        additionalInfo = "⚠️ SPF設定を確認してください。設定ミスがあると将来的に問題になる可能性があります。";
      } else {
        finalMessage = "DMARCポリシーが「none」のため受信されましたが、認証は失敗しています。";
        additionalInfo = "🚨 セキュリティリスクが高い状態です。SPF・DKIM・DMARCの設定を見直してください。";
      }
    } else if (dmarcResult === "QUARANTINE") {
      finalStatus = "メール隔離";
      finalMessage = "認証に失敗したため、スパムフォルダに隔離されます。";
      finalClass = "warning";
    } else {
      finalStatus = "メール拒否";
      finalMessage = "認証に失敗したため、メールは受信拒否されます。";
      finalClass = "danger";
    }
    
    finalResult.innerHTML = `
      <div class="final-result-card ${finalClass}">
        <h3>🎯 最終判定結果</h3>
        <div class="final-status">
          <span class="status-icon">${finalClass === 'success' ? '✅' : finalClass === 'warning' ? '⚠️' : '❌'}</span>
          <strong>${finalStatus}</strong>
        </div>
        <p>${finalMessage}</p>
        ${additionalInfo ? `<div class="additional-info">${additionalInfo}</div>` : ''}
        <div class="result-breakdown">
          <small>
            <strong>認証内訳:</strong> 
            SPF: ${spfResult ? '✅ PASS' : '❌ FAIL'} | 
            DKIM: ${dkimResult ? '✅ PASS' : '❌ FAIL'} | 
            DMARC: ${dmarcResult}
          </small>
        </div>
      </div>
    `;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
});
