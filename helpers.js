const getUserByEmail = (email, database) => {
  return Object.values(database).find(user => user.email === email);
};

module.exports = getUserByEmail;