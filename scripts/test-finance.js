import { formatCurrency, evaluateFormula, calculateDelta } from '../src/utils/finance.js';

console.log("🧪 TESTING Safe Finance Logic (Phase 2)...\n");

let failures = 0;

const assert = (desc, actual, expected) => {
    // Normalize spaces: replace non-breaking space (0xA0) with normal space (0x20)
    const normActual = typeof actual === 'string' ? actual.replace(/\u00a0/g, ' ') : actual;
    const normExpected = typeof expected === 'string' ? expected.replace(/\u00a0/g, ' ') : expected;

    // Also remove grouping dots for looser verification if needed, but let's try exact match first with normalized spaces.

    // Verify equality
    const passed = (typeof actual === 'object' && actual !== null)
        ? JSON.stringify(actual) === JSON.stringify(expected)
        : normActual === normExpected;
    if (passed) {
        console.log(`✅ ${desc}`);
    } else {
        console.error(`❌ ${desc}`);
        console.error(`   Expected: "${expected}"`);
        console.error(`   Got:      "${actual}"`);
        console.error(`   Debug:    "${escape(normActual)}" vs "${escape(normExpected)}"`);
        failures++;
    }
}

// --- SUITE 1: formatCurrency ---
console.log("\n--- formatCurrency ---");
assert("Handles integer", formatCurrency(1000), "1.000,00 €");
assert("Handles float", formatCurrency(1234.56), "1.234,56 €");
assert("Handles string number", formatCurrency("500"), "500,00 €");
assert("Handles string with comma", formatCurrency("50,50"), "50,50 €");
assert("Handles null (Safe)", formatCurrency(null), "");
assert("Handles undefined (Safe)", formatCurrency(undefined), "");
assert("Handles object (Safe)", formatCurrency({}), "");

// --- SUITE 2: evaluateFormula ---
console.log("\n--- evaluateFormula ---");
assert("Simple multimeter", evaluateFormula("=10*5"), 50);
assert("Division", evaluateFormula("=100/4"), 25);
assert("Without =", evaluateFormula("50+50"), 100);
assert("Decimal comma", evaluateFormula("=10,5*2"), 21);
// Edge cases
try {
    evaluateFormula("=10/0");
    console.error("❌ Division by zero should throw");
    failures++;
} catch (e) { console.log("✅ Division by zero throws correctly"); }

try {
    evaluateFormula("=BadSyntax++");
    console.error("❌ Bad syntax should throw");
    failures++;
} catch (e) { console.log("✅ Bad syntax throws correctly"); }


// --- SUITE 3: calculateDelta ---
console.log("\n--- calculateDelta ---");
assert("Increase", calculateDelta(100, 50), { value: 50, isPositive: true, changed: true });
assert("Decrease", calculateDelta(50, 100), { value: -50, isPositive: false, changed: true });
assert("No change", calculateDelta(100, 100), { value: 0, isPositive: false, changed: false });
assert("Null safe", calculateDelta(null, 100), { value: 0, changed: false });


if (failures === 0) {
    console.log("\n✨ ALL TESTS PASSED. Logic is safe to merge.");
    process.exit(0);
} else {
    console.error(`\n💀 ${failures} TESTS FAILED.`);
    process.exit(1);
}
