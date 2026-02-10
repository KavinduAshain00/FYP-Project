/**
 * Tutor (AI hints) constants
 */
const FALLBACK_HINTS = {
  button: [
    '🔍 Check if your button has an onclick handler or event listener.',
    '💡 Make sure the button element is not disabled.',
    '📝 Verify the button is not covered by another element (check z-index).',
  ],
  center: [
    '🎯 For horizontal centering, try: margin: 0 auto; with a defined width.',
    '🎯 For flexbox centering: display: flex; justify-content: center; align-items: center;',
    '🎯 For grid centering: display: grid; place-items: center;',
  ],
  loop: [
    '🔄 Check your loop condition - is it ever becoming false?',
    '🔄 Verify your counter is being incremented/decremented.',
    '🔄 Use console.log() inside the loop to track iterations.',
  ],
  undefined: [
    '❓ The variable might not be initialized before use.',
    '❓ Check for typos in variable names (JavaScript is case-sensitive).',
    '❓ Ensure the variable is in the correct scope.',
  ],
  syntax: [
    '🔧 Check for missing semicolons, brackets, or parentheses.',
    '🔧 Verify all strings are properly quoted.',
    '🔧 Look for unclosed HTML tags.',
  ],
  animation: [
    "🎬 Make sure you're updating the position inside a game loop (requestAnimationFrame).",
    '🎬 Check that your animation values are changing each frame.',
    '🎬 Verify the element exists before trying to animate it.',
  ],
  collision: [
    '💥 Compare the bounding boxes of both objects.',
    '💥 Check if (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x)...',
    '💥 Remember to check both X and Y axes for 2D collision.',
  ],
};

const DEFAULT_FALLBACK_HINTS = [
  '🤔 Try breaking down your problem into smaller steps.',
  '📖 Re-read the module objectives and hints.',
  "🔍 Use console.log() to debug and see what's happening.",
];

module.exports = {
  FALLBACK_HINTS,
  DEFAULT_FALLBACK_HINTS,
};
