import fs from 'fs';

const aequitasData = JSON.parse(fs.readFileSync('src/data/aequitasData.json', 'utf-8'));
const item = aequitasData.find(d => d.id === 'RF0104');
console.log('RF0104 in aequitasData.json:');
console.log(JSON.stringify(item, null, 2));
