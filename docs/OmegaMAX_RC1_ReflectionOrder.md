# ΩMAX Ver.1.0 RC1 反映順メモ v1.0.0

## 目的

このメモは、ΩMAX Ver.1.0 RC1 に向けて、
作成済みの統合コードを GitHub / VS Code / GAS へ反映する順番を固定するためのもの。

重要方針は以下。

- 新機能追加より RC1 完成を優先する
- 既存コードとの整合性を最優先する
- 反映順を間違えて依存エラーを出さない
- 1ファイル反映ごとに軽い確認を行う
- 最後に全体実行テストを行う


---

## 現在のRC1目標構成

Main
  ↓
OmegaPipeline
  ↓
OmegaDataLayer
  ↓
FeatureEngine
  ↓
CoreEngine
  ↓
AIBrain
  ↓
TicketEngine
  ↓
BacktestEngine
  ↓
LearningEngine
  ↓
DashboardEngine


---

## 反映する主要ファイル

### 1. Main.js

役割：
- ΩMAXの実行入口
- OmegaPipeline.run() を呼び出す
- healthCheck / dryRun / dailyRun の入口を持つ

VS Code保存名：
Main.js

GAS上のファイル名：
Main


---

### 2. OmegaPipeline.js

役割：
- DataLayerからレース取得
- Race標準化
- FeatureEngine実行
- CoreEngine実行
- AIBrain実行
- TicketEngine実行
- Backtest / Learning / Dashboard連携

VS Code保存名：
OmegaPipeline.js

GAS上のファイル名：
OmegaPipeline

反映するコード：
OmegaPipeline_AIBrainIntegration_v1.0.0


---

### 3. TicketEngine.js

役割：
- AIBrain結果を受けて買い目生成
- buildFromAIBrain() を正式実装
- 既存 build() は後方互換として維持
- Confidence / EV / Risk / Bankroll を統合

VS Code保存名：
TicketEngine.js

GAS上のファイル名：
TicketEngine

反映するコード：
TicketEngine_AIBrainComplete_v1.0.0


---

### 4. BacktestEngine.js

役割：
- TicketEngineの実出力を検証
- AIBrain判断を含むバックテスト
- LearningEngineへ渡せる履歴を生成
- 資金曲線 / 回収率 / 勝率 / 最大ドローダウンを評価

VS Code保存名：
BacktestEngine.js

GAS上のファイル名：
BacktestEngine

反映するコード：
BacktestEngine_AIBrainIntegration_v1.0.0


---

## 推奨反映順

### Step 1：バックアップ

作業前に必ず以下を実施。

1. VS Codeで現在のプロジェクトを保存
2. GitHubへ現在状態をコミット
3. 必要ならZIPバックアップを作成

推奨コミット名：

chore: backup before rc1 integration


---

### Step 2：OmegaPipeline.js を反映

最初に OmegaPipeline を反映する。

理由：
- Main / TicketEngine / BacktestEngine の中心になるため
- AIBrain接続の本体であるため
- TicketEngine.buildFromAIBrain() の呼び出し元であるため

確認ポイント：
- class OmegaPipeline が1つだけ存在する
- run() がある
- analyzeRace() がある
- runAIBrain() がある
- buildTicket() がある
- testOmegaPipelineAIBrainIntegration() がある


---

### Step 3：Main.js を反映

次に Main を反映する。

理由：
- OmegaPipeline.run() の入口だから
- 先にOmegaPipelineがないと Main.run() が動かないため

確認ポイント：
- class Main が1つだけ存在する
- main() がある
- runOmegaDaily() がある
- dryRunOmega() がある
- healthCheckOmega() がある
- testMain() がある


---

### Step 4：TicketEngine.js を反映

次に TicketEngine を反映する。

理由：
- OmegaPipeline.buildTicket() が buildFromAIBrain() を優先するため
- この段階でAIBrainルートの買い目生成が完成するため

確認ポイント：
- class TicketEngine が1つだけ存在する
- buildFromAIBrain() がある
- build() が残っている
- bankroll / confidence / EV / risk を扱う
- tickets 配列を返す


---

### Step 5：BacktestEngine.js を反映

最後に BacktestEngine を反映する。

理由：
- TicketEngineの出力形式が固まってから検証層を更新する方が安全
- AIBrain + TicketEngine の実出力を前提にできるため

確認ポイント：
- class BacktestEngine が1つだけ存在する
- run() がある
- ticket結果を検証できる
- finalBankroll を返す
- history を返す
- LearningEngineに渡せる形式になっている


---

## GAS側での確認順

### 1. healthCheckOmega()

目的：
依存関係の不足確認。

期待結果：
- ok: true
- missing: []

もし missing が出た場合：
- 該当ファイル名の重複 / 未反映 / クラス名違いを確認する


---

### 2. dryRunOmega()

目的：
1レースだけ解析できるか確認。

期待結果：
- ok: true
- result.race がある
- result.coreResults がある
- result.aiBrainResult がある
- result.ticket がある


---

### 3. testOmegaPipelineAIBrainIntegration()

目的：
OmegaPipeline単体でAIBrain統合が動くか確認。

期待結果：
- coreCount > 0
- hasAIBrain: true
- ticketCount >= 0


---

### 4. testMain()

目的：
Main経由でdryRunまで通るか確認。

期待結果：
- healthCheck OK
- dryRun成功


---

### 5. runOmegaDaily()

目的：
日次本番フロー確認。

期待結果：
- ok: true
- races がある
- raceResults がある
- metrics がある
- bankroll がある


---

## エラー時の確認順

### AIBrain is not defined

原因候補：
- AIBrain.js が未反映
- class名が AIBrain ではない
- GAS上でファイルが保存されていない

確認：
- AIBrain.jsに class AIBrain があるか
- analyzeRace() があるか


---

### TicketEngine.buildFromAIBrain is not a function

原因候補：
- TicketEngineが旧版のまま
- buildFromAIBrain() が未実装
- class重複で旧TicketEngineが優先されている

確認：
- class TicketEngine が重複していないか
- buildFromAIBrain() が存在するか


---

### OmegaPipeline is not defined

原因候補：
- OmegaPipeline.js未反映
- class名違い
- 構文エラーで読み込めていない

確認：
- GASの保存時エラーを見る
- class OmegaPipeline があるか


---

### Logger.log is not a function

原因候補：
- GAS標準Loggerと独自Loggerの衝突
- 独自Loggerに info/warn/error がない

対応：
- ΩMAX内では Logger.info / Logger.warn / Logger.error に統一
- Logger.log は使わない


---

### Cannot read properties of null

原因候補：
- 必要なスプレッドシートのシートがない
- シート名が CONFIG と一致していない

確認：
- RACES
- HORSES
- ODDS
- LOG
- DASHBOARD
- HISTORY


---

## GitHubコミット順

### 1回目：統合前バックアップ

chore: backup before rc1 integration


### 2回目：OmegaPipeline + Main反映

feat: integrate ai brain pipeline entrypoint


### 3回目：TicketEngine反映

feat: support ai brain ticket generation


### 4回目：BacktestEngine反映

feat: integrate ai brain backtest flow


### 5回目：全体監査後

chore: prepare omega max rc1


---

## RC1完了条件

以下をすべて満たしたら RC1 完成扱い。

- healthCheckOmega() が ok:true
- dryRunOmega() が正常完了
- testOmegaPipelineAIBrainIntegration() が正常完了
- testMain() が正常完了
- runOmegaDaily() が正常完了
- Dashboardに結果が出力される
- Backtest結果に finalBankroll がある
- LearningEngine.update() がエラーなく通る
- GitHubへコミット済み


---

## 次にやること

1. この反映順に沿って VS Code のファイルを更新
2. GASへ反映
3. healthCheckOmega() を実行
4. エラーがあればログを確認
5. dryRunOmega() へ進む

ここまで通れば、ΩMAX Ver.1.0 RC1 は完成直前。
