// Comprehensive test of the regex pattern for filtering SVG path data from subtitles
const testCases = [
  // Original example from user
  `{=7}m 126 -170 l 148 -49 -100 29 b -102 23 -103 15 -101 6 -100 -3 -102 -15 -109 -28 -114 -40 -123 -76 -128 -75 -148 -68 -156 -68 -165 -69 {=6}Izumi {=7}m 126 -170 l 148 -49 -100 29 b -102 23 -103 15 -101 6 -100 -3 -102 -15 -109 -28 -114 -40 -123 -76 -128 -75 -148 -68 -156 -68 -165 -69 {=6}I`,
  
  // Simpler example
  `{=5}m 0 0 l 10 10 {=4}Hello`,
  
  // Multiple segments in one string
  `{=3}m 1 2 b 3 4 5 6 {=2}Test {=7}l 8 9 v 10 {=1}World`,
  
  // Mixed with regular text
  `Regular text {=4}path data here {=3}and more text after`,
  
  // Edge case with no text after last marker
  `{=1}m 0 0 l 1 1 {=2}`
];

console.log("Testing SVG path filtering implementation:\n");

testCases.forEach((testString, index) => {
  console.log(`Test ${index + 1}:`);
  console.log("Original:", testString);
  
  // Apply the regex pattern from our implementation
  const filtered = testString.replace(/\{=\d+\}[^{]*?\{=\d+\}\s*([^{}]*)/g, function(match, textContent) {
    return textContent.trim() + ' ';
  }).replace(/\s+/g, " ").trim();
  
  console.log("Filtered:", filtered);
  console.log("---");
});

// Test with the exact function implementation
function cleanSubtitleText(text) {
  if (!text) return "";

  // Remove SVG path data pattern: {=number}path_commands{=number}text_content
  // Capture the text content after the second marker and preserve it
  text = text.replace(/\{=\d+\}[^{]*?\{=\d+\}\s*([^{}]*)/g, function(match, textContent) {
    // Extract and return only the text content, with a space to separate from next content
    return textContent.trim() + ' ';
  });

  // Don't mess with ruby/rt tags, and also preserve span for coloring
  text = text.replace(/<(?!\/?(?:ruby|rt|rp|span))[^>]*>/g, "");

  // Only clean up basic HTML entities and whitespace
  return text
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

console.log("\nTesting with full implementation function:");
testCases.forEach((testString, index) => {
  console.log(`Test ${index + 1}:`);
  console.log("Original:", testString);
  console.log("Filtered:", cleanSubtitleText(testString));
  console.log("---");
});