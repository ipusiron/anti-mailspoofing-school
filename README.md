<!--
---
id: day035
slug: anti-mailspoofing-school

title: "Anti-MailSpoofing School"

subtitle_ja: "メールなりすまし対策学習ツール"
subtitle_en: "Email Spoofing Defense Learning Tool"

description_ja: "SPF/DKIM/DMARCとアラインメントの仕組みを、学習・シミュレーション・チャレンジの3つのモードで体験的に学べる教育用Webアプリ。判定はRFCに沿ってブラウザー内で行い、外部へは送信しません。"
description_en: "An educational web app for learning SPF, DKIM, DMARC and alignment through learning cards, a step-by-step simulation and a progressive challenge. Everything is evaluated in the browser, following the RFCs, with no network access."

category_ja:
  - メールセキュリティ
category_en:
  - Email Security

difficulty: 2

tags:
  - SPF
  - DKIM
  - DMARC
  - email-authentication
  - phishing-prevention
  - security-education

repo_url: "https://github.com/ipusiron/anti-mailspoofing-school"
demo_url: "https://ipusiron.github.io/anti-mailspoofing-school/"

hub: true
---
-->

# Anti-MailSpoofing School - メールなりすまし対策学習ツール

[English](README.en.md) · 日本語

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/anti-mailspoofing-school?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/anti-mailspoofing-school?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/anti-mailspoofing-school)
![GitHub license](https://img.shields.io/github/license/ipusiron/anti-mailspoofing-school)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/anti-mailspoofing-school/)

**Day035 - 生成AIで作るセキュリティツール100**

**Anti-MailSpoofing School** は、メールのなりすまし対策（SPF・DKIM・DMARC）を体験的に学べる教育用ツールです。

1通のメールの条件を入れると、受信サーバーが SPF → DKIM → アラインメント → DMARC の順にどう判定するかを表示します。判定はすべてブラウザーの中で行い、メールの送信や DNS への問い合わせはしません。

SPF・DMARC レコードの書き方の診断と、受信したメールの Authentication-Results ヘッダーの読み解きもできます。

---

## 🌐 デモページ

👉 [https://ipusiron.github.io/anti-mailspoofing-school/](https://ipusiron.github.io/anti-mailspoofing-school/)

---

## 📸 スクリーンショット

> ![別ドメインで SPF に合格しても、From とそろわないので DMARC は fail になり拒否される](assets/screenshot.png)
>
> *シミュレーション: 別ドメインで SPF に合格しても、From とそろわず拒否される*

> ![チャレンジで認証ログを読んで処理を答えた画面](assets/screenshot2.png)
>
> *チャレンジ: 認証ログを読んで受信・隔離・拒否を答える*

> ![英語表示のシミュレーション。外部の配信サービスでも DKIM がそろえば DMARC は pass](assets/en/screenshot.png)
>
> *英語表示: 外部の配信サービスでも、DKIM がそろえば DMARC は pass*

> ![レコード診断で、問題の多い SPF と DMARC のレコードの誤り・注意・参考を一覧にした画面](assets/screenshot3.png)
>
> *レコード診断: 問題の多いレコードの誤り・注意・参考を一覧にする*

> ![英語表示のヘッダー解読。Authentication-Results が2つあり、下の偽のヘッダーは pass と書いている](assets/en/screenshot2.png)
>
> *英語表示のヘッダー解読: 下の偽のヘッダーは pass と書いているが、信頼できるのは自分の受信サーバーが付けた上のものだけ*

---

## ✨ 機能

### 📘 学習モード

- SPF・DKIM・DMARC とアラインメントの考え方を、宅配便のたとえつきのカードで説明する
- メール認証の流れを5つの手順で示し、各手順を押すと説明が出る（アニメーションでも順に表示できる）

### 🧪 シミュレーション

- From のドメイン、MAIL FROM（Return-Path）のドメイン、送信元 IP、SPF レコード、DKIM の結果と署名のドメイン（d=）、DMARC レコードを入れて判定する
- 受信サーバーが引く DNS レコード（`TXT ＜MAIL FROM のドメイン＞`・`TXT _dmarc.＜組織ドメイン＞` など）を示す
- SPF → DKIM → アラインメント → DMARC の順に結果と理由を表示し、最後に受信・隔離・拒否を示す
- 結果に応じて改善の提案（SPF への追加、アラインメント、DKIM 署名、p=none からの段階的な強化）を出す
- プリセット10件: 正常なメール、なりすまし、別ドメインで SPF 合格、DKIM 失敗、p=none、転送、外部の配信サービス、厳密な SPF アラインメント、サブドメインのポリシー、IP の部分一致に注意

### 🎯 チャレンジ

- 認証ログを読んで、受信・隔離・拒否のどれになるかを答える
- 初級・中級・上級の各4問（計12問）。正解はシミュレーションと同じ判定の処理で計算する
- 解放済みの最高レベルで3回続けて正解すると、次のレベルへ進める。同じ問題は続けて出ない
- 正誤にかかわらず解説を表示する

### 🩺 レコード診断

- SPF と DMARC のレコードを貼ると、書き方の誤りと危険な設定を「誤り・注意・参考」の3段階で示す
- SPF: `v=spf1` の位置、レコードの重複、知らない項目、IP アドレスと範囲の書き方、`+all`・`?all`、`all` のあとの項目、`ptr`、DNS の問い合わせ回数（上限10回）、255文字を超える長さ
- DMARC: `v=DMARC1` が最初にあるか、`p=`・`sp=`・`adkim=`・`aspf=`・`pct=` の値、`rua=`・`ruf=` が `mailto:` で始まるか、タグの重複と知らないタグ、`p=none` の監視止まり、`rua=` がないこと
- 良い例と問題の多い例のサンプルつき

### 📨 ヘッダー解読

- 受信したメールのヘッダーを貼ると、`Authentication-Results` の spf・dkim・dmarc の結果を読み解く
- 折り返した行とかっこのコメントを処理し、SPF の `smtp.mailfrom`・DKIM の `header.d` と `header.from` がそろっているか（relaxed）を示す
- `Authentication-Results` が2つ以上あると、信頼できるのは自分の受信サーバーが付けたもの（ふつうはいちばん上）だけだと警告する
- サンプル3件: すべて合格、なりすまし（偽のヘッダーつき）、転送

### 🌏 日英表示・ヘルプ

- 右上のボタンで日本語と英語を切り替える（URL の `?lang=ja|en` でも指定できる）
- 右上の「?」でヘルプを開く

---

## 📖 使い方

1. **📘 学習モード**で、4枚のカードと認証の流れを読む
2. **🧪 シミュレーション**で、プリセットを順に判定して結果の違いを確かめる。値を書き換えて自分の条件でも試す
3. **🎯 チャレンジ**で、認証ログから処理を当てる。解説を読みながら上級まで進める
4. **🩺 レコード診断**で、自分のドメインの SPF・DMARC レコード（DNS の TXT レコードの値）を貼って確かめる
5. **📨 ヘッダー解読**で、受信したメールのヘッダー（メールソフトの「ソースを表示」など）を貼って結果を読む

ファイルを直接開いても（file://）、Web サーバー経由でも動きます。

---

## 🎓 対象読者

- メールのなりすまし対策を理解したい学生・社会人
- SPF・DKIM・DMARC の違いや連携に混乱している初学者
- セキュリティ教育者・講師
- 実務でメールサーバーを扱うが、認証の流れに不安がある人

---

## 🛡️ メールセキュリティの体系的解説

### メールなりすまし攻撃の背景

メールの送信の手順（SMTP）は1982年に標準化されました（RFC 821）。当初は送信者の身元を確かめる仕組みがなく、誰でも他人や組織の名前で差出人（From）を書けました。このため、攻撃者が他人や組織になりすましてメールを送る状況が続いてきました。

#### 主な脅威

- **フィッシング攻撃**: 正規の企業を装った詐欺メール
- **ビジネスメール詐欺（BEC）**: 経営陣や取引先になりすました送金詐欺
- **マルウェア配布**: 信頼できる送信者を装ったウイルス拡散
- **ブランド悪用**: 企業の信頼性を損なう偽装メール

### メール認証技術の進化

これらの脅威に対抗するため、3つの認証技術が段階的に整えられてきました。

- **SPF**（2003年に提案。現在の仕様は RFC 7208）: 送信元の IP アドレスが正当かを確認する
- **DKIM**（RFC 4871・2007年。現在の仕様は RFC 6376）: メールが改ざんされていないかと、署名したドメインを確認する
- **DMARC**（2012年に仕様を公開。RFC 7489）: SPF・DKIM の結果と From のドメインを突き合わせ、失敗したときの扱いを宣言する

---

## 🧰 SPF / DKIM / DMARC の仕組み

それぞれの技術を、**宅配便の配達にたとえて**説明します。

### 📦 SPF（配達員の所属確認）

> 🕵️‍♂️「この配達員（IP アドレス）は、名乗った会社（MAIL FROM のドメイン）から出していいと登録されている？」

- 受信サーバーは MAIL FROM（Return-Path）のドメインの SPF レコードを DNS で引き、送信元の IP が含まれるかを確かめる
- 結果は pass・fail・softfail・neutral・none・permerror など
- たとえ: 配達員が、名乗った会社の社員名簿に載っているかを確かめる

### ✍️ DKIM（荷物に押された封印・サイン）

> ✉️「この荷物（メール）は確かに送り主が封をした。中身も途中で変えられていない」

- 送信側が秘密鍵で電子署名を付け、署名したドメインを d= に書く。検証用の公開鍵は DNS に登録する
- 受信側は公開鍵で署名を検証する。転送されても署名は残る
- たとえ: 封筒に送り主の印が押してあり、中身がそのままと確かめられる

### 🧑‍⚖️ DMARC（ルールにしたがって処理）

> 📜「From の会社は、認証に失敗した荷物をどう扱ってほしいと決めている？」

- From のドメインの持ち主が、`_dmarc.＜ドメイン＞` に DMARC レコードを置く
- SPF か DKIM が合格し、しかもそのドメインが From とそろっていれば pass
- fail のときに受信側へ求める処置を p=（none・quarantine・reject）で宣言する。サブドメインには sp= を使える
- たとえ: マンションの管理人が、住人の決めたルール表にしたがって配達物を扱う

### 🪪 アラインメント（名札と差出人の一致）

> 🧐「合格した配達員の会社名は、差出人に書かれた会社名と同じ？」

- 攻撃者は自分のドメインで SPF や DKIM に合格できる。そこで DMARC は、合格したドメインが From とそろっているかも見る
- relaxed（既定）: 同じ組織ドメインならそろう（例: `bounce.example.com` と `example.com`）
- strict（`aspf=s`・`adkim=s`）: 完全に同じドメインのときだけそろう

### 🧠 まとめ

| 技術 | 目的 | 見るもの | たとえ |
|------|------|----------|--------|
| SPF | 送信元の正当性の確認 | MAIL FROM のドメインと送信元 IP | 配達員の所属確認 |
| DKIM | 改ざんの検出と署名者の確認 | 電子署名と d= のドメイン | 封印とサイン |
| DMARC | 失敗したときの扱いの宣言 | そろった SPF・DKIM の合格 | 管理人のルール表 |
| アラインメント | From とのそろい方の確認 | From と各ドメインの一致 | 名札と差出人の一致 |

### ❗ よくある誤解と注意点

- SPF に合格しても、そのドメインが From とそろっていなければ DMARC には効かない（別ドメインでの合格によるなりすましを防ぐため）
- DMARC は、そろった SPF の合格か、そろった DKIM の合格の**どちらか一方**があれば pass
- SPF の softfail（`~all`）は、DMARC では合格に数えない
- `p=none` は「合格」ではなく「処置を求めない（監視だけ）」。DMARC の判定は fail のまま
- 転送すると SPF は失敗しやすい。DKIM の署名は残るので、DKIM がそろっていれば DMARC は pass になる

---

## 🔬 仕様と既知解答

このツールの判定は `js/mailauth-core.js` だけにあり、シミュレーションとチャレンジの両方が同じ処理を使います。

- **SPF**（RFC 7208）: 左から順に評価し、最初に一致した項目の限定子（`+` pass・`-` fail・`~` softfail・`?` neutral）で結果を決める。`ip4`・`ip6` は CIDR の範囲で照合し、文字列の部分一致では合格にしない。どれにも一致せず `all` もなければ neutral、レコードがなければ none、書き方の誤りは permerror
- **DMARC**（RFC 7489）: From のドメインについて、SPF の合格が MAIL FROM のドメインで、DKIM の合格が d= のドメインでそろっているかを見る。どちらかがそろっていれば pass。fail なら、From が組織ドメインそのものなら p=、サブドメインなら sp=（なければ p=）の処置
- **組織ドメイン**: 右から2つのラベル。`co.jp`・`co.uk` など、2つのラベルからなる公開の接尾辞は短い一覧で扱い、3つのラベルにする

以前の版の誤りと訂正:

- SPF を文字列の部分一致で判定していたため、`ip4:192.0.2.10` のレコードで送信元 `192.0.2.1` が pass になっていた（下の表の最後の行）
- アラインメントを見ていなかったため、別ドメインで SPF に合格したなりすましを見抜けなかった。チャレンジの上級問題（サブドメイン）の正解も誤っていた

### SPF の既知解答

| SPF レコード | 送信元 IP | 結果 |
| --- | --- | --- |
| `v=spf1 ip4:192.0.2.0/24 -all` | `192.0.2.1` | `pass` |
| `v=spf1 ip4:192.0.2.0/24 -all` | `203.0.113.5` | `fail` |
| `v=spf1 ip4:192.0.2.0/24 ~all` | `203.0.113.5` | `softfail` |
| `v=spf1 ip6:2001:db8::/32 -all` | `2001:db8::25` | `pass` |
| `v=spf1 include:_spf.example.net ?all` | `198.51.100.7` | `neutral` |
| `v=spf1 ip4:192.0.2.300 -all` | `192.0.2.1` | `permerror` |
| （なし） | `192.0.2.1` | `none` |
| `v=spf1 ip4:192.0.2.10 -all` | `192.0.2.1` | `fail` |

### プリセットの判定

| シナリオ | From | MAIL FROM | 送信元 IP | SPF | DKIM | DMARC レコード | DMARC | 処理 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 正常なメール (`normal`) | `example.com` | `example.com` | `192.0.2.1` | `pass` | `pass (d=example.com)` | `v=DMARC1; p=reject` | `pass` | `accept` |
| なりすまし（SPF 失敗） (`spoof`) | `example.com` | `example.com` | `203.0.113.5` | `fail` | `none` | `v=DMARC1; p=reject` | `fail` | `reject` |
| 別ドメインで SPF 合格 (`unaligned`) | `example.com` | `mail.example.net` | `203.0.113.5` | `pass` | `none` | `v=DMARC1; p=reject` | `fail` | `reject` |
| DKIM 失敗・SPF で救済 (`dkim-fail`) | `example.com` | `example.com` | `192.0.2.1` | `pass` | `fail (d=example.com)` | `v=DMARC1; p=quarantine` | `pass` | `accept` |
| すべて失敗・p=none (`monitor`) | `example.com` | `example.com` | `203.0.113.5` | `fail` | `fail (d=example.com)` | `v=DMARC1; p=none` | `fail` | `accept` |
| 転送されたメール (`forwarded`) | `example.com` | `example.com` | `198.51.100.20` | `fail` | `pass (d=example.com)` | `v=DMARC1; p=reject` | `pass` | `accept` |
| 外部の配信サービス (`esp`) | `example.com` | `bounce.example.org` | `198.51.100.7` | `pass` | `pass (d=example.com)` | `v=DMARC1; p=reject` | `pass` | `accept` |
| 厳密な SPF アラインメント (`strict`) | `example.com` | `bounce.example.com` | `192.0.2.1` | `pass` | `none` | `v=DMARC1; p=reject; aspf=s` | `fail` | `reject` |
| サブドメインのポリシー (`subdomain`) | `news.example.com` | `news.example.com` | `203.0.113.9` | `fail` | `fail (d=news.example.com)` | `v=DMARC1; p=reject; sp=quarantine` | `fail` | `quarantine` |
| IP の部分一致に注意 (`substring`) | `example.com` | `example.com` | `192.0.2.1` | `fail` | `none` | `v=DMARC1; p=quarantine` | `fail` | `quarantine` |

### レコード診断の既知解答

`js/mailauth-tools.js` の `lintSpf()`・`lintDmarc()` の結果です。

| 種類 | レコード | 判定 | 指摘 |
| --- | --- | --- | --- |
| SPF | `v=spf1 ip4:192.0.2.0/24 include:_spf.example.net -all` | `ok` | 参考: DNS の問い合わせが要る項目はこのレコードだけで 1 個です。include 先の分も合わせて 10 回までに収めます。<br>参考: -all で、ほかの送信元を fail にしています。 |
| SPF | `v=spf1 ip4:192.0.2.0/24 ~all` | `ok` | 参考: ~all は、ほかの送信元を softfail にします。DMARC では合格に数えません。 |
| SPF | `v=spf1 +all` | `error` | 誤り: +all は、どの IP からの送信も許可します。なりすましを防げないので使いません。 |
| SPF | `v=spf1 include:_spf.example.net` | `warning` | 注意: all も redirect= もありません。どれにも一致しない送信元は neutral になります。<br>参考: DNS の問い合わせが要る項目はこのレコードだけで 1 個です。include 先の分も合わせて 10 回までに収めます。 |
| SPF | `v=spf1 ip4:192.0.2.300 ptr -all ip4:198.51.100.0/24` | `error` | 誤り: IP アドレスや範囲の書き方が正しくありません: ip4:192.0.2.300<br>注意: ptr は使わないことが推奨されています（RFC 7208）。<br>注意: all のあとの項目は評価されません: ip4:198.51.100.0/24<br>参考: DNS の問い合わせが要る項目はこのレコードだけで 1 個です。include 先の分も合わせて 10 回までに収めます。<br>参考: -all で、ほかの送信元を fail にしています。 |
| DMARC | `v=DMARC1; p=reject; sp=reject; rua=mailto:dmarc@example.com` | `ok` | 参考: p=reject で、失敗したメールの拒否を求めています。 |
| DMARC | `v=DMARC1; p=none` | `warning` | 注意: rua=（集計レポートの送り先）がありません。正当な送信元の確認に役立ちます。<br>参考: p=none は監視だけです。集計レポートで確かめてから quarantine、reject へ強めます。<br>参考: sp= がないので、サブドメインにも p=none が使われます。 |
| DMARC | `p=reject; v=DMARC1; adkim=x; rua=dmarc@example.com` | `error` | 誤り: v=DMARC1 を最初に書く必要があります。<br>誤り: adkim= の値が正しくありません（r か s）: x<br>誤り: rua= の送り先は mailto: で始めます: dmarc@example.com<br>参考: p=reject で、失敗したメールの拒否を求めています。<br>参考: sp= がないので、サブドメインにも p=reject が使われます。 |

### ヘッダー解読の既知解答

ヘッダー解読のサンプルを `readHeaders()` で読んだ結果です。✓ は From とそろう、✗ はそろわない、— は合格でないので見ていないことを表します。

| サンプル | 順番 | 付けたサーバー | SPF | DKIM | DMARC |
| --- | --- | --- | --- | --- | --- |
| すべて合格 (`pass`) | 1 | `mx.example.net` | `pass` bounce.example.com ✓ | `pass` example.com ✓ | `pass` |
| なりすまし (`spoof`) | 1 | `mx.example.net` | `fail` example.com — | `none` — | `fail` |
| なりすまし (`spoof`) | 2 | `mx.example.org` | `pass` example.com ✓ | `pass` example.com ✓ | `pass` |
| 転送 (`forward`) | 1 | `mx.example.net` | `softfail` example.com — | `pass` example.com ✓ | `pass` |

### 簡略化していること

- SPF の `include`・`a`・`mx`・`exists`・`ptr`・`redirect=` は DNS の問い合わせが要るので評価せず、「評価しなかった項目」として表示する
- 組織ドメインは短い一覧で求める（実際の受信サーバーは Public Suffix List を使う）
- DKIM は結果（pass・fail・none）と署名のドメインを選ぶ形で、署名の計算はしない
- DMARC の `pct=` と、受信側の独自の方針（ローカルポリシー）は扱わない
- レコード診断は `include` 先のレコードを引かないので、DNS の問い合わせ回数は貼ったレコードの中だけで数える
- ヘッダー解読は、ヘッダーが本物かどうかを確かめられない。アラインメントは relaxed だけで示す

---

## 🔬 技術仕様の詳細

### SPF レコード

```dns
; SPF レコードの例
example.com. IN TXT "v=spf1 ip4:192.0.2.0/24 include:_spf.example.net -all"
```

- `v=spf1`: SPF のバージョン1
- `ip4:192.0.2.0/24`: 許可する IPv4 の範囲（`ip6:` で IPv6）
- `include:_spf.example.net`: 他のドメインの SPF レコードを取り込む
- `-all`: ほかは fail（厳格）／`~all`: softfail／`?all`: neutral／`+all`: すべて許可（使わない）

### DKIM レコード

```dns
; DKIM の公開鍵の例（セレクター selector1）
selector1._domainkey.example.com. IN TXT "v=DKIM1; k=rsa; p=MIGfMA0GCS..."
```

1. 送信側: 秘密鍵でヘッダーと本文に電子署名を付け、`d=example.com; s=selector1` などを書く
2. DNS: 公開鍵を `＜セレクター＞._domainkey.＜ドメイン＞` の TXT レコードに置く
3. 受信側: DNS から公開鍵を取り出して署名を検証する

### DMARC レコード

```dns
; DMARC レコードの例
_dmarc.example.com. IN TXT "v=DMARC1; p=quarantine; sp=reject; adkim=r; aspf=r; rua=mailto:dmarc@example.com"
```

- `p=none`: 処置を求めない（監視だけ）
- `p=quarantine`: 迷惑メールフォルダーなどへの隔離を求める
- `p=reject`: 受信の拒否を求める
- `sp=`: サブドメインに使うポリシー（なければ p= と同じ）
- `adkim=`・`aspf=`: アラインメントの方式（`r` relaxed・`s` strict。既定は r）
- `rua=`: 集計レポートの送り先

---

## 🏢 実装における段階的アプローチ

### フェーズ1: 監視・分析

1. **SPF**: 送信に使うすべてのサーバーを洗い出し、`~all` で運用を始める
2. **DKIM**: 主要な送信システムで、From のドメインの DKIM 署名を付ける
3. **DMARC**: `p=none` と `rua=` で集計レポートを集め、正当な送信元を確かめる

### フェーズ2: 段階的強化

1. **SPF**: 不要な許可を削り、`-all` に変える
2. **DKIM**: 外部の配信サービスを含むすべての送信経路で、From のドメインで署名させる
3. **DMARC**: `p=quarantine` に上げて影響を確かめる

### フェーズ3: 完全保護

1. **DMARC**: `p=reject` にする
2. **継続監視**: 集計レポートで新しい送信元や設定の漏れを見つける
3. **サブドメイン**: `sp=reject` でサブドメインも守る

---

## 🔒 このツールのセキュリティ

- メールの送信・DNS への問い合わせ・外部への通信はしない（CSP の `default-src 'none'`）
- CSP は `script-src 'self'`・`style-src 'self'` で、インラインのスクリプトとスタイルを使わない
- 入力は DOM の `textContent` で表示し、HTML として解釈しない
- 貼ったレコードとヘッダーはブラウザーの中だけで処理し、保存も送信もしない
- localStorage に保存するのは表示言語だけ（使えない環境でも動く）

---

## 🧪 テスト

```bash
npm test
```

- Node.js 22 以上。依存パッケージはない（`node --test`）
- GitHub Actions で、push と pull_request のたびに実行する
- `test/core.test.js`: SPF・組織ドメイン・アラインメント・DMARC の判定
- `test/data.test.js`: プリセットと12問の判定（正解はコードで計算）、例示用のドメインとアドレスだけを使っていること、チャレンジの進み方
- `test/html.test.js`: CSP・ARIA・禁止する書き方（innerHTML・インラインのハンドラーなど）
- `test/i18n.test.js`: 日英の辞書のキーの一致、英語に日本語が残らないこと
- `test/tools.test.js`: レコード診断の指摘、DNS の問い合わせ回数、ヘッダーの読み解きとアラインメント、すべての指摘に日英の文があること
- `test/contrast.test.js`: 配色のコントラスト比
- `test/format.test.js`: 行の長さと行数
- `test/readme.test.js`: この README と README.en.md の表の値、構成、画像

---

## 📁 ディレクトリー構造

```
anti-mailspoofing-school/
├── .github/                 # GitHub の設定
│   └── workflows/           # GitHub Actions のワークフロー
│       └── test.yml         # push と pull_request で npm test を実行する
├── assets/                  # 画像
│   ├── en/                  # 英語の画面のスクリーンショット
│   │   ├── screenshot.png   # 英語のシミュレーション（外部の配信サービス）
│   │   └── screenshot2.png  # 英語のヘッダー解読（偽のヘッダーつき）
│   ├── screenshot.png       # シミュレーション（別ドメインで SPF 合格→拒否）
│   ├── screenshot2.png      # チャレンジの解答後
│   └── screenshot3.png      # レコード診断（問題の多い例）
├── js/                      # スクリプト（classic script）
│   ├── challenge-logic.js   # チャレンジの進み方の規則（DOM を使わない）
│   ├── challenge.js         # チャレンジの画面
│   ├── checker.js           # レコード診断の画面
│   ├── headers.js           # ヘッダー解読の画面
│   ├── i18n.js              # 日英の辞書と言語の切り替え
│   ├── learn.js             # 学習モードの画面
│   ├── mailauth-core.js     # SPF・アラインメント・DMARC の判定（DOM を使わない）
│   ├── mailauth-data.js     # プリセット10件・問題12問・サンプルのデータ
│   ├── mailauth-tools.js    # レコードの文法チェックとヘッダーの読み解き（DOM を使わない）
│   ├── main.js              # タブ・ヘルプ・言語の切り替え
│   └── simulate.js          # シミュレーションの画面
├── test/                    # 自動テスト（node --test）
│   ├── contrast.test.js     # 配色のコントラスト比
│   ├── core.test.js         # 判定の処理
│   ├── data.test.js         # プリセット・問題・チャレンジの進み方
│   ├── format.test.js       # 行の長さと行数
│   ├── html.test.js         # CSP・ARIA・禁止する書き方
│   ├── i18n.test.js         # 日英の辞書
│   ├── readme.test.js       # README の表・構成・画像
│   └── tools.test.js        # レコード診断とヘッダー解読
├── .gitignore               # Git の管理から外すファイル
├── .nojekyll                # GitHub Pages で Jekyll を使わない
├── CLAUDE.md                # Claude Code 向けの説明（英語）
├── LICENSE                  # MIT ライセンス
├── README.en.md             # 英語の説明
├── README.md                # 日本語の説明
├── index.html               # 5タブの画面
├── package.json             # npm test の設定（依存なし）
└── style.css                # スタイル
```

---

## 💻 動作環境

- Chrome・Edge・Firefox・Safari の最近の版
- ファイルを直接開いても（file://）、Web サーバー経由でも動く
- 幅320pxのスマートフォンから表示できる

---

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) をご覧ください。

---

## 🛠️ このツールについて

本ツールは、「生成AIで作るセキュリティツール100」プロジェクトの一環として開発されました。 このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを100日間にわたり制作・公開していく取り組みを行っています。

プロジェクトの詳細や他のツールについては、以下のページをご覧ください。

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
