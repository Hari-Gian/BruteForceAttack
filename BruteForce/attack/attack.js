const fs = require('fs');
const path = require('path');
const os = require('os');

const { smartDictionaryAttack } = require('./dictionary-attack.js');
const { bruteforce_char_parallel } = require('./bruteforce-attack.js');
const { loadRainbowTable, rainbowTableAttack, hashPassword } = require('./rainbow-table.js');

// Character sets for attack configurations
const CHARACTER_SETS = {
    numbers: "0123456789",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    turkish: "ÇŞĞİÖÜçşğıöü",
    cyrillic: "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя",
    symbols: "!@#$%^&*()_+-=~`[]{}|\\;:'\",.<>?/©®™±§¶°¿¡"
};

// Process command line arguments
const parseArguments = () => {
    const args = process.argv.slice(2);
    const config = {
targetPassword: "gIanPeN", // Default password to crack
maxDepth: 10,             // Default max password length
charsets: ["lowercase", "uppercase"] // Default character types
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--password':
            case '-p':
                if (i + 1 < args.length) {
                    config.targetPassword = args[++i];
                }
                break;
            case '--max-depth':
            case '-d':
                if (i + 1 < args.length) {
                    config.maxDepth = parseInt(args[++i]);
                }
                break;
            case '--charset':
            case '-c':
                if (i + 1 < args.length) {
                    config.charsets = args[++i].split(',');
                }
                break;
            case '--help':
            case '-h':
                console.log("Usage: node attack.js [options]");
                console.log("Options:");
                console.log("  -p, --password <password>     Target password (default: gIanPeN)");
                console.log("  -d, --max-depth <number>      Maximum password length (default: 10)");
                console.log("  -c, --charset <sets>          Character sets to use, comma-separated");
                console.log("                                Available sets: numbers, lowercase, uppercase, turkish, cyrillic, symbols");
                console.log("                                (default: lowercase,uppercase)");
                console.log("  -h, --help                    Show this help message");
                process.exit(0);
        }
    }

    return config;
};

// Construct character set based on selections
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

// Entry point for attack execution
const main = async () => {
// Get command line configuration
    const config = parseArguments();
    const chars = buildCharacterSet(config.charsets);
    const targetHash = hashPassword(config.targetPassword);
    
    console.log("=".repeat(60));
    console.log("PARALLEL PASSWORD ATTACK SYSTEM");
    console.log(`Using ${os.cpus().length} CPU cores for maximum performance`);
    console.log("=".repeat(60));
    
// Show attack settings
    console.log("");
    console.log(`Target password: ${config.targetPassword}`);
    console.log(`Target hash (SHA-256): ${targetHash}`);
    console.log(`Max password length: ${config.maxDepth}`);
    console.log(`Character sets: ${config.charsets.join(', ')}`);
    console.log(`Total characters: ${chars.length}`);
    console.log("=".repeat(60));

// 1. Initiate Rainbow Table attack (quickest for known hashes)
    console.log("");
    console.log("=".repeat(60));
    console.log("Step 1: Rainbow Table Attack");
    console.log("=".repeat(60));
    const rainbowTable = loadRainbowTable();
    const rainbowSuccess = await rainbowTableAttack(targetHash, rainbowTable);
    
    if (rainbowSuccess) {
        console.log("");
        console.log("=".repeat(60));
        console.log("Attack sequence completed - PASSWORD FOUND via Rainbow Table!");
        console.log("=".repeat(60));
        return;
    }

// 2. Execute smart attack (credentials + dictionary) in parallel
    console.log("");
    console.log("=".repeat(60));
    console.log("Step 2: Smart Dictionary Attack");
    console.log("=".repeat(60));
    
// Define password check function
    const check = (pwd) => {
        return pwd == config.targetPassword;
    };
    
// Sample user data (placeholder for actual user info)
    const userData = {
        email: "user@example.com",
        birthday: "1990-01-01",
        name: "John",
        surname: "Doe"
    };
    
    const smartSuccess = await smartDictionaryAttack(userData, check);
    
    if (smartSuccess) {
        console.log("");
        console.log("=".repeat(60));
        console.log("Attack sequence completed - PASSWORD FOUND via Dictionary!");
        console.log("=".repeat(60));
        return;
    }

// 3. Use parallel brute-force as a last resort
    console.log("");
    console.log("=".repeat(60));
    console.log("Step 3: Parallel Brute-Force Attack");
    console.log("=".repeat(60));
    await bruteforce_char_parallel(chars, config.maxDepth, config.targetPassword);
    
    console.log("");
    console.log("=".repeat(60));
    console.log("Attack sequence completed");
    console.log("=".repeat(60));
};

// Begin the attack in parallel
main().catch(console.error);
