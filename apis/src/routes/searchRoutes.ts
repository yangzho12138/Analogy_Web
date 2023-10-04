import express, { Request, Response } from 'express'
import { BadRequestError } from '../../../common/src/errors/bad-request-error';
import axios from 'axios';
import { SearchHistory } from '../models/searchHistory';
import { requireAuth } from '../../../common/src/middlewares/require-auth';
import { validateRequest } from '../../../common/src/middlewares/validate-request';
import { User } from '../models/users';
import { SearchRecord } from '../models/searchRecord';

const router = express.Router();
const BING_SEARCH_URL = 'https://api.bing.microsoft.com/v7.0/search';
const BING_SEARCH_RESULT_COUNT = 10;

router.post('/api/search', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { query, tag } = req.body;

    if(!query || !tag) {
        throw new BadRequestError('Invalid query or tag');
    }

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
        const user = await User.findById(req.currentUser!.id);

        const searchHistory = await SearchHistory.build({
            userId: req.currentUser!.id,
            tag: tag,
            searchRecordIds: []
        });
        await searchHistory.save();
        
        user!.searchHistoryIds.push(searchHistory.id);
        await user!.save();

        let searchResult = [];

        for(let i = 0; i < data.webPages.value.length; i++){
            const searchRecord = await SearchRecord.build({
                searchHistoryId: searchHistory.id,
                title: data.webPages.value[i].name,
                url: data.webPages.value[i].url,
                isRelevant: false,
                tag: tag
            });
            await searchRecord.save();
            searchHistory.searchRecordIds.push(searchRecord.id);
            await searchHistory.save();
            searchResult.push(searchRecord);
        }
        
        res.status(200).send(searchResult);
    }catch(err){
        res.status(500).send('Error querying Bing API');
    }
})

router.post('/api/search/changeRelevant', requireAuth, validateRequest, async (req: Request, res: Response) => {
    const { searchRecordId } = req.body;

    if(!searchRecordId) {
        throw new BadRequestError('Invalid searchRecordId');
    }

    const searchRecord = await SearchRecord.findById(searchRecordId);
    if(!searchRecord){
        throw new BadRequestError('Invalid searchRecordId');
    }

    searchRecord.isRelevant = !searchRecord.isRelevant;
    await searchRecord.save();

    res.status(200).send(searchRecord);
})

export { router as searchRouter };