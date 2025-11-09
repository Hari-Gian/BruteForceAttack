const fs = require('fs');
const path = require('path');
const { generatePermutations } = require('./credential-permutation.js');

// Load common passwords for dictionary attack
const loadDictionary = () => {
    try {
        const dictionaryPath = path.join(__dirname, 'PasswordDictionary.txt');
        const content = fs.readFileSync(dictionaryPath, 'utf-8');
        return content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    } catch (error) {
        console.log("Warning: Could not load password dictionary");
        return [];
    }
};

// Check a list of passwords in parallel
const checkPasswordsParallel = async (passwords, checkFunction, chunkSize = 1000) => {
    const chunks = [];
    for (let i = 0; i < passwords.length; i += chunkSize) {
        chunks.push(passwords.slice(i, i + chunkSize));
    }

    const promises = chunks.map(chunk => {
        return new Promise((resolve, reject) => {
            for (let pwd of chunk) {
                if (checkFunction(pwd)) {
                    resolve(pwd);
                    return;
                }
            }
            resolve(null);
        });
    });

    const results = await Promise.all(promises);
    const found = results.find(result => result !== null);
    return found || null;
};

// Execute smart dictionary attack with parallel processing
const smartDictionaryAttack = async (userData, checkFunction) => {
    const NUM_WORKERS = require('os').cpus().length;
    console.log(`Starting PARALLEL smart dictionary attack with ${NUM_WORKERS} workers...`);
    const startTime = Date.now();
    
// Prioritize user credential permutations concurrently
    console.log("Testing user credential permutations...");
    const userPermutations = generatePermutations(userData);
    const foundInPermutations = await checkPasswordsParallel(userPermutations, checkFunction);
    
    if (foundInPermutations) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✓ Password found using user credential permutation in ${elapsed}s: ${foundInPermutations}`);
        return true;
    }

// Next, check against a common password dictionary in parallel
    console.log("Testing common password dictionary...");
    const dictionary = loadDictionary();
    const foundInDictionary = await checkPasswordsParallel(dictionary, checkFunction, 5000);
    
    if (foundInDictionary) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✓ Password found using dictionary in ${elapsed}s: ${foundInDictionary}`);
        return true;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✗ Smart dictionary attack failed after ${elapsed}s. Password not found.`);
    return false;
};

module.exports = { smartDictionaryAttack };
