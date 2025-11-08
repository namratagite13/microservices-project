

const Note = require('../models/Notes');
const logger = require('../utils/logger');

const createNote = async (req, res) => {
    try{
        const {title, content, category} = req.body;
        if(!title || !content){
            return res.status(400).json({
                success: false,
                message: "Please include both a title and content for the note."
            })
        }

        const newNote = new Note({
            user: req.userId,
            title,
            content,
            category: category || 'General'
        });

        const createdNote = await newNote.save();
        logger.info(`Note created by user ${req.userId}: ${createdNote._id}`)

        res.status(201).json({
            success: true,
            message: 'Note created successfully.',
            note: createdNote,
        });
    }catch(error){
        logger.error(`Error creating note for user ${req.userId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating notes'
        })

    }
};

const getNotes = async (req, res) =>{
    try{
        const userId = req.userId;
        const {category} = req.query; //get category filter

        let filter = {user: userId};

        if(category){
            filter.category = category;
        }

        const notes = await Note.find(filter).sort({createdAt: -1});

        res.status(200).json({
            success: true,
            count: notes.length,
            notes,
        });

    }catch(error){
        logger.error(`Error fetching notes for user ${req.userId}`, error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching notes.'
        })

    }
};


const getNoteById = async (req, res) =>{
    try{
        const note = await Note.findById(req.params.id);

        if(!note){
            return res.status(404).json({
                success: false,
                message: 'Note not found.'
            })
        };
        if(note.user.toString() !== req.userId.toString()){
            logger.warn(`Unauthorized access attempt on note ${req.params.id} by ${req.userId}`);
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this note.'
            })
        }
        res.status(200).json({
            success: true, note
        })

    }catch(error){
        if(error.name === 'CastError'){
            return res.status(404).json({
                success: false,
                message: 'Note not found with that ID.'
            })
        }
        logger.error(`Error fetching note ${req.param.id} for user ${req.userId}`, error);
        res.status(500).json({
            success:false,
            message: 'Server error while fetching note.'
        })

    }
};

const updateNote = async(req, res)=>{
    try{
        const {title, content, category} = req.body;

        const note = await Note.findById(req.params.id);
        if(!note){
            return res.status(404).json({
                success: false,
                message: "Note not found."
            })
        };

        //security check
        if(note.user.toString() !== req.userId.toString()){
            logger.warn(`Unauthorized update attempt on note ${req.params.id} by user ${req.userId}`);
            return res.status(403).json({
                success: 'Note authorized to update this note.'

            })
        };

        //update the field
        note.title = title || note.title;
        note.content = content || note.content;
        note.category = category || note.category;
        note.updatedAt = Date.now(); //updating timestamp

        const updatedNote = await note.save();
        logger.info(`Note updated by user ${req.userId} : ${updatedNote._id}`)

        res.status(200).json({
            success: true,
            message: true,
            message: 'Note updated successfully',
            note: updatedNote
        })

    }catch(error){
        if(error.name === 'CastError'){
            return res.status(404).json({
                success: false,
                message: 'Note not found with that id'
            })
        }
        logger.error(`Error updating note ${req.params.id} for user ${req.userId}`);
        res.status(500).json({
            success: false,
            message: 'Server error while updating note.'
        })

    }
};

const deleteNote = async (req, res)=>{
    try{
        const note = await Note.findById(req.params.id);

        if(!note){
            return res.status(404).json({
                success: false,
                message: 'Not authorized to delete this note.'
            })
        }

        //security check
        if(note.user.toString() !== req.userId.toString()){
            logger.warn(`Unauthorized delete attempt on note ${req.params.id} by user ${req.userId}`);
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this note.'
            });
        }
        await Note.deleteOne({_id: req.params.id});
        logger.info(`Note deleted by user ${req.userId} : ${req.params.id}`);

        res.status(200).json({
            success: true,
            message: 'Note removed successfully'
        })

    }catch(error){
        if(error.name == 'CastError'){
            return res.status(404).json({
                success: false,
                message: 'Note not found with that ID.'
            })
        }
        logger.error(`Error deleting note ${req.params.id} for user ${req.userId}`);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting note.'
        })

    }

};


module.exports = {
    createNote,
    getNotes,
    getNoteById,
    updateNote,
    deleteNote
    
}