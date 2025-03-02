const initialS = {};

for (let i = 34; i <= 38; i++) {
    initialS[`S${i}`] = {
        mode: 'symmetrical',
        enabled: true,
        compareToKey: 'S13',
        comparisonType: 'primary',
        waterfall: true,
        bar: true,
        point: true,
    };
}

console.log(JSON.stringify(initialS, null, 2));