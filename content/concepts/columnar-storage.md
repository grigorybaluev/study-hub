---
title: Columnar storage
domain: data
wikipedia: "Data orientation"
aliases: ["column store", "Parquet", "Apache Arrow", "ORC"]
requires: [{concept: file-io, strength: soft}]
maps_to: [study-hub/ds-core/data-pipelines]
---

Storing a table column by column instead of row by row, so analytical queries read only the
columns they need and similar values compress well.
