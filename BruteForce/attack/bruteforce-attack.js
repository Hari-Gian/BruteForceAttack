const { Worker } = require('worker_threads');
const path = require('path');

/**
 * Bidirectional Brute-Force with Dynamic Worker Reallocation
 * 
 * This function performs a parallel brute-force attack using a bidirectional approach:
 * - UP Group: Searches longer passwords (middle to maxDepth)
 * - DOWN Group: Searches shorter passwords (middle-1 to 1)
 * 
 * When the DOWN group finishes, its cores are reallocated to help the UP group,
 * maximizing CPU utilization throughout the attack.
 * 
 * @param {string} chars - Character set to use for generating passwords
 * @param {number} maxDepth - Maximum password length to search
 * @param {string} targetPassword - Target password to find
 * @returns {Promise<boolean>} - True if password was found, false otherwise
 */
const bruteforce_char_parallel = async (chars, maxDepth, targetPassword) => {
    const NUM_WORKERS = require('os').cpus().length;
    console.log(`Starting BIDIRECTIONAL PARALLEL brute-force attack (lengths 1-${maxDepth}) using ${NUM_WORKERS} CPU cores...`);
    console.log(`Strategy: DOWN cores join UP cores when finished to maximize utilization`);
    const globalStartTime = Date.now();
    
    const middle = Math.ceil(maxDepth / 2);
    
// Distribute initial worker load: ~70% for increasing depth, ~30% for decreasing
    const initialUpWorkers = Math.ceil(NUM_WORKERS * 0.7);
    const initialDownWorkers = NUM_WORKERS - initialUpWorkers;
    
    console.log(`\nGroup UP (${middle}→${maxDepth}): ${initialUpWorkers} cores initially`);
    console.log(`Group DOWN (${middle-1}→1): ${initialDownWorkers} cores initially`);
    console.log(`DOWN cores will join UP when finished\n`);
    
    let passwordFound = null;
    let allWorkers = [];
    
// State management for workers increasing depth
    let upCurrentDepth = middle;
    let upWorkersCount = initialUpWorkers;
    let upSearching = true;
    
    /**
     * Create workers for a specific password length
     * 
     * @param {number} depth - Password length to search
     * @param {number} numWorkers - Number of workers to create
     * @param {string} groupName - Name of the worker group (for logging)
     * @returns {Object} - Object containing workers array and promises array
     */
    const createWorkersForDepth = (depth, numWorkers, groupName) => {
        const workers = [];
        const promises = [];
        const charsPerWorker = Math.ceil(chars.length / numWorkers);
        
        for (let w = 0; w < numWorkers; w++) {
            const startIdx = w * charsPerWorker;
            const endIdx = Math.min(startIdx + charsPerWorker, chars.length);
            
            if (startIdx >= chars.length) break;

            const worker = new Worker(path.join(__dirname, 'attack-worker.js'), {
                workerData: {
                    chars: chars,
                    depth: depth,
                    startIdx: startIdx,
                    endIdx: endIdx,
                    targetPassword: targetPassword
                }
            });

            const promise = new Promise((resolve) => {
                worker.on('message', (result) => {
                    if (result && !passwordFound) {
                        passwordFound = result;
                        console.log(`\n✓ PASSWORD FOUND by ${groupName} at length ${depth}: ${result}`);
                        
// Shut down all other worker threads
                        allWorkers.forEach(w => {
                            if (w !== worker && !w.isTerminated) {
                                w.terminate();
                            }
                        });
                    }
                    resolve(result);
                });
                worker.on('error', (error) => {
                    console.error('Worker error:', error);
                    resolve(null);
                });
            });

            worker.on('exit', () => {
                const index = allWorkers.indexOf(worker);
                if (index !== -1) {
                    allWorkers.splice(index, 1);
                }
            });

            allWorkers.push(worker);
            workers.push(worker);
            promises.push(promise);
        }
        
        return { workers, promises };
    };
    
    /**
     * UP Group: Search from middle to maxDepth
     * Focuses on longer passwords which are more commonly used
     */
    const searchUpward = async () => {
        for (let currentDepth = middle; currentDepth <= maxDepth; currentDepth++) {
            if (passwordFound) break;
            
            upCurrentDepth = currentDepth;
            
            console.log(`[UP GROUP] Searching length ${currentDepth} with ${upWorkersCount} cores...`);
            const startTime = Date.now();
            
            const { workers, promises } = createWorkersForDepth(currentDepth, upWorkersCount, 'UP GROUP');
            
            await Promise.all(promises);
            
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            if (!passwordFound) {
                console.log(`[UP GROUP] Length ${currentDepth} complete (${elapsed}s) - not found`);
            } else {
                break;
            }
        }
        upSearching = false;
    };
    
    /**
     * DOWN Group: Search from middle-1 to 1
     * Handles shorter passwords which are searched first
     */
    const searchDownward = async () => {
        for (let currentDepth = middle - 1; currentDepth >= 1; currentDepth--) {
            if (passwordFound) break;
            
            console.log(`[DOWN GROUP] Searching length ${currentDepth} with ${initialDownWorkers} cores...`);
            const startTime = Date.now();
            
            const { workers, promises } = createWorkersForDepth(currentDepth, initialDownWorkers, 'DOWN GROUP');
            
            await Promise.all(promises);
            
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            if (!passwordFound) {
                console.log(`[DOWN GROUP] Length ${currentDepth} complete (${elapsed}s) - not found`);
            } else {
                break;
            }
        }
        
// If 'down' workers complete and 'up' workers are still active, reallocate resources
        if (!passwordFound && upSearching) {
upWorkersCount = NUM_WORKERS; // Assign all available cores to the 'up' search
console.log(`\n[REALLOCATION] DOWN cores finished! Reassigning ${initialDownWorkers} cores to UP group.`);
            console.log(`[REALLOCATION] UP group now has ${upWorkersCount} cores (all available cores)\n`);
        }
    };
    
    try {
// Launch both upward and downward searches concurrently
        await Promise.all([searchUpward(), searchDownward()]);
    } finally {
// Guarantee all worker threads are properly closed
        allWorkers.forEach(worker => {
            if (!worker.isTerminated) {
                worker.terminate();
            }
        });
    }
    
    const totalElapsed = ((Date.now() - globalStartTime) / 1000).toFixed(2);
    
    if (passwordFound) {
        console.log(`\n✓ ATTACK SUCCESSFUL in ${totalElapsed}s`);
        return true;
    } else {
        console.log(`\n✗ Parallel brute-force failed after ${totalElapsed}s (searched lengths 1-${maxDepth})`);
        return false;
    }
};

module.exports = { bruteforce_char_parallel };
