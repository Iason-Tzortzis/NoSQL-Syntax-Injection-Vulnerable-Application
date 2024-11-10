//Dependencies
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
var jwt = require("jsonwebtoken");
const ejsMate = require("ejs-mate");
const Str_Random = require("./generate_random_string.js");
var mongoose = require("mongoose");
const User = require("./user.model");
require("dotenv").config();

//App Setup
app.use(cookieParser());
app.use(express.urlencoded());
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "static")));
app.use(bodyParser.urlencoded({ extended: true }));

//db connection with mongoose(mongodb)
mongoose
  .connect(`${process.env.MONGODB_URI}`, {
    dbName: `${process.env.MONGODB_DATABASE}`,
    user: `${process.env.MONGODB_USER}`,
    pass: `${process.env.MONGODB_PASSWORD}`,
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then((_) => {
    console.log(
      `Connected to ${mongoose.connection.db.databaseName} as ${mongoose.connection.user}`
    );
  })
  .catch(console.error);

//Insert seed data in DB if the document is empty
User.countDocuments({}).then((count) => {
  if (count > 0) {
    console.log("The collection has entries." + count);
  } else {
    users = [
      {
        Name: "Michael Baker",
        username: "michaelbaker01",
        password: Str_Random(8),
        role: "agent",
      },
      {
        Name: "Angel Mendoza",
        username: "angelmendoza02",
        password: Str_Random(8),
        role: "agent",
      },
      {
        Name: "Theodore Alletez",
        username: "theodorealletez03",
        password: Str_Random(8),
        role: "agent",
      },
      {
        Name: "Lucas Allen",
        username: "lucasallen04",
        password: Str_Random(8),
        role: "agent",
      },
    ];
    User.insertMany(users)
      .then((docs) => {
        console.log("Users inserted:", docs);
      })
      .catch((err) => {
        console.error("Error inserting users:", err);
      });
    console.log("The collection is empty.");
  }
});

const port = process.env.PORT || 8000;
//Generate Secret Key to be used for signing JWT tokens
const SECRET_KEY = String(Str_Random(32));

//Routes
app.get("/", async function (req, res) {
  try {
    //Get all active insurance agents
    result = await User.find({}).exec();

    //If there are active insurance agents render login page
    if (result) {
      return res.render("login", { data: result });
    } else {
      return res.send("No active insurance Agents found");
    }
  } catch (e) {
    return res.send("Error");
  }
});

app.post("/", async function (req, res, next) {
  try {
    //Get user input from the request object
    username = req.body.username;
    password = req.body.password;

    //Fetch user record with the supplied credentials
    var result = await User.findOne({
      $where: `this.username == '${username}' && this.password == '${password}'`,
    }).exec();

    //Check if user exists with provided credentials and if yes generate JWT token
    if (result) {
      let token_data = {
        username: result.username,
        role: result.role,
      };
      token = jwt.sign(token_data, SECRET_KEY, { expiresIn: "1h" });
      res.cookie("JWT", token);
      return res.redirect("/home");
    } else {
      return res.send("Invalid credentials submitted");
    }
  } catch (e) {
    next();
  }
});

app.get("/home", function (req, res) {
  try {
    try {
      //Get token from request object
      token = req.cookies.JWT;

      //If no token found redirect to login page
      if (!token) {
        return res.redirect("/");
      }

      //Verify tokens signature
      var data = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.send("Missing valid JWT token");
    }

    //If token is valid render home page
    if (data) {
      return res.render("home", { username: data.username });
    } else {
      return res.send("Missing valid JWT token");
    }
  } catch (e) {
    return res.send("Error 404");
  }
});

app.get("/admin", async function (req, res) {
  try {
    try {
      //Get token from the request object
      token = req.cookies.JWT;

      //if no token is found in the request object redirect to login page
      if (!token) {
        return res.redirect("/");
      }

      //Check if JWT token is valid
      var data = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.send("Missing valid JWT token");
    }
    //Check if authenticated user is Authorized to access Admin route
    if (data.role == "admin") {
      return res.render("admin");
    } else {
      return res.render("forbidden");
    }
  } catch (err) {
    res.send("Error 404");
  }
});

app.get("/forbidden", function (req, res) {
  return res.render("forbidden");
});

app.get("/logout", function (req, res) {
  res.clearCookie("JWT");
  return res.redirect("/");
});

app.get("*", function (req, res) {
  return res.redirect("/");
});

//Start App
app.listen(port, function () {
  console.log(`Serving on Port ${port}`);
});
