// Express middleware
const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

// Places controller
const placesController = require("../controllers/PlacesController");
const fileUpload = require("../middleware/fileUpload");
const checkAuth = require("../middleware/checkAuth");

// Route for getting all places for a certain user id.
router.get("/user/:uid", placesController.getUserPlacesById);

// Route for getting a certain place by the id of said place.
router.get("/:pid", placesController.getPlaceById);

// jwt middleware]
router.use(checkAuth);

// Route for creating a new place.
router.post(
  "/",
  fileUpload.single("image"),
  [(check("title").not().isEmpty(), check("description").isLength({ min: 5 }), check("address").not().isEmpty())],
  placesController.createNewPlace
);

// Route for updating a place by id.
router.patch("/:pid", [check("title").not().isEmpty(), check("description").isLength({ min: 5 })], placesController.updatePlaceById);

// Route for deleting a place by id.
router.delete("/:pid", placesController.deletePlaceById);

module.exports = router;
