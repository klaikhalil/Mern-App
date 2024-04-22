const asyncHandler = require("express-async-handler");
const { Category, validateCreateCategory } = require("../models/Category");
const { validateCreateComment } = require("../models/Comment");

/**
 * @desc Create new category
 * @route /api/categories
 * @method POST
 * @access private (only admin)
 */
module.exports.createCategoryCtrl = asyncHandler(async (req, res) => {
    const { error } = validateCreateCategory(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const category = await Category.create({
        title: req.body.title,
        user: req.user.id,
    });

    res.status(200).json(category);
});

/**
 * @desc Get all categories
 * @route /api/categories
 * @method GET
 * @access public
 */
module.exports.getAllCategoriesCtrl = asyncHandler(async (req, res) => {
    const categories = await Category.find();

    res.status(200).json(categories);
});

/**
 * @desc Delete category
 * @route /api/categories/:id
 * @method DELETE
 * @access private (only admin)
 */
module.exports.deleteCategoryCtrl = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    } 

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
        message: "Category has been deleted",
        categoryId: category._id,
    });
});
