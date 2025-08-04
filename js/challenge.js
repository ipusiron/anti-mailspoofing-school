document.addEventListener("DOMContentLoaded", () => {
  const challengeSection = document.getElementById("challenge");

  // 問題データベース
  const questionBank = [
    // 初級レベル（基本的な判定）
    {
      id: 1,
      level: "初級",
      difficulty: 1,
      title: "基本的なSPF/DKIM失敗ケース",
      scenario: "すべての認証が失敗した明確なケース",
      log: {
        spf: "FAIL (送信IP: 203.0.113.5 が許可されていません)",
        dkim: "FAIL (署名が見つかりません)",
        dmarc: "ポリシー: reject"
      },
      correctAnswer: "reject",
      explanation: "SPF・DKIM共に失敗し、DMARCポリシーが「reject」のため、メールを拒否するのが正しい判断です。"
    },
    {
      id: 2,
      level: "初級", 
      difficulty: 1,
      title: "正常な認証パターン",
      scenario: "すべての認証が成功したケース",
      log: {
        spf: "PASS (送信IP: 192.0.2.1 が許可されています)",
        dkim: "PASS (署名検証成功)",
        dmarc: "ポリシー: none"
      },
      correctAnswer: "accept",
      explanation: "SPF・DKIM共に成功しており、メールを受信するのが正しい判断です。"
    },
    {
      id: 3,
      level: "初級",
      difficulty: 1, 
      title: "DMARC none ポリシー",
      scenario: "認証失敗だがDMARCポリシーがnone",
      log: {
        spf: "FAIL (送信IP: 203.0.113.10 が許可されていません)",
        dkim: "FAIL (署名検証失敗)",
        dmarc: "ポリシー: none"
      },
      correctAnswer: "accept",
      explanation: "SPF・DKIM共に失敗していますが、DMARCポリシーが「none」（監視のみ）のため、メールは受信されます。"
    },
    
    // 中級レベル（部分的成功・複雑なケース）
    {
      id: 4,
      level: "中級",
      difficulty: 2,
      title: "SPF失敗・DKIM成功パターン",
      scenario: "認証が部分的に成功したケース",
      log: {
        spf: "FAIL (送信IP: 198.51.100.5 が許可されていません)",
        dkim: "PASS (署名検証成功)",
        dmarc: "ポリシー: quarantine"
      },
      correctAnswer: "accept",
      explanation: "SPFは失敗していますが、DKIMが成功しているため、DMARC認証はパスします。ただし、SPF設定の確認が推奨されます。"
    },
    {
      id: 5,
      level: "中級",
      difficulty: 2,
      title: "Quarantine ポリシー適用",
      scenario: "認証失敗時の隔離処理",
      log: {
        spf: "FAIL (送信IP: 203.0.113.25 が許可されていません)",
        dkim: "FAIL (署名が見つかりません)",
        dmarc: "ポリシー: quarantine"
      },
      correctAnswer: "quarantine", 
      explanation: "SPF・DKIM共に失敗し、DMARCポリシーが「quarantine」のため、メールをスパムフォルダに隔離するのが正しい判断です。"
    },
    {
      id: 6,
      level: "中級",
      difficulty: 2,
      title: "SPF Softfail ケース",
      scenario: "SPF softfail の判定",
      log: {
        spf: "SOFTFAIL (~all により軟性失敗)",
        dkim: "FAIL (署名検証失敗)",
        dmarc: "ポリシー: quarantine"
      },
      correctAnswer: "quarantine",
      explanation: "SPF SOFTFAILは完全な失敗ではありませんが、DKIMも失敗しているため、DMARCポリシーに従い隔離処理となります。"
    },
    
    // 上級レベル（実践的・複雑なシナリオ）
    {
      id: 7,
      level: "上級",
      difficulty: 3,
      title: "メール転送時の認証問題",
      scenario: "正当なメール転送での認証失敗",
      log: {
        spf: "FAIL (転送サーバーのIPが元ドメインのSPFに含まれない)",
        dkim: "PASS (DKIM署名は保持されている)",
        dmarc: "ポリシー: reject, alignment=strict"
      },
      correctAnswer: "accept",
      explanation: "メール転送時はSPFが失敗することが多いですが、DKIMが成功していればDMARC認証はパスします。これは正当な転送と判断できます。"
    },
    {
      id: 8,
      level: "上級", 
      difficulty: 3,
      title: "サブドメインなりすまし",
      scenario: "サブドメインを使ったなりすまし攻撃",
      log: {
        spf: "PASS (サブドメインのSPFレコードが設定されている)",
        dkim: "FAIL (署名が無効)",
        dmarc: "ポリシー: reject, subdomain policy=quarantine"
      },
      correctAnswer: "quarantine",
      explanation: "SPFはパスしていますが、DKIMが失敗し、サブドメインポリシーが「quarantine」のため、隔離処理が適切です。"
    },
    {
      id: 9,
      level: "上級",
      difficulty: 3,
      title: "DKIM署名の有効期限切れ",
      scenario: "期限切れDKIM署名の処理",
      log: {
        spf: "PASS (送信IP: 192.0.2.10 が許可されています)",
        dkim: "FAIL (署名の有効期限が切れています)",
        dmarc: "ポリシー: reject"
      },
      correctAnswer: "accept",
      explanation: "DKIMは失敗していますが、SPFが成功しているため、DMARC認証はパスします。ただし、DKIM設定の更新が必要です。"
    }
  ];

  // チャレンジシステムの状態管理
  const challengeState = {
    currentQuestion: 0,
    score: { correct: 0, total: 0, streak: 0 },
    unlockedLevels: [1],
    maxLevel: 1,
    questions: [],
    isCompleted: false, // 全レベルクリア状態
    
    // 問題を難易度別に取得
    getQuestionsByLevel(level) {
      return questionBank.filter(q => q.difficulty === level);
    },
    
    // ランダムな問題を選択
    selectRandomQuestion(level) {
      const availableQuestions = this.getQuestionsByLevel(level);
      return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    },
    
    // レベル解放チェック（3回連続正解で次レベル開放）
    checkLevelUnlock() {
      // 3回連続正解で次のレベルを解放
      if (this.score.streak >= 3 && this.maxLevel < 3) {
        this.maxLevel++;
        this.unlockedLevels.push(this.maxLevel);
        // 連続正解数をリセット（次のレベル用）
        this.score.streak = 0;
        return { type: 'levelUnlock', level: this.maxLevel };
      }
      
      // 上級レベルで3回連続正解したらクリア
      if (this.maxLevel === 3 && this.score.streak >= 3 && !this.isCompleted) {
        this.isCompleted = true;
        return { type: 'gameComplete' };
      }
      
      return false;
    },
    
    // スコア更新
    updateScore(isCorrect) {
      this.score.total++;
      if (isCorrect) {
        this.score.correct++;
        this.score.streak++;
      } else {
        this.score.streak = 0;
      }
    }
  };

  challengeSection.innerHTML = `
    <div class="challenge-container">
      <div class="challenge-header">
        <h3>🎯 チャレンジモード</h3>
        <p>メール認証ログを分析して、適切な処理方法を判定しましょう！</p>
      </div>
      
      <div class="level-selector">
        <h4>難易度を選択</h4>
        <div class="level-buttons">
          <button class="level-btn active" data-level="1">
            🟢 初級<br><small>基本的な判定</small>
          </button>
          <button class="level-btn locked" data-level="2">
            🟡 中級<br><small>複雑なケース</small>
          </button>
          <button class="level-btn locked" data-level="3">
            🔴 上級<br><small>実践的シナリオ</small>
          </button>
        </div>
      </div>
      
      <div class="progress-section">
        <div class="score-display">
          <div class="score-item">
            <span class="score-label">正答率</span>
            <span class="score-value" id="accuracy">0%</span>
          </div>
          <div class="score-item">
            <span class="score-label">連続正解</span>
            <span class="score-value" id="streak">0</span>
          </div>
          <div class="score-item">
            <span class="score-label">現在のレベル</span>
            <span class="score-value" id="current-level">初級</span>
          </div>
        </div>
        <div class="level-progress">
          <div class="progress-bar-container">
            <div class="progress-bar-fill" id="level-progress"></div>
          </div>
          <small id="progress-text">初級レベルの問題を解いてください</small>
        </div>
      </div>
      
      <div class="question-container" id="question-container">
        <button id="start-challenge" class="start-btn">🚀 チャレンジ開始</button>
      </div>
    </div>
  `;

  // DOM要素を取得
  const levelButtons = document.querySelectorAll('.level-btn');
  const startButton = document.getElementById('start-challenge');
  const questionContainer = document.getElementById('question-container');
  const accuracyDisplay = document.getElementById('accuracy');
  const streakDisplay = document.getElementById('streak');
  const currentLevelDisplay = document.getElementById('current-level');
  const levelProgressBar = document.getElementById('level-progress');
  const progressText = document.getElementById('progress-text');

  let selectedLevel = 1;
  let currentQuestion = null;

  // レベル選択イベント
  levelButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const level = parseInt(btn.dataset.level);
      if (challengeState.unlockedLevels.includes(level)) {
        selectedLevel = level;
        levelButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateLevelDisplay();
        
        // レベル変更時は常にレベル選択画面を表示（問題表示中か否かに関わらず）
        showLevelSelector();
      }
    });
  });

  // チャレンジ開始
  startButton.addEventListener('click', () => {
    startNewQuestion();
  });

  function startNewQuestion() {
    currentQuestion = challengeState.selectRandomQuestion(selectedLevel);
    displayQuestion(currentQuestion);
  }

  function displayQuestion(question) {
    questionContainer.innerHTML = `
      <div class="question-card">
        <div class="question-header">
          <h4>${question.title}</h4>
          <div class="question-meta">
            <span class="level-badge level-${question.difficulty}">${question.level}</span>
            <span class="scenario-text">${question.scenario}</span>
          </div>
        </div>
        
        <div class="log-display">
          <h5>📋 認証ログ</h5>
          <pre class="auth-log">SPF 検証: ${question.log.spf}
DKIM 検証: ${question.log.dkim}
DMARC: ${question.log.dmarc}</pre>
        </div>
        
        <form id="quiz-form">
          <h5>🤔 判定してください</h5>
          <div class="answer-options">
            <label class="answer-option">
              <input type="radio" name="answer" value="accept" />
              <span class="option-text">✅ 受信（accept）</span>
              <small>メールを通常の受信箱に配送</small>
            </label>
            <label class="answer-option">
              <input type="radio" name="answer" value="quarantine" />
              <span class="option-text">⚠️ 隔離（quarantine）</span>
              <small>スパムフォルダに隔離</small>
            </label>
            <label class="answer-option">
              <input type="radio" name="answer" value="reject" />
              <span class="option-text">❌ 拒否（reject）</span>
              <small>メールを受信拒否</small>
            </label>
          </div>
          <button type="submit" class="submit-btn" disabled>判定する</button>
        </form>
        
        <div id="quiz-result" class="quiz-result"></div>
      </div>
    `;

    // フォームイベントを設定
    const form = document.getElementById('quiz-form');
    const resultBox = document.getElementById('quiz-result');
    const submitBtn = form.querySelector('.submit-btn');
    
    // ラジオボタンの変更イベントを監視
    const radioButtons = form.querySelectorAll('input[name="answer"]');
    radioButtons.forEach(radio => {
      radio.addEventListener('change', () => {
        submitBtn.disabled = false;
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const selected = document.querySelector('input[name="answer"]:checked');
      if (!selected) {
        alert("いずれかの選択肢を選んでください。");
        return;
      }

      // 回答後は再度回答できないようにボタンを無効化
      submitBtn.disabled = true;
      radioButtons.forEach(radio => radio.disabled = true);

      const answer = selected.value;
      const isCorrect = answer === question.correctAnswer;
      
      // スコア更新
      challengeState.updateScore(isCorrect);
      challengeState.questions.push({
        ...question,
        userAnswer: answer,
        userCorrect: isCorrect
      });

      // 結果表示
      displayResult(question, answer, isCorrect);
      
      // レベル解放チェック
      const unlockResult = challengeState.checkLevelUnlock();
      if (unlockResult) {
        if (unlockResult.type === 'levelUnlock') {
          showLevelUnlockMessage(unlockResult.level);
          updateLevelButtons();
        } else if (unlockResult.type === 'gameComplete') {
          showGameCompleteMessage();
        }
      }
      
      // UI更新
      updateScoreDisplay();
      updateLevelDisplay();
    });
  }

  function displayResult(question, userAnswer, isCorrect) {
    const resultBox = document.getElementById('quiz-result');
    const answerLabels = {
      accept: '✅ 受信',
      quarantine: '⚠️ 隔離', 
      reject: '❌ 拒否'
    };

    resultBox.innerHTML = `
      <div class="result-card ${isCorrect ? 'correct' : 'incorrect'}">
        <div class="result-header">
          <span class="result-icon">${isCorrect ? '🎉' : '😅'}</span>
          <h5>${isCorrect ? '正解です！' : '不正解です'}</h5>
        </div>
        
        <div class="answer-comparison">
          <div class="user-answer">
            <strong>あなたの回答:</strong> ${answerLabels[userAnswer]}
          </div>
          <div class="correct-answer">
            <strong>正解:</strong> ${answerLabels[question.correctAnswer]}
          </div>
        </div>
        
        <div class="explanation">
          <h6>💡 解説</h6>
          <p>${question.explanation}</p>
        </div>
        
        <div class="result-actions">
          <button class="next-btn" onclick="startNewQuestion()">次の問題</button>
          <button class="level-btn-small" onclick="showLevelSelector()">レベル変更</button>
        </div>
      </div>
    `;
  }

  function updateScoreDisplay() {
    const accuracy = challengeState.score.total > 0 
      ? Math.round((challengeState.score.correct / challengeState.score.total) * 100)
      : 0;
    
    accuracyDisplay.textContent = `${accuracy}%`;
    streakDisplay.textContent = challengeState.score.streak;
    
    const levelLabels = { 1: '初級', 2: '中級', 3: '上級' };
    currentLevelDisplay.textContent = levelLabels[challengeState.maxLevel];
  }

  function updateLevelButtons() {
    levelButtons.forEach((btn, index) => {
      const level = index + 1;
      if (challengeState.unlockedLevels.includes(level)) {
        btn.classList.remove('locked');
        btn.disabled = false;
      }
    });
  }

  function updateLevelDisplay() {
    const levelLabels = { 1: '初級', 2: '中級', 3: '上級' };
    const currentLevelQuestions = challengeState.getQuestionsByLevel(selectedLevel);
    const solvedInLevel = challengeState.questions
      .filter(q => q.difficulty === selectedLevel)
      .length;
    
    // ゲームクリア済みの場合
    if (challengeState.isCompleted) {
      progressText.textContent = `🏆 全レベルクリア達成！おめでとうございます！`;
      levelProgressBar.style.width = `100%`;
      return;
    }
    
    // 現在のレベルでの進捗表示
    const streakNeeded = challengeState.maxLevel < 3 ? 3 : (challengeState.maxLevel === 3 && !challengeState.isCompleted ? 3 : 0);
    const currentStreak = challengeState.score.streak;
    
    if (streakNeeded > 0) {
      progressText.textContent = `${levelLabels[selectedLevel]}レベル (${solvedInLevel}/${currentLevelQuestions.length}問解答済み) - 連続正解: ${currentStreak}/3`;
      const progress = (currentStreak / 3) * 100;
      levelProgressBar.style.width = `${Math.min(progress, 100)}%`;
    } else {
      progressText.textContent = `${levelLabels[selectedLevel]}レベル (${solvedInLevel}/${currentLevelQuestions.length}問解答済み)`;
      const progress = (solvedInLevel / currentLevelQuestions.length) * 100;
      levelProgressBar.style.width = `${Math.min(progress, 100)}%`;
    }
  }

  function showLevelUnlockMessage(level) {
    const levelLabels = { 2: '中級', 3: '上級' };
    alert(`🎉 おめでとうございます！連続3回正解で${levelLabels[level]}レベルが解放されました！`);
  }
  
  function showGameCompleteMessage() {
    setTimeout(() => {
      alert(`🏆 おめでとうございます！\n上級レベルで3回連続正解で全レベルクリアです！\n\nメール認証のスペシャリストですね！`);
    }, 1000);
  }

  function showLevelSelector() {
    currentQuestion = null; // 現在の問題をクリア
    const levelLabels = { 1: '初級', 2: '中級', 3: '上級' };
    questionContainer.innerHTML = `
      <div class="level-selector-prompt">
        <p>現在の選択レベル: <strong>${levelLabels[selectedLevel]}</strong></p>
        <button id="start-challenge" class="start-btn">🚀 ${levelLabels[selectedLevel]}レベルを開始</button>
      </div>
    `;
    document.getElementById('start-challenge').addEventListener('click', startNewQuestion);
  }

  // グローバル関数として定義（ボタンから呼び出されるため）
  window.startNewQuestion = startNewQuestion;
  window.showLevelSelector = showLevelSelector;

  // 初期表示更新
  updateScoreDisplay();
  updateLevelDisplay();
});
