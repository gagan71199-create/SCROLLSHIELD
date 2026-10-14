// quotes.js — a small set of original motivational lines shown to the user
// when they return to Reels/Shorts after being away for a while.
// Loaded before content.js.

const RS_QUOTES = [
  "You came back — that's okay. Just notice it this time.",
  "One scroll doesn't have to become an hour. You're in control here.",
  "Future you will thank you for closing this a little sooner today.",
  "This feed was built to never end. You get to decide when you're done.",
  "A short break now saves you a long regret later.",
  "You opened this on purpose. Make sure you close it on purpose too.",
  "Your time is worth more than an infinite feed.",
  "Progress on your goals happens away from this screen.",
  "Notice the urge, then choose anyway.",
  "Five minutes here rarely feels like five minutes later.",
  "You're allowed to scroll. Just make it a choice, not a habit.",
  "The best scroll session is the one you walk away from on time.",
];

// Shown on the BLOCK overlay itself — a gentle nudge of awareness about time
// already spent, meant to prompt reflection rather than shame.
const RS_OVERLAY_QUOTES = [
  "That task you've been putting off is still waiting for you.",
  "This is time you won't get back — is this really how you want to spend it?",
  "You told yourself 'just five minutes' a while ago.",
  "Nobody scrolls here and later says 'that was time well spent.'",
  "Somewhere, the version of you with your goals done isn't scrolling right now.",
  "This app doesn't miss you when you leave. Your other priorities might.",
  "You'll remember today for what you did, not for what you scrolled.",
  "Every reel here was designed to make 'one more' feel small. It adds up anyway.",
  "If a friend spent their day this way, what would you gently tell them?",
  "The scroll resets in seconds. The hour it already took doesn't.",
];

function rsRandomQuote() {
  return RS_QUOTES[Math.floor(Math.random() * RS_QUOTES.length)];
}

function rsRandomOverlayQuote() {
  return RS_OVERLAY_QUOTES[Math.floor(Math.random() * RS_OVERLAY_QUOTES.length)];
}
