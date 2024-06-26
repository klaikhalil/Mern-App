const router = require("express").Router();
const { createCommentCtrl, getAllComments, deleteCommentCtrl, updateCommentCtrl } = require("../controllers/commentsController");
const validateObjectId = require("../middlewares/validateObjectId");
const { verifyToken, verifyTokenAndAdmin } = require("../middlewares/verifyToken");

// /api/comments
router.route("/")
.post(verifyToken, createCommentCtrl)
.get(verifyTokenAndAdmin, getAllComments);

// /api/comments/:id
router.route("/:id")
    .delete(validateObjectId, verifyToken , deleteCommentCtrl)
    .put(validateObjectId,verifyToken,updateCommentCtrl);
module.exports = router ;