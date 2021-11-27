const mongoose = require('mongoose');
const Paginate = require('mongoose-paginate');
const bcrypt = require('bcrypt');

const EmployeeSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    personal: {
        type: Object,
        required: true
    },
    professional: {
        type: Object,
        required: false
    },
    authorization: {
        type: Object,
        required: false
    },
    // soft delete flag
    is_active: {
        type: Boolean,
        default: true
    },
    // created by user id
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    // last updated by user id
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    // date & time of record creation
    created_date: {
        type: Date,
        required: true
    },
    // last date & time of record updation
    updated_date: {
        type: Date,
        default: Date.now,
        required: true
    }
});

// compare encrypted password with the password saved in db
EmployeeSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.authorization.password);
}

EmployeeSchema.plugin(Paginate);
const Employee = module.exports = mongoose.model('Employee', EmployeeSchema);