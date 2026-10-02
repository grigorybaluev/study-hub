---
title: Probability calibration
domain: ml
wikipedia: "Calibration (statistics)"
aliases: ["calibration curve", "reliability diagram", "Platt scaling", "isotonic regression", "Brier score"]
requires: [classification-metrics, {concept: logistic-regression, strength: soft}]
maps_to: [study-hub/ds-core/model-evaluation]
---

Making a classifier's predicted probabilities match observed frequencies — of the cases scored
0.8, about 80% should be positive — so the scores can be used as probabilities.
