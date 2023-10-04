import request from "supertest";
import { app } from "../../app";
import { User } from "../../models/users";
import { SearchHistory } from "../../models/searchHistory";
import { SearchRecord } from "../../models/searchRecord";

it('search failed due to invalid parameter', async() => {
    const response = await request(app)
    .post('/api/search')
    .set('Cookie', await global.signin())
    .send({})
    .expect(400)
    expect(response.body.errors[0].message).toBe('Invalid query or tag');
})

it('search successfully', async() => {
    const tag = 'GPT'

    await request(app)
    .post('/api/search')
    .set('Cookie', await global.signin())
    .send({
        'query': 'cellphone',
        'tag': tag
    })
    .expect(200)

    const user = await User.findOne({ email: 'test@illinois.edu' })
    expect(user!.searchHistoryIds.length).toEqual(1)

    const searchHistory = await SearchHistory.findOne({ userId: user!.id })
    expect(searchHistory!.searchRecordIds.length).not.toEqual(0)

    const searchRecords = await SearchRecord.find({ searchHistoryId: searchHistory!.id })
    for(let searchRecord of searchRecords){
        expect(searchRecord.tag).toEqual(tag)
        expect(searchRecord.isRelevant).toEqual(false)
    }
})

it('change relevant failed due to invalid search record id', async() => {
    const tag = 'GPT'
    const user = await global.signin()

    await request(app)
    .post('/api/search')
    .set('Cookie', user)
    .send({
        'query': 'cellphone',
        'tag': tag
    })
    .expect(200)

    const response1 = await request(app)
    .post('/api/search/changeRelevant')
    .set('Cookie', user)
    .send({})
    .expect(400)
    expect(response1.body.errors[0].message).toBe('Invalid searchRecordId');

    const response2 = await request(app)
    .post('/api/search/changeRelevant')
    .set('Cookie', user)
    .send({
        SearchRecordId: '123'
    })
    .expect(400)
    expect(response2.body.errors[0].message).toBe('Invalid searchRecordId');
})

it('change relevant successfully', async() => {
    const tag = 'GPT'
    const user = await global.signin()

    const response = await request(app)
    .post('/api/search')
    .set('Cookie', user)
    .send({
        'query': 'cellphone',
        'tag': tag
    })
    .expect(200)

    const searchRecord = response.body[0];
    const searchRecordIsRelevant = searchRecord.isRelevant;
    await request(app)
    .post('/api/search/changeRelevant')
    .set('Cookie', user)
    .send({
        searchRecordId: searchRecord.id
    })
    .expect(200)
    const changedSearchRecord = await SearchRecord.findById(searchRecord.id)
    expect(searchRecordIsRelevant).toEqual(!changedSearchRecord)
})
