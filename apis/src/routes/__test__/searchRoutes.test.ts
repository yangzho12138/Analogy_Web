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
    const tag = 'Self-generated'
    const cookie = await global.signin();
    const concept = await global.selectConcept(cookie);
    console.log("concept", concept)

    await request(app)
    .post('/api/search')
    .set('Cookie', cookie)
    .send({
        'query': 'cellphone',
        'tag': tag,
        'concept': concept
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
    const tag = 'Self-generated'
    const cookie = await global.signin()
    const concept = await global.selectConcept(cookie);

    await request(app)
    .post('/api/search')
    .set('Cookie', cookie)
    .send({
        'query': 'cellphone',
        'tag': tag,
        'concept': concept
    })
    .expect(200)

    const response1 = await request(app)
    .post('/api/search/changeRelevant')
    .set('Cookie', cookie)
    .send({})
    .expect(400)
    expect(response1.body.errors[0].message).toBe('Invalid searchRecordId');

    const response2 = await request(app)
    .post('/api/search/changeRelevant')
    .set('Cookie', cookie)
    .send({
        SearchRecordId: '123'
    })
    .expect(400)
    expect(response2.body.errors[0].message).toBe('Invalid searchRecordId');
})
