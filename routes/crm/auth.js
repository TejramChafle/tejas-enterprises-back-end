
// Express
var express = require('express');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');

// Models import
const Employee = require('../../models/Employee');

// Router
var router = express.Router();


/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     description: login to application with email and password
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: credentials
 *         description: credentials include email & password
 *         in: body
 *         required: true
 *     responses:
 *       200:
 *         description: Successfully authenticated
 */
// USER LOGIN
router.post("/login", async (req, resp) => {
    console.log('req.body : ', req.body);

    // CHECK if the email & password matches with the password present in db
    Employee.findOne({ 'authorization.username': req.body.username, is_active: true }).exec().then(async (user) => {
        console.log('user) found : ', user);
        // Compare the password to match with the password saved in db
        if (!await user.comparePassword(req.body.password)) {
            // 401: Unauthorized. Authentication failed to due mismatch in credentials.
            resp.status(401).json({
                message: 'Authentication failed. Your email or password is incorrect!'
            });
        } else {
            // GENERATE jwt token with the expiry time
            const token = jwt.sign({ username: req.body.username, id: user._id }, process.env.JWT_ACCESS_KEY, { expiresIn: "24h" });

            resp.status(201).json({
                user: user,
                token: token
            });
        }
    }).catch(error => {
        console.log('Login error :', error);
        resp.status(401).json({
            message: 'Authentication failed. Your email address or password is incorrect!'
        });
    });
});

// USER SIGNUP
router.post("/signup", async (req, resp) => {

    console.log('User : ', User);
    console.log('req.body : ', req.body);

    // CHECK if the email & password matches with the password present in db
    User.findOne({ email: req.body.email, is_active: true }).populate('user').exec().then(async (user) => {

        console.log('user found : ', user);

        // Compare the password to match with the password saved in db
        if (user) {
            // 401: Unauthorized. Authentication failed to due mismatch in credentials.
            resp.status(409).json({
                message: 'Email id is already in use. Please login with the provided email!'
            });
        } else {
            // Since the user doesn't exist, then save the detail
            console.log(req.body);
            let user = new User(req.body);
            user._id = new mongoose.Types.ObjectId(),
                user.created_date = Date.now(),
                user.updated_date = Date.now();
            bcrypt.hash(user.password, 10, (err, result) => {
                console.log('result of hash', result);
                user.password = result;
                user.save().then(registeredUser => {
                    console.log(registeredUser);

                    // Send registration successful mail
                    sendMail(registeredUser);

                    // GENERATE jwt token with the expiry time
                    const token = jwt.sign({ email: registeredUser.email, id: registeredUser._id }, process.env.JWT_ACCESS_KEY, { expiresIn: "24h" });

                    return resp.status(201).json({
                        message: 'User account created successfully.',
                        user: {
                            id: registeredUser._id,
                            email: registeredUser.email,
                            name: registeredUser.name,
                            devices: registeredUser.devices
                        },
                        token: token
                    });
                }).catch(error => {
                    console.log('error : ', error);
                    // 500 : Internal Sever Error. The request was not completed. The server met an unexpected condition.
                    // return resp.status(500).json(error);
                });
            });
        }
    }).catch(error => {
        console.log('signup error :', error);
        resp.status(401).json({
            message: 'User registration failed.',
            error: error
        });
    });
});

// Send Mail function using Nodemailer 
async function sendMail(user) {
    /* let mailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "info@wizbee.co.in",
            pass: "working@24"
        }
    }); */

    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let mailTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });

    // Setting credentials 
    let mailDetails = {
        from: "contact@hmtrading.biz",
        to: user.email,
        subject: "Registration successful",
        text: "Hi " + user.name + "\nThank you for regestering Personal Manager V3. We welcome you onboard and happy to offer you the wide range of services.\n"
            + "For any queries, please feel free to write us. We would be happy to help you.\n"
            + "Thank you.\nRegards, Personal Manager V3\n2305, Silver Oak, Somewhere near road,\nPune\nIndia-411014."
    };


    // Sending Email 
    mailTransporter.sendMail(mailDetails,
        function (err, data) {
            if (err) {
                console.log("Failed to send an email with error : ", err);
            } else {
                console.log('Sent signup email result : ', data);
                console.log("Email sent successfully.");
            }
        });
}

module.exports = router;
