// Test script for enhanced JSON parsing
// This script tests the new JSON parsing strategies with various malformed inputs

// Mock the enhanced JSON repair function
function repairJson(jsonText) {
  console.log('Repairing JSON with enhanced logic...');
  let repaired = jsonText;
  
  // Step 1: Remove error markers and problematic content
  console.log('Step 1: Removing error markers...');
  repaired = repaired
    .replace(/\[ERROR\]/g, '')  // Remove [ERROR] markers
    .replace(/\[WARNING\]/g, '')  // Remove [WARNING] markers
    .replace(/\[INFO\]/g, '')  // Remove [INFO] markers
    .replace(/error:/gi, '')  // Remove error: prefixes
    .replace(/warning:/gi, '')  // Remove warning: prefixes
    .replace(/info:/gi, '');  // Remove info: prefixes

  // Step 2: Fix double-quoted string values (the main issue you're seeing)
  console.log('Step 2: Fixing double-quoted string values...');
  repaired = repaired
    // Fix the specific pattern: "day": ""Monday"" -> "day": "Monday"
    .replace(/:\s*""([^"]*?)""/g, ': "$1"')
    // Fix other double-quoted patterns
    .replace(/:\s*""([^"]*?)""/g, ': "$1"')
    // Fix triple quotes
    .replace(/:\s*"""([^"]*?)"""/g, ': "$1"')
    // Fix mixed quote patterns
    .replace(/:\s*"([^"]*?)""/g, ': "$1"')
    .replace(/:\s*""([^"]*?)"/g, ': "$1"');

  // Step 3: Fix malformed property values
  console.log('Step 3: Fixing malformed property values...');
  repaired = repaired
    // Fix patterns like: "type": ""Push A"" -> "type": "Push A"
    .replace(/:\s*"([^"]*)"([^",}\]]*)"([^"]*)"\s*([,}])/g, ': "$1$2$3"$4')
    // Fix unquoted string values that should be quoted
    .replace(/:\s*([a-zA-Z][a-zA-Z0-9\s-]*[a-zA-Z0-9])(\s*[,}])/g, ':"$1"$2')
    // Fix numeric values that got quoted
    .replace(/:\s*"(\d+(?:\.\d+)?)"(\s*[,}])/g, ':$1$2');

  // Step 4: Enhanced JSON repair patterns
  console.log('Step 4: Applying enhanced repair patterns...');
  const repairPatterns = [
    // Fix missing commas between array items
    { pattern: /}\s*{/g, replacement: '}, {' },
    { pattern: /]\s*{/g, replacement: '], {' },
    { pattern: /}\s*\[/g, replacement: '}, [' },
    
    // Fix trailing/leading commas
    { pattern: /,(\s*[}\]])/g, replacement: '$1' },
    { pattern: /([{[]\s*),/g, replacement: '$1' },
    
    // Fix unquoted property names
    { pattern: /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, replacement: '$1"$2":' },
  ];

  // Apply each repair pattern and log changes
  repairPatterns.forEach(({ pattern, replacement }) => {
    const before = repaired;
    repaired = repaired.replace(pattern, replacement);
    if (before !== repaired) {
      console.log(`Applied repair pattern: ${pattern}`);
    }
  });

  // Step 5: Clean up whitespace and final formatting
  console.log('Step 5: Final cleanup and formatting...');
  repaired = repaired
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*:\s*/g, ': ')
    .trim();

  console.log('JSON repair completed. Original length:', jsonText.length, 'Repaired length:', repaired.length);
  return repaired;
}

// Mock the multiple parsing strategies function
function parseJsonWithMultipleStrategies(jsonText) {
  console.log('Attempting multiple JSON parsing strategies...');
  
  const strategies = [
    {
      name: 'Direct Parse',
      fn: () => JSON.parse(jsonText)
    },
    {
      name: 'Trimmed Parse',
      fn: () => JSON.parse(jsonText.trim())
    },
    {
      name: 'Repaired Parse',
      fn: () => JSON.parse(repairJson(jsonText))
    },
    {
      name: 'Error Marker Removal',
      fn: () => {
        const cleaned = jsonText
          .replace(/\[ERROR\]/g, '')
          .replace(/\[WARNING\]/g, '')
          .replace(/\[INFO\]/g, '')
          .replace(/error:/gi, '')
          .replace(/warning:/gi, '')
          .replace(/info:/gi, '');
        return JSON.parse(cleaned);
      }
    },
    {
      name: 'Double Quote Fix',
      fn: () => {
        const fixed = jsonText
          .replace(/:\s*""([^"]*?)""/g, ': "$1"')
          .replace(/:\s*"""([^"]*?)"""/g, ': "$1"')
          .replace(/:\s*"([^"]*?)""/g, ': "$1"')
          .replace(/:\s*""([^"]*?)"/g, ': "$1"');
        return JSON.parse(fixed);
      }
    },
    {
      name: 'Extract JSON Object',
      fn: () => {
        const match = jsonText.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(repairJson(match[0]));
        }
        throw new Error('No JSON object found');
      }
    },
    {
      name: 'Aggressive Repair',
      fn: () => {
        let aggressive = jsonText
          // Remove all error markers
          .replace(/\[[^\]]*\]/g, '')
          // Fix double quotes
          .replace(/""/g, '"')
          // Fix missing commas
          .replace(/}\s*{/g, '}, {')
          .replace(/]\s*{/g, '], {')
          // Fix unquoted strings
          .replace(/:\s*([a-zA-Z][a-zA-Z0-9\s-]*[a-zA-Z0-9])(\s*[,}])/g, ':"$1"$2');
        
        return JSON.parse(aggressive);
      }
    }
  ];

  for (const strategy of strategies) {
    try {
      console.log(`Trying strategy: ${strategy.name}`);
      const result = strategy.fn();
      
      // Validate the result has the expected structure
      if (result && typeof result === 'object') {
        if ((result.workout && Array.isArray(result.workout)) || 
            (result.diet && Array.isArray(result.diet))) {
          console.log(`✅ Strategy "${strategy.name}" succeeded`);
          return { success: true, data: result, strategy: strategy.name };
        }
      }
      
      console.log(`Strategy "${strategy.name}" returned invalid structure`);
    } catch (error) {
      console.log(`Strategy "${strategy.name}" failed:`, error.message);
    }
  }

  console.log('❌ All parsing strategies failed');
  return { 
    success: false, 
    error: 'All JSON parsing strategies failed',
    strategy: 'none'
  };
}

// Test cases
const testCases = [
  {
    name: 'Double-quoted strings (your main issue)',
    input: '{ "day": ""Monday"", "type": ""Push A"", "routine": [] }',
    expected: 'Should fix double quotes'
  },
  {
    name: 'Error markers in JSON',
    input: '{ "day": "[ERROR]Monday", "type": "Push A", "routine": [] }',
    expected: 'Should remove error markers'
  },
  {
    name: 'Mixed quote patterns',
    input: '{ "day": ""Monday"", "type": "Push A", "routine": [] }',
    expected: 'Should fix mixed quotes'
  },
  {
    name: 'Missing commas',
    input: '{ "day": "Monday" "type": "Push A" "routine": [] }',
    expected: 'Should add missing commas'
  },
  {
    name: 'Unquoted property names',
    input: '{ day: "Monday", type: "Push A", routine: [] }',
    expected: 'Should quote property names'
  },
  {
    name: 'Complex malformed JSON',
    input: '{ "day": ""[ERROR]Monday"", "type": ""Push A"", "routine": "[ { "exercise": "Decline Dumbbell Press"", "sets": 4, "reps": ""6-8"", "rest": ""2-3 min"" } ] }',
    expected: 'Should handle complex malformed JSON'
  }
];

console.log('🧪 Testing Enhanced JSON Parsing System\n');

testCases.forEach((testCase, index) => {
  console.log(`\n--- Test ${index + 1}: ${testCase.name} ---`);
  console.log('Input:', testCase.input);
  console.log('Expected:', testCase.expected);
  
  const result = parseJsonWithMultipleStrategies(testCase.input);
  
  if (result.success) {
    console.log(`✅ SUCCESS: Parsed using strategy "${result.strategy}"`);
    console.log('Result:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ FAILED:', result.error);
  }
  
  console.log('--- End Test ---\n');
});

console.log('🎉 JSON Parsing Test Complete!');
