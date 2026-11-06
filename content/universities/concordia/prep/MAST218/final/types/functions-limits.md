---
title: Domains, level curves and limits
order: 8
asks: sketch a domain, name level curves, find a limit or show it does not exist, continuity
units: [multivariable-functions-limits]
---

## Logic

The answer to a domain question is a region, and the answer to a level-curve question is a family of
named curves: both are read from the formula. A limit at a point needs agreement from every direction.
So disproving one takes two paths, and proving one takes an inequality.

## Pattern

:::steps[A limit in two variables]
1. Substitute. A non-zero denominator means the answer is the value.
2. On $\frac00$: try to factor and cancel.
3. Try the axes, then $y = mx$, then a curve that balances the powers ($y = x^2$, $x = y^2$). Two different values: the limit does not exist.
4. If every path gives $L$: bound $|f - L|$ by something that goes to $0$ (squeeze), or use polar form with a bound free of $\theta$.
:::

:::steps[Domains and level curves]
1. Domain: list the restrictions (denominators, even roots, logarithms) as inequalities. Draw each boundary: solid if included, dashed if not.
2. Level curves: set $f = k$, rewrite, name the curve, and state which $k$ occur.
:::

## Traps

:::caution[Traps]
- Equal values on many paths prove nothing.
- $y = mx$ with an answer that depends on $m$ already settles it: no limit.
- A polar form must be bounded for all $\theta$ at once; going to $0$ for each fixed $\theta$ is not enough.
- A value of $k$ outside the range gives no level curve.
- Continuity at a point needs the value and the limit to exist and be equal.
:::

## Worked problems

::::exercise[Four limits]
Find each limit or show it does not exist, all as $(x, y) \to (0, 0)$: (a) $\frac{x^4 - y^4}{x^2 + y^2}$; (b) $\frac{xy}{x^2 + 2y^2}$; (c) $\frac{x^3}{x^2 + y^2}$; (d) $\frac{xy^2}{x^2 + y^4}$.

:::solution
(a) Factor: $\frac{(x^2 - y^2)(x^2 + y^2)}{x^2 + y^2} = x^2 - y^2 \to 0$.

(b) Along $y = mx$ the function is $\frac{m}{1 + 2m^2}$: $0$ for $m = 0$ and $\frac13$ for $m = 1$. No limit.

(c) Polar: $r\cos^3\theta$, and $|r\cos^3\theta| \le r \to 0$. The limit is $0$.

(d) Along $y = 0$ the function is $0$. Along $x = y^2$ it is $\frac{y^4}{2y^4} = \frac12$. No limit.
:::
::::

:::note[Pattern at work]
Each stops at a different step: (a) step 2, (b) and (d) step 3, (c) step 4. In (d) lines all give $0$, and only the curve that balances $x$ against $y^2$ exposes it.
:::

::::exercise[A domain and a family of level curves]
Sketch the domain of $f(x, y) = \sqrt{x - y^2}$ and describe its level curves. What is the range?

:::solution
$x - y^2 \ge 0$: the points on and to the right of the parabola $x = y^2$, with the parabola drawn solid.

$\sqrt{x - y^2} = k$ needs $k \ge 0$, and then $x = y^2 + k^2$: copies of the parabola shifted right by $k^2$. So the range is $[0, \infty)$. Equally spaced $k$ give the shifts $1, 4, 9, \dots$: the curves spread out as $k$ grows, because the surface flattens.
:::
::::

:::note[Pattern at work]
The domain's boundary is itself the level curve at $k = 0$, as often happens with a square root.
:::
