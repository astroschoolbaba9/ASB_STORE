const express = require("express");
const router = express.Router();

const courseController = require("../controllers/course.controller");
const { requireAuth } = require("../middleware/auth");

router.get("/courses", courseController.getCourses);
router.get("/courses/:id", courseController.getCourseById);

// Purchase + gated content
router.post("/courses/:id/buy", requireAuth, courseController.buyCourse);
router.get("/courses/:id/content", requireAuth, courseController.getCourseContent);

// MyCourses
router.get("/me/courses", requireAuth, courseController.getMyCourses);

module.exports = router;
