const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    name: {
        type: String,
        required: false
    },
    className: {
        type: String,
        required: false
    },
    session: {
        type: String,
        required: false
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
            type: Number, // 0 = present, 3 = absent (based on the provided JSON data)
            required: true
        }
    }]
}, {
    timestamps: true
});

// Modify the index to be more flexible
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);