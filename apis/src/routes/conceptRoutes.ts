import express, { Request, Response } from 'express'
import { BadRequestError } from '../../../common/src/errors/bad-request-error';
import { requireAuth } from '../../../common/src/middlewares/require-auth';
import { validateRequest } from '../../../common/src/middlewares/validate-request';
import mongoose from 'mongoose';
import { Concept } from '../models/concept';

const router = express.Router();

// add new concepts
router.post('/api/concept/add', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { concepts } = req.body;

    if(!concepts || !Array.isArray(concepts)) {
        throw new BadRequestError('Invalid concept');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try{
        for(let i = 0; i < concepts.length; i++){
            const existingConcept = await Concept.findOne({ name: concepts[i] });
            if(!existingConcept){
                const concept = await Concept.build({
                    name: concepts[i],
                });
                await concept.save();   
            }
        }
        await session.commitTransaction();
        res.status(201).send({});
    } catch(err) {
        await session.abortTransaction();
        res.status(500).send('Error saving search history');
    } finally {
        await session.endSession();
    }
});

// get all concepts
router.get('/api/concept/getAll', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const concepts = await Concept.find({status: false});

    res.status(200).send(concepts);
});

// select concepts
// return the successfully selected concepts
router.post('/api/concept/select', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { concepts } = req.body;

    if(!concepts || !Array.isArray(concepts)) {
        throw new BadRequestError('Invalid concept');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try{
        let selectedConcepts = [];
        for(let i = 0; i < concepts.length; i++){
            // lock the document
            const existingConcept = await Concept.findOneAndUpdate({ 
                _id: concepts[i],
                status: false
             },{
                status: true,
                userId: req.currentUser!.id
             },
             {
                 new: true,
                 session
            });
            if(existingConcept){
                selectedConcepts.push(existingConcept);
            }
        }
        await session.commitTransaction();
        res.status(201).send({selectedConcepts});
    } catch(err) {
        await session.abortTransaction();
        res.status(500).send('Error selecting concepts');
    } finally {
        await session.endSession();
    }
});

// unselect concepts
router.post('/api/concept/unselect', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { concept } = req.body;

    if(!concept) {
        throw new BadRequestError('Invalid concept');
    }

    try{
        const releasedConcept = await Concept.findOneAndUpdate({ 
            _id: concept,
            status: true,
            userId: req.currentUser!.id
         },{
            status: false,
            userId: null
         },
         {
             new: true,
        });
        if(!releasedConcept){
            res.status(500).send('Concept not found');
        }
        res.status(201).send({releasedConcept});
    } catch(err) {
        res.status(500).send('Error unselecting concept');
    }
});

export { router as conceptRouter };

