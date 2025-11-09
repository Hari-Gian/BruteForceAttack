// Test script for worker reallocation
const { bruteforce_char_parallel } = require('./bruteforce-attack.js');

// Character sets for testing
const CHARACTER_SETS = {
    numbers: "0123456789",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
};

/**
 * Build character set from selected sets
 * 
 * @param {Array<string>} selectedSets - Array of character set names
 * @returns {string} - Combined character set
 */
const buildCharacterSet = (selectedSets) => {
    let chars = "";
    for (const setName of selectedSets) {
        if (CHARACTER_SETS[setName]) {
            chars += CHARACTER_SETS[setName];
        }
    }
    return chars;
};

// Entry point for reallocation test
const main = async () => {
// Configure test parameters
const targetPassword = "aaaaa"; // Example 5-character password
const maxDepth = 6;             // Max password length for test
const charsets = ["lowercase"]; // Using only lowercase for quicker tests
const chars = buildCharacterSet(charsets);
    
    console.log("=".repeat(60));
    console.log("TEST WORKER REALLOCATION");
    console.log(`Using ${require('os').cpus().length} CPU cores for maximum performance`);
    console.log("=".repeat(60));
    
// Show test configuration
    console.log("");
    console.log(`Target password for test: ${targetPassword} (length ${targetPassword.length})`);
    console.log(`Max password length: ${maxDepth}`);
    console.log(`Character sets: ${charsets.join(', ')}`);
    console.log(`Total characters: ${chars.length}`);
    console.log(`DOWN should finish lengths 1-3, then help UP with 4-6`);
    console.log("=".repeat(60));

    console.log("");
    console.log("=".repeat(60));
    console.log("Brute-Force Attack with Worker Reallocation");
    console.log("=".repeat(60));
    
// Execute brute force attack: confirm DOWN workers reallocate to UP
    const success = await bruteforce_char_parallel(chars, maxDepth, targetPassword);
    
    if (success) {
        console.log("");
        console.log("=".repeat(60));
        console.log("TEST SUCCESSFUL - PASSWORD FOUND!");
        console.log("=".repeat(60));
    } else {
        console.log("");
        console.log("=".repeat(60));
        console.log("TEST FAILED - PASSWORD NOT FOUND");
        console.log("=".repeat(60));
    }
};

// Run the test
main().catch(console.error);
