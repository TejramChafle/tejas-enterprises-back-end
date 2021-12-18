
// Express
var express = require('express');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
// Models import
const Employee = require('../../models/Employee');
const Auth = require('../../models/Auth');

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
    Employee.findOne({ email: req.body.email, is_active: true }).populate('user').exec().then(async (user) => {

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
async function sendMail(resp, mailDetails) {
    // console.log({resp, mailDetails});
    // Registration mail 
    /* let mailDetails = {
        from: "tchafle24@gmail.com",
        to: user.email,
        subject: "Registration successful",
        text: "Hi " + user.name + "\nThank you for regestering Personal Manager V3. We welcome you onboard and happy to offer you the wide range of services.\n"
            + "For any queries, please feel free to write us. We would be happy to help you.\n"
            + "Thank you.\nRegards, Personal Manager V3\n2305, Silver Oak, Somewhere near road,\nPune\nIndia-411014."
    }; */

    const mailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "tchafle24@gmail.com",
            pass: "mailme240hr"
        }
    });
    // let testAccount = nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    /* let mailTransporter = nodemailer.createTransport({
        host: "mail.tejasenterprises.biz",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'admin@tejasenterprises.biz', // generated ethereal user
            pass: 'IamAdmin', // generated ethereal password
        },
    }); */

    // Sending Email 
    mailTransporter.sendMail(mailDetails,
        function (err, data) {
            console.log(err, data);
            if (err) {
                console.log("Failed to send an email with error : ", err);
                return resp.status(500).json({
                    message: 'Failed to sent mail for reset password.',
                    result: false
                });
            } else {
                console.log("Email sent successfully.");
                return resp.status(201).json({
                    message: 'Mail sent for reset password.',
                    result: true
                });
            }
        });
}

router.get('/send-reset-password-link', async (req, resp) => {
    // CHECK if the email is registered and account is active
    Employee.findOne({ 'authorization.username': req.query.email, is_active: true }).exec()
        .then(async (user) => {
            // Compare the password to match with the password saved in db
            if (user) {
                // generate reset password key with expiry and append to the reset password URL
                const salt = 10;
                const time = new Date();
                // Generate random token key for URL
                let key = await bcrypt.hash(time.toDateString(), salt);
                // Remove the $ from key and make it short to 20 chars
                key = key.toString().substring(8, 28).replace('/', '0');
                // Add 30 minute expiry time
                const expiry_time = time.setMinutes(time.getMinutes() + 30);

                // Save auth information
                const auth_data = {
                    email: req.query.email,
                    key: key,
                    expiry_time: expiry_time
                };
                let auth = new Auth(auth_data);
                auth._id = new mongoose.Types.ObjectId();
                auth.save().then(result => {
                    // console.log('result', result);
                })

                // reset password email 
                let mailDetails = {
                    from: "support@tejasenterprises.biz",
                    to: req.query.email,
                    subject: "Reset your Tejas Enterprises password",
                    text: "Hi,\n\nClick the link below to reset your password. If you did not request for your password to be reset, please email us at support@tejasenterprises.biz.\n"
                        + "https://tejasenterprises.biz/auth/reset-password/" + key + "\n\n"
                        + "For any queries, please feel free to write us. We would be happy to help you.\n"
                        + "Thank you.\n\nRegards, \nSupport Team\nTejas Enterprises\nhttps://tejasenterprises.biz\n"
                };
                return sendMail(resp, mailDetails);
            } else {
                return resp.status(201).json({
                    message: 'The provided email id is not registered with Tejas Enterprises.',
                    result: false
                });
            }
        })
        .catch(error => {
            console.log({ error });
            return resp.status(500).json({
                message: 'Oops! Something went wrong. Please try again after sometime.',
                result: false,
                error
            })
        });
});

module.exports = router;
