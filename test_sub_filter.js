// Test the regex pattern for filtering SVG path data from subtitles
const testString = `{=7}m 126 -170 l 148 -49 -100 29 b -102 23 -103 15 -101 6 -100 -3 -102 -15 -109 -28 -114 -40 -123 -76 -128 -75 -148 -68 -156 -68 -165 -69 {=6}Izumi {=7}m 126 -170 l 148 -49 -100 29 b -102 23 -103 15 -101 6 -100 -3 -102 -15 -109 -28 -114 -40 -123 -76 -128 -75 -148 -68 -156 -68 -165 -69 {=6}I`;

console.log("Original string:");
console.log(testString);

// Apply the updated regex pattern with space addition
const filtered = testString.replace(/\{=\d+\}[^{]*?\{=\d+\}\s*([^{}]*)/g, function(match, textContent) {
  return textContent.trim() + ' ';
});

console.log("\nFiltered string:");
console.log(filtered);