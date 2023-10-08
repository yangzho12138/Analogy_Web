import express, { Request, Response } from 'express'
import { BadRequestError } from '../../../common/src/errors/bad-request-error';
import axios from 'axios';
import { SearchHistory } from '../models/searchHistory';
import { requireAuth } from '../../../common/src/middlewares/require-auth';
import { validateRequest } from '../../../common/src/middlewares/validate-request';
import { User } from '../models/users';
import { SearchRecord } from '../models/searchRecord';
import mongoose from 'mongoose';

const router = express.Router();
const BING_SEARCH_URL = 'https://api.bing.microsoft.com/v7.0/search';
const BING_SEARCH_RESULT_COUNT = 10;

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
    const { query, tag } = req.body;

    if(!query || !tag) {
        throw new BadRequestError('Invalid query or tag');
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
            searchRecordIds: []
        });
            
        user!.searchHistoryIds.push(searchHistory.id);
    
        let searchResult = [];
    
        for(let i = 0; i < data.webPages.value.length; i++){
            const searchRecord = await SearchRecord.build({
                searchHistoryId: searchHistory.id,
                title: data.webPages.value[i].name,
                url: data.webPages.value[i].url,
                isRelevant: 0,
                tag: tag
            });
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
    const searchHistory = await SearchHistory.find({
        userId: req.currentUser!.id
    });

    res.status(200).send(searchHistory);
})

// show a specific search history for a user
router.get('/api/search/getSearchHistoryDetail', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { searchHistoryId } = req.body;

    if(!searchHistoryId) {
        throw new BadRequestError('Invalid search history id');
    }

    const searchHistory = await SearchHistory.findById(searchHistoryId);
    if(!searchHistory){
        throw new BadRequestError('Invalid search history id');
    }

    const searchRecords = await SearchRecord.find({
        _id: {
            $in: searchHistory.searchRecordIds
        }
    });

    res.status(200).send(searchRecords);
})

// save search history for a user
// allow to change isRelevant and tag
router.post('/api/search/saveSearchHistory', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { searchRecords } = req.body;

    if(!searchRecords) {
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
            searchRecord.isRelevant = searchRecords[i].isRelevant;
            searchRecord.tag = searchRecords[i].tag;
            await searchRecord.save({ session });
        }
        await session.commitTransaction();

        res.status(200).send('Search records saved');
    } catch(err){
        await session.abortTransaction();
        res.status(500).send('Error saving search history');
    } finally{
        await session.endSession();
    }
})



export { router as searchRouter };