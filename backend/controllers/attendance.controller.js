const Attendance = require('../models/attendance.model');

// Create and Save new Attendance
exports.create = async (req, res) => {
    try {
        const { date, className, session, students } = req.body;

        const existingAttendance = await Attendance.findOne({
            date: new Date(date),
            className,
            session
        });

        if (existingAttendance) {
            existingAttendance.students = students;
            const updatedAttendance = await existingAttendance.save();
            res.json({ 
                message: "Attendance updated successfully",
                data: updatedAttendance 
            });
        } else {
            const attendance = new Attendance({
                date: new Date(date),
                className,
                session,
                students
            });
            const savedAttendance = await attendance.save();
            res.status(201).json({ 
                message: "Attendance saved successfully",
                data: savedAttendance 
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Error saving attendance",
            error: error.message
        });
    }
};

// Find attendance by date
exports.findByDate = async (req, res) => {
    try {
        const attendance = await Attendance.findOne({
            date: new Date(req.params.date),
            className: req.query.className,
            session: req.query.session
        });

        if (!attendance) {
            return res.status(404).json({ message: "No attendance found for this date" });
        }

        res.json(attendance);
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving attendance",
            error: error.message
        });
    }
};

// Retrieve all attendance records
exports.findAll = async (req, res) => {
    try {
        const { className, session } = req.query;
        const query = {};

        if (className) query.className = className;
        if (session) query.session = session;

        const attendance = await Attendance.find(query)
            .sort({ date: -1 });

        res.json(attendance);
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving attendance records",
            error: error.message
        });
    }
};

// Update attendance
exports.update = async (req, res) => {
    try {
        const { students } = req.body;
        const attendance = await Attendance.findOneAndUpdate(
            {
                date: new Date(req.params.date),
                className: req.query.className,
                session: req.query.session
            },
            { students },
            { new: true }
        );

        if (!attendance) {
            return res.status(404).json({ message: "Attendance not found" });
        }

        res.json({ 
            message: "Attendance updated successfully",
            data: attendance 
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating attendance",
            error: error.message
        });
    }
};

// Delete attendance
exports.delete = async (req, res) => {
    try {
        const attendance = await Attendance.findOneAndDelete({
            date: new Date(req.params.date),
            className: req.query.className,
            session: req.query.session
        });

        if (!attendance) {
            return res.status(404).json({ message: "Attendance not found" });
        }

        res.json({ message: "Attendance deleted successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting attendance",
            error: error.message
        });
    }
};
// const Attendance = require('../models/attendance.model');

// Fetch attendance summary for all students
exports.getAttendanceSummary = async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find();

        // Aggregate attendance by student and date
        const summary = {};
        attendanceRecords.forEach(record => {
            record.students.forEach(student => {
                if (!summary[student.name]) {
                    summary[student.name] = {};
                }
                summary[student.name][record.date.toISOString().split('T')[0]] = student.status; // status is attendance percentage
            });
        });

        res.json(summary);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching attendance summary",
            error: error.message
        });
    }
};
