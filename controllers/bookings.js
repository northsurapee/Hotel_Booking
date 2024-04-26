const Booking = require('../models/Booking')
const Hotel = require('../models/Hotel')
const Room = require('../models/Room')
const { sendEmail } = require('../utils/booking')

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

        // Check days of booking
        const startDateObj = new Date(req.body.startDate);
        const endDateObj = new Date(req.body.endDate);

        // Calculate the difference in milliseconds
        const timeDifference = endDateObj.getTime() - startDateObj.getTime();

        // Convert milliseconds to days (1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
        const differenceInDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

        // const existedBooking = await Booking.find({ user: req.user.id })
        // If not admin, user can create only 3 appointment
        if (differenceInDays >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, message: `The user with ID ${req.user.id} has can make at most 3 days for each booking` })
        }
        // console.log(req.body)

        // Get all days between startDate and endDate
        const allDays = [];
        let currentDate = startDateObj;
        // Loop through each day until reaching endDate
        while (currentDate <= endDateObj) {
            // Add the current date to the list
            allDays.push(currentDate.toISOString().slice(0, 10)); // Get YYYY-MM-DD format

            // Increment current date by 1 day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Check if there is any day in reservedDate
        let allRooms = []
        for (r of req.body.rooms) {
            const room = await Room.findById(r.roomId);
            allRooms.push(room.name)
            let daysInReservedDate = []
            for (const day of allDays) {
                if (room.reservedDate.some(rd => rd.date.toISOString().slice(0, 10) === day)) {
                    daysInReservedDate.push(day)
                }
            }
            console.log(daysInReservedDate)
            if (daysInReservedDate.length > 0) {
                return res.status(400).json({ success: false, message: `At Room ${room.name} in ${daysInReservedDate.join(', ')}, the room has already reserved` })
            }
        }

        // Create new booking
        const booking = await Booking.create(req.body)

        // Update reservedDate
        for (r of req.body.rooms) {
            const datesToAdd = allDays.map(day => ({ date: new Date(day), bookingId: booking._id }));
            const updatedRoom = await Room.findOneAndUpdate(
                { _id: r.roomId },
                { $push: { reservedDate: { $each: datesToAdd } } },
                { new: true } // Return the updated document
            );

            if (!updatedRoom) {
                return res.status(500).json({ success: false, message: "Cannot update room" })
            }
        }
        // console.log('sendEmail:', sendEmail)
        const isSent = sendEmail(
            req.user.email,
            'Hotel Booking Confirmation',
            `Your booking at ${hotel.name}<br>
            For Room ${allRooms.join(", ")}<br>
            From ${req.body.startDate} to ${req.body.endDate}
            has been successfully confirmed. We hope you enjoy your stay!`
        )

        // if (!isSent) {
        //     return res.status(400).json({ success: false, message: `Email has not been sent yet` })
        // }

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

        const isEmailSent = req.body?.isEmailSent;
        if (isEmailSent !== undefined && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, message: `Normal user cannot edit this attribute` })
        }

        if (req.body.startDate || req.body.endDate) {
            // Check days of booking
            const startDateObj = req.body.startDate ? new Date(req.body.startDate) : booking.startDate
            const endDateObj = req.body.endDate ? new Date(req.body.endDate) : booking.endDate

            // Calculate the difference in milliseconds
            const timeDifference = endDateObj.getTime() - startDateObj.getTime();

            // Convert milliseconds to days (1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
            const differenceInDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

            // const existedBooking = await Booking.find({ user: req.user.id })
            // If not admin, user can create only 3 appointment
            if (differenceInDays >= 3 && req.user.role !== 'admin') {
                return res.status(400).json({ success: false, message: `The user with ID ${req.user.id} has can make at most 3 days for each booking` })
            }
            // console.log(req.body)

            // Get all days between startDate and endDate
            const allDays = [];
            let currentDate = startDateObj;
            // Loop through each day until reaching endDate
            while (currentDate <= endDateObj) {
                // Add the current date to the list
                allDays.push(currentDate.toISOString().slice(0, 10)); // Get YYYY-MM-DD format

                // Increment current date by 1 day
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Check if there is any day in reservedDate
            for (r of booking.rooms) {
                const room = await Room.findById(r.roomId);
                let daysInReservedDate = []

                for (const day of allDays) {
                    if (room.reservedDate.some(rd => rd.date.toISOString().slice(0, 10) === day && rd.bookingId.toString() != booking._id.toString())) {
                        daysInReservedDate.push(day)
                    }
                }
                console.log(daysInReservedDate)
                if (daysInReservedDate.length > 0) {
                    return res.status(400).json({ success: false, message: `At Room ${room.name} in ${daysInReservedDate.join(', ')}, the room has already reserved` })
                }

            }
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