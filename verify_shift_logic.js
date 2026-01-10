var pad = (n) => String(n).padStart(2, '0');

// Mock Data from Form
var data = {
    startDate: '2025-12-20',
    startTime: '14:30',
    endDate: '2025-12-20',
    endTime: '18:30'
};

// Logic from ShiftModal.jsx
var [startYear, startMonth, startDay] = data.startDate.split('-').map(Number);
var [startHour, startMinute] = data.startTime.split(':').map(Number);

// Construct String
var startAt = `${startYear}-${pad(startMonth)}-${pad(startDay)}T${pad(startHour)}:${pad(startMinute)}:00`;

console.log('Constructed Payload startAt:', startAt);

// Logic from WeeklyScheduler.jsx (Simulate Parsing)
var parseDateManual = (isoStr) => {
    if (!isoStr) return new Date();
    // Handle both "2024-01-01T10:00:00" and "2024-01-01T10:00:00.000Z" (legacy)
    var cleanStr = isoStr.replace('Z', '').split('.')[0];
    var [datePart, timePart] = cleanStr.split('T');
    var [y, m, d] = datePart.split('-').map(Number);
    var [h, min] = timePart.split(':').map(Number);
    // Note: m - 1 because Date month is 0-indexed
    return new Date(y, m - 1, d, h, min, 0);
};

var parsedDate = parseDateManual(startAt);
console.log('Parsed Date Object:', parsedDate.toString());
console.log('Parsed Date ISO:', parsedDate.toISOString());

// Test with 00:00
data.startTime = '00:00';
[startHour, startMinute] = data.startTime.split(':').map(Number);
startAt = `${startYear}-${pad(startMonth)}-${pad(startDay)}T${pad(startHour)}:${pad(startMinute)}:00`;
console.log('Constructed 00:00 Payload:', startAt);
parsedDate = parseDateManual(startAt);
console.log('Parsed 00:00 Date:', parsedDate.toString());

// Test Edge Case: Empty Time?
try {
    var badTime = '';
    var [h, m] = badTime.split(':').map(Number);
    console.log('Empty Time parse:', h, m);
} catch (e) {
    console.log('Empty Time error:', e.message);
}
