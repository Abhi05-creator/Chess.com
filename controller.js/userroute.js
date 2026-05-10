const express = require('express');
const userRouter = express.Router();
const userController = require('./usercontroller');
const authController = require('./authenticate');

userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);

userRouter.get('/', authController.authenticate, userController.getAllUsers);
userRouter.get('/:id', authController.authenticate, userController.getUserById);
userRouter.post('/', authController.authenticate, userController.createUser);
userRouter.put('/:id', authController.authenticate, userController.updateUser);
userRouter.delete('/:id', authController.authenticate, userController.deleteUser);
userRouter.post('/match/find', authController.authenticate, userController.findMatch);

module.exports = userRouter;