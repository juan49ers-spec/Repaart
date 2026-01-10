
const toLocalISOStringWithOffset = (date) => {
    const tzo = -date.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = (num) => {
        const norm = Math.floor(Math.abs(num));
        return (norm < 10 ? '0' : '') + norm;
    };
    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        dif + pad(tzo / 60) + ':' + pad(tzo % 60);
};

console.log("=== DST VERIFICATION STRESS TEST ===");
console.log("System Timezone Offset (Minutes):", new Date().getTimezoneOffset());

// Test 1: Winter Date (Standard Time)
const winterDate = new Date(2024, 0, 15, 10, 0, 0); // Jan 15, 2024
console.log("\n[TEST 1] Winter (Jan 15 2024, 10:00 Local)");
console.log("Object:", winterDate.toString());
console.log("Offset String:", toLocalISOStringWithOffset(winterDate));

// Test 2: Summer Date (DST)
const summerDate = new Date(2024, 5, 15, 10, 0, 0); // June 15, 2024
console.log("\n[TEST 2] Summer (June 15 2024, 10:00 Local)");
console.log("Object:", summerDate.toString());
console.log("Offset String:", toLocalISOStringWithOffset(summerDate));

// Test 3: DST Transition (Spring Forward)
// March 31, 2024 is transition in Europe. 2:00 becomes 3:00.
// Let's test 12:00 PM on that day vs day before.
const preDst = new Date(2024, 2, 30, 12, 0, 0);
const postDst = new Date(2024, 2, 31, 12, 0, 0); // Should have different offset
console.log("\n[TEST 3] Spring Transition Check");
console.log("Pre-Transition:", toLocalISOStringWithOffset(preDst));
console.log("Post-Transition:", toLocalISOStringWithOffset(postDst));

// Analysis
const winterOffset = toLocalISOStringWithOffset(winterDate).slice(-6);
const summerOffset = toLocalISOStringWithOffset(summerDate).slice(-6);

console.log("\n[ANALYSIS]");
if (winterOffset !== summerOffset) {
    console.log(`✅ SUCCESS: Offsets detected as dynamic (${winterOffset} vs ${summerOffset}). System respects DST.`);
} else {
    console.log(`⚠️ WARNING: Offsets are identical (${winterOffset}). Either system is UTC/No-DST, or logic failed.`);
}

console.log("\n=== END TEST ===");
