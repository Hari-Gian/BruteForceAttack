# Brute Force Attack Script

This script performs a brute force attack using a dictionary of common passwords and their permutations.

## Usage

```bash
node attack.js [email] [password]
```

- `email` (optional): Target email address (default: "test@example.com")
- `password` (optional): Target password (default: "password123")

## Example

```bash
# Use default values
node attack.js

# Specify target email and password
node attack.js user@example.com secret123
```

## How it works

1. The script reads passwords from `PasswordDictionary.txt`
2. For each password, it generates permutations including:
   - Original password
   - Lowercase and uppercase versions
   - First letter capitalized
   - Numbers appended (0-5)
   - Common symbols appended/prepended (!, @, #, 123)
   - Common number combinations appended/prepended (123, 321)
3. It simulates login attempts and reports when the correct password is found
4. It reports statistics including time taken, passwords tried, and permutations tried

## Note

This is a simulation for educational purposes only. In a real scenario, this would make actual HTTP requests to a login endpoint.
