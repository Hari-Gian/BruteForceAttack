const { parentPort, workerData } = require('worker_threads');

const { chars, depth, startIdx, endIdx, targetPassword } = workerData;

/**
 * Check if the generated password matches the target password
 * 
 * @param {string} password - Password to check
 * @returns {boolean} - True if password matches target, false otherwise
 */
const checkPassword = (password) => {
    return password === targetPassword;
};

/**
 * Generate a password from the current indices
 * 
 * @param {Array<number>} indices - Array of character indices
 * @param {number} depth - Password length
 * @returns {string} - Generated password
 */
const generatePassword = (indices, depth) => {
    let password = "";
    for (let i = 0; i < depth; i++) {
        password += chars[indices[i]];
    }
    return password;
};

/**
 * Increment the indices array to generate the next password combination
 * 
 * @param {Array<number>} indices - Array of character indices
 * @param {number} depth - Password length
 * @param {number} charLength - Length of the character set
 * @returns {boolean} - True if increment was successful, false if all combinations have been tried
 */
const incrementIndices = (indices, depth, charLength) => {
// Iterate from the last index downwards, similar to counting up
    let i = depth - 1;
    while (i >= 0) {
        indices[i]++;
        if (indices[i] === charLength) {
            indices[i] = 0;
            i--;
        } else {
            break;
        }
    }
    
// All combinations explored if index goes below zero
    return i >= 0;
};

/**
 * Iterative brute-force function for better performance
 * 
 * This function generates password combinations iteratively rather than recursively,
 * which is more memory-efficient and faster for large search spaces.
 * 
 * @param {number} depth - Password length to search
 * @param {number} startIdx - Starting character index for this worker
 * @param {number} endIdx - Ending character index for this worker
 * @returns {string|null} - Found password or null if not found
 */
const bruteforce_iterative = (depth, startIdx, endIdx) => {
// Set up array with zeroes to track character indices
    const indices = new Array(depth).fill(0);
    indices[0] = startIdx;

// Loop until the first character index completes its cycle
    while (indices[0] < endIdx) {
// Create password string from current character indices
        const password = generatePassword(indices, depth);
        
// Compare generated password with target
        if (checkPassword(password)) {
            return password;
        }

// Advance indices for the next password combination
        if (!incrementIndices(indices, depth, chars.length)) {
// Worker has exhausted all possible combinations
            break;
        }
    }

    return null;
};

// Execute brute-force, send result to main thread
const result = bruteforce_iterative(depth, startIdx, endIdx);
parentPort.postMessage(result);
