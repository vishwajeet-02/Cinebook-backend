import Show from "../models/Show.js";


// CREATE SHOW
export const createShow = async (req, res) => {
  try {
    const show = await Show.create(req.body);

    const populatedShow = await Show.findById(show._id)
      .populate("movie", "title poster duration")
      .populate("theatre", "name city address")
      .populate("screen", "name screenType totalSeats");

    res.status(201).json({
      message: "Show created successfully",
      show: populatedShow
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// GET ALL SHOWS
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({
      isActive: true
    })
      .populate("movie", "title poster duration")
      .populate("theatre", "name city address")
      .populate("screen", "name screenType totalSeats")
      .sort({ showDate: 1 });

    res.json(shows);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// GET SHOW BY ID
export const getShowById = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate("movie", "title poster duration")
      .populate("theatre", "name city address")
      .populate("screen", "name screenType totalSeats");

    if (!show) {
      return res.status(404).json({
        message: "Show not found"
      });
    }

    res.json(show);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// UPDATE SHOW
export const updateShow = async (req, res) => {
  try {
    const show = await Show.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
      .populate("movie", "title poster duration")
      .populate("theatre", "name city address")
      .populate("screen", "name screenType totalSeats");

    if (!show) {
      return res.status(404).json({
        message: "Show not found"
      });
    }

    res.json({
      message: "Show updated successfully",
      show
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// DELETE SHOW
export const deleteShow = async (req, res) => {
  try {
    const show = await Show.findByIdAndDelete(
      req.params.id
    );

    if (!show) {
      return res.status(404).json({
        message: "Show not found"
      });
    }

    res.json({
      message: "Show deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};