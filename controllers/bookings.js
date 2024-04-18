const Booking = require('../models/Booking')
const Hotel = require('../models/Hotel')
const Room = require('../models/Room')

exports.getBookings = async (req, res, next) => {
    let query
    // General users can see only their bookings!
    if (req.user.role !== 'admin') {
        query = Booking.find({ userId: req.user.id }).populate({
            path: 'hotelId',
            select: 'name address subDistrict district province postalCode tel'
        }).populate({
            path: 'rooms.roomId',
            select: 'name'
        }).select('startDate endDate residents createdAt updatedAt');
    } else { // If you are admin, you can see all!

        if (req.params.hotelID) {
            console.log(req.params.hotelID)
            query = Booking.find({ hotelId: req.params.hotelID }).populate({
                path: 'hotelId',
                select: 'name address subDistrict district province postalCode tel'
            }).populate({
                path: 'rooms.roomId',
                select: 'name'
            }).populate({
                path: 'userId',
                select: 'name email'
            }).select('startDate endDate residents isEmailSent createdAt updatedAt');
        } else {
            query = Booking.find().populate({
                path: 'hotelId',
                select: 'name address subDistrict district province postalCode tel'
            }).populate({
                path: 'rooms.roomId',
                select: 'name'
            }).populate({
                path: 'userId',
                select: 'name email'
            }).select('startDate endDate residents isEmailSent createdAt updatedAt');
        }
    }
    try {
        const bookings = await query;

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ success: false, message: "Cannot find bookings" })
    }
}

exports.getBooking = async (req, res, next) => {
    try {
        let booking
        // General users view
        if (req.user.role !== 'admin') {
            booking = await Booking.findById(req.params.id).populate({
                path: 'hotelId',
                select: 'name address subDistrict district province postalCode tel'
            }).populate({
                path: 'rooms.roomId',
                select: 'name'
            }).select('startDate endDate residents createdAt updatedAt');
        } else { // Admin view
            booking = await Booking.findById(req.params.id).populate({
                path: 'hotelId',
                select: 'name address subDistrict district province postalCode tel'
            }).populate({
                path: 'rooms.roomId',
                select: 'name'
            }).populate({
                path: 'userId',
                select: 'name email'
            }).select('startDate endDate residents isEmailSent createdAt updatedAt');
        }

        if (!booking) {
            return res.status(400).json({ success: false, message: `No booking with the id of ${req.params.id}` })
        }

        res.status(200).json({ success: true, data: booking })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ success: false, message: "Cannot find booking" })
    }
}

exports.addBooking = async (req, res, next) => {
    try {
        req.body.hotelId = req.params.hotelID

        const hotel = await Hotel.findById(req.params.hotelID)

        if (!hotel) {
            return res.status(404).json({ success: false, message: `No hotel with the id of ${req.params.hotelID}` })
        }

        // Ownership
        req.body.userId = req.user.id
        const existedBooking = await Booking.find({ user: req.user.id })
        // If not admin, user can create only 3 appointment
        if (existedBooking.lenght >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, message: `The user with ID ${req.user.id} has already made 3 bookings` })
        }

        const booking = await Booking.create(req.body)

        res.status(200).json({
            success: true,
            data: booking
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ success: false, message: "Cannot create Booking" })
    }
}

exports.updateBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id)

        if (!booking) {
            return res.status(400).json({ success: false, message: `No booking with the id of ${req.params.id}` })
        }

        // Make sure user is the appointment owner
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this booking` })
        }

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })
        res.status(200).json({ success: true, data: booking })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ success: false, message: "Cannot update booking" })
    }
}

exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)

        if (!booking) {
            return res.status(400).json({ success: false, message: `No booking with the id of ${req.params.id}` })
        }

        // Make sure user is the appointment owner
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to delete this booking` })
        }

        await booking.deleteOne()
        res.status(200).json({ success: true, data: {} })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ success: false, message: "Cannot delete booking" })
    }
}