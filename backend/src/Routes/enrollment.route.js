const express = require('express')
const router = express.Router()
const { protect, authorizeRoles } = require("../middlewares/auth.middleware");
const {  createUser } = require('../controllers/enrollment.controller');



router.post(
  "/create-user",
  protect,
  authorizeRoles("admin"),
  createUser
);

module.exports = router