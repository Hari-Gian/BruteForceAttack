#!/usr/bin/env node

const readline = require('readline');
const { bruteforce_char_parallel } = require('./bruteforce-attack.js');
const { hashPassword } = require('./rainbow-table.js');

// Available character sets
const CHARACTER_SETS = {
    numbers: "0123456789",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    turkish: "ÇŞĞİÖÜçşğıöü",
    cyrillic: "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя",
    symbols: "!@#$%^&*()_+-=~`[]{}|\\;:'\",.<>?/©®™±§¶°¿¡"
};

// Compile character set from chosen options
const buildCharacterSet = (selectedSets) => {
    let chars = "";
    for (const setName of selectedSets) {
        if (CHARACTER_SETS[setName]) {
            chars += CHARACTER_SETS[setName];
        } else {
            console.warn(`Warning: Unknown character set '${setName}' ignored`);
        }
    }
    return chars;
};

// Initialize readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Show main menu options
const showMenu = () => {
    console.log("\n" + "=".repeat(60));
    console.log("BRUTE FORCE ATTACK TOOL");
    console.log("=".repeat(60));
    console.log("1. Run Brute Force Attack");
    console.log("2. Show Character Sets");
    console.log("3. Exit");
    console.log("=".repeat(60));
};

// Prompt user for input
const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

// List defined character sets
const showCharacterSets = () => {
    console.log("\nAvailable Character Sets:");
    console.log("-".repeat(30));
    for (const [name, chars] of Object.entries(CHARACTER_SETS)) {
        console.log(`${name}: ${chars.substring(0, 30)}${chars.length > 30 ? '...' : ''} (${chars.length} chars)`);
    }
};

// Set attack parameters
const configureAttack = async () => {
    console.log("\n--- Attack Configuration ---");
    
    const targetPassword = await askQuestion("Enter target password: ");
    const maxDepth = parseInt(await askQuestion("Enter maximum password length (default 10): ")) || 10;
    
    console.log("\nSelect character sets (comma-separated, e.g., 'numbers,lowercase,uppercase'):");
    showCharacterSets();
    const charsetInput = await askQuestion("Character sets (default: lowercase,uppercase): ");
    const charsets = charsetInput ? charsetInput.split(',').map(s => s.trim()) : ['lowercase', 'uppercase'];
    
    return {
        targetPassword,
        maxDepth,
        charsets
    };
};

// Execute brute-force attack, providing real-time updates
const runAttack = async (config) => {
    const chars = buildCharacterSet(config.charsets);
    const targetHash = hashPassword(config.targetPassword);
    
    console.log("\n" + "=".repeat(60));
    console.log("ATTACK CONFIGURATION");
    console.log("=".repeat(60));
    console.log(`Target password: ${config.targetPassword}`);
    console.log(`Target hash: ${targetHash}`);
    console.log(`Max length: ${config.maxDepth}`);
    console.log(`Character sets: ${config.charsets.join(', ')}`);
    console.log(`Total characters: ${chars.length}`);
    console.log("=".repeat(60));
    
    console.log("\nStarting attack...\n");
    
// Initiate the attack
    const startTime = Date.now();
    const success = await bruteforce_char_parallel(chars, config.maxDepth, config.targetPassword);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log("\n" + "=".repeat(60));
    if (success) {
        console.log(`PASSWORD FOUND in ${elapsed}s: ${success}`);
    } else {
        console.log(`ATTACK FAILED after ${elapsed}s`);
    }
    console.log("=".repeat(60));
};

// Core CLI interaction loop
const main = async () => {
    while (true) {
        showMenu();
        const choice = await askQuestion("Select an option (1-3): ");
        
        switch (choice) {
            case '1':
                const config = await configureAttack();
                await runAttack(config);
                await askQuestion("\nPress Enter to continue...");
                break;
            case '2':
                showCharacterSets();
                await askQuestion("\nPress Enter to continue...");
                break;
            case '3':
                console.log("Goodbye!");
                rl.close();
                return;
            default:
                console.log("Invalid option. Please try again.");
        }
    }
};

// Manage graceful exit on interruption
rl.on('SIGINT', () => {
    console.log("\n\nExiting...");
    rl.close();
    process.exit(0);
});

// Launch the command-line interface
main().catch(console.error);
