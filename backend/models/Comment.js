const mongoose = require("mongoose");
const Joi = require("joi");

// comment schema
const commentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, // Corrected comma placement
    },
    username: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
});

// comment model 
const Comment = mongoose.model("Comment", commentSchema);

// validate create comment 
function validateCreateComment(obj) {
    const schema = Joi.object({
        postId: Joi.string().required().label("Post ID"),
        text: Joi.string().required().label("Text"),
    });
    return schema.validate(obj);
}

// validate update comment 
function validateUpdateComment(obj) {
    const schema = Joi.object({
        text: Joi.string().required(),
    });
    return schema.validate(obj);
}

module.exports = {
    Comment,
    validateCreateComment,
    validateUpdateComment
}
