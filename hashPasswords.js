const bcrypt = require('bcrypt');

async function hashPasswords() {
  const passwords = ['password1', 'password2', 'password3', 'password4', 'password5'];
  for (let i = 0; i < passwords.length; i++) {
    const hashedPassword = await bcrypt.hash(passwords[i], 10);
    console.log(`Password ${i + 1}:`, hashedPassword);
  }
}

hashPasswords();
