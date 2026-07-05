# ΩMAX Ultimate v10 Master Design

## 1. 目的

ΩMAXは競馬予想AIではなく、期待値投資システムである。

目的は以下。

- 勝率ではなく回収率を最大化する
- BUY / WATCH / PASS を明確に判定する
- 過去3年の中央競馬データで初期補正を行う
- 毎日の結果で自己学習する
- 中央・地方を同一基盤で運用する

## 2. 全体構造

Data Layer
↓
Race Domain
↓
FeatureEngine
↓
CalibrationEngine
↓
LearningEngine
↓
CoreEngine
↓
ConfidenceEngine
↓
TicketEngine
↓
BacktestEngine
↓
Dashboard

## 3. FeatureEngine 方針

FeatureEngineは勝敗判断をしない。
事実を数値化する。

特徴量は以下5系統。

1. 基礎能力
2. 適性
3. 状態
4. 展開
5. 市場

合計80〜100特徴量を最終目標とする。

## 4. 特徴量採用基準

特徴量は以下を満たすものだけ採用する。

- 予想時点で利用可能
- 再現可能
- 客観的
- 学習可能
- 重複しすぎない
- 結果データを未来参照しない

## 5. Calibration

初期キャリブレーションは中央競馬過去3年を対象とする。

目的は以下。

- 初期Feature Weight生成
- 市場バイアス補正
- 距離・馬場・コース別補正
- EV補正

## 6. Learning

LearningEngineは日次更新のみ担当する。

Calibration = 初期学習
Learning = 日々の微調整

## 7. v10で追加しないもの

v10完成までは新機能追加を禁止する。

許可するのは以下のみ。

- バグ修正
- 設計書に沿った実装
- 精度改善
- 安定化
