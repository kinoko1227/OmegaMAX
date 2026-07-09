# ΩMAX Ver.1.0 RC1 全体監査メモ v1.0.0

作成日: 2026-07-09
対象: OmegaMAX(2).zip / AIBrain統合後RC1候補
目的: RC1完成前の全体構成・接続・残タスクの確認

============================================================
1. 監査結論
============================================================

現状のΩMAXは、RC1直前の状態まで到達している。
大きな構成崩れや重複クラスは見つからない。

ただし、ZIP内の現行TicketEngine.jsはまだ buildFromAIBrain() を持っていないため、
先に作成した TicketEngine_AIBrainComplete_v1.0.0 を正式反映する必要がある。

また、BacktestEngineもAIBrain出力・TicketEngine出力をそのまま検証する形へ更新する必要がある。

RC1完成までの残作業は以下。

1. Main.gs / Main.js をRC1入口専用版へ更新
2. OmegaPipeline_AIBrainIntegration_v1.0.0 を正式OmegaPipelineへ反映
3. TicketEngine_AIBrainComplete_v1.0.0 を正式TicketEngineへ反映
4. BacktestEngine_AIBrainIntegration_v1.0.0 を正式BacktestEngineへ反映
5. healthCheck → dryRun → dailyRun の順で統合テスト
6. GitHubへ RC1 としてコミット

============================================================
2. 現在の理想構成
============================================================

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

この構成をRC1正式ルートとする。

============================================================
3. ファイル監査結果
============================================================

確認対象ZIP内の主要ファイル:

- Main.js
- OmegaPipeline.js
- AIBrain.js
- TicketEngine.js
- BacktestEngine.js
- LearningEngine.js
- DashboardEngine.js
- OmegaDataLayer.js
- FeatureEngine.js
- CoreEngine.js
- Race.js
- Utils.js
- Config.js
- Logger.js

確認結果:

- class重複: なし
- function重複: なし
- AIBrain.js: class AIBrain 存在
- AIBrain.js: analyzeRace(input) 存在
- OmegaPipeline.js: analyzeRace(race) 存在
- Main.js: OmegaPipeline.run() 呼び出しあり
- 現行TicketEngine.js: build() は存在
- 現行TicketEngine.js: buildFromAIBrain() は未反映

============================================================
4. 反映すべきRC1候補ファイル
============================================================

以下の3つをRC1候補として正式反映する。

1. Main RC1入口専用版
   - Main → OmegaPipeline.run() のみに責務を絞る
   - healthCheckOmega()
   - dryRunOmega()
   - runOmegaDaily()
   - omegaVersion()

2. OmegaPipeline_AIBrainIntegration_v1.0.0
   - Race.build()
   - FeatureEngine.buildRace()
   - CoreEngine.evaluate()
   - AIBrain.analyzeRace()
   - TicketEngine.buildFromAIBrain() 優先
   - buildFromAIBrain がなければ既存 build() へフォールバック

3. TicketEngine_AIBrainComplete_v1.0.0
   - buildFromAIBrain() を正式実装
   - AIBrain decision / confidence / EV / explanation を買い目へ反映
   - build() は後方互換として維持

4. BacktestEngine_AIBrainIntegration_v1.0.0
   - TicketEngineの出力をそのまま検証
   - AIBrain判断込みで検証
   - LearningEngineへ渡せるhistoryを生成

============================================================
5. 重要な注意点
============================================================

TicketEngine更新時の注意:

- 既存 build() は削除しない
- OmegaPipeline側は buildFromAIBrain() があれば優先する
- buildFromAIBrain() の戻り値形式は既存ticket形式と互換にする
- tickets配列、expectedEV、riskScore、confidence、decision を含める

BacktestEngine更新時の注意:

- 既存run(races, bankroll)の入口は維持する
- TicketEngineの結果形式に依存しすぎない
- ticket.tickets がない場合でも落ちない
- NO_BET / PASS / 見送りを正常結果として扱う

OmegaPipeline更新時の注意:

- AIBrain未定義の場合も落とさない
- AIBrainがnullでもTicketEngine.build()へフォールバックする
- runAIBrain() は new AIBrain().analyzeRace() を使う
- CONFIG.AIBRAIN.ITERATIONS がなければ3000を使う

Main更新時の注意:

- Main側に解析ロジックを持たせない
- Entry Pointとしての責務に限定する
- runOmegaDaily / omegaRunDaily / main の互換関数を残す

============================================================
6. RC1テスト順序
============================================================

GASで以下の順に実行する。

Step 1:
healthCheckOmega()

期待結果:
- ok: true
- missing: []

Step 2:
dryRunOmega()

期待結果:
- ok: true
- 1レース解析成功
- coreResultsあり
- aiBrainResultあり
- ticketあり

Step 3:
testOmegaPipelineAIBrainIntegration()

期待結果:
- coreCount > 0
- hasAIBrain: true
- ticketCount >= 0

Step 4:
runOmegaDaily()

期待結果:
- ok: true
- raceResults生成
- metrics生成
- bankroll返却
- Dashboard更新

Step 5:
runOmegaLearning()

期待結果:
- Backtest履歴生成
- LearningEngine.update() 実行
- Knowledge系に異常なし

============================================================
7. RC1コミット前チェックリスト
============================================================

[ ] MainをRC1入口専用版に更新した
[ ] OmegaPipelineをAIBrain統合版に更新した
[ ] TicketEngineをAIBrain完全対応版に更新した
[ ] BacktestEngineをAIBrain統合版に更新した
[ ] HorseBrain.js等の旧個別Brainファイルが復活していない
[ ] class重複がない
[ ] function重複がない
[ ] Logger.logではなく Logger.info/warn/error に統一されている
[ ] CONFIG.BANKROLL.INITIAL が参照可能
[ ] CONFIG.AIBRAIN.ITERATIONS がなくても動く
[ ] healthCheckOmega() が通る
[ ] dryRunOmega() が通る
[ ] runOmegaDaily() が通る
[ ] Dashboardが更新される
[ ] GitHubへコミットした

============================================================
8. RC1完成判定
============================================================

RC1完成条件:

- MainからOmegaPipelineが起動する
- OmegaPipelineからAIBrainが呼ばれる
- AIBrain結果をTicketEngineが受け取る
- TicketEngine結果をBacktestEngineが検証できる
- Backtest結果をLearningEngineが学習に使える
- Dashboardに結果が出る
- 旧Brain個別ファイルに戻らない
- 1日分の処理が最後まで落ちずに完走する

この条件を満たしたら、

ΩMAX Ver.1.0 RC1 完成

として扱ってよい。

============================================================
9. 次にやること
============================================================

次の作業は、正式反映順として以下。

1. Main RC1入口専用版を反映
2. OmegaPipeline_AIBrainIntegration_v1.0.0 を反映
3. TicketEngine_AIBrainComplete_v1.0.0 を反映
4. BacktestEngine_AIBrainIntegration_v1.0.0 を反映
5. healthCheckOmega() 実行
6. dryRunOmega() 実行
7. エラーが出たら該当ファイルだけ修正

以上。
