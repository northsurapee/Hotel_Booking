const Hotel = require("../models/Hotel");

//@desc     Get all hotels
//@route    GET /api/v1/hotels
//@access   Public
exports.getHotels = async (req, res, next) => {
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

  query = Hotel.find(JSON.parse(queryStr));

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
    const total = await Hotel.countDocuments();
    query = query.skip(startIndex).limit(limit);

    // Excecute query
    const hotels = await query;

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
      count: hotels.length,
      pagination,
      data: hotels,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

//@desc     Get single hotel
//@route    GET /api/v1/hotels/:id
//@access   Public
exports.getHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel)
      return res.status(404).json({ success: false, msg: "Hotel not found" });
    res.status(200).json({ success: true, data: hotel });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

//@desc     Create a hotel
//@route    POST /api/v1/hotels
//@access   Private
exports.createHotel = async (req, res, next) => {
  const hotel = await Hotel.create(req.body);
  console.log(hotel);
  res.status(201).json({
    success: true,
    data: hotel,
  });
};

//@desc     Update single hotel
//@route    PUT /api/v1/hotels/:id
//@access   Private
exports.updateHotel = async (req, res, next) => {
  try {
    // Set updatedAt attribute to current date-time
    req.body.updatedAt = Date.now();

    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!hotel)
      return res.status(404).json({ success: false, msg: "Hotel not found" });
    res.status(200).json({ success: true, data: hotel });
  } catch {
    return res.status(400).json({ success: false });
  }
};

//@desc     Delete single hotel
//@route    DELETE /api/v1/hotels/:id
//@access   Private
exports.deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel)
      return res.status(404).json({ success: false, msg: "Hotel not found" });

    await hotel.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    return res.status(400).json({ success: false });
  }
};
