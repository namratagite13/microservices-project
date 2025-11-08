
const mongoose  = require('mongoose')


const noteSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId, //12 byte ._id generation
        required: true,
        ref: 'User'
    },
    title:{
        type: String,
        required: [true, 'A note title is required'],
        trim: true,
        maxlength: 100
    },
    content:{
        type: String,
        required: [true, 'Note content cannot be empty.']
    },
    tags:{
        type: [String],
        default : []
    },
    category:{
        type: String,
        trim: true,
        maxlength: 50,
        default: 'General'
    },
    isArchived: {
        type :Boolean,
        default: false
    },
}, {
    timestamps: true
});

const Note = mongoose.model('Note', noteSchema);
module.exports = Note