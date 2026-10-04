---
title: Database index
domain: data
wikipedia: "Database index"
aliases: ["index (database)", "B-tree index", "query optimization", "query plan"]
requires: [database-system, {concept: binary-search-tree, strength: soft}, {concept: hash-table, strength: soft}]
maps_to: [study-hub/ds-core/sql, study-hub/ds-core/data-modelling]
---

An auxiliary structure, usually a B-tree or a hash table, that lets a database find matching
rows without scanning the whole table, at the cost of space and slower writes.
