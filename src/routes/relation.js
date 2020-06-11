'use strict'

const express = require('express');
const router = express.Router();
const relation = require('../controllers/relation');
const RELATION_ADD_PATH = '/add';
const RELATION_ALL_PATH = '/getAll';
const RELATION_UPDATE_PATH = '/update';

router.post(RELATION_ADD_PATH, relation.add);
router.post(RELATION_ALL_PATH, relation.getAll);
router.post(RELATION_UPDATE_PATH, relation.update);

module.exports = router;
