const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const pokeSchema = require("./pokeSchema");
const userSchema = require("./userSchema");
const accessSchema = require("./accessSchema");
const errorSchema = require("./errorSchema");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const jwt_secret = "my dog is a goof";

let Pokemon = null;
let User = null;
let Access = null;
let Error = null;

const app = express();

app.use(
  cors({
    exposedHeaders: ["auth-token-access", "auth-token-refresh"],
    origin:
      "https://64339b887e2e523c7b0bbfa5--super-sprinkles-343903.netlify.app",
    credentials: true,
  })
);

app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Origin",
    "https://64339b887e2e523c7b0bbfa5--super-sprinkles-343903.netlify.app"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,POST,PUT,DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie"
  );
  next();
});

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(cookieParser());

function addAccessLog(username, endpoint) {
  console.log(username);
  console.log(endpoint);
  // add to user access log with timestamp, endpoint accessed

  Access.create({
    username: username,
    endpoint: endpoint,
    timestamp: Date.now(),
  });
}

function logError(errorCode, endpoint) {
  // log 4** and 5** errors with endpoint name
  console.log("error code:", errorCode);
  console.log("endpoint: ", endpoint);

  // Error.create({
  //   errCode: errorCode,
  //   endpoint: endpoint,
  // });
}

function checkToken(req, res, next) {
  if (req.cookies["auth-token-access"]) {
    const decoded = jwt.verify(req.cookies["auth-token-access"], jwt_secret);

    req.verifiedToken = decoded;
  }
  next();
}

app.all("*", checkToken);

mongoose.connect(process.env.mongo);

const db = mongoose.connection;

db.on("open", async () => {
  Pokemon = mongoose.model("pokemon", pokeSchema);
  User = mongoose.model("user", userSchema);
  Access = mongoose.model("access", accessSchema);
  Error = mongoose.model("error", errorSchema);
});

app.get("/", (req, res) => {
  res.sendStatus(200);
});

app.post("/login", async (req, res) => {
  if (req.verifiedToken) {
    res.json(req.verifiedToken);
  } else if (req.body.username && req.body.password) {
    const username = req.body.username;
    const password = req.body.password;

    const auth = await login(username, password);

    const MAX_AGE = 6000000;

    if (auth === "admin") {
      const token = jwt.sign(
        { success: true, admin: true, username },
        jwt_secret
      );

      res.cookie("auth-token-access", token, { maxAge: MAX_AGE });

      res.json({ success: true, admin: true, username });
    } else if (auth) {
      const token = jwt.sign(
        { success: true, admin: false, username },
        jwt_secret
      );

      res.cookie("auth-token-access", token, { maxAge: MAX_AGE });

      res.json({ success: true, admin: false, username });
    } else {
      res.json({ success: false, admin: false, username });
    }
  } else {
    res.json({ success: false });
  }
});

async function login(username, password) {
  const results = await User.find({ username: username });

  if (results.length === 0) {
    return false;
  }

  const user = results[0];

  if (user.password !== password) {
    return false;
  } else if (user.isAdmin) {
    return "admin";
  } else {
    return true;
  }
}

app.get("/logout", (req, res) => {
  res.cookie("auth-token-access", "");
  res.json({ success: true });
});

app.get("/pokemon", async (req, res) => {
  if (!req.verifiedToken) {
    res.send({ msg: "not logged in" });
  } else {
    addAccessLog(req.verifiedToken.username, req.url);
    // console.log(req.verifiedToken);
    let pokemon = [];
    const nameRegex = new RegExp(req.query.name, "i");

    if (req.query.name && req.query.type) {
      // find by name and type
      pokemon = await Pokemon.find({
        type: { $all: req.query.type },
        "name.english": { $regex: nameRegex },
      });
    } else if (req.query.name) {
      // find by name
      pokemon = await Pokemon.find({
        "name.english": { $regex: nameRegex },
      });
    } else if (req.query.type) {
      // find by type
      pokemon = await Pokemon.find({ type: { $all: req.query.type } });
    } else {
      // find all
      pokemon = await Pokemon.find({});
    }

    res.send(pokemon);
  }
});

app.get("/pokemon/:id", async (req, res) => {
  if (!req.verifiedToken) {
    res.send({ msg: "not logged in" });
  } else {
    addAccessLog(req.verifiedToken.username, req.url);
    try {
      let pokemon = await Pokemon.find({ id: req.params.id });

      res.send(pokemon);
    } catch (err) {
      logError(err, req.url);
      res.send([]);
    }
  }
});

app.get("/admin/report/access", async (req, res) => {
  // get log of accesses in time period
  console.log("getting accesses");

  const accesses = await Access.find({});

  res.send({ data: accesses });
});

app.get("/admin/report/errors", async (req, res) => {
  // get log of errors in time period

  const errors = await Error.find({});

  res.send({ data: errors });
});

app.post("/error", (req, res) => {
  logError(req.body.errCode, req.url);
});

app.get("*", (req, res) => {
  console.log(req.url);
  logError(404, req.url);
});

app.listen(process.env.PORT, () => {
  console.log("Listening on port 8000");
});
