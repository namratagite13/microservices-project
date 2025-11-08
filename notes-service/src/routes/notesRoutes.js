
const express = require('express');
const {createNote, getNotes, getNoteById, updateNote, deleteNote} = require('../controller/notes-controller');
const {authMiddleware} = require('../middleware/authMiddleware')

const router = express.Router();


router.post('/create-note', authMiddleware, createNote);
router.get('/get-note', authMiddleware, getNotes);
router.get('/:id', authMiddleware, getNoteById);
router.post('/:id', authMiddleware, updateNote);
router.delete('/:id', authMiddleware, deleteNote);
module.exports = router;