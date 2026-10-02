---
title: Stochastic gradient descent
domain: math.optimization
wikipedia: "Stochastic gradient descent"
short: "SGD"
aliases: ["SGD", "mini-batch gradient descent", "momentum", "Adam", "RMSprop", "adaptive learning rate", "optimizer (deep learning)"]
part_of: [gradient-descent]
requires: [{concept: expected-value, strength: soft}]
maps_to: [study-hub/ds-core/optimization, study-hub/ds-core/neural-networks]
---

Gradient descent that estimates the gradient from a small random batch of the data at each
step, usually with momentum or per-parameter step sizes (Adam, RMSprop): the standard way
models are trained on large data.
