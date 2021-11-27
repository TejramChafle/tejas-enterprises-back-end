const mongoose = require('mongoose');
const Paginate = require('mongoose-paginate');

const SurveySchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    surveyor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: false
    },
    property: {
        type: Object,
        required: false
    },
    water: {
        type: Object,
        required: false
    },
    solar: {
        type: Object,
        required: false
    },
    engineer: {
        type: Object,
        required: false
    },
    plumber: {
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
        required: false
    },
    // last updated by user id
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: false
    },
    // date & time of record creation
    created_date: {
        type: Date,
        required: false
    },
    // last date & time of record updation
    updated_date: {
        type: Date,
        default: Date.now,
        required: false
    }
});

SurveySchema.plugin(Paginate);
const Survey = module.exports = mongoose.model('Survey', SurveySchema);