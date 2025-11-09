const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// SHA-256 hashing function
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

// Construct rainbow table from password list
const generateRainbowTable = (passwords) => {
    const rainbowTable = {};
    let count = 0;
    
    console.log(`Generating rainbow table for ${passwords.length} passwords...`);
    
    for (const password of passwords) {
        const hash = hashPassword(password);
        rainbowTable[hash] = password;
        count++;
        
        if (count % 1000 === 0) {
            console.log(`  Processed ${count}/${passwords.length} passwords...`);
        }
    }
    
    console.log(`✓ Rainbow table generated with ${count} entries`);
    return rainbowTable;
};

// Persist rainbow table to disk
const saveRainbowTable = (rainbowTable, filename = 'RainbowTable.json') => {
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, JSON.stringify(rainbowTable, null, 2));
    console.log(`✓ Rainbow table saved to ${filename}`);
};

// Retrieve rainbow table from file
const loadRainbowTable = (filename = 'RainbowTable.json') => {
    try {
        const filepath = path.join(__dirname, filename);
        const data = fs.readFileSync(filepath, 'utf-8');
        const rainbowTable = JSON.parse(data);
        console.log(`✓ Rainbow table loaded with ${Object.keys(rainbowTable).length} entries`);
        return rainbowTable;
    } catch (error) {
        console.log(`Warning: Could not load rainbow table from ${filename}`);
        return null;
    }
};

// Perform rainbow table attack by looking up hash
const rainbowTableAttack = async (targetHash, rainbowTable) => {
    console.log('Starting Rainbow Table attack...');
    const startTime = Date.now();
    
    if (!rainbowTable) {
        console.log('✗ No rainbow table available');
        return false;
    }
    
// Check for direct hash match in table
    if (rainbowTable[targetHash]) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✓ Password found in rainbow table in ${elapsed}s: ${rainbowTable[targetHash]}`);
        return rainbowTable[targetHash];
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✗ Rainbow table attack failed after ${elapsed}s. Hash not in table.`);
    return false;
};

// Create extensive rainbow table using common patterns
const generateComprehensiveRainbowTable = (chars, maxLength = 6) => {
    const passwords = new Set();
    
    console.log(`Generating comprehensive rainbow table (length 1-${maxLength})...`);
    
// Recursively generate all password combinations up to a given length
    const generate = (current, depth) => {
        if (depth === 0) return;
        
        for (let i = 0; i < chars.length; i++) {
            const newPassword = current + chars[i];
            passwords.add(newPassword);
            
            if (depth > 1) {
                generate(newPassword, depth - 1);
            }
        }
    };
    
// Iterate through each password length
    for (let length = 1; length <= maxLength; length++) {
        console.log(`  Generating passwords of length ${length}...`);
        generate('', length);
    }
    
    console.log(`✓ Generated ${passwords.size} unique passwords`);
    return Array.from(passwords);
};

module.exports = {
    hashPassword,
    generateRainbowTable,
    saveRainbowTable,
    loadRainbowTable,
    rainbowTableAttack,
    generateComprehensiveRainbowTable
};
