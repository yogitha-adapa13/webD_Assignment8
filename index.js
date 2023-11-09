
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
app.use(express.json());

// Connecting to MongoDB

mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.send('Welcome to the API');
  });
  
// Creating a user and adding validations

app.post('/user/create', async (req, res) => {
  console.log('Received request body:', req.body);
    const { fullName, email, password } = req.body;
    console.log('Received email:', email);
    // Validating email 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send('Invalid email format');
    }
  
    // Validating full name
    if (!fullName || fullName.length < 3) {
      return res.status(400).send('Full name must be at least 3 characters');
    }
  
    // Validating password
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).send('Password must be at least 8 characters and include both letters and numbers and no special characters');
    }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
    // Creating a new user
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });
  
  newUser.save()
    .then(() => {
      res.status(201).send('User created successfully');
    })
    .catch((err) => {
      res.status(500).send('Error creating user');
    });
  });


// Updating user details (full name and password only)

app.put('/user/edit', async (req, res) => {
    const { fullName, password, email } = req.body;
  
    try {
      // Validating full name
      if (fullName && fullName.length < 3) {
        return res.status(400).send('Full name must be at least 3 characters');
      }
  
      // Validating password
      if (password) {
        const passwordRegex = /^(?=.[A-Za-z])(?=.\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
          return res.status(400).send('Password must be at least 8 characters and include both letters and numbers and no special characters');
        }
      }
  
      // Checking if the user is there
      const foundUser = await User.findOne({ email });
  
      if (!foundUser) {
        return res.status(404).send('User not found');
      }
  
      // Updating full name and/or password
      if (fullName) foundUser.fullName = fullName;
      if (password) foundUser.password = await bcrypt.hash(password, 10);
  
      await foundUser.save();
  
      res.status(200).send('User details updated successfully');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error updating user');
    }
  });
  

// Deleting user by taking email as parameter
app.delete('/user/delete', async (req, res) => {
    const { email } = req.body;
  
    try {
      const deletedUser = await User.findOneAndDelete({ email });
  
      if (!deletedUser) {
        return res.status(404).send('User not found');
      }
  
      res.status(200).send('User deleted successfully');
    } catch (error) {
      res.status(500).send('Error deleting user');
    }
  });

// Getting details of all users
app.get('/user/getAll', (req, res) => {

  User.find({}, 'fullName email password')
  .then((users) => {
    res.status(200).json(users);
  })
  .catch((err) => {
    res.status(500).send('Error retrieving user data');
  });
});

// Starting the server
const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});