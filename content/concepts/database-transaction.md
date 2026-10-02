---
title: Database transaction
domain: data
wikipedia: "Database transaction"
aliases: ["transaction (database)", "ACID", "commit and rollback", "isolation level", "concurrency control"]
requires: [database-system, {concept: concurrency, strength: soft}]
maps_to: [study-hub/ds-core/data-modelling, study-hub/ds-core/sql]
---

A group of database operations that succeeds or fails as a whole, and stays isolated from other
users' simultaneous work, so the data is never left half-changed.
