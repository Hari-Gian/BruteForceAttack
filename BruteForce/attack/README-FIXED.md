# Fixed Brute Force Attack Script

This document describes the fixes made to the brute force attack module to resolve the issues with worker management and hardcoded passwords.

## Issues Fixed

### 1. Worker Management Issues
**Problem**: The program was crashing when the bottom cores didn't find anything due to improper worker termination and race condition handling.

**Solution**: 
- Added proper worker tracking with an `allWorkers` array to keep track of all active workers
- Implemented proper worker termination in a `finally` block to ensure all workers are cleaned up
- Added `worker.on('exit')` handlers to remove workers from the tracking array when they terminate
- Improved error handling for worker failures

### 2. Hardcoded Password Issue
**Problem**: The target password was hardcoded in multiple places, making it difficult to maintain and test with different passwords.

**Solution**:
- Removed hardcoded password from the worker files
- Made the password configurable by passing it as a parameter through the workerData
- Updated the main attack script to pass the target password to the brute force function
- Updated the brute force function to accept the target password as a parameter

## Key Changes

### attack/attack-worker.js
- Removed hardcoded password check
- Added `targetPassword` parameter to workerData
- Modified check function to use the passed target password

### attack/bruteforce-attack.js
- Changed function signature to accept `targetPassword` parameter
- Added worker tracking with `allWorkers` array
- Implemented proper worker cleanup in a `finally` block
- Added `worker.on('exit')` handlers for proper cleanup
- Improved error handling

### attack/attack.js
- Updated call to `bruteforce_char_parallel` to pass the target password
- Minor formatting improvements

## Testing

Two test scripts were created to verify the fixes:

1. `test-bruteforce.js` - Tests the brute force attack with simple passwords
2. Original `attack.js` - Verifies the full attack sequence still works

Both tests confirm that:
- Workers are properly managed and terminated
- Passwords can be configured dynamically
- The bidirectional search works correctly
- No crashes occur when one group finishes before the other

## Usage

The attack system now works as follows:

1. Rainbow Table Attack (fastest for known hashes)
2. Smart Dictionary Attack (user credentials + dictionary)
3. Parallel Brute-Force Attack (fallback for unknown passwords)

The brute force attack now uses a bidirectional parallel approach:
- Group UP: Searches longer passwords (lengths from middle to maxDepth)
- Group DOWN: Searches shorter passwords (lengths from middle-1 to 1)
- Distribution: ~70% cores for UP group, ~30% for DOWN group

This approach provides better performance by focusing more resources on longer passwords, which are more commonly used.
