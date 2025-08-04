document.addEventListener("DOMContentLoaded", () => {
  const learnSection = document.getElementById("learn");

  // 既存のトピックカードを先に追加
  const topics = [
    {
      id: "spf",
      title: "SPF（Sender Policy Framework）",
      icon: "🔹",
      analogy: "📦 配達員の所属確認",
      description: "送信元IPアドレスが正当かどうかを検証する仕組み",
      technical: "ドメインのDNSに「このドメインから送信してよいIPアドレス」を登録。受信者は送信ドメインのDNSレコードを参照し、実際の送信IPと一致するかをチェックします。",
      example: "配達員が正しい建物から来ているか確認するようなもの"
    },
    {
      id: "dkim",
      title: "DKIM（DomainKeys Identified Mail）",
      icon: "🔸",
      analogy: "✍️ 封印とサイン",
      description: "メールが改ざんされていないことを保証する技術",
      technical: "送信者が電子署名をメールに付与。公開鍵はDNSに登録され、受信者側が署名を検証してメール本文やヘッダの改ざんを検出します。",
      example: "封筒に送り主のハンコが押してあり、中身がそのままと確認できるようなもの"
    },
    {
      id: "dmarc",
      title: "DMARC（Domain-based Message Authentication）",
      icon: "🔺",
      analogy: "🧑‍⚖️ ルールに基づく判断",
      description: "SPF/DKIMの結果に基づいて処理方針を決める仕組み",
      technical: "SPFとDKIMの検証結果に基づいて、受信者がどう処理すべきか（受信・隔離・拒否）をポリシーで指定。結果のレポートを送信者に返すことも可能です。",
      example: "マンションの管理人がルール表にしたがって配達を許可するか判断するようなもの"
    }
  ];

  const container = document.createElement("div");
  container.className = "learn-cards";

  topics.forEach(topic => {
    const card = document.createElement("div");
    card.className = "learn-card";
    card.innerHTML = `
      <div class="card-header">
        <span class="card-icon">${topic.icon}</span>
        <h3>${topic.title}</h3>
      </div>
      <div class="card-analogy">
        <span class="analogy-icon">${topic.analogy}</span>
      </div>
      <div class="card-content">
        <p class="card-description">${topic.description}</p>
        <div class="card-details">
          <h4>技術的な詳細</h4>
          <p>${topic.technical}</p>
        </div>
        <div class="card-example">
          <span class="example-label">💡 たとえ</span>
          <p>${topic.example}</p>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  learnSection.appendChild(container);

  // メール認証の流れセクションを追加
  const flowSection = document.createElement("div");
  flowSection.className = "flow-section";
  flowSection.innerHTML = `
    <h2>📧 メール認証の流れ</h2>
    <p>実際のメール送信から受信までの認証プロセスを視覚的に理解しましょう。</p>
  `;
  learnSection.appendChild(flowSection);

  // インタラクティブなフロー図を作成（カードの後に配置）
  const flowContainer = document.createElement("div");
  flowContainer.className = "flow-container";
  flowContainer.innerHTML = `
    <div class="flow-diagram">
      <div class="flow-step" data-step="1">
        <div class="step-icon">📮</div>
        <div class="step-label">送信者</div>
        <div class="step-detail">example@sender.com</div>
      </div>
      
      <div class="flow-arrow">→</div>
      
      <div class="flow-step" data-step="2">
        <div class="step-icon">🌐</div>
        <div class="step-label">DNS照会</div>
        <div class="step-detail">SPFレコード確認</div>
        <div class="check-badge spf-check">SPF</div>
      </div>
      
      <div class="flow-arrow">→</div>
      
      <div class="flow-step" data-step="3">
        <div class="step-icon">🔐</div>
        <div class="step-label">署名検証</div>
        <div class="step-detail">DKIM署名確認</div>
        <div class="check-badge dkim-check">DKIM</div>
      </div>
      
      <div class="flow-arrow">→</div>
      
      <div class="flow-step" data-step="4">
        <div class="step-icon">📋</div>
        <div class="step-label">ポリシー適用</div>
        <div class="step-detail">DMARC判定</div>
        <div class="check-badge dmarc-check">DMARC</div>
      </div>
      
      <div class="flow-arrow">→</div>
      
      <div class="flow-step" data-step="5">
        <div class="step-icon">📨</div>
        <div class="step-label">受信者</div>
        <div class="step-detail">recipient@example.com</div>
      </div>
    </div>
    
    <div class="flow-controls">
      <button id="play-animation" class="control-btn">▶ アニメーション再生</button>
      <button id="reset-animation" class="control-btn">↻ リセット</button>
    </div>
    
    <div id="step-explanation" class="step-explanation"></div>
  `;

  learnSection.appendChild(flowContainer);

  // ステップごとの詳細説明
  const stepExplanations = {
    1: {
      title: "メール送信",
      content: "送信者がメールを作成し、送信サーバーを通じてメールを送信します。"
    },
    2: {
      title: "SPF認証",
      content: "受信サーバーは送信元ドメインのDNSに登録されたSPFレコードを確認し、送信元IPアドレスが許可されているか検証します。"
    },
    3: {
      title: "DKIM認証",
      content: "メールに付与されたデジタル署名を、DNSに公開された公開鍵を使って検証し、メールの改ざんがないか確認します。"
    },
    4: {
      title: "DMARC判定",
      content: "SPFとDKIMの結果を総合的に判断し、送信者が設定したDMARCポリシーに従って、メールを受信・隔離・拒否のいずれかに処理します。"
    },
    5: {
      title: "メール配送",
      content: "すべての認証をパスしたメールは、受信者のメールボックスに配送されます。"
    }
  };

  // クリックイベントの設定
  const flowSteps = document.querySelectorAll(".flow-step");
  const explanationDiv = document.getElementById("step-explanation");

  flowSteps.forEach(step => {
    step.addEventListener("click", () => {
      const stepNum = step.dataset.step;
      const explanation = stepExplanations[stepNum];
      
      // すべてのステップからactiveクラスを削除
      flowSteps.forEach(s => s.classList.remove("active"));
      // クリックしたステップにactiveクラスを追加
      step.classList.add("active");
      
      // 説明を表示
      explanationDiv.innerHTML = `
        <h4>${explanation.title}</h4>
        <p>${explanation.content}</p>
      `;
      explanationDiv.classList.add("show");
    });
  });

  // アニメーション機能
  const playBtn = document.getElementById("play-animation");
  const resetBtn = document.getElementById("reset-animation");
  let animationTimeout = null;
  let isPlaying = false;

  playBtn.addEventListener("click", () => {
    if (isPlaying) {
      // 停止処理
      stopAnimation();
    } else {
      // 再生処理
      startAnimation();
    }
  });

  function startAnimation() {
    resetAnimation();
    isPlaying = true;
    playBtn.textContent = "■ 停止";
    playBtn.classList.add("playing");
    
    let currentStep = 0;
    
    const animateStep = () => {
      if (currentStep < flowSteps.length && isPlaying) {
        flowSteps[currentStep].classList.add("animated");
        
        // 対応する説明も表示
        const stepNum = flowSteps[currentStep].dataset.step;
        const explanation = stepExplanations[stepNum];
        explanationDiv.innerHTML = `
          <h4>${explanation.title}</h4>
          <p>${explanation.content}</p>
        `;
        explanationDiv.classList.add("show");
        
        currentStep++;
        animationTimeout = setTimeout(animateStep, 1500);
      } else {
        // アニメーション完了
        stopAnimation();
      }
    };
    
    animateStep();
  }

  function stopAnimation() {
    isPlaying = false;
    if (animationTimeout) {
      clearTimeout(animationTimeout);
      animationTimeout = null;
    }
    playBtn.textContent = "▶ アニメーション再生";
    playBtn.classList.remove("playing");
  }

  resetBtn.addEventListener("click", () => {
    stopAnimation();
    resetAnimation();
  });

  function resetAnimation() {
    flowSteps.forEach(step => {
      step.classList.remove("animated", "active");
    });
    explanationDiv.classList.remove("show");
    explanationDiv.innerHTML = "";
  }
});
