// What each kind of card is called: on the card in the deck, and in the Anki export's Kind field.
import type { Card } from "../data/types";

export const KIND_LABEL: Record<Card["kind"], string> = {
  definition: "Definition", theorem: "Theorem", lemma: "Lemma", proposition: "Proposition", corollary: "Corollary",
  steps: "Method", caution: "Caution", insight: "Key idea", eq: "Formula",
  output: "What does this print?", method: "Which method?", exercise: "Exercise",
};
