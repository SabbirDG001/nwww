const express = require('express');
const router = express.Router();
const Session = require('../models/session');
const Class = require('../models/Class');
const Attendance = require('../models/attendance.model');

// Get all sessions (for dropdown)
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find().select('name');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all classes (for dashboard)
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find();
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a class
router.delete('/classes/:id', async (req, res) => {
  try {
    // Delete the class
    await Class.findByIdAndDelete(req.params.id);
    
    // Also delete all attendance records for this class
    const classDoc = await Class.findById(req.params.id);
    if (classDoc) {
      await Attendance.deleteMany({ className: classDoc.name });
    }
    
    res.json({ message: 'Class and related attendance records deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get full session data by name (for copying)
router.get('/sessions/:name', async (req, res) => {
  try {
    console.log(`Fetching session: ${req.params.name}`);
    
    // First try to find the session in the Session model
    const session = await Session.findOne({ name: req.params.name });
    
    if (session) {
      console.log(`Found session in Session collection: ${session.name}`);
      return res.json(session);
    }
    
    // If not found in Session model, try to find in Attendance model
    const attendanceRecord = await Attendance.findOne({ 
      name: req.params.name 
    });
    
    if (attendanceRecord) {
      console.log(`Found session in Attendance collection: ${attendanceRecord.name}`);
      return res.json(attendanceRecord);
    }
    
    // If not found anywhere
    console.log(`Session not found: ${req.params.name}`);
    return res.status(404).json({ error: 'Session not found' });
    
  } catch (err) {
    console.error('Error fetching session:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new class with students from a session
router.post('/classes', async (req, res) => {
  const { name, session, students } = req.body;

  try {
    console.log(`Creating class "${name}" with session "${session}"`);
    
    // Verify we have a session
    if (!session) {
      return res.status(400).json({ error: 'Session is required' });
    }
    
    // Create new class
    const newClass = new Class({
      name,
      session,
      data: [], // Initialize with empty data array
      createdAt: new Date()
    });
    
    await newClass.save();
    console.log(`Created class: ${newClass._id}`);
    
    // If students were provided, use them. Otherwise, fetch from the session
    let studentData = students;
    
    if (!studentData || studentData.length === 0) {
      console.log(`No students provided, fetching from session "${session}"`);
      
      // Fetch student data from the session
      const sessionData = await Session.findOne({ name: session });
      
      if (sessionData && sessionData.students) {
        studentData = sessionData.students;
        console.log(`Found ${studentData.length} students in session`);
      } else {
        console.log(`No students found in session "${session}"`);
      }
    }
    
    // Create a new attendance record for this class if we have students
    if (studentData && studentData.length > 0) {
      const newAttendance = new Attendance({
        date: new Date(),
        className: name,
        session: session,
        name: name, // Use class name as the attendance record name
        students: studentData
      });
      
      await newAttendance.save();
      console.log(`Created attendance record for class "${name}"`);
    }
    
    res.status(201).json({
      message: 'Class created successfully',
      class: newClass
    });
    
  } catch (err) {
    console.error('Error creating class:', err);
    res.status(500).json({ error: err.message });
  }
});

// MOVED OUTSIDE - Post attendance data
router.post('/attendance', async (req, res) => {
  try {
    const { date, className, session, students } = req.body;
    
    // Validate required fields
    if (!date || !className || !session || !Array.isArray(students)) {
      return res.status(400).json({ 
        error: 'Invalid request. Required fields: date, className, session, students array' 
      });
    }
    
    console.log(`Saving attendance for class "${className}" (${session}) on ${date}`);
    
    // Check if an attendance record already exists for this class/date
    let attendanceRecord = await Attendance.findOne({
      className,
      session,
      date: new Date(date)
    });
    
    if (attendanceRecord) {
      // Update existing record
      console.log(`Updating existing attendance record (${attendanceRecord._id})`);
      attendanceRecord.students = students;
      attendanceRecord.updatedAt = new Date();
      await attendanceRecord.save();
      
      res.json({
        message: 'Attendance record updated successfully',
        record: attendanceRecord
      });
    } else {
      // Create new record
      console.log(`Creating new attendance record for class "${className}"`);
      const newAttendance = new Attendance({
        date: new Date(date),
        className,
        session,
        students,
        createdAt: new Date()
      });
      
      await newAttendance.save();
      
      res.status(201).json({
        message: 'Attendance recorded successfully',
        record: newAttendance
      });
    }
  } catch (err) {
    console.error('Error saving attendance:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get attendance records for a specific class
router.get('/classes/:id/attendance', async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    const attendanceRecords = await Attendance.find({
      className: classDoc.name,
      session: classDoc.session
    }).sort({ date: -1 });
    
    res.json(attendanceRecords);
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get class by ID
router.get('/classes/:id', async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    res.json(classDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;