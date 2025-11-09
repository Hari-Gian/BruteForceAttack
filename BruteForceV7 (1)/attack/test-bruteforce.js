// Brute force attack testing script
const { bruteforce_char_parallel } = require('./bruteforce-attack.js');

// Character sets for testing
const CHARACTER_SETS = {
    numbers: "0123456789",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    symbols: "!@#$%^&*()_+-=~`[]{}|\\;:'\",.<>?"
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

// Entry point for brute force test
const main = async () => {
// Configure test parameters
const targetPassword = "1a"; // Example 2-character password
const maxDepth = 3;          // Max password length for test
const charsets = ["numbers", "lowercase", "uppercase"]; // Character sets for test
const chars = buildCharacterSet(charsets);
    
    console.log("=".repeat(60));
    console.log("TEST BRUTE FORCE ATTACK");
    console.log(`Using ${require('os').cpus().length} CPU cores for maximum performance`);
    console.log("=".repeat(60));
    
// Show test configuration
    console.log("");
    console.log(`Target password for test: ${targetPassword}`);
    console.log(`Max password length: ${maxDepth}`);
    console.log(`Character sets: ${charsets.join(', ')}`);
    console.log(`Total characters: ${chars.length}`);
    console.log("=".repeat(60));

// Execute brute force attack using test settings
    console.log("");
    console.log("=".repeat(60));
    console.log("Direct Brute-Force Attack");
    console.log("=".repeat(60));
    
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
