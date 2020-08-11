// Mongoose
const mongoose = require("mongoose");

// Express Middleware
const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const HttpError = require("./models/HttpError");

// Route handling imports
const PlacesRoutes = require("./routes/PlaceRoutes");
const UserRoutes = require("./routes/UserRoutes");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

// Route Handling
app.use("/api/places", PlacesRoutes);
app.use("/api/users", UserRoutes);

// Unknown Route middleware
app.use((req, res, next) => {
  const error = new HttpError("This page cannot be found", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, function (err) {});
  }
  if (res.headersSend) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "Unknown Error occurred." });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mongoapp.puyp7.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
    console.log("Mongoose is connected");
  })
  .catch((error) => console.log(error));
