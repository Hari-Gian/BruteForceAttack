const fs = require('fs');
const path = require('path');
const { generateRainbowTable, saveRainbowTable, generateComprehensiveRainbowTable } = require('./rainbow-table.js');
const { generatePermutations } = require('./credential-permutation.js');

// Define character sets
const numbers = "0123456789";
const normalLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const turkishLetters = "ÇŞĞİÖÜçşğıöü";
const cyrillicLetters = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const symbols = "!@#$%^&*()_+-=~`[]{}|\\;:'\",.<>?/©®™±§¶°¿¡";

// Load dictionary file
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

// Create sample user data permutations
const generateSamplePermutations = () => {
    const sampleUsers = [
        { email: "user@example.com", birthday: "1990-01-01", name: "John", surname: "Doe" },
        { email: "admin@test.com", birthday: "1985-05-15", name: "Admin", surname: "User" },
        { email: "test@mail.com", birthday: "2000-12-31", name: "Test", surname: "Account" }
    ];
    
    const allPermutations = [];
    for (const userData of sampleUsers) {
        allPermutations.push(...generatePermutations(userData));
    }
    
    return allPermutations;
};

// Primary rainbow table generation function
const main = async () => {
    console.log("=".repeat(60));
    console.log("RAINBOW TABLE GENERATOR");
    console.log("=".repeat(60));
    
    const allPasswords = new Set();
    
// 1. Include dictionary passwords
    console.log("\n1. Loading dictionary passwords...");
    const dictionary = loadDictionary();
    dictionary.forEach(pwd => allPasswords.add(pwd));
    console.log(`   Added ${dictionary.length} dictionary passwords`);
    
// 2. Generate and add sample user permutations
    console.log("\n2. Generating sample user permutations...");
    const permutations = generateSamplePermutations();
    permutations.forEach(pwd => allPasswords.add(pwd));
    console.log(`   Added ${permutations.length} user permutations`);
    
// 3. Include common short passwords (1-3 characters to manage memory)
    console.log("\n3. Generating common short passwords (1-3 chars)...");
    const commonChars = numbers + "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$";
    const shortPasswords = generateComprehensiveRainbowTable(commonChars, 3);
    shortPasswords.forEach(pwd => allPasswords.add(pwd));
    console.log(`   Added ${shortPasswords.length} short passwords`);
    
// 4. Incorporate a specific test password
    console.log("\n4. Adding test password...");
    allPasswords.add("şД3\\");
    console.log(`   Added test password`);
    
// Begin rainbow table generation
    console.log("\n" + "=".repeat(60));
    console.log(`Total unique passwords to hash: ${allPasswords.size}`);
    console.log("=".repeat(60));
    
    const passwordArray = Array.from(allPasswords);
    const rainbowTable = generateRainbowTable(passwordArray);
    
// Write rainbow table to file
    console.log("\n" + "=".repeat(60));
    saveRainbowTable(rainbowTable);
    console.log("=".repeat(60));
    
    console.log("\n✓ Rainbow table generation complete!");
    console.log(`  Total entries: ${Object.keys(rainbowTable).length}`);
    console.log(`  File: RainbowTable.json`);
};

main().catch(console.error);
