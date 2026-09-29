import Theatre from "../models/Theatre.js";

// CREATE THEATRE
export const createTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.create(req.body);

    res.status(201).json({
      message: "Theatre created successfully",
      theatre
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// GET ALL THEATRES
export const getTheatres = async (req, res) => {
  try {
    const theatres = await Theatre.find({
      isActive: true
    }).sort({ createdAt: -1 });

    res.json(theatres);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// GET THEATRE BY ID
export const getTheatreById = async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id);

    if (!theatre) {
      return res.status(404).json({
        message: "Theatre not found"
      });
    }

    res.json(theatre);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// UPDATE THEATRE
export const updateTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!theatre) {
      return res.status(404).json({
        message: "Theatre not found"
      });
    }

    res.json({
      message: "Theatre updated successfully",
      theatre
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// DELETE THEATRE
export const deleteTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.findByIdAndDelete(
      req.params.id
    );

    if (!theatre) {
      return res.status(404).json({
        message: "Theatre not found"
      });
    }

    res.json({
      message: "Theatre deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};