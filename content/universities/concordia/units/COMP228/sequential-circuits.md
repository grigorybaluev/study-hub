---
title: Sequential circuits — latches, flip-flops, clocks and registers
order: 8
status: detailed
weeks: [6, 7]
notes: ["Lecture 6, slides 2–9: tri-state buffers, feedback loops, timing diagrams", "Lecture 6, slides 10–16: the R-S latch, the D latch, the system clock, level- versus edge-triggering, the leader–follower flip-flop, controlling the output", "Lecture 6, slides 17–19 and Lecture 7, slides 3–4: multi-bit registers, T and J-K flip-flops, a load-controlled negative-edge D flip-flop"]
textbook: ""
introduces: [sequential-circuit]
requires:
  - {concept: digital-logic, strength: hard}
reinforces: []
---

Combinational circuits forget their inputs the instant those inputs change. A computer
needs to hold a value — a variable, a program counter, the result of the last instruction —
and holding is done by feeding a circuit's output back into its own input. This unit follows
that idea from a loop of two inverters to the clocked registers a CPU is built from, and
introduces the timing diagram as the tool for reasoning about signals that change.

## Three-state wires and feedback

Before feedback, one more gate. Ordinary outputs always drive a 0 or a 1, so two of them
connected to the same wire fight — and, in the lecture's phrase, can lead to a fire. A
**tri-state buffer** adds an enable input: enabled, it passes its input through; disabled,
its output is electrically disconnected (**high impedance**, Hi-Z), as if it were not there.
Many components can then share one wire as long as only one is enabled at a time. That is
what a bus is, in the next unit.

Now the loop. Two NOT gates in a ring have two stable states — the wire between them is 0 or
1 and stays that way forever. It remembers, but nothing can change it. An **AND–OR loop**
adds inputs to force the value up or down or leave it alone, and the question "what is Q?"
stops having a single answer: it depends on what happened *before*. Circuits like this are
**sequential**, and their behaviour has to be described over time.

> **Definition — timing diagram.** A plot with one row per signal and time along the
> horizontal axis, each row a square wave between low (0) and high (1); a middle level marks
> Hi-Z, and an output's transition is drawn slightly after the input change that caused it,
> because gates take time.

## Latches

> **Definition — R-S latch.** Two cross-coupled NOR (or NAND) gates with inputs S (set) and R
> (reset) and complementary outputs $Q$ and $\bar Q$. $S = 1$ sets $Q$ to 1, $R = 1$ resets
> it to 0, $S = R = 0$ holds the previous value, and $S = R = 1$ is not allowed — both outputs
> drop to 0 and the state after they are released is a race.

```sim
id: arch-228-sequential-rs-latch
custom: true
engine: arch
mode: timing
device: rs-latch
signals: {S: "0100000110", R: "0000100010"}
note: "Q rises a little after S goes high and stays high when S drops — the loop holds it. R resets it later. The last two slots show the forbidden S = R = 1 and the release straight after: the annotation names the race. Edit the signal strings to try a different sequence."
```

An R-S latch answers "set or reset?", but a register wants to answer "what value, and when?".
The **D latch** puts a little logic in front: input D is the value, input E (enable) is the
when, with $S = D E$ and $R = \bar D E$. While E is high, Q follows D; when E drops, Q keeps
whatever D was last.

```sim
id: arch-228-sequential-d-latch
custom: true
engine: arch
mode: timing
device: d-latch
signals: {D: "0110100110", E: "0011110000"}
note: "While E is high (slots 2–5) Q copies every change of D, glitches included; when E falls, Q freezes at the last value and ignores D afterwards. Level-triggered storage is transparent for as long as the enable is held — the problem the flip-flop solves."
```

## The clock and the edge

A computer has a **system clock**, a signal alternating between 0 and 1 billions of times a
second, and it decides *when* things may change. Gates and wires have delays that vary with
manufacturing, and a signal that has passed through several gates settles at an unpredictable
moment; acting only at clock ticks means everything has had a full cycle to settle. A design
that does not settle within a cycle is simply wrong, and **overclocking** is the gamble that
it will anyway with a shorter cycle.

A latch is **level-triggered**: it responds for the whole time its enable is high, and if D
changes during that time — or if the latch's own output feeds back into D through some logic
— the value can run away. What a register needs is **edge-triggering**: sample D at the
instant the clock rises (or falls), and ignore it otherwise. Making the enable pulse
"momentarily" high is hard to get right, so the standard construction uses two latches in
series with opposite enables — the **leader–follower** (master–slave) flip-flop. While the
clock is low the leader tracks D and the follower holds; when the clock goes high the leader
freezes and the follower copies it. Only one is ever open, and the value passes through at
the edge. Which latch gets the inverter decides whether the flip-flop is positive- or
negative-edge triggered.

```sim
id: arch-228-sequential-d-ff
custom: true
engine: arch
mode: timing
device: d-ff
signals: {D: "0011110001100", CLK: "0101010101010"}
note: "The purple marks are rising clock edges. Q takes the value D had at each edge and nothing else: the change of D at slot 6 is ignored until the next edge, and the brief 1 at slots 9–10 is caught only because an edge falls inside it. Set edge: neg in the block to sample on falling edges instead."
```

## Registers and the other flip-flops

A flip-flop stores one bit. A **register** is $w$ of them side by side, sharing the clock, with
$w$ D inputs and $w$ Q outputs; drawn as a box with a $w$-wide input, a $w$-wide output, a
clock and two control lines. The two controls are the whole interface the datapath needs:

- **Load** (store): whether to capture new data at the next edge. Since the clock is always
  running, a mux in front of D selects between the new value and the flip-flop's own output,
  so a register not being loaded re-stores itself.
- **Enable** (output): a tri-state buffer on Q, so the register only drives the shared bus
  when asked.

Two variants of the flip-flop reuse the forbidden state instead of forbidding it. The **J-K
flip-flop** is an edge-triggered R-S with $J = K = 1$ redefined to mean toggle; the **T
flip-flop** is the special case $J = K = T$: toggle on the edge when T is 1, hold when it is
0. Toggling only makes sense edge-triggered — a level-triggered toggle would oscillate for
as long as the level lasted — and counters are built from T flip-flops in a chain.

```sim
id: arch-228-sequential-jk
custom: true
engine: arch
mode: timing
device: jk-ff
signals: {J: "1100001111", K: "0000110011", CLK: "0101010101"}
note: "J alone sets on the edge, K alone resets, both together toggle: the last two edges flip Q each time. A T flip-flop is this device with J and K tied together: held at 1 it toggles on every rising edge, so Q runs at half the clock's frequency — a divide-by-two counter."
```

**Equations**

- *R-S latch*: $Q_{next} = S + \bar R \, Q$ with $S R = 0$ required.
- *D latch*: $S = DE$, $R = \bar D E$; $Q_{next} = D$ while $E = 1$, else $Q$.
- *D flip-flop*: $Q \leftarrow D$ at the active clock edge only.
- *J-K flip-flop*: $Q_{next} = J \bar Q + \bar K Q$ at the edge; *T flip-flop*: $Q_{next} = T \oplus Q$.
- *Load control*: $D_{ff} = \text{Load} \cdot D_{in} + \overline{\text{Load}} \cdot Q$.

> **Key insight.** Memory is feedback, and control over memory is control over *when* the
> feedback loop is allowed to change. The clock edge turns a transparent latch into a
> register that samples once per cycle, and the load and enable lines turn a register into
> something a control unit can command — the vocabulary of the next unit's datapath.

## Further reading

- [Flip-flop (electronics)](https://en.wikipedia.org/wiki/Flip-flop_(electronics)) — latches, master–slave and edge-triggered flip-flops, the J-K and T variants.
- [Three-state logic](https://en.wikipedia.org/wiki/Three-state_logic) — Hi-Z outputs and shared buses.
- [Clock signal](https://en.wikipedia.org/wiki/Clock_signal) — why synchronous design works and what overclocking risks.
- [Digital timing diagram](https://en.wikipedia.org/wiki/Digital_timing_diagram) — reading and drawing the plots used throughout this unit.
