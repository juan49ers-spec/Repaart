
// --- COPY OF ALGORITHM FOR ISOLATED TESTING ---
const calculateDayLayout = (events, containerWidthPx = 200, minCardWidthPx = 30) => {
    if (!events || events.length === 0) return [];

    const processed = events.map(e => {
        const start = new Date(e.startAt);
        const end = new Date(e.endAt);
        const startMin = start.getHours() * 60 + start.getMinutes();
        let endMin = end.getHours() * 60 + end.getMinutes();
        if (endMin < startMin) endMin = 1440;
        if (endMin === 0) endMin = 1440;

        return { ...e, _start: startMin, _end: endMin, _id: e.id };
    }).sort((a, b) => {
        if (a._start !== b._start) return a._start - b._start;
        return (b._end - b._start) - (a._end - a._start);
    });

    const clusters = [];
    let currentCluster = [];
    let clusterEnd = -1;

    processed.forEach(event => {
        if (event._start >= clusterEnd) {
            if (currentCluster.length > 0) clusters.push(currentCluster);
            currentCluster = [event];
            clusterEnd = event._end;
        } else {
            currentCluster.push(event);
            clusterEnd = Math.max(clusterEnd, event._end);
        }
    });
    if (currentCluster.length > 0) clusters.push(currentCluster);

    const results = [];
    clusters.forEach(cluster => {
        const columns = [];
        cluster.forEach(event => {
            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                if (columns[i] <= event._start) {
                    columns[i] = event._end;
                    event._colIndex = i;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                columns.push(event._end);
                event._colIndex = columns.length - 1;
            }
        });

        const numColumns = columns.length;
        const singleColWidth = containerWidthPx / numColumns;
        const isDeckMode = singleColWidth < minCardWidthPx;

        cluster.forEach(event => {
            let style = {};
            if (isDeckMode) {
                const offset = 12;
                const leftPx = event._colIndex * offset;
                style = {
                    displayType: 'deck',
                    left: `${(leftPx / containerWidthPx) * 100}%`,
                    width: `calc(100% - ${(leftPx / containerWidthPx) * 100}%)`,
                    zIndex: 10 + event._colIndex,
                    isDeck: true
                };
            } else {
                const colWidthPct = 100 / numColumns;
                const leftPct = event._colIndex * colWidthPct;
                style = {
                    displayType: 'columns',
                    left: `${leftPct}%`,
                    width: `${colWidthPct}%`,
                    zIndex: 10,
                    isDeck: false
                };
            }
            results.push({ ...event, layout: style });
        });
    });

    return results;
};

// --- TEST SCENARIOS ---
console.log("=== LAYOUT ALGORITHM UNIT TEST ===");

const baseDate = "2024-01-01";

// Case 1: Single Rider
const case1 = [{ id: '1', startAt: `${baseDate}T10:00:00`, endAt: `${baseDate}T12:00:00` }];
const res1 = calculateDayLayout(case1, 200, 30);
console.log("[CASE 1] Single Rider:", res1[0].layout.displayType,
    res1[0].layout.width === '100%' ? "✅ 100% Width" : `❌ ${res1[0].layout.width}`);

// Case 2: 3 Riders Overlapping (Standard)
const case2 = [
    { id: 'A', startAt: `${baseDate}T10:00:00`, endAt: `${baseDate}T12:00:00` },
    { id: 'B', startAt: `${baseDate}T10:30:00`, endAt: `${baseDate}T12:30:00` },
    { id: 'C', startAt: `${baseDate}T11:00:00`, endAt: `${baseDate}T13:00:00` }
];
const res2 = calculateDayLayout(case2, 200, 30); // 200px / 3 = 66px > 30px. Should be columns.
console.log("\n[CASE 2] 3 Riders (Standard):");
const types2 = res2.map(r => r.layout.displayType);
const widths2 = res2.map(r => r.layout.width);
console.log("Types:", types2.every(t => t === 'columns') ? "✅ All Columns" : types2);
console.log("Widths:", widths2[0] === '33.333333333333336%' ? "✅ ~33%" : widths2[0]);

// Case 3: 10 Riders (DECK MODE)
const case3 = [];
for (let i = 0; i < 10; i++) {
    case3.push({ id: `D${i}`, startAt: `${baseDate}T10:00:00`, endAt: `${baseDate}T12:00:00` });
}
const res3 = calculateDayLayout(case3, 200, 30); // 200px / 10 = 20px < 30px. Should be DECK.
console.log("\n[CASE 3] 10 Riders (Deck Mode):");
const types3 = res3.map(r => r.layout.displayType);
console.log("Types:", types3.every(t => t === 'deck') ? "✅ All Deck" : types3);
console.log("First Left:", res3[0].layout.left);
console.log("Last Index Z:", res3[9].layout.zIndex);

if (types3.every(t => t === 'deck') && types2.every(t => t === 'columns')) {
    console.log("\n✅ OVERALL RESULT: PASSED");
} else {
    console.log("\n❌ OVERALL RESULT: FAILED");
}
