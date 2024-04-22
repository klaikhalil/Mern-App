const asyncHandler = require("express-async-handler");
const res = require("express/lib/response");
const { Post, validateCreatePost , validateUpdatePost } = require("../models/Post");
const { cloudinaryUploadImage, cloudinaryRemoveImage } = require("../utils/cloudinary");
const path = require("path");
const { Comment} = require("../models/Comment");
/**
 * @desc Create new post
 * @route /api/posts
 * @method POST
 * @access private (only logged-in user)
 */
 module.exports.createPostCtrl = asyncHandler(async (req, res) => {
    // 1. Validation for image
    if (!req.file) {
        return res.status(400).json({ message: "No image provided" });
    }

    // 2. Validation for data
    const { error } = validateCreatePost(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        // 3. Upload photo to Cloudinary
        const result = await cloudinaryUploadImage(req.file.path); // Utilisez req.file.path pour obtenir le chemin du fichier temporaire

        // 4. Create new post and save it to the database
        const post = await Post.create({
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            user: req.user.id,
            image: {
                url: result.secure_url,
                publicId: result.public_id,
            },
        });

        // 5. Send response to the client
        res.status(201).json(post);

        // 6. Remove temporary file from server
        fs.unlinkSync(req.file.path);
    } catch (err) {
        console.error("Error creating post:", err);
        res.status(500).json({ message: "Error creating post" });
    }
});


/**
 * @desc Get all posts
 * @route /api/posts
 * @method GET
 * @access public
 */
module.exports.getAllPostsCtrl = asyncHandler(async (req, res) => {
    const { pageNumber, category } = req.query;
    const POST_PER_PAGE = 3; // Define your desired number of posts per page

    try {
        let posts;
        if (pageNumber) {
            posts = await Post.find()
                .skip((pageNumber - 1) * POST_PER_PAGE)
                .limit(POST_PER_PAGE)
                .sort({ createdAt: -1 });
        } else if (category) {
            posts = await Post.find({ category })
                .sort({ createdAt: -1 })
                .populate("user", ["-password"]);
        } else {
            posts = await Post.find().sort({ createdAt: -1 })
                .populate("user", ["-password"]);
        }
        res.status(200).json(posts);
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).json({ message: "Error fetching posts" });
    }
});

/**
 * @desc Get single post
 * @route /api/posts/:id
 * @method GET
 * @access public
 */
module.exports.getSinglePostCtrl = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id).populate("user", ["-password"]);
    if (!post) {
        return res.status(400).json({ message: "post not found" });
    }
    res.status(200).json(post);
});

/**
 * @desc Get posts count
 * @route /api/posts/count
 * @method GET
 * @access public
 */
module.exports.getPostCountCtrl = asyncHandler(async (req, res) => {
    const count = await Post.countDocuments();
    res.status(200).json(count);
});

/**
 * @desc delete post
 * @route /api/posts/:id
 * @method DELETE
 * @access private (only admin or owner of the post)
 */
module.exports.deletePostCtrl = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        return res.status(400).json({ message: "post not found" });
    }
    if (req.user.isAdmin || req.user.id === post.user.toString()) {
        await Post.findByIdAndDelete(req.params.id);
        await cloudinaryRemoveImage(post.image.publicId);

        // @TODO delete all comments that belong to this post 
        await Comment.deleteMany({ postId: post._id});

        res.status(200).json({
            message: "post has been deleted successfully",
            postId: post._id
        });
    } else {
        res.status(403).json({ message: "access denied, forbidden" });
    }
});

/**
 * @desc Update post
 * @route /api/posts/:id
 * @method PUT
 * @access private (only owner of the post)
 */
module.exports.updatePostCtrl = asyncHandler(async (req, res) => {
    // 1 validation
    const {error} = validateUpdatePost(req.body);
    if(error) {
        return res.status(400).json({message: "error.details[0".message});
    }

    // 2 get the post from the db and check if post exists 
    const post = await Post.findById(req.params.id);
    if(!post) {
        return res.status(404).json({message: "post not found "});
    }
    // 3 check if this post belong to logged in user 
    if(req.user.id !== post.user.toString()) {
        return res.status(403).json({message: "access denied you are not allowed "});
    }

    // 4 update post
    const updatedpost = await Post.findByIdAndUpdate(req.params.id , {
        $set: {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category
        }
    } , { new: true}).populate("user" , ["-password"])

    // 5 send message to the client 
    res.status(200).json(updatedpost);
});


/**
 * @desc Update post Image
 * @route /api/posts/update-image/:id
 * @method PUT
 * @access private (only owner of the post)
 */
 module.exports.updatePostImageCtrl = asyncHandler(async (req, res) => {
    // 1 validation
    if(!req.file) {
        return res.status(400).json({message: "no image provided"});
    }

    // 2 get the post from the db and check if post exists 
    const post = await Post.findById(req.params.id);
    if(!post) {
        return res.status(404).json({message: "post not found "});
    }
    // 3 check if this post belong to logged in user 
    if(req.user.id !== post.user.toString()) {
        return res.status(403).json({message: "access denied you are not allowed "});
    }

    // 4 delete the old image
    await cloudinaryRemoveImage(post.image.publicId);
    
    // 5 upload new photo 
    const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
    const result = await cloudinaryUploadImage(imagePath);

    // 6 update the image field in the db 
    const updatedPost = await Post.findByIdAndUpdate(req.params.id , {
        $set: {
            image:{
                url: result.secure_url,
                publicId: result.public_id,

            }
        }
    } , { new: true});

    // 7 send response to client 
    res.status(200).json(updatedPost);

    // 8 remove image from the server 
    fs.unlinkSync(imagePath);
 });



/**
 * @desc Toggle like 
 * @route /api/posts/like/:id
 * @method PUT
 * @access private (only logged in user)
 */
module.exports.toggleLikeCtrl = asyncHandler(async (req,res) => {
    const loggedInUser = req.user.id;
    const {id: postId} = req.params;
    let post = await Post.findById(postId);
    if(!post) {
        return res.status(404).json({message: "post not found "});
    }

    const isPostAlreadyLiked = post.likes.find(
        (user) => user.toString() === loggedInUser );
    if(isPostAlreadyLiked) {
        post = await Post.findByIdAndUpdate(postId , {
            $pull: { likes: loggedInUser }
        },
         { new: true });
    } else {
        post = await Post.findByIdAndUpdate(postId , {
            $push: { likes: loggedInUser }
        },
         { new: true });
    }
    res.status(200).json(post);
})

