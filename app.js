const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const port = 3000;


// Start server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecoffees', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully'))
    .catch((error) => console.error('MongoDB connection error:', error));

const db = mongoose.connection;

//Save Name And Email
app.use(bodyParser.json());


const saveEmailSchema = new mongoose.Schema(
    {
        token: { type: String, unique: true, required: true, default: () => crypto.randomBytes(25).toString('hex') },
        name: String,
        email: { type: String, unique: true, required: true },
        created_at: { type: Date, default: Date.now },
        password: { type: String, required: true },
    },
    { collection: 'users', versionKey: false }
);

saveEmailSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
});

const SaveEmail = mongoose.model('saveEmail', saveEmailSchema);

app.post('/ecoffees/saveEmail', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Missing required parameters: name, email, and password',
                status: false,
            });
        }

        const existedUser = await SaveEmail.findOne({ email });

        if (existedUser) {
            return res.status(400).json({
                message: 'Email already exists',
                status: false,
            });
        }

        const newUser = new SaveEmail({ name, email, password });

        await newUser.save();

        res.status(200).json({
            message: 'User account created successfully',
            status: true,
            data: newUser,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error creating user account',
            status: false,
        });
    }
});






app.get("/check-con", async (req, res) => {
    try {
        res.json("connection is working");
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



//Category API

const categorySchema = new mongoose.Schema({
    id: String,
    name: String,
}, { collection: 'categories' });

const categoriesScm = mongoose.model('categories', categorySchema);

app.get('/ecoffees/category', async (req, res) => {
    // Retrieve the categories from the database
    const categories = await categoriesScm.find({});

    // Check if there is any data
    if (categories.length === 0) {
        // Send a message if there is no data
        res.status(200).send({ status: false, message: 'No data found', data: categories });
    } else {
        // Send the response with a status property
        res.status(200).send({ status: true, data: categories });
    }
});


//Near By
const nearbyModel = new mongoose.Schema({
    id: String,
    name: String,
    rate: String,
    review: String,
    distance: String,
    location: String,
    fav: Boolean,
    photos: [
        {
            id: String,
            photo: String,
        },
    ],
    provide: [
        {
            id: String,
            name: String,
        },
    ],
}, { collection: 'nearby' });

const nearBySchma = mongoose.model('nearby', nearbyModel);
app.get('/ecoffees/nearby', async (req, res) => {
    const nearByData = await nearBySchma.find({});

    // Check if there is any data
    if (nearByData.length === 0) {
        // Send a message if there is no data
        res.status(200).send({ status: false, message: 'No data found', data: nearByData });
    } else {
        // Send the response with a status property
        res.status(200).send({ status: true, data: nearByData });
    }
});


//Special Cafe
const specialSchema = new mongoose.Schema({
    id: String,
    name: String,
    rate: String,
    review: String,
    distance: String,
    location: String,
    provide: [
        {
            id: String,
            name: String,
        },
    ],
}, { collection: 'special' });

const specialSchma = mongoose.model('special', specialSchema);

app.get('/ecoffees/specialcafe', async (req, res) => {
    // Retrieve the categories from the database
    const specialcafe = await specialSchma.find({});

    if (specialcafe.length === 0) {
        res.status(200).send({ status: false, message: 'No data found', data: specialcafe });
    } else {
        res.status(200).send({ status: true, data: specialcafe });
    }
});


//Favorite


const favoriteSchema = new mongoose.Schema(
    {
        fav: Boolean,
        usertoken: String,
        cafeid: String,
    },
    { collection: 'myfavorite', versionKey: false }
);


const favSchema = mongoose.model('favorite', favoriteSchema);

app.post('/ecoffees/favorite', async (req, res) => {
    try {
        const { fav, usertoken, cafeid } = req.body;

        if (!fav || !usertoken || !cafeid) {
            return res.status(400).json({
                message: 'Missing required parameters',
                status: false,
            });
        }

        const existedUser = await favSchema.findOne({ usertoken, cafeid });

        if (existedUser) {
            return res.status(400).json({
                message: 'Already favorite',
                status: false,
            });
        }

        const newUser = new favSchema({ fav, usertoken, cafeid });

        await newUser.save();

        res.status(200).json({
            message: 'Save favorite',
            status: true,
            data: newUser,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error Something want wrong.',
            status: false,
        });
    }
});

// My Favorite List API

app.get('/ecoffees/myfavoritelist', (req, res) => {
    const { usertoken } = req.headers;

    nearBySchma.findOne({ usertoken })
        .then(favorite => {
            if (favorite) {
                res.json(favorite);
            } else {
                res.status(404).json({ message: 'User token not found' });
            }
        })
        .catch(err => {
            res.status(500).json({ message: 'Internal server error' });
        });
});
