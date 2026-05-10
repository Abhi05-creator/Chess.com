const User = require('../model.js/chessusermodel');
const Game = require('../model.js/gamemodel');
const bcrypt = require('bcrypt');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const createUser = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User created', id: newUser._id });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, password } = req.body;
    try {
        const updates = { username, email };
        if (password) updates.password = await bcrypt.hash(password, 10);
        const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const findMatch = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) return res.status(404).json({ message: 'User not found' });

        // Matchmaking logic: find an 'outgame' opponent within a +/- 200 rank range.
        // We use findOneAndUpdate to atomically mark the opponent as 'ingame' 
        // so no one else can match with them at the same time.
        const opponent = await User.findOneAndUpdate(
            {
                _id: { $ne: currentUser._id },
                status: 'outgame',
                rank: { 
                    $gte: (currentUser.rank || 1200) - 200, 
                    $lte: (currentUser.rank || 1200) + 200 
                }
            },
            { status: 'ingame' },
            { new: true }
        ).select('-password');

        if (!opponent) {
            return res.status(404).json({ message: 'No available opponents found' });
        }

        // Mark current user as 'ingame' as well
        currentUser.status = 'ingame';
        await currentUser.save();

        res.json({ opponent });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, findMatch };