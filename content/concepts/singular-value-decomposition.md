---
title: Singular value decomposition
domain: math.linear-algebra
wikipedia: "Singular value decomposition"
short: "SVD"
aliases: ["SVD", "singular values", "low-rank approximation", "truncated SVD", "pseudoinverse", "Eckart–Young theorem"]
part_of: [matrix-decomposition]
requires: [eigenvalue, orthogonality, {concept: matrix-rank, strength: soft}]
maps_to: [study-hub/ds-core/linear-algebra, study-hub/ds-core/numerical-methods]
---

Writing any matrix as a rotation, a scaling along orthogonal axes and another rotation, A =
UΣVᵀ; the largest singular values give the best low-rank approximation of the matrix.
