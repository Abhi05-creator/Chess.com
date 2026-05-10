const User = require('../model.js/chessusermodel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const mongoose = require('mongoose');

// Disable buffering to fail early if database connection is not ready
mongoose.set('bufferCommands', false);

exports.signup = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!email || !password || !username) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email address' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, email, password: hashedPassword });
        const token = jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ message: 'User created successfully', token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }

};


exports.authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }   
    let token=authHeader.split(" ")[1];
    if(!token){
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  
        req.user=decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }};