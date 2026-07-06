# ΩMAX AIOS
## OMEGAMAX_ARCHITECTURE.md

Version : 11.0
Project : ΩMAX AIOS
Status : Design Frozen

---

# 1. Philosophy

ΩMAXは競馬予想AIではない。

ΩMAXは

「競馬を理解し、
市場を理解し、
学び続ける競馬投資OS」

である。

---

# 2. Constitution

## 第1条

馬を予想するのではない。

その馬が今日、
本来の能力をどれだけ発揮できる状態にあるかを評価する。

---

## 第2条

Featureは削除しない。

Contextに応じて
Weightを変化させる。

---

## 第3条

Horse Stateを最優先する。

能力ではなく
状態を評価する。

---

## 第4条

Marketを敵ではなく情報源とする。

人気ではなく
期待値を評価する。

---

## 第5条

全レースを学習対象とする。

ただし

Global

Context

Horse

の3階層で学習する。

---

## 第6条

Explainable AI

すべての予想は
理由を説明できること。

---

# 3. System Architecture

JRA-VAN

↓

JRAConnector

↓

OmegaDataLayer

↓

Horse State Generator

↓

Feature Engine

↓

ACE

↓

Core Engine

↓

Race Simulator

↓

Ticket Engine

↓

Capital Engine

↓

Learning Engine

↓

Horse State Update

---

# 4. ACE

Adaptive Cognition Engine

ΩMAXの頭脳。

役割

・Horse Brain

・Race Brain

・Market Brain

・Evolution Brain

・Explain Brain

---

# 5. Horse Brain

目的

その馬を理解する。

評価対象

・能力

・状態

・成長

・成熟

・疲労

・調教

・馬体重

・休養

・輸送

・得意条件

・苦手条件

・Horse Timeline

---

# 6. Race Brain

目的

レースを理解する。

評価対象

・距離

・コース

・馬場

・天候

・クッション値

・トラックバイアス

・含水率

・開催日数

・展開

・頭数

・レベル

---

# 7. Market Brain

目的

市場を理解する。

評価対象

・人気

・オッズ

・売れ方

・期待値

・市場バイアス

・資金配分

---

# 8. Evolution Brain

目的

学習。

役割

・仮説生成

・バックテスト

・重み更新

・Context学習

---

# 9. Explain Brain

目的

予想理由を説明する。

出力

・能力評価

・状態評価

・市場評価

・勝負度

・推奨理由

---

# 10. Learning

Global Learning

競馬全体を学習

Context Learning

条件別に学習

Horse Learning

馬個体を学習

Adaptive Learning

ACEが統合

---

# 11. Race Simulator

目的

複数シナリオの評価

内容

・展開予測

・位置取り予測

・能力発揮率

・勝率

・連対率

・複勝率

・期待値

---

# 12. Development Rules

設計を優先する。

思想を崩さない。

Featureは削除しない。

後方互換を維持する。

一度完成したモジュールは
安易に書き換えない。

---

# 13. Final Goal

競馬を予想するシステムではない。

競馬という複雑な現象を理解し、
利益を生み続ける競馬投資OSを構築する。
