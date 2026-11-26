import type { TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "sell-your-years";

/** Approved narration: the 60 s cut of the user's script (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  {
    id: "cold",
    chapter: null,
    text: "You have ten pounds left in your bank account. But there's a new way to make money. Sell five years of your life for five hundred thousand pounds. Would you do it?",
  },
  { id: "c1", chapter: { n: 1, title: "TIME IS MONEY" }, text: "If humans could sell their lifespan, time would become the most valuable currency on Earth." },
  { id: "c2", chapter: { n: 2, title: "THE FIRST SALES" }, text: "At first, millions would sell a few years to buy houses, pay off debts and escape poverty." },
  { id: "c3", chapter: { n: 3, title: "BUYING CENTURIES" }, text: "But billionaires wouldn't buy cars and private islands. They'd buy centuries of extra life." },
  {
    id: "c4",
    chapter: { n: 4, title: "TWO CLASSES" },
    text: "Humanity would split into two classes. The rich, who could live for thousands of years. And the poor, who might never reach forty.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "THE YEAR MARKET" },
    text: "People would sacrifice decades just to feed their families. Parents would sell their years to give their children a better future.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "HOW LONG YOU LIVE" },
    text: "Money wouldn't just determine how well you live. It would determine how long you live. The rich wouldn't just own the world. They'd outlive everyone in it.",
  },
  { id: "end", chapter: { n: 7, title: "YOUR OFFER" }, text: "So, if someone offered you one million pounds for ten years of your life... would you accept?" },
];

/** Caption words always set in brand amber (Scribe writes "£10" as one token: it normalises to "10"). */
export const KEYWORDS = [
  "10",
  "money",
  "sell",
  "five",
  "years",
  "life",
  "hundred",
  "thousand",
  "pounds",
  "lifespan",
  "time",
  "valuable",
  "currency",
  "millions",
  "houses",
  "debts",
  "poverty",
  "billionaires",
  "cars",
  "islands",
  "centuries",
  "extra",
  "split",
  "classes",
  "rich",
  "thousands",
  "poor",
  "forty",
  "40",
  "sacrifice",
  "decades",
  "feed",
  "families",
  "parents",
  "children",
  "future",
  "well",
  "long",
  "own",
  "world",
  "outlive",
  "everyone",
  "million",
  "ten",
  "accept",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF YOU COULD" }, { text: "SELL YEARS", color: P.amber }, { text: "OF YOUR LIFE?", size: 58 }];
