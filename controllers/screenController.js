import Screen from "../models/Screen.js";


// CREATE SCREEN
export const createScreen = async (req, res) => {
  try {
       console.log("🔥 CREATE SCREEN HIT");
    console.log("SCREEN BODY:", req.body);
    const screen = await Screen.create(req.body);

    res.status(201).json({
      message: "Screen created successfully",
      screen
    });

  } catch (error) {
     console.log("🔥 SCREEN ERROR:", error.message);
    res.status(500).json({
      message: error.message
    });
  }
};


// GET ALL SCREENS
export const getScreens = async (req, res) => {
  try {
    const screens = await Screen.find({
      isActive: true
    }).populate("theatre", "name city address");

    res.json(screens);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// GET SCREEN BY ID
export const getScreenById = async (req, res) => {
  try {
    const screen = await Screen.findById(req.params.id)
      .populate("theatre", "name city address");

    if (!screen) {
      return res.status(404).json({
        message: "Screen not found"
      });
    }

    res.json(screen);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// UPDATE SCREEN
export const updateScreen = async (req, res) => {
  try {
    const screen = await Screen.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate("theatre", "name city address");

    if (!screen) {
      return res.status(404).json({
        message: "Screen not found"
      });
    }

    res.json({
      message: "Screen updated successfully",
      screen
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// DELETE SCREEN
export const deleteScreen = async (req, res) => {
  try {
    const screen = await Screen.findByIdAndDelete(
      req.params.id
    );

    if (!screen) {
      return res.status(404).json({
        message: "Screen not found"
      });
    }

    res.json({
      message: "Screen deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};