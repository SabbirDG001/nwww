const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    className: {
        type: String,
        required: true
    },
    session: {
        type: String,
        required: true
    },
    students: [{
        studentId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        status: {
            type: Number, // Use numeric values for attendance (e.g., count of attendance)
            required: true
        }
    }]
}, {
    timestamps: true
});

// Compound index for unique attendance records per class per day
attendanceSchema.index({ date: 1, className: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
