---
title: Support vector machine
domain: ml
wikipedia: "Support vector machine"
short: "SVM"
aliases: ["SVM", "maximum-margin classifier", "soft margin", "support vectors", "support vector regression"]
requires: [convex-optimization, dot-product, {concept: kernel-method, strength: soft}, {concept: loss-function, strength: soft}]
maps_to: [study-hub/ds-core/supervised-learning]
---

A classifier that separates two classes with the widest possible margin, decided only by the
training points closest to the boundary (the support vectors), and made nonlinear with kernels.
