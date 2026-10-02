---
title: Policy gradient method
domain: ml
wikipedia: "Policy gradient method"
aliases: ["policy gradient", "REINFORCE", "actor–critic", "proximal policy optimization", "PPO"]
part_of: [reinforcement-learning]
requires: [gradient-descent, expected-value]
maps_to: [study-hub/ds-core/reinforcement-learning]
---

Learning a policy directly by gradient ascent on its expected reward, estimated from sampled
episodes, often with a learned value function (a critic) to reduce the noise.
