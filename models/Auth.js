const mongoose = require('mongoose');

const AuthSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    // User email id
    email: {
        type: String,
        required: true
    },
    // key to validate the user 
    key: {
        type: String,
        required: true
    },
    // Time to validate password request, after this saved time, user should not be allowed to reset password
    expiry_time: {
        type: Date,
        required: true
    }
});
module.exports = mongoose.model('Auth', AuthSchema);