const express = require('express');
const mongoose = require('mongoose');
const auth = require('../../auth');
const bcrypt = require('bcrypt');
const router = express.Router();
const authorization = require('./auth');
const Employee = require('../../models/Employee');

// GET EMPLOYEES (default active) WITH filter, sorting & pagination
router.get('/', auth, (req, resp) => {
    // console.log('req.query: ', req.query);
    let filter = {};
    filter.is_active = req.query.is_active || true;
    if (req.query.name) filter['personal.name'] = new RegExp('.*' + req.query.name + '.*', 'i');
    if (req.query.primary_phone) filter['professional.phone.primary'] = new RegExp('.*' + req.query.primary_phone + '.*', 'i');
    if (req.query.alternate_phone) filter['professional.phone.alternate'] = new RegExp('.*' + req.query.alternate_phone + '.*', 'i');
    if (req.query.email) filter['professional.email'] = new RegExp('.*' + req.query.email + '.*', 'i');
    if (req.query.city) filter['professional.area.city'] = new RegExp('.*' + req.query.city + '.*', 'i');
    if (req.query.gender) filter['personal.gender'] = req.query.gender;
    if (req.query.designation) filter['professional.designation'] = req.query.designation;
    if (req.query.supervisor) filter['professional.supervisor._id'] = req.query.supervisor;

    // console.log(filter);

    Employee.paginate(filter,
        {
            sort: { _id: req.query.sort_order },
            page: parseInt(req.query.page),
            limit: parseInt(req.query.limit)
        }, (error, result) => {
            console.log('error',error);
            // 500 : Internal Sever Error. The request was not completed. The server met an unexpected condition.
            if (error) return resp.status(500).json({
                error: error
            });
            return resp.status(200).json(result);
        });
});




// GET SINGLE EMPLOYEE BY ID
router.get('/:id', auth, (req, resp) => {
    Employee.findById(req.params.id).exec().then(employee => {
        return resp.status(200).json(employee);
    }).catch(error => {
        console.log('error : ', error);
        // 204 : No content. There is no content to send for this request, but the headers may be useful.
        return resp.status(204).json({
            error: error
        });
    });
});



// SAVE EMPLOYEE
router.post('/', auth, async (req, resp) => {
    // console.log({req});
    // First check if the conact with firstname, lastname and mobile number already exists.
    Employee.findOne({ 'personal.email': req.body.personal.email, is_active: true })
        .exec()
        .then(employee => {
            // If the employee with firstname, lastname and mobile number already exists, then return error
            if (employee) {
                // 409 : Conflict. The request could not be completed because of a conflict.
                return resp.status(409).json({
                    message: 'The employee with email ' + req.body.personal.email + ' already resistered in system.'
                });
            } else {
                // Since the user doesn't exist, then save the detail
                // console.log(req.body);
                const now = Date.now();

                bcrypt.hash(req.body.credentials.password, 10, (err, hashResult) => {
                    // console.log('result of hash', hashResult);
                    // Save employee information
                    const employee_data = {
                        personal: req.body.personal,
                        professional: req.body.professional,
                        authorization: {
                            ...req.body.credentials,
                            password: hashResult
                        },
                    };
                    let employee = new Employee(employee_data);
                    employee._id = new mongoose.Types.ObjectId();
                    employee.created_date = now;
                    employee.updated_date = now;
                    employee.created_by = req.body.created_by;
                    employee.updated_by = req.body.updated_by;
                    employee.save().then(employeeResult => {
                        // console.log('employeeResult', employeeResult);
                        // Registration mail 
                        const mailDetails = {
                            from: process.env.MAIL_SENDER_ID,
                            to: req.body.credentials.username,
                            subject: "Registration successful with Tejas Enterprises",
                            text: "Hi " + req.body.personal.firstName + ",\nYou have been registered with Tejas Enterprises as "
                                + req.body.professional.designation + ". We welcome you onboard.\n\n"
                                + "Please find the authentication detail to login to Tejas Enterprises software:\n"
                                + "URL: https://tejasenterprises.biz\n"
                                + "Username: " + req.body.credentials.username + "\n"
                                + "Password: " + req.body.credentials.password + "\n\n"
                                + "If should you change your password, please use forgot password process using above mentioned email id used for username.\n"
                                + "For any queries, please feel free to write us. We would be happy to help you.\n"
                                + "Thank you.\n\nRegards, \nSupport Team\nTejas Enterprises\nhttps://tejasenterprises.biz\n"
                        };
                        // Send registration mail
                        authorization.sendMail(resp, mailDetails);
                        return resp.status(201).json({
                            message: 'Employee created successfully.',
                            result: employeeResult
                        });
                    }).catch(error => {
                        console.log('error : ', error);
                        // 500 : Internal Sever Error. The request was not completed. The server met an unexpected condition.
                        return resp.status(500).json(error);
                    });
                });
            }
        }).catch(error => {
            console.log('error : ', error);
            // 500 : Internal Sever Error. The request was not completed. The server met an unexpected condition.
            return resp.status(500).json(error);
        });
});



// UPDATE EMPLOYEE
router.put('/:id', auth, (req, resp) => {
    /* Employee.findByIdAndUpdate(req.params.id, req.body).exec().then(employee => {
        return resp.status(200).json(employee);
    }).catch(error => {
        // 500 : Internal Sever Error. The request was not completed. The server met an unexpected condition.
        return resp.status(500).json(error);
    }); */

    const params = {
        personal: req.body.personal,
        professional: req.body.professional,
        updated_date: req.body.updated_date,
        updated_by: req.body.updated_by
    };
    Employee.findByIdAndUpdate(req.params.id, params).exec().then(employee => {
        return resp.status(200).json(employee);
    }).catch(error => {
        // 500 : Internal Sever Error. The request was not completed. The server met an unexpected condition.
        return resp.status(500).json(error);
    });
});



// DELETE EMPLOYEE (Hard delete. This will delete the entire employee detail. Only application admin should be allowed to perform this action )
router.delete('/:id', auth, (req, resp) => {
    Employee.findByIdAndRemove(req.params.id).exec().then(employee => {
        return resp.status(200).json(employee);
    }).catch(error => {
        console.log('error : ', error);
        // 500 : Internal Sever Error. The request was not completed. The server met an unexpected condition.
        return resp.status(500).json({
            error: error
        });
    });
});

module.exports = router;
