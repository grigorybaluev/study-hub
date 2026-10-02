---
title: Hierarchical clustering
domain: ml
wikipedia: "Hierarchical clustering"
aliases: ["agglomerative clustering", "divisive clustering", "dendrogram", "linkage criterion", "Ward's method"]
part_of: [cluster-analysis]
requires: [distance-metric, {concept: tree, strength: soft}]
maps_to: [study-hub/ds-core/unsupervised-learning]
---

Building a tree of nested clusters by repeatedly merging the two closest groups (or splitting
the loosest), so the dendrogram can be cut at whatever number of clusters fits.
