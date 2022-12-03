const reviewModel = require("../models/reviewModel");
const bookModel = require("../models/bookModel");
const errorHandler = require("../errorHandling/errorHandling");

exports.createReview = async function (req, res) {
  try {
    // const bookId = req.params.bookId;
    const data = req.body;

    const book = await bookModel.findOne({
      _id: req.params.bookId,
      isDeleted: false,
    });
    if (!book) {
      return res.status(400).send({
        status: false,
        message: "Either the Book ID is invalid or the book is deleted",
      });
    }
    data.reviewedAt = Date.now();
    data["bookId"] = req.params.bookId;
    const reviewCreated = await reviewModel.create(data);
    const reviews = JSON.parse(JSON.stringify(reviewCreated));
    const { bookId, reviewedBy, reviewedAt, rating, review, _id } = reviews;
    await bookModel.findOneAndUpdate(
      { _id: req.params.bookId },
      { $inc: { reviews: 1 } }
    );
    return res.status(201).send({
      status: true,
      message: "Success",
      data: { bookId, reviewedBy, reviewedAt, rating, review, _id },
    });
  } catch (err) {
    return errorHandler(err, res);
  }
};

exports.updateReview = async function (req, res) {
  try {
    let data = req.body;
    let bookId = req.params.bookId;
    let reviewId = req.params.reviewId;

    const book = await bookModel
      .findOne({ _id: bookId, isDeleted: false })
      .select({ __v: 0, deletedAt: 0, ISBN: 0 });
    if (!book) {
      return res.status(400).send({
        status: false,
        message: "Either the book ID is invalid or the book is deleted",
      });
    }
    let findReview = await reviewModel.findOne({
      _id: reviewId,
      isDeleted: false,
      bookId,
    });

    if (!findReview) {
      return res.status(404).send({
        status: false,
        message: "A review with this id does not exists for this book",
      });
    }

    await reviewModel.findOneAndUpdate(
      { _id: reviewId },
      { $set: { ...data } },
      { runValidators: true }
    );

    const allReviews = await reviewModel.find({ bookId : bookId , isDeleted : false }).select({
      isDeleted: 0,
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
    });
    let books = JSON.parse(JSON.stringify(book));
    books.reviewsData = allReviews;
    books.reviews = allReviews.length;

    return res.status(200).send({ status: true, Data: books });
  } catch (err) {
    return errorHandler(err, res);
  }
};

exports.deleteReview = async (req, res) => {
  try {
    let bookId = req.params.bookId;
    let reviewId = req.params.reviewId;

    let findReview = await reviewModel.findOne({
      _id: reviewId,
      isDeleted: false,
    });

    if (!findReview) {
      return res.status(404).send({
        status: false,
        message: "A review with this id does not exists",
      });
    }

    await reviewModel.findOneAndUpdate(
      { _id: reviewId },
      { $set: { isDeleted: true } }
    );
    let updatedBook = await bookModel.findOneAndUpdate(
      { _id: bookId },
      { $inc: { reviews: -1 } }
    );
    
    if (!updatedBook) {
      return res.status(400).send({
        status: false,
        message: "Either the book ID is invalid or the book is deleted",
      });
    }
    return res
      .status(200)
      .send({ status: true, data: "Review deleted successfully" });
  } catch (err) {
    return errorHandler(err, res);
  }
};




