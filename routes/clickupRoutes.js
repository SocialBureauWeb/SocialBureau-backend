const express = require("express");
const clickupController = require("../controllers/clickupController");
const clickupRoutes = express.Router();

clickupRoutes.get('/tasks', clickupController.getTasks);
clickupRoutes.get('/time', clickupController.getTime);
clickupRoutes.get('/user-task', clickupController.getTasksById);
clickupRoutes.get('/user-details', clickupController.getUserDetails);

module.exports = clickupRoutes;