'use strict'

const express = require('express');
const router = express.Router();
const memberData = require('../controllers/memberData');

const LIST_PATH = '/list';
const GET_PATH = '/get';
const ADD_PATH = '/add';
const UPDATE_PATH = '/updatde';
const DELETE_PATH = '/delete';

router.get(GET_PATH, memberData.findOne);
router.get(LIST_PATH, memberData.find);
router.post(ADD_PATH, memberData.addOne);
router.put(UPDATE_PATH, memberData.updateOne);
router.delete(DELETE_PATH, memberData.deleteOne);

module.exports = router;
