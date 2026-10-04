---
title: Dimensional modelling
domain: data
wikipedia: "Dimensional modeling"
aliases: ["star schema", "snowflake schema", "fact table", "dimension table", "slowly changing dimension"]
part_of: [data-warehouse]
requires: [relational-model, {concept: entity-relationship-model, strength: soft}]
maps_to: [study-hub/ds-core/data-modelling]
---

Designing analytical tables as central fact tables of measurements joined to dimension tables
that describe them (who, what, where, when), so queries stay simple and fast.
