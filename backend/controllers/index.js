/**
 * Central export for all controllers
 */
const authController = require("./authController");
const userController = require("./userController");
const achievementsController = require("./achievementsController");
const modulesController = require("./modulesController");
const tutorController = require("./tutorController");

module.exports = {
  authController,
  userController,
  achievementsController,
  modulesController,
  tutorController,
};
