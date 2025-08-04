# Anti-MailSpoofing School - メールなりすまし対策学習ツール

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/anti-mailspoofing-school?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/anti-mailspoofing-school?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/anti-mailspoofing-school)
![GitHub license](https://img.shields.io/github/license/ipusiron/anti-mailspoofing-school)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/anti-mailspoofing-school/)

**Day035 - 生成AIで作るセキュリティツール100**

**Anti-MailSpoofing School** は、メールなりすまし対策を学べる教育用ツールです。

メールのなりすまし攻撃（Mail Spoofing）に対抗するための仕組み（SPF/DKIM/DMARC）を、視覚的かつ体験的に学べます。

---

## 🌐 デモページ

👉 [https://ipusiron.github.io/anti-mailspoofing-school/](https://ipusiron.github.io/anti-mailspoofing-school/)

---

## 📸 スクリーンショット

> ![ダミー](assets/screenshot.png)
>
> *ダミー*

---

## 🔰 このツールでできること

本ツールは以下の3つの学習モードを備えています。

---
### 🧠 1. 学習モード（Learn）
- SPF/DKIM/DMARCの違いや役割を図解付きで解説。
- なぜこれらが必要なのか、どう組み合わせると有効なのかを視覚的に学べる。

---
### 🧪 2. シミュレーションモード（Simulate）
- 仮想的な送信メールに対して、以下の条件を設定できる。
  - 送信元IPアドレス
  - DKIM署名の有無
  - SPF/DKIMレコードの内容
  - DMARCポリシーの指定
- 条件に基づいて、受信側でどのような認証判断が行われるかをステップ実行で表示する。

---
### 🎯 3. チャレンジモード（Challenge）
- SPF/DKIM/DMARCの検証結果ログをもとに、「このメールは受け取ってよいか？」をユーザーが判断する。
- 解説付きのフィードバックで、理解を深めるクイズ形式の学習が可能。

---

## 🎓 対象読者

- メールのなりすまし対策を理解したい学生・社会人
- SPF/DKIM/DMARCの違いや連携に混乱している初学者
- セキュリティ教育者・講師
- 実務でメールサーバーを扱うが、認証の流れに不安がある方

---

## 🛠️ 技術スタック

- HTML / CSS / JavaScript（フロントエンドのみ）
- クライアントサイドで完結、サーバー不要
- GitHub Pagesによるデモ公開対応

---

## 📂 ディレクトリー構成

```
anti-mailspoofing-school/
├── index.html
├── style.css
├── js/
│   ├── main.js         ← タブ切り替えと初期化
│   ├── learn.js        ← 学習タブの処理
│   ├── simulate.js     ← シミュレーションタブの処理
│   └── challenge.js    ← チャレンジタブの処理
└── images/（※任意）
```

---

## 🧰 SPF / DKIM / DMARC の仕組み

メールの送信元を検証する技術は、次の3つが基本です。

- **SPF**：IPアドレスの正当性を確認する。
- **DKIM**：メールが改ざんされていないかを確認する。
- **DMARC**：SPF/DKIMの結果に応じて、受け入れるかどうかを判断する。

それぞれの技術を、**宅配便の配達にたとえて** 説明します。

---

### 📦 SPF（差出人の住所チェック）

> 🕵️‍♂️「この住所（ドメイン）から、この配達員（IPアドレス）が出していいって、事前に登録されてる？」

- 送信元IPが、そのドメインのDNSに登録されているかをチェックする。
- 登録されていればPASS、そうでなければFAILと判定する。
- たとえ：配達員が正しい建物から来ているか確認する。

---

### ✍️ DKIM（荷物に押された封印・サイン）

> ✉️「この荷物（メール）は確かに送り主が封をした。中身も途中で変えられていない！」

- メールに電子署名がついているか、改ざんされていないかを検証。
- 公開鍵はDNSに登録、受信側が検証に使う。
- たとえ：封筒に送り主のハンコが押してあり、中身がそのままと確認できる。

---

### 🧑‍⚖️ DMARC（ルールにしたがって処理）

> 📜「SPFやDKIMが失敗した場合、この荷物はどうするか？受け取る？保留？拒否？」

- SPF/DKIMの結果をもとに、受信側の処理方針を決める。
- none/quarantine/rejectのいずれかのポリシーをDNSで指定。
- たとえ：マンションの管理人がルール表にしたがって配達を許可するか判断する。

---

### 🧠 まとめ

| 技術 | 目的 | 検証対象 | たとえ |
|------|------|-----------|--------|
| SPF | 送信元の正当性確認 | IPアドレス | 配達員の所属確認 |
| DKIM | メールの改ざん検出 | 電子署名 | 封印があるかどうか |
| DMARC | ポリシーに基づく処理 | SPF/DKIMの結果 | 管理人のルール表で判断 |

---

### ❗ よくある誤解と注意点

SPFとDKIMはそれぞれ独立して機能します。

- DMARCは、 **どちらか一方がPASSでもOK**（ただし、Fromドメインとの整合性が必要）。
- DKIMは、途中でメール内容が書き換えられると検証失敗（改ざん検知）。

---

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) をご覧ください。

---

## 🛠 このツールについて

本ツールは、「生成AIで作るセキュリティツール100」プロジェクトの一環として開発されました。 このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを100日間にわたり制作・公開していく取り組みを行っています。

プロジェクトの詳細や他のツールについては、以下のページをご覧ください。

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
