import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "last-human";

/** Video title (not spoken: the narration starts at "You wake up tomorrow morning."). */
export const TITLE = "What If You Were the Last Human on Earth?";

const p = (...paras: string[]) => paras.join("\n\n");

/**
 * The user's script, verbatim (see script.md). Chapter labels are on-screen only.
 * The voiceover was generated in three parts: A = cold..c4, B = c5..c9, C = c10..c14.
 */
export const BLOCKS: NarrationBlock[] = [
  {
    id: "cold",
    chapter: null,
    text: p(
      "You wake up tomorrow morning. Your alarm is ringing. Sunlight is coming through your window. Everything seems completely normal.",
      "Until you check your phone.",
      "No new messages. No missed calls. Nobody has posted anything.",
      "You call your best friend. Nothing.",
      "You call your family. Nothing.",
      "You step outside.",
    ),
  },
  {
    id: "c1",
    chapter: { n: 1, title: "THE EMPTY CITY" },
    text: p(
      "The streets are empty. Cars sit abandoned along the road. The shops are open, but nobody is inside.",
      "And slowly, a terrifying possibility enters your mind.",
      "What if you're the last human being alive?",
    ),
  },
  {
    id: "c2",
    chapter: { n: 2, title: "IS ANYONE THERE?" },
    text: p(
      "At first, you don't believe it. You search houses, hospitals, police stations. You drive through neighbourhoods, shouting for someone to answer.",
      "But nobody does.",
    ),
  },
  {
    id: "c3",
    chapter: { n: 3, title: "THE MACHINES KEEP RUNNING" },
    text: p(
      "And the strangest part? The world hasn't ended.",
      "Electricity is still running. Water still comes from the tap. The internet might even work for a while.",
      "Humanity has vanished. But the machines it built haven't stopped yet.",
      "So what happens next?",
    ),
  },
  {
    id: "c4",
    chapter: { n: 4, title: "THE FIRST 24 HOURS" },
    text: p(
      "During your first twenty-four hours, survival might actually be surprisingly easy.",
      "Supermarkets are full of food. Petrol stations have fuel. Homes are stocked with supplies.",
      "You could sleep in a mansion, drive an expensive car, or walk through a museum without buying a ticket.",
      "But there's a problem.",
      "Almost everything you rely on was designed to be maintained by other people.",
      "And those people are gone.",
    ),
  },
  {
    id: "c5",
    chapter: { n: 5, title: "LIGHTS OUT" },
    text: p(
      "As the hours pass, electricity networks begin facing problems. Power plants and substations depend on automated controls, but also on operators, fuel deliveries, maintenance and a functioning grid.",
      "Some facilities would shut down safely. Others could experience faults. Different areas would lose power at different times.",
      "There's no single moment when every light on Earth switches off.",
      "But eventually, your neighbourhood could go dark.",
      "And when the electricity fails, your problems multiply.",
      "Refrigerators stop cooling. Mobile networks lose backup power. Water pumps may stop. Wastewater systems begin failing.",
      "Your phone is still in your hand.",
      "But there's nobody left to call.",
    ),
  },
  {
    id: "c6",
    chapter: { n: 6, title: "THE FIRST WEEK" },
    text: p(
      "By the end of the first week, you need a plan.",
      "Fresh food is beginning to spoil. Depending on local infrastructure, tap water may no longer be reliable.",
      "You need bottled water, preserved food, medicine, warm clothing and a safe place to live.",
      "And you need to think about something people rarely consider.",
      "Fire.",
      "Without firefighters, a small blaze could spread through an abandoned building.",
      "Without emergency services, even a minor injury could become dangerous.",
      "A broken ankle, an infected cut, or a serious illness could leave you completely helpless.",
    ),
  },
  {
    id: "c7",
    chapter: { n: 7, title: "SURVIVAL MODE" },
    text: p(
      "So you stop treating the world like your personal playground.",
      "And start treating it like a survival problem.",
      "You find a house with a fireplace, a reliable water source and room to store supplies.",
      "You collect batteries, solar panels, tools and first-aid equipment.",
      "You learn how to purify water and preserve food.",
    ),
  },
  {
    id: "c8",
    chapter: { n: 8, title: "NATURE MOVES IN" },
    text: p(
      "But while you're learning to survive, something else is happening.",
      "Nature is beginning to reclaim the world.",
      "With traffic gone, roads become silent.",
      "Without constant human activity, many animals begin exploring places they once avoided.",
      "Weeds push through pavement cracks. Gardens become overgrown. Unmaintained buildings slowly deteriorate.",
      "But cities wouldn't turn into forests overnight.",
      "Nature works on its own timescale.",
      "And some of the most dramatic changes would take decades.",
    ),
  },
  {
    id: "c9",
    chapter: { n: 9, title: "LEFT BEHIND" },
    text: p(
      "Meanwhile, the animals humanity left behind face very different futures.",
      "Some pets would struggle without food, water or care.",
      "Others might escape and adapt.",
      "Livestock trapped in buildings or fenced areas could be especially vulnerable.",
      "Wild animals, however, might benefit from the disappearance of hunting, traffic and habitat disturbance.",
      "The planet would continue changing.",
      "Even without us.",
    ),
  },
  {
    id: "c10",
    chapter: { n: 10, title: "ALONE" },
    text: p(
      "After one month, your biggest enemy might no longer be hunger.",
      "It might be loneliness.",
      "Humans evolved as social creatures.",
      "We depend on conversation, cooperation, friendship and belonging.",
      "Now imagine going thirty days without hearing another human voice.",
      "No jokes. No arguments. No conversations.",
      "Nobody to celebrate with.",
      "Nobody to tell you that everything is going to be okay.",
      "You might begin talking to yourself.",
      "Recording messages.",
      "Playing old videos just to hear somebody speak.",
      "And the longer you're alone, the harder it could become to maintain motivation and a normal daily routine.",
      "Because surviving physically isn't the same as living well.",
    ),
  },
  {
    id: "c11",
    chapter: { n: 11, title: "A NEW ROUTINE" },
    text: p(
      "So you create a schedule.",
      "You wake up at the same time every day.",
      "You exercise, cook, repair equipment and keep a journal.",
      "You search libraries for books on farming, medicine and engineering.",
      "And you keep looking for other survivors.",
      "Not because you've found evidence that anyone remains.",
      "But because accepting that you're alone forever might be the hardest part.",
    ),
  },
  {
    id: "c12",
    chapter: { n: 12, title: "ONE YEAR LATER" },
    text: p(
      "One year later, the world looks very different.",
      "Many roads are damaged or obstructed. Buildings have suffered leaks, weather damage and neglect.",
      "Some areas have experienced fires or flooding.",
      "And the technologies that once made everyday life effortless are becoming increasingly difficult to use.",
      "You might still generate electricity using solar panels, provided the equipment works and you can maintain it.",
      "You might grow vegetables, collect rainwater and preserve food.",
      "But everything takes effort.",
      "Every repair is your responsibility.",
      "Every mistake is yours to solve.",
    ),
  },
  {
    id: "c13",
    chapter: { n: 13, title: "THE LAST CHAPTER" },
    text: p(
      "And there's one final reality you can't escape.",
      "If you truly are the last human being on Earth, humanity has no future generation.",
      "When you die, the human story ends.",
      "Our cities, our music, our inventions and our history would remain for a while.",
      "But without people to preserve them, much of what we created would slowly disappear.",
    ),
  },
  {
    id: "c14",
    chapter: { n: 14, title: "EARTH GOES ON" },
    text: p(
      "Yet Earth itself would survive.",
      "Forests would grow. Oceans would move. Animals would evolve.",
      "The planet doesn't need humanity to keep spinning.",
      "But humanity needs something that no amount of technology can replace.",
      "Other humans.",
      "So if you woke up tomorrow and discovered that everyone else had vanished...",
      "How long do you think you would survive?",
    ),
  },
];

/** Voiceover parts (generated separately, joined by scripts/join-voiceover.ts). */
export const PARTS: { id: string; blocks: string[] }[] = [
  { id: "a", blocks: ["cold", "c1", "c2", "c3", "c4"] },
  { id: "b", blocks: ["c5", "c6", "c7", "c8", "c9"] },
  { id: "c", blocks: ["c10", "c11", "c12", "c13", "c14"] },
];

export const partText = (id: string) =>
  PARTS.find((x) => x.id === id)!
    .blocks.map((b) => BLOCKS.find((x) => x.id === b)!.text)
    .join("\n\n");

/** On-screen time stamps, shown at the start of these blocks. */
export const STAMPS: Partial<Record<string, string>> = {
  c4: "DAY 1",
  c6: "DAY 7",
  c10: "DAY 30",
  c12: "ONE YEAR LATER",
};
