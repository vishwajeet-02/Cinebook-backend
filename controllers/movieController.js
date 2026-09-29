import Movie from "../models/Movie.js";

// CREATE MOVIE
export const createMovie = async (req, res) => {
  try {
    const movie = await Movie.create(req.body);

    res.status(201).json({
      message: "Movie created successfully",
      movie
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// GET ALL MOVIES
export const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find({
      isActive: true
    }).sort({ createdAt: -1 });

    res.json(movies);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// GET SINGLE MOVIE
export const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found"
      });
    }

    res.json(movie);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// UPDATE MOVIE
export const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found"
      });
    }

    res.json({
      message: "Movie updated successfully",
      movie
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// DELETE MOVIE
export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(
      req.params.id
    );

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found"
      });
    }

    res.json({
      message: "Movie deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};