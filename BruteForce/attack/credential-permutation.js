const generatePermutations = (userData) => {
    const { email, birthday, name, surname } = userData;
    const permutations = [];

    if (email) {
// Generate email permutations
        permutations.push(email);
        permutations.push(email.split("@")[0]);
        permutations.push(email.split("@")[0].toLowerCase());
        permutations.push(email.split("@")[0].toUpperCase());
        permutations.push(email.split("@")[0].split("").reverse().join(""));
    }

    if (birthday) {
// Generate birthday permutations
        permutations.push(birthday.replace(/-/g, ""));
permutations.push(birthday.replace(/-/g, "").substring(0, 8)); // Format: YYYYMMDD
permutations.push(birthday.split("-")[2] + birthday.split("-")[1] + birthday.split("-")[0]); // Format: DDMMYYYY
permutations.push(birthday.split("-")[0]); // Extract year
permutations.push(birthday.split("-")[2] + birthday.split("-")[1]); // Format: DDMM
    }

    if (name) {
        permutations.push(name);
        permutations.push(name.toLowerCase());
        permutations.push(name.toUpperCase());
        permutations.push(name + "123");
        permutations.push(name + "1234");
        permutations.push(name + "12345");
    }

    if (surname) {
        permutations.push(surname);
        permutations.push(surname.toLowerCase());
        permutations.push(surname.toUpperCase());
    }

// Create combined permutations from email and birthday
    if (email && birthday) {
        permutations.push(email.split("@")[0] + birthday.split("-")[0]);
        permutations.push(email.split("@")[0] + birthday.split("-")[1]);
        permutations.push(email.split("@")[0] + birthday.split("-")[2]);
        permutations.push(email.split("@")[0] + birthday.replace(/-/g, ""));
    }

    if (name && birthday) {
        permutations.push(name + birthday.split("-")[0]);
        permutations.push(name + birthday.split("-")[2]);
        permutations.push(name.toLowerCase() + birthday.replace(/-/g, ""));
    }

    if (name && surname) {
        permutations.push(name + surname);
        permutations.push(name.toLowerCase() + surname.toLowerCase());
        permutations.push(name[0] + surname);
    }

    return permutations;
};

module.exports = { generatePermutations };
