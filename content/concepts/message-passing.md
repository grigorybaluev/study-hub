---
title: Message passing
domain: programming
wikipedia: "Message passing"
short: "message passing"
aliases: ["actor model", "mailbox", "send and receive", "Erlang processes"]
requires: [{concept: concurrency, strength: soft}]
maps_to: [study-hub/ds-core/programming-fundamentals, study-hub/ds-core/computing-systems]
---

Concurrent processes that share no memory and cooperate by sending each other messages, which wait
in the receiver's mailbox until it takes them.
