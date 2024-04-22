const mongoose = require("mongoose");
const Joi = require("joi");

// category schema
const categorySchema = new mongoose.Schema({
    
    title: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, // Corrected comma placement
    },
    
}, {
    timestamps: true,
});

// category model 
const Category = mongoose.model("Category", categorySchema);

// validate create category
function validateCreateCategory(obj) {
    const schema = Joi.object({
        title: Joi.string().required().label("Text"),
    });
    return schema.validate(obj);
}


module.exports = {
    Category,
    validateCreateCategory,
}
