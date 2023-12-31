import express, { Request, Response } from 'express'
import { requireAuth, validateRequest, BadRequestError } from '@ticket_hub/common';
import mongoose from 'mongoose';
import { Concept } from '../models/concept';
import { SearchHistory } from '../models/searchHistory';
import fs from 'fs';
import readline from 'readline';

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

// read concepts through csv file
router.post('/api/concept/readCsv', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { csvFilePath } = req.body;

    const readStream = fs.createReadStream(csvFilePath);
    const rl = readline.createInterface({
        input: readStream,
        crlfDelay: Infinity
    });

    let jsonList : Array<string> = [];

    rl.on('line', (line) => {
        const firstWord = line.split(',')[0].trim();
        jsonList.push(firstWord);
    });

    rl.on('close', async() => {
        const json = JSON.stringify(jsonList);
        res.status(200).send(json);
    });
});

// get all concepts
router.get('/api/concept/getAll', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const concepts = await Concept.find({status: false});
    // console.log(concepts)
    res.status(200).send(concepts);
});

// select concepts
// return the successfully selected concepts
router.post('/api/concept/select', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { concept } = req.body;

    if(!concept) {
        throw new BadRequestError('Invalid concept');
    }

    // lock the document
    const existingConcept = await Concept.findOneAndUpdate({ 
        _id: concept,
        status: false
     },{
        status: true,
        userId: req.currentUser!.id
     },
     {
         new: true,
    });

    if(!existingConcept){
        return res.status(500).send('Concept not found or already selected');
    }

    res.status(200).send({existingConcept});
});

// unselect concepts
router.post('/api/concept/unselect', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { concept } = req.body;

    if(!concept) {
        throw new BadRequestError('Invalid concept');
    }

    try{
        const searchHistorySubmmitedIncludConcept = await SearchHistory.findOne({
            concept: concept,
            submitted: true
        });
        if(searchHistorySubmmitedIncludConcept && searchHistorySubmmitedIncludConcept.userId === req.currentUser!.id){
            return res.status(200).send('Concept included in submitted search history');
        }

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
        res.status(200).send({releasedConcept});
    } catch(err) {
        res.status(500).send('Error unselecting concept');
    }
});

// current user selected concept
router.get('/api/concept/getSelected', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const concept = await Concept.findOne({status: true, userId: req.currentUser!.id, submitted: false});
    if(!concept){
        return res.status(200).send({});
    }
    res.status(200).send(concept);
});

export { router as conceptRouter };

