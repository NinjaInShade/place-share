// Custom error model
const HttpError = require("../models/HttpError");

// Unique id / express validation modules.
const { validationResult } = require("express-validator");

// Coord translating function
const translateCoords = require("../util/Location");

// DB
const fs = require("fs");
const mongoose = require("mongoose");
const Place = require("../models/place");
const User = require("../models/user");

async function getPlaceById(req, res, next) {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Couldnt find that place", 500);
    return next(error);
  }

  if (!place) {
    const error = new HttpError("No place with that ID", 404);
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
}

async function getUserPlacesById(req, res, next) {
  const userId = req.params.uid;
  // Filters out every place with same creator as url param into an array [] of objects [{}, {}, {}]
  let userPlaces;
  try {
    userPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError("User has no places", 500);
    return next(error);
  }

  if (!userPlaces || userPlaces.length === 0) {
    return next(new HttpError("Could not find places for the provided user id.", 404));
  }

  res.json({ places: userPlaces.places.map((place) => place.toObject({ getters: true })) });
}

async function createNewPlace(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs", 422));
  }

  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await translateCoords(address);
  } catch (error) {
    return next(error);
  }

  const newPlace = new Place({
    title,
    description,
    imageUrl: req.file.path,
    address,
    creator: req.userData.userId,
    location: coordinates,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again.", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await newPlace.save({ session });
    user.places.push(newPlace);
    await user.save({ session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("creating place failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({ place: newPlace });
}

async function updatePlaceById(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs", 422));
  }

  const placeId = req.params.pid;
  const { title, description } = req.body;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Couldnt update place", 500);
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    return next(new HttpError("You are not the right user!", 401));
  }

  place.title = title;
  place.description = description;
  try {
    await place.save();
  } catch (err) {
    const error = new HttpError("Couldnt savep place", 500);
    return next(error);
  }

  res.status(200).json({ confirm: "place has been updated", place: place.toObject({ getters: true }) });
}

async function deletePlaceById(req, res, next) {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError("Couldnt delete place", 500);
    return next(error);
  }

  if (!place) {
    return next(new HttpError("This place doesnt even exist.", 404));
  }

  if (place.creator.id !== req.userData.userId) {
    return next(new HttpError("you cant delete someones place!", 401));
  }

  const imagePath = place.imageUrl;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session });
    place.creator.places.pull(place);
    await place.creator.save({ session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("Couldnt delete place in the DB", 500);
    return next(error);
  }

  fs.unlink(imagePath, function (err) {});
  res.status(200).json({ place: "has been successfully deleted." });
}

exports.getPlaceById = getPlaceById;
exports.getUserPlacesById = getUserPlacesById;
exports.createNewPlace = createNewPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;
