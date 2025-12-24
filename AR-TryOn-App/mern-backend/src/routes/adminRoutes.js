import express from "express";
import {
    signup as signupAdmin,
    login as loginAdmin,
    getMe,
    updateProfile
} from "../controllers/adminAuthController.js";
import adminOnly from "../middleware/adminOnly.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/signup", signupAdmin);
router.post("/login", loginAdmin);

// Profile Routes
router.get("/me", adminOnly, getMe);
router.put("/me", adminOnly, upload.single('profileImage'), updateProfile);

export default router;

