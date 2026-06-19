const express = require("express");
const router = express.Router();

const protectRoutes = require("../../middleware/protectRoute");
const { getMyStoreProfile } = require("../../controllers/store/profile");
const { 
    createProduct, 
    getProductById, 
    getProductsByStore, 
    updateProduct, 
    updateStock, 
    toggleAvailability, 
    deleteProduct } = require("../../controllers/store/product");

// GET /api/store/me
router.get("/me", protectRoutes, getMyStoreProfile);

router.post("/addProduct", protectRoutes, createProduct)
router.get("/getSingleProduct", protectRoutes, getProductById)
router.get("/getProductsByStore", protectRoutes, getProductsByStore)
router.get("/addProduct", protectRoutes, createProduct)

module.exports = router;