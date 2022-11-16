var express = require("express");
var router = express.Router();

const { MongoClient } = require("mongodb");

const url =
  "mongodb+srv://<user>:<password>@cluster0.akv9o8h.mongodb.net/?retryWrites=true&w=majority";

async function fetchQuestion(client, res) {
  const result = await client
    .db("JengaQuiz")
    .collection("Questions")
    .aggregate([{ $sample: { size: 1 } }]);

  await result.forEach(sample => {
    res.send({ q: sample.q, a1: sample.a1, a2: sample.a2, a3: sample.a3, a4: sample.a4, t: sample.t });
  });
}

async function functionforquestions(res) {
  var client = new MongoClient(url);

  await client.connect();

  await fetchQuestion(client, res);

  await client.close();
}

router.post("/getquestion", (req, res) => {
  functionforquestions(res);
});

let q = "";
let a1 = "";
let a2 = "";
let a3 = "";
let a4 = "";
let t = "";
router.post("/submitquestion", (req, res) => {
  q = req.body.q;
  a1 = req.body.a1;
  a2 = req.body.a2;
  a3 = req.body.a3;
  a4 = req.body.a4;
  t = req.body.t;
  createQuestion(q, a1, a2, a3, a4, t);
  res.send();
});

async function createQuestion(q, a1, a2, a3, a4, t) {
  var client = new MongoClient(url);

  await client.connect();

  await createListing(
    client,
    {
      q: q,
      a1: a1,
      a2: a2,
      a3: a3,
      a4: a4,
      t: t,
    },
    "Questions"
  );

  await client.close();
}

async function chechLoginPassword(client, name, password, res) {
  const result = await client
    .db("JengaQuiz")
    .collection("Accounts")
    .findOne({ name: name, password: password });

  if (result) {
    res.send({ valid: true, points: result.points });
  } else {
    res.send({ valid: false, points: 0 });
  }
}

async function loginAccount(name, password, res) {
  var client = new MongoClient(url);

  await client.connect();

  await chechLoginPassword(client, name, password, res);

  await client.close();
}

let logName;
let logPassword;
router.post("/acclogin", (req, res) => {
  logName = req.body.accName;
  logPassword = req.body.password;
  loginAccount(logName, logPassword, res);
});

async function createListing(client, newListing, collection) {
  const result = await client
    .db("JengaQuiz")
    .collection(collection)
    .insertOne(newListing);
  console.log(
    `New listing created with the following id: ${result.insertedId}`
  );
}

async function chechIfNameIsUnique(client, name, password, res) {
  const result = await client
    .db("JengaQuiz")
    .collection("Accounts")
    .findOne({ name: name });

  if (result) {
    console.log("no happen sry");
    res.send({ valid: false });
  } else {
    await createListing(
      client,
      {
        name: name,
        password: password,
        points: 0,
      },
      "Accounts"
    );
    res.send({ valid: true });
  }
}

async function createAccount(name, password, res) {
  var client = new MongoClient(url);

  await client.connect();

  await chechIfNameIsUnique(client, name, password, res);

  await client.close();
}

let createName;
let createPassword;
router.post("/signin", (req, res) => {
  createName = req.body.accName;
  createPassword = req.body.password;
  createAccount(createName, createPassword, res);
});

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

//games[i] = {code:"ttt", started:false, players:[Martin, Tosho, Superman], currentPlayer:Martin, jenga:[
//   { exist1: true, exist2: true, exist3: true, exist4: true, exist5: true, exist6: true },
//   { exist1: true, exist2: true, exist3: true, exist4: true, exist5: true, exist6: true },
//   { exist1: true, exist2: true, exist3: true, exist4: true, exist5: true, exist6: true },
//   { exist1: true, exist2: true, exist3: true, exist4: true, exist5: true, exist6: true },
// ]}
let games = [];

let loginobj;
router.post("/joingame", (req, res) => {
  let gameExists = false;
  loginobj = req.body;
  for (let i = 0; i < games.length; i++) {
    if (loginobj.gameCode == games[i].code && !games[i].started) {
      gameExists = true;
      games[i].players.push(loginobj.userName);
    }
  }
  if (!gameExists) {
    games.push({
      code: loginobj.gameCode,
      started: false,
      players: [loginobj.userName],
      currentPlayer: loginobj.userName,
      jenga: [
        {
          exist1: true,
          exist2: true,
          exist3: true,
          exist4: true,
          exist5: true,
          exist6: true,
        },
        {
          exist1: true,
          exist2: true,
          exist3: true,
          exist4: true,
          exist5: true,
          exist6: true,
        },
        {
          exist1: true,
          exist2: true,
          exist3: true,
          exist4: true,
          exist5: true,
          exist6: true,
        },
        {
          exist1: true,
          exist2: true,
          exist3: true,
          exist4: true,
          exist5: true,
          exist6: true,
        },
      ],
    });
  }
  for (let i = 0; i < games.length; i++) {
    if (loginobj.gameCode == games[i].code) {
      res.send(games[i]);
    }
  }
});

let newJenga;
let newJengaCode;
let myCurrentPlayer;
router.post("/updatejenga", (req, res) => {
  newJenga = req.body.curentJenga;
  newJengaCode = req.body.gameCode;
  myCurrentPlayer = req.body.userName;
  for (let i = 0; i < games.length; i++) {
    if (newJengaCode == games[i].code) {
      games[i].jenga = newJenga;
      for (let j = 0; j < games[i].players.length; j++) {
        if (myCurrentPlayer == games[i].players[j]) {
          if (j == games[i].players.length - 1) {
            games[i].currentPlayer = games[i].players[0];
          } else {
            games[i].currentPlayer = games[i].players[j + 1];
          }
        }
      }
    }
  }
  res.send();
});

let getJengaCode;
router.post("/getjenga", (req, res) => {
  getJengaCode = req.body.gameCode;
  for (let i = 0; i < games.length; i++) {
    if (getJengaCode == games[i].code) {
      res.send({
        jenga: games[i].jenga,
        currentPlayer: games[i].currentPlayer,
      });
    }
  }
});

let startGameCode;
router.post("/startgame", (req, res) => {
  startGameCode = req.body.gameCode;
  for (let i = 0; i < games.length; i++) {
    if (startGameCode == games[i].code) {
      games[i].started = true;
    }
  }
  res.send();
});

let checkstartedGameCode;
router.post("/checkstarted", (req, res) => {
  checkstartedGameCode = req.body.gameCode;
  for (let i = 0; i < games.length; i++) {
    if (checkstartedGameCode == games[i].code) {
      // let myPlayers = []
      // for(let j = 0; j < games[i].players; j++){
      //   myPlayers.push(games[i].players[j])
      // }
      res.send({ started: games[i].started, players: games[i].players });
    }
  }
});

let getPlayersCode;
router.post("/getplayers", (req, res) => {
  getPlayersCode = req.body.gameCode;
  for (let i = 0; i < games.length; i++) {
    if (getPlayersCode == games[i].code) {
      res.send({
        players: games[i].players,
      });
    }
  }
});

module.exports = router;
