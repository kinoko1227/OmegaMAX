# ΩMAX AIOS
## STATE_MODEL.md

Version : 1.0
Status : Design Frozen

---

# Purpose

ΩMAXは能力を評価しない。

その馬が今日、
どれだけ能力を発揮できる状態にあるかを評価する。

そのためΩMAXでは
すべてを「State（状態）」として管理する。

StateはACE（Adaptive Cognition Engine）の入力となる。

---

# State Architecture

ΩMAXは4種類のStateを持つ。

Horse State
Race State
Market State
Time State

すべての判断は
この4つのStateを統合して行う。

---

# 1. Horse State

目的

馬個体の現在状態を評価する。

評価項目

・Base Ability（基礎能力）

・Condition（体調）

・Training State（調教状態）

・Body Weight State（馬体重状態）

・Fatigue（疲労）

・Recovery（回復）

・Transportation（輸送）

・Mental State（精神状態）

・Rotation（ローテーション）

・Growth（成長）

・Maturity（成熟）

・Decline（衰え）

・Surface Fitness（芝・ダート適性）

・Distance Fitness（距離適性）

・Course Fitness（競馬場適性）

・Track Fitness（馬場適性）

・Pace Fitness（ペース適性）

・Running Style Stability（脚質安定性）

・Risk（リスク）

・Confidence（信頼度）

---

# Horse Profile

Horse Stateとは別に
Horse Profileを保持する。

Horse Profileは
その馬の個性を表す。

保持内容

・Best Weight

・Best Training Pattern

・Best Training Time Range

・Best Interval

・Best Distance

・Best Course

・Best Going

・Best Season

・Best Pace

・Best Running Style

・Weak Conditions

・Preferred Recovery Pattern

Horse Profileは
Learning Engineが更新する。

---

# Horse Timeline

Horseは時間によって変化する。

Horse Timelineとして保持する。

・成長曲線

・能力推移

・状態推移

・疲労推移

・成熟推移

・衰退推移

・休養履歴

・調教履歴

・馬体重履歴

---

# 2. Race State

目的

レースそのものを理解する。

評価項目

・Course

・Surface

・Distance

・Direction

・Weather

・Track Condition

・Cushion Value

・Moisture

・Track Bias

・Wind

・Temperature

・Humidity

・Gate Bias

・Race Class

・Field Size

・Race Level

・Expected Pace

・Predicted Position Distribution

・Predicted Speed Distribution

・Difficulty

---

# 3. Market State

目的

市場心理を理解する。

評価項目

・Odds

・Popularity

・Expected Value

・Kelly Ratio

・Market Bias

・Market Confidence

・Money Flow

・Late Odds Movement

・Value Gap

・Public Expectation

---

# 4. Time State

目的

時間軸を理解する。

評価項目

・Age

・Career

・Season

・Growth Phase

・Peak Prediction

・Decline Prediction

・Days Since Last Race

・Training Interval

・Recovery Days

・Historical Trend

---

# State Score

すべてのStateは
100点満点で評価する。

例

Training State

Score

94

Confidence

91%

Sample

325

Updated

2026-07-06

---

# State Confidence

すべてのStateは
信頼度を持つ。

Confidenceは

・サンプル数

・学習量

・条件一致率

・最新データ

から算出する。

Confidenceが低いStateは
ACE内で影響度を下げる。

---

# State Weight

Stateは固定ではない。

ACEがContextごとに
Weightを変更する。

例

Training

通常

1.00

↓

新馬戦

1.30

↓

古馬GⅠ

0.80

---

# State Update

レース終了後

Learning Engineが

Horse State

Race State

Market State

Time State

を更新する。

Featureは削除しない。

Weightのみ変化する。

---

# Design Principles

Stateは固定値ではない。

Stateは時間によって変化する。

StateはContextによって意味が変わる。

StateはHorseごとに異なる。

StateはMarketにも影響される。

---

# Final Definition

ΩMAXは

能力を予測するAIではない。

Horse State

Race State

Market State

Time State

を統合し、

「今日、その馬がどれだけ能力を発揮できるか」

を評価する競馬投資OSである。
