const User = require('../models/User');

const prefixes = [
  'ghost', 'shadow', 'cyber', 'neo', 'byte', 'null', 'cipher',
  'hack', 'root', 'zero', 'phoenix', 'raven', 'viper', 'echo',
  'delta', 'omega', 'sigma', 'nexus', 'vortex', 'binary'
];

const separators = ['_', '-', '.'];

const generateRandomNumber = () => {
  return Math.floor(Math.random() * 999).toString().padStart(3, '0');
};

async function generateUsername() {
  let username;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 20;

  while (exists && attempts < maxAttempts) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const separator = separators[Math.floor(Math.random() * separators.length)];
    username = `${prefix}${separator}${generateRandomNumber()}`;
    exists = await User.exists({ username });
    attempts++;
  }

  if (exists) {
    // Fallback with timestamp
    username = `anon_${Date.now().toString().slice(-6)}`;
  }

  return username;
}

module.exports = { generateUsername };