const { isValidObjectId } = require("mongoose");
const bookModel = require("../models/bookModel");
const reviewModel = require("../models/reviewModel");
const errorHandler = require("../errorHandling/errorHandling");
const userModel = require("../models/userModel");

exports.createBook = async (req, res) => {
  try {
    if (!isValidObjectId(req.body.userId)) {
      return res.send("User ID is invalid");
    }
    let user = await userModel.findById(req.body.userId);
    if (!user) {
      return res
        .status(400)
        .send({ status: false, message: "No user exist with this ID" });
    }
    let bookData = await bookModel.create(req.body);
    return res
      .status(201)
      .send({ status: true, message: "Success", data: bookData });
  } catch (err) {
    return errorHandler(err, res);
  }
};

exports.getBooks = async (req, res) => {
  try {
    const reqQuery = req.query;
    const { userId, category, subcategory } = reqQuery;

    if (userId)
      if (!isValidObjectId(userId))
        return res
          .status(400)
          .send({ status: false, message: "User ID is not valid." });

    if (
      Object.keys(reqQuery).length === 0 ||
      userId ||
      category ||
      subcategory
    ) {
      const book = await bookModel
        .find({ $and: [{ isDeleted: false }, reqQuery] })
        .select({
          title: 1,
          excerpt: 1,
          category: 1,
          releasedAt: 1,
          userId: 1,
          reviews: 1,
        })
        .sort({ title: 1 });

      if (book.length === 0)
        return res.status(404).send({
          status: false,
          message: "No books found with these filters.",
        });

      return res
        .status(200)
        .send({ status: true, message: "Books List", data: book });
    } else
      return res.status(400).send({ status: false, message: "Invalid query." });
  } catch (err) {
    return errorHandler(err, res);
  }
};

exports.getBooksById = async function (req, res) {
  try {
    let bookId = req.params.bookId;

    if (!isValidObjectId(bookId))
      return res
        .status(400)
        .send({ status: false, message: "BookId is not valid" });

    const allReviews = await reviewModel
      .find({ bookId, isDeleted: false })
      .select({
        isDeleted: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      });
    const book = await bookModel
      .findOne({ _id: bookId, isDeleted: false })
      .select({ __v: 0, deletedAt: 0, ISBN: 0 });
    if (!book)
      return res
        .status(404)
        .send({ status: false, message: "Book does Not Exist" });

    const books = JSON.parse(JSON.stringify(book));
    books.reviewsData = allReviews;
    books.reviews = allReviews.length;

    return res
      .status(200)
      .send({ status: true, message: "Books List", data: books });
  } catch (err) {
    return errorHandler(err, res);
  }
};

exports.updateBooks = async (req, res) => {
  try {
    const reqBody = req.body;
    if (req.body.title) {
      req.body.title =
        req.body.title[0].toUpperCase() + req.body.title.slice(1);
    }
    let { title, excerpt, ISBN, releasedAt } = reqBody;
    const bookId = req.params.bookId;
    if (!bookId) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide book ID" });
    }

    const updatedBook = await bookModel.findOneAndUpdate(
      { _id: bookId },
      { $set: { title, excerpt, releasedAt, ISBN } },

      { new: true, runValidators: true }
    );
    if (!updatedBook) {
      return res
        .status(404)
        .send({ status: false, message: "No book found with this ID" });
    }
    return res.status(200).send({ status: true, data: updatedBook });
  } catch (err) {
    return errorHandler(err, res);
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    if (!bookId)
      return res
        .status(400)
        .send({ status: false, message: "please provide bookId" });

    const book = await bookModel.findOneAndUpdate(
      { _id: bookId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: Date.now() } },
      { $new: true }
    );
    if (!book) {
      return res.status(400).send({
        status: false,
        message: "Book is either deleted or does not exist",
      });
    }
    return res
      .status(200)
      .send({ status: true, message: `Book is  deleted successfully` });
  } catch (err) {
    return errorHandler(err, res);
  }
};
