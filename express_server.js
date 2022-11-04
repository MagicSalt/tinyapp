const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const getUserByEmail = require('./helpers');

app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: 'session',
    keys: ['user_id'],
  })
);

app.set('view engine', 'ejs');

// DATABASE

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
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

// FUNCTIONS

const generateRandomString = () => {
  return Math.random().toString(36).substring(6);
};

const newUser = (email, password) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password: hashedPassword,
  };
  return id;
};

const urlsForUser = (id) => {
  let filtered = {};
  for (let urlID of Object.keys(urlDatabase)) {
    if (urlDatabase[urlID].userID === id) {
      filtered[urlID] = urlDatabase[urlID];
    }
  }
  return filtered;
};

// ROUTES

app.get("/", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id),
  };
  if (templateVars.user) {
    res.render('urls_index', templateVars);
  } else {
    res.render('urls_login', templateVars);
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls2.json', (req, res) => {
  res.json(users);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls', (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id),
  };
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (templateVars.user) {
    res.render('urls_new', templateVars);
  } else {
    res.render('urls_login', templateVars);
  }
});

app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  const id = generateRandomString();
  urlDatabase[id] = { longURL, userID };
  res.redirect(`/urls/${id}`);
});

app.get('/urls/:id', (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
  };
  if (req.session.user_id === urlDatabase[templateVars.id].userID) {
    res.render("urls_show", templateVars);
  } else if (!templateVars.longURL) {
    res.status(400).send('This TinyURL cannot be found');
  } else {
    res.status(400).send('This TinyURL does not belong to you!');
  }
});

app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;
  if (req.session.user_id === urlDatabase[id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.status(400).send('You are not allowed to delete that TinyURL!');
  }
});

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  if (req.session.user_id === urlDatabase[id].userID) {
    urlDatabase[id].longURL = longURL;
    res.redirect(`/urls/${id}`);
  } else {
    res.status(400).send('You are not allowed to edit that TinyURL!');
  }
});

app.get('/login', (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id)
  };
  if (templateVars.user) {
    res.render('urls_index', templateVars);
  } else {
    res.render('urls_login', templateVars);
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (!user) {
    res.status(403).send('Email not found');
  } else if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send('Incorrect password');
  } else {
    req.session.user_id = user.id;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.get("/register", (req,res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  if (templateVars.user) {
    res.redirect('/urls');
  } else {
    res.render('urls_register', templateVars);
  }
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send('Email and/or password missing!');
  } else if (getUserByEmail(email, users)) {
    res.status(400).send('This email is already registered!');
  } else {
    const user_id = newUser(email, password);
    req.session.user_id = user_id;
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});