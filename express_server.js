const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('view engine', 'ejs');

function generateRandomString() {
  return Math.random().toString(36).substring(6);
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const newUser = (email, password) => {
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password,
  };
  return id;
};

const findUser = (email) => {
  return Object.values(users).find(user => user.email === email);
};

const checkPassword = (user, password) => {
  if (user.password === password) {
    return true;
  } else {
    return false;
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls', (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']],
    urls: urlDatabase,
   };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render('urls_new', templateVars);
});

app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const id = generateRandomString();
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

app.get('/urls/:id', (req, res) => {
  const templateVars = { 
    users: users[req.cookies['user_id']],
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls')
});

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render('urls_login', templateVars);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body
  const user = findUser(email)
  if (!user) {
    res.status(403).send('Email not found');
  } else if (!checkPassword(user, password)) {
    res.status(403).send('Incorrect password');
  } else {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send('Email and/or password missing!');
  } else if (findUser(email)) {
    res.status(400).send('This email is already registered!');
  } else {
    const user_id = newUser(email, password);
    res.cookie('user_id', user_id);
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});