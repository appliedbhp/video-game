const guides = {
  shelly: {
    name: "Shelly", skill: "Acceptance", frames: 5, meet: 245,
    intro: "I’m Shelly. Large waves will roll across this beach. When one reaches you, we’ll pause and practice making room for an uncomfortable feeling. Watch the surf and choose your next step.",
    prompt: "A wave splashes Scratchy and he feels nervous. What could he try?",
    answers: ["Wait until he feels completely calm.", "Notice the tightness, let it be there, and take a safe step.", "Pretend he feels nothing."],
    correct: 1, hint: "Look for the answer that makes room for the feeling.",
    takeaway: "You can be nervous and still choose a safe step.",
  },
  ace: {
    name: "Ace", skill: "Committed Action", frames: 25, meet: 250, practice: 485,
    intro: "I’m Ace. Ahead are rocky steps and gaps across the desert. Our next destination is the shade shelter. We’ll choose a small action, reach the shade, and then take the next stretch.",
    prompt: "What’s a useful plan for crossing the desert?",
    answers: ["Get to the shade, pause for water, then take the next stretch.", "Sprint the whole way without a break.", "Wait for the desert to get easier."],
    correct: 0, hint: "Choose a specific next step you can do.",
    takeaway: "Try your plan. Reach the shade marker, then continue to the exit.",
    checkpoint: 1510,
  },
  olli: {
    name: "Olli the Otter", skill: "Mindfulness", frames: 25, meet: 260, practice: 1040,
    intro: "I’m Olli. Ahead, the trail dips into clear flowing water. You’ll move more slowly inside it. Jump onto the bank to get out. When we reach the river, we’ll notice what we can see, hear, and feel.",
    prompt: "Scratchy stands where the water laps the bank. What could he notice?",
    answers: ["Whether tomorrow’s crossing will be harder.", "How fast everyone else would get across.", "The cool water, the ripple on the surface, and the sound it makes."],
    correct: 2, hint: "Choose something Scratchy can sense right now.",
    takeaway: "You noticed what’s here right now. When your mind wanders, you can come back to a sensation.",
  },
  barnaby: {
    name: "Barnaby", skill: "Self-as-Context", frames: 12, meet: 172, practice: 610, flying: true,
    intro: "Up here! I’m Barnaby. Ahead are snowy gaps and high ledges. When you reach the ledge, jump up and touch me. I’ll carry you up for a bird’s-eye view. Hold Space to fly higher and use Left and Right to steer. Release Space to descend. Keep steering as we come down, and I’ll let go when you touch the ground. From above, we’ll practice noticing a difficult thought and choosing our next step.",
    prompt: "Scratchy thinks, “I’m a failure.” Which response takes a step back?",
    answers: ["I can notice that thought. It’s one thing I’m experiencing.", "That thought is all there is to me.", "I need a different thought before I can move."],
    correct: 0, hint: "Look for the response that notices the thought without turning it into an identity.",
    takeaway: "Thoughts and feelings can change. You’re the one noticing them.",
  },
  fargo: {
    name: "Fargo", skill: "Values", frames: 25, meet: 182, practice: 610,
    intro: "I’m Fargo. Ahead, the trail forks beside a broken fence. We’ll choose a direction by thinking about how we want to act. Let’s practice putting kindness into one small action.",
    prompt: "Scratchy wants to be kind. What would putting that value into action look like?",
    answers: ["Collect more stars than anyone else.", "Pause and help someone find the trail.", "Wait until there’s a prize for helping."],
    correct: 1, hint: "Choose the action that expresses kindness.",
    takeaway: "You chose a way to act on kindness. A value can guide what you do again tomorrow.",
  },
};

const acceptanceQuestions = [
  {
    prompt: "Scratchy’s shoulders tense when he hears the surf. What could he do?",
    answers: ["Notice the tension and give it room while he watches for a safe opening.", "Hold still until he feels no tension.", "Tell himself he isn’t allowed to feel tense."],
    correct: 0, hint: "Look for an answer that lets the feeling be there.",
    takeaway: "There’s room to feel tense and still pay attention to what’s safe.",
  },
  {
    prompt: "Scratchy feels frustrated after a wave catches him. How could he respond?",
    answers: ["Act as if he isn’t frustrated.", "Refuse to try again until he feels cheerful.", "Acknowledge the frustration and choose when he’s ready for another step."],
    correct: 2, hint: "Choose a response that makes room for frustration.",
    takeaway: "You can feel frustrated and still decide what to do next.",
  },
];

const defusionThoughts = [
  "I’ll get the next jump wrong.",
  "I’m too slow to keep up.",
  "I’ll probably take the wrong path.",
  "Everyone else makes this look easy.",
  "I should have figured this out by now.",
  "I’ll feel silly if I have to ask for help.",
  "I’ll get stuck again.",
  "I’m not ready to try this yet.",
  "I’ll forget what I’m supposed to do.",
  "This is taking me too long.",
  "I’ll have to start over if I slip.",
  "I’m not good at new things.",
  "I should be able to do this on the first try.",
  "I might pick the wrong answer.",
];

const stickyResponses = [
  "Treat the thought as a fact and let it decide what I do.",
  "Wait for the thought to go away before I take another step.",
  "Keep arguing with the thought until I’m sure it’s wrong.",
  "Replay what went wrong until I know exactly why.",
  "Compare myself with everyone else before I decide whether to try.",
  "Tell myself I’m only allowed to have positive thoughts.",
  "Keep checking for certainty before I move.",
  "Use one mistake as proof that I can’t do this.",
  "Try to push the thought out of my head every time it comes back.",
  "Judge myself for having the thought in the first place.",
  "Let the thought make the decision for me.",
  "Keep looking for proof that I won’t make a mistake.",
  "Put the trail on hold until I can stop thinking about it.",
  "Assume the thought is a prediction of what will happen.",
  "Keep asking for reassurance until I don’t feel any doubt.",
  "Treat having the thought as a reason to give up.",
];

const advancedDefusion = [
  { text: "Name it as a story my mind is telling, then take the next step.", takeaway: "Naming the story can help you recognize it when it comes back." },
  { text: "Picture the words on a leaf floating past. Let it drift without chasing it.", takeaway: "Letting the thought drift makes room for it without having to follow it." },
  { text: "Say the thought slowly and notice the sounds of the words.", takeaway: "Listening to the words as sounds gives you another way to notice them." },
  { text: "Write the thought down and look at it as a sentence on the page.", takeaway: "Putting the words on a page can help you see the thought as something you’re noticing." },
  { text: "Say “Thanks, mind, I heard you,” and choose my next step.", takeaway: "You can acknowledge what your mind says and still choose what to do." },
  { text: "Sing the thought to a familiar tune and notice how the words sound.", takeaway: "Changing how the words sound can make it easier to hear them as a thought." },
  { text: "Imagine the thought as a subtitle passing across a screen.", takeaway: "A subtitle can be there while you keep paying attention to the rest of the scene." },
  { text: "Say “My mind is making a prediction,” and notice what’s happening now.", takeaway: "Labeling a prediction helps you separate it from what’s actually happening." },
];

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makeDefusionDeck(count) {
  const thoughts = shuffled(defusionThoughts);
  const techniques = shuffled(advancedDefusion);
  const distractors = shuffled(stickyResponses);
  return Array.from({ length: count }, (_, index) => {
    const thought = thoughts[index];
    const advanced = techniques[index];
    return {
      thought,
      options: shuffled([
        { kind: "familiar", text: `I’m having the thought that ${thought}`, takeaway: "Adding those words helps me notice the thought and choose my next step." },
        { kind: "advanced", ...advanced },
        { kind: "sticky", text: distractors[index] },
      ]),
    };
  });
}
