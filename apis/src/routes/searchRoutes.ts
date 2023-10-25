import express, { Request, Response } from 'express'
import { BadRequestError } from '../../../common/src/errors/bad-request-error';
import axios from 'axios';
import { SearchHistory } from '../models/searchHistory';
import { SearchHistoryAttrs } from '../models/searchHistory';
import { TestCase } from '../models/testcases';
import { requireAuth } from '../../../common/src/middlewares/require-auth';
import { validateRequest } from '../../../common/src/middlewares/validate-request';
import { User } from '../models/users';
import { SearchRecord, SearchRecordAttrs } from '../models/searchRecord';
import { Concept } from '../models/concept';
import mongoose from 'mongoose';
import fs from 'fs';
import readline from 'readline';

const router = express.Router();
const BING_SEARCH_URL = 'https://api.bing.microsoft.com/v7.0/search';
const BING_SEARCH_RESULT_COUNT = 10;

const TAG_TYPE_NUMBER = 3;

async function fetchBingAPI(query : string){
    try{
        const { data } = await axios.get(BING_SEARCH_URL, {
            headers: {
                'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY
            },
            params: {
                q: query,
                count: BING_SEARCH_RESULT_COUNT
            }
        });
        return data;
    }catch(err){
        throw new Error('Error querying Bing API');
    }
}

// use bing api to search for query
router.post('/api/search', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { query, tag, concept } = req.body;

    if(!query || !tag) {
        throw new BadRequestError('Invalid query or tag');
    }

    if(concept){
        const choosenConcept = await Concept.findOne({ _id: concept });
        if(!choosenConcept || !choosenConcept.status || choosenConcept.userId !== req.currentUser!.id){
            throw new BadRequestError('Invalid concept');
        }
    }

    let data = await fetchBingAPI(query);

    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        const user = await User.findById(req.currentUser!.id);
        const searchHistory = await SearchHistory.build({
            userId: req.currentUser!.id,
            searchKeyword: query,
            tag: tag,
            concept: concept,
            searchRecordIds: []
        });
            
        user!.searchHistoryIds.push(searchHistory.id);
    
        let searchResult = [];
    
        for(let i = 0; i < data.webPages.value.length; i++){
            const searchRecord = await SearchRecord.build({
                searchHistoryId: searchHistory.id,
                url: data.webPages.value[i].url,
                isRelevant: 0,
                tag: tag
            });
            await searchRecord.save({ session });
            searchHistory.searchRecordIds.push(searchRecord.id);
            searchResult.push(searchRecord);
        }

        // TODO: inject test cases
        // randomly choose 2 test cases (type1: no clear labels)
        for(let i = 0; i < 2; i++){
            const testCases = await TestCase.find({
                userIds: {
                    $nin: req.currentUser!.id
                },
                labeled: false
            });
            if(testCases.length === 0){
                break;
            }
            const randomTestCase = testCases[Math.floor(Math.random() * testCases.length)];
            const searchRecord = await SearchRecord.build({
                searchHistoryId: searchHistory.id,
                url: randomTestCase.url,
                isRelevant: 0,
                tag: tag
            });
            await searchRecord.save({ session });
            searchHistory.searchRecordIds.push(searchRecord.id);
            searchResult.push(searchRecord);
        }
        // randomly choose 1 test case (type2: with clear labels)
        const testCases = await TestCase.find({
            userIds: {
                $nin: req.currentUser!.id
            },
            labeled: true
        });
        if(testCases.length !== 0){
            const randomTestCase = testCases[Math.floor(Math.random() * testCases.length)];
            const searchRecord = await SearchRecord.build({
                searchHistoryId: searchHistory.id,
                url: randomTestCase.url,
                isRelevant: 0,
                tag: tag
            });
            searchRecord.isPreSet = true;
            searchRecord.preSetVal = randomTestCase.label;
            await searchRecord.save({ session });
            searchHistory.searchRecordIds.push(searchRecord.id);
            searchResult.push(searchRecord);
        }
    
        await searchHistory.save({ session });
        await user!.save({ session });

        await session.commitTransaction();
            
        res.status(200).send(searchResult);
    } catch(err){
        await session.abortTransaction();
        res.status(500).send('Error saving search history');
    } finally{
        await session.endSession();
    }
})

// get all search history for a user
router.get('/api/search/getAllSearchHistory', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const searchHistories = await SearchHistory.find({
        userId: req.currentUser!.id
    });

    const groupedByConceptName: Record<string, SearchHistoryAttrs[]> = {};
    for(let i = 0; i < searchHistories.length; i++){
        const searchHistory = searchHistories[i];
        const concept = await Concept.findOne({ _id: searchHistory.concept });
        if(!concept){
            throw new Error('No concept found');
        }
        if(!groupedByConceptName[concept.name]){
            groupedByConceptName[concept.name] = [searchHistory];
        } else{
            groupedByConceptName[concept.name].push(searchHistory);
        }
    }

    res.status(200).send(groupedByConceptName);
})

interface SearchHistoryDetail {
    searchRecords: SearchRecordAttrs[];
    submitted: boolean;
}

// show a specific search history for a user
router.get('/api/search/getSearchHistoryDetail', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { searchHistoryId } = req.body;

    if(!searchHistoryId) {
        throw new BadRequestError('Invalid search history id');
    }

    const searchHistory = await SearchHistory.findById(searchHistoryId);
    if(!searchHistory || searchHistory.userId !== req.currentUser!.id){
        throw new BadRequestError('Invalid search history id');
    }

    const searchRecords = await SearchRecord.find({
        _id: {
            $in: searchHistory.searchRecordIds
        }
    });

    const searchHistoryDetail : SearchHistoryDetail = {} as SearchHistoryDetail;
    searchHistoryDetail.searchRecords = searchRecords;
    searchHistoryDetail.submitted = searchHistory.submitted;

    res.status(200).send(searchHistoryDetail);
})

// save search history for a user
// allow to change isRelevant, relevantContent and tag
// TODO: check whether test cases are valid
router.post('/api/search/saveSearchHistory', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { searchRecords } = req.body;

    if(!searchRecords || !Array.isArray(searchRecords)) {
        throw new BadRequestError('Invalid search history');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try{
        for(let i = 0; i < searchRecords.length; i++){
            const searchRecord = await SearchRecord.findById(searchRecords[i].id);
            if(!searchRecord){
                throw new Error('No search record found');
            }
            // check all search records are finished and the test cases is finished correctly
            if(searchRecord.isPreSet && (searchRecord.preSetVal === true && searchRecords[i].isRelevant === 2 || searchRecord.preSetVal === false && searchRecords[i].isRelevant !== 2) || searchRecords[i].isRelevant === 0){
                const user = await User.findById(req.currentUser!.id);
                user!.failedAttempts++;
                if(user!.failedAttempts >= 3){
                    throw new Error('You wasted all attempts, please contact the TA');
                }else{
                    await user!.save();
                    throw new Error('Please make sure you finished all parts carefully, you have ' + (3 - user!.failedAttempts) + ' attempts left');
                }
            }
            searchRecord.isRelevant = searchRecords[i].isRelevant;
            searchRecord.tag = searchRecords[i].tag;
            await searchRecord.save({ session });
        }
        await session.commitTransaction();

        res.status(200).send('Search records saved');
    } catch(err){
        await session.abortTransaction();
        if (err instanceof Error) {
            res.status(500).send(err.message);
        } else {
            res.status(500).send('An unexpected error occurred');
        }
    } finally{
        await session.endSession();
    }
})

// submit search histories of a concept for a user
router.post('/api/search/submitSearchHistory', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { conceptId } = req.body;

    if(!conceptId) {
        throw new BadRequestError('Invalid concept id');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try{
        const concept = await Concept.findOne({ _id: conceptId });
        if(!concept || !concept.status || concept.userId !== req.currentUser!.id || concept.submitted){
            throw new Error('Search history submit failed, this concept not be selected by the user or already be submitted');
        }
        concept.submitted = true;
        await concept.save({ session });
        const tags = new Set();
        const searchHistoryIds = await SearchHistory.find({
            concept: conceptId,
            userId: req.currentUser!.id
        }).distinct('_id');
        for(let i = 0; i < searchHistoryIds.length; i++){
            const searchHistory = await SearchHistory.findById(searchHistoryIds[i]);
            // check whether search history is valid
            if(!searchHistory || searchHistory.userId !== req.currentUser!.id || searchHistory.submitted){
                throw new Error('Search history submit failed, some search histories is invalid or already submitted');
            }
            // if(searchHistory.concept){
            //     const concept = await Concept.findOne({ _id: searchHistory.concept });
            //     if(!concept || !concept.status || concept.userId !== req.currentUser!.id){
            //         throw new Error('Search history submit failed, this concept not be selected by the user');
            //     }
            // }
            // check each search record isRelevant changed
            // const searchRecords = await SearchRecord.find({
            //     _id: {
            //         $in: searchHistory.searchRecordIds
            //     }
            // });
            // for(let j = 0; j < searchRecords.length; j++){
            //     if(searchRecords[j].isRelevant === 0){
            //         throw new Error('Search history submit failed, please make sure you have marked all search records');
            //     }
            // }
            // check there are 3 types of tags
            tags.add(searchHistory.tag);
            searchHistory.submitted = true;
            await searchHistory.save({ session });
        }
        if(tags.size !== TAG_TYPE_NUMBER){
            throw new Error('Search history submit failed, please make sure you have finished 3 different types (tags) of queries');
        }
        await session.commitTransaction();
        res.status(200).send('Search history submitted');
    } catch(err){
        await session.abortTransaction();
        if (err instanceof Error) {
            res.status(500).send(err.message);
        } else {
            res.status(500).send('An unexpected error occurred');
        }
    } finally{
        await session.endSession();
    }
})

interface SearchRecordInfo {
    id: string;
    concept: string;
    query: string;
    title: string;
    url: string;
    isRelevant: number;
    tag: string;
}

// get info of a search record (copy board)
router.get('/api/search/getSearchRecordInfo', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { searchRecordId } = req.body;

    if(!searchRecordId) {
        throw new BadRequestError('Invalid search record id');
    }

    const searchRecordInfo : SearchRecordInfo = {} as SearchRecordInfo;
    const searchRecord = await SearchRecord.findById(searchRecordId);
    if(!searchRecord){
        throw new BadRequestError('Invalid search record id');
    }
    searchRecordInfo.id = searchRecord.id;
    searchRecordInfo.isRelevant = searchRecord.isRelevant;
    searchRecordInfo.tag = searchRecord.tag;
    searchRecordInfo.url = searchRecord.url;

    const searchHistory = await SearchHistory.findById(searchRecord.searchHistoryId);
    if(!searchHistory){
        throw new BadRequestError('Invalid search record id');
    }
    searchRecordInfo.query = searchHistory.searchKeyword;

    const concept = await Concept.findById(searchHistory.concept);
    if(!concept){
        throw new BadRequestError('Invalid search record id');
    }
    searchRecordInfo.concept = concept.name;

    res.status(200).send(searchRecordInfo);
})

// chunk the big data file into small chunks
function chunkArray<T>(originalArray: T[], chunkSize: number): T[][] {
    let chunks: T[][] = [];

    let index = 0;

    while (index < originalArray.length) {
        chunks.push(originalArray.slice(index, index + chunkSize));
        index += chunkSize;
    }

    return chunks;
}


// insert test cases - type1: no clear labels / type2: with clear labels
router.post('/api/search/insertTestCases', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { filePath, type } = req.body;
    if(!filePath || !type) {
        throw new BadRequestError('Invalid file path');
    }
    const readStream = fs.createReadStream(filePath);
  
    // Handle file not found
    readStream.on('error', (err) => {
        return res.status(404).json({ message: 'File not found' });
    });

    const reader = readline.createInterface({
        input: readStream,
        crlfDelay: Infinity,
    });

    const data: any[] = [];

    reader.on('line', (line: string) => {
        try {
        const jsonLine = JSON.parse(line);
        data.push(jsonLine);
        } catch (err) {
            console.error('Failed to parse JSON line:', err);
            return res.status(500).json({ message: 'Failed to parse file line' });
        }
    });

    reader.on('close', async () => {
        const session = await mongoose.startSession();
        try{
            // file is too big, need to chunk, or the transaction session will timeout
            const chunks = chunkArray(data, 100);
            for(const chunk of chunks){
                session.startTransaction();
                for(let i = 0; i < chunk.length; i++){
                    const testCase = await TestCase.build({
                        url: chunk[i].url
                    });
                    if(type === '2'){
                        testCase.labeled = true;
                        testCase.label = chunk[i].label;
                    }
                    await testCase.save({ session });
                }
                await session.commitTransaction();
            }
        } catch(err){
            await session.abortTransaction();
            console.error('Failed to save test cases:', err);
            return res.status(500).json({ message: 'Error saving test cases' });
        } finally{
            await session.endSession();
        }
        return res.json(data);
    });
})

export { router as searchRouter };