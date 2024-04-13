const Room = require("../models/Room");

//@desc     Get all rooms
//@route    GET /api/v1/rooms
//@access   Public
exports.getRooms = async (req, res, next) => {
  let query;

  // Extract req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFileds = ["select", "sort", "page", "limit"];

  // Loop over remove fields and delete them from reqQuery
  removeFileds.forEach((param) => delete reqQuery[param]);
  console.log(reqQuery);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Conditional Query
  queryStr = queryStr.replace(
    /\b(gt|get|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  query = Room.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAT");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  try {
    const total = await Room.countDocuments();
    query = query.skip(startIndex).limit(limit);

    // Excecute query
    const rooms = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }
    res.status(200).json({
      success: true,
      count: rooms.length,
      pagination,
      data: rooms,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

//@desc     Get single room
//@route    GET /api/v1/rooms/:id
//@access   Public
exports.getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room)
      return res.status(404).json({ success: false, msg: "Room not found" });
    res.status(200).json({ success: true, data: room });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

//@desc     Create a room
//@route    POST /api/v1/rooms
//@access   Private
exports.createRoom = async (req, res, next) => {
  const room = await Room.create(req.body);
  res.status(201).json({
    success: true,
    data: room,
  });
};

//@desc     Update single room
//@route    PUT /api/v1/rooms/:id
//@access   Private
exports.updateRoom = async (req, res, next) => {
  try {
    // Set updatedAt attribute to current date-time
    req.body.updatedAt = Date.now();

    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!room)
      return res.status(404).json({ success: false, msg: "Room not found" });
    res.status(200).json({ success: true, data: room });
  } catch {
    return res.status(400).json({ success: false });
  }
};

//@desc     Delete single room
//@route    DELETE /api/v1/rooms/:id
//@access   Private
exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room)
      return res.status(404).json({ success: false, msg: "Room not found" });

    await room.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    return res.status(400).json({ success: false });
  }
};
