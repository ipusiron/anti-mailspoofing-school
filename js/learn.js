document.addEventListener("DOMContentLoaded", () => {
  const learnSection = document.getElementById("learn");

  const topics = [
    {
      id: "spf",
      title: "🔹 SPF（Sender Policy Framework）",
      description: `
        SPFは、ドメインのDNSに「このドメインから送信してよいIPアドレス」を登録することで、<strong>送信元IPが正当かどうか</strong>を検証する仕組みです。<br>
        メール受信者は、送信ドメインのDNSレコードを参照し、実際の送信IPと一致するかをチェックします。`
    },
    {
      id: "dkim",
      title: "🔸 DKIM（DomainKeys Identified Mail）",
      description: `
        DKIMは、送信者が<strong>電子署名</strong>をメールに付与することで、メール本文やヘッダが改ざんされていないことを保証する技術です。<br>
        公開鍵はDNSに登録され、受信者側が検証に使います。`
    },
    {
      id: "dmarc",
      title: "🔺 DMARC（Domain-based Message Authentication, Reporting and Conformance）",
      description: `
        DMARCは、SPFとDKIMの検証結果に基づいて、<strong>受信者がどう処理すべきか（受信・隔離・拒否）</strong>をポリシーで指定できる仕組みです。<br>
        また、結果のレポートを送信者に返すことも可能です。`
    }
  ];

  const container = document.createElement("div");
  container.className = "learn-cards";

  topics.forEach(topic => {
    const card = document.createElement("div");
    card.className = "learn-card";
    card.innerHTML = `
      <h3>${topic.title}</h3>
      <p>${topic.description}</p>
    `;
    container.appendChild(card);
  });

  learnSection.appendChild(container);
});
