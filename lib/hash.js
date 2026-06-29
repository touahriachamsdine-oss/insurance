const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const passwords = ['SuperAdmin123!', 'Company123!', 'Company123!', 'Agent123!', 'Client123!', 'Client123!'];
passwords.forEach(p => {
  console.log(`${p} => ${hashPassword(p)}`);
});
