const users = [];
let idCounter = 1;

module.exports = {
  findByEmail(email) {
    return users.find((u) => u.email === email) || null;
  },
  findById(id) {
    return users.find((u) => u.id === id) || null;
  },
  create({ name, email, password }) {
    const user = { id: idCounter++, name, email, password };
    users.push(user);
    return user;
  },
};