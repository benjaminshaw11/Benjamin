// backend/src/utils/validators.js

class Validators {
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUsername(username) {
    return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
  }

  static isValidPassword(password) {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[0-9]/.test(password) && 
           /[!@#$%^&*]/.test(password);
  }

  static isValidBetAmount(amount) {
    return amount > 0 && amount <= 1000000;
  }

  static isValidOdds(odds) {
    return odds > 1 && odds < 1000;
  }

  static sanitize(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  }
}

module.exports = Validators;
