const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

router.get('/',(req, res, next) => {
    User.find()
    .exec()
    .then(docs => {
        console.log(docs);
        res.status(200).json(docs)
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});
router.post('/signup',(req, res, next) => {
    User.find({$or:[{email: req.body.email},{username: req.body.username}]})
    .exec()
    .then(user => {
        if(user.length >= 1){
            return res.status(409).json({
                message: 'email address or username already exists'
            });
        } else {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if (err) {
                    return  res.json(500)({
                        error: err
                    });
                } else {
                    const user = new User({
                        _id: new mongoose.Types.ObjectId(),
                        name: req.body.name,
                        surname: req.body.surname,
                        username: req.body.username,
                        email: req.body.email,
                        password: hash
                    });
                    user
                    .save()
                    .then(result => {
                        console.log(result);
                        res.status(200).json({
                            message: 'User created',
                            createdUser: user
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({error: err});
                    });
                }
            });
        }
    })
});
router.post('/login',(req, res, next) => {
    User.find({$or:[{email: req.body.email},{username: req.body.username}]})
    .exec()
    .then(user => {
        if(user.length < 1){
            return res.status(401).json({
                message: 'Auth Failed'
            });
        }
        bcrypt.compare(req.body.password, user[0].password, (err, result) => {
            if(err){
                return res.status(401).json({
                    message: 'Auth Failed'
                });
            }
            if(result){
                const token = jwt.sign(
                {
                    email: user[0].email,
                    userId: user[0]._id
                },
                process.env.JWT_KEY,
                {
                    expiresIn: "1h"
                }
                );
                return res.status(200).json({
                    message: 'Auth succesful',
                    token: token
                });
            }
            res.status(401).json({
                message: 'Auth Failed'
            });
        });
    });
});
router.get('/:userId',(req, res, next) => { 
    const id = req.params.userId;
    User.findById(id)
    .exec()
    .then(doc => {
        console.log("From DB", doc);
        if(doc){
            res.status(200).json(doc);
        } else{
            res.status(404).json({message: "Not found in DB"});
        }
        
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });
});
router.patch('/:userId',(req, res, next) => {
    const id = req.params.userId;
    const updateOps = {};
    for(const ops of req.body){
        updateOps[ops.propName] = ops.value;
    }
    User.update({_id: id}, { $set: updateOps })
    .exec()
    .then(result => {
        console.log(result);
        res.status(200).json(result);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
        error: err
        });
    });
});
router.patch('/post/:userId',(req, res, next) => {
    User.updateOne(
        { _id: req.params.userId },
        { $push: { postCount: [req.body.post] } },
        function(err, result) {
          if (err) {
            res.send(err);
          } else {
            res.send(result);
          }
        }
      );
    // const id = req.params.userId;
    // const  = {};
    // for(const ops of req.body){
    //     updateOps[ops.propName] = ops.value;
    // }
    // User.update({_id: id}, { $set: updateOps })
    // .exec()
    // .then(result => {
    //     console.log(result);
    //     res.status(200).json(result);
    // })
    // .catch(err => {
    //     console.log(err);
    //     res.status(500).json({
    //     error: err
    //     });
    // });
});
router.delete('/:userId',(req, res, next) => {
    const id = req.params.userId;
    User.remove({_id: id})
    .exec()
    .then(result => {
        res.status(200).json(res);
    })
    .catch(err =>{
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

module.exports = router
