import request from "supertest";
import { app } from "../../app";
import { User } from "../../models/users";
import { SearchHistory } from "../../models/searchHistory";
import { SearchRecord } from "../../models/searchRecord";
import { Concept } from "../../models/concept";

it('search failed due to invalid parameter', async() => {
    const response = await request(app)
    .post('/api/search')
    .set('Cookie', await global.signin())
    .send({})
    .expect(400)
    expect(response.body.errors[0].message).toBe('Invalid query or tag');
})

it('search failed due to incomplete parameter', async() => {
    const tag = 'Chat-GPT query'
    const cookie = await global.signin()
    const concept = await global.selectConcept(cookie);
    await global.setTestcase(cookie);

    const response = await request(app)
    .post('/api/search')
    .set('Cookie', cookie)
    .send({
        'query': 'cellphone',
        'tag': tag,
        'concept': concept
    })
    .expect(400)
    expect(response.body.errors[0].message).toBe('You must enter the gpt link for non self-generated query');
})

it('search failed due to invalid concept', async() => {
    const tag = 'Self-generated'
    const cookie = await global.signin()
    await global.setTestcase(cookie);

    const response = await request(app)
    .post('/api/search')
    .set('Cookie', cookie)
    .send({
        'query': 'cellphone',
        'tag': tag,
        'concept': "65533a03ad008eace6ebb913" // invalid concept
    })
    .expect(400)
    expect(response.body.errors[0].message).toBe('Invalid concept');
})

const doSearch = async(selectedTag : string, cookie : string[], concept: string) => {
    const tag = selectedTag
    await global.setTestcase(cookie);

    const response = await request(app)
    .post('/api/search')
    .set('Cookie', cookie)
    .send({
        'query': 'cellphone',
        'tag': tag,
        'concept': concept,
        'link': 'https://www.google.com'
    })

    return response.body;
}

it('search successfully', async() => {
    const tag = 'Self-generated'
    const cookie = await global.signin();
    const concept = await global.selectConcept(cookie);
    await global.setTestcase(cookie);

    await request(app)
    .post('/api/search')
    .set('Cookie', cookie)
    .send({
        'query': 'cellphone',
        'tag': tag,
        'concept': concept,

    })
    .expect(200)

    // get data from bing api (expect 3 test cases)
    const searchRecords = await SearchRecord.find({  })
    expect(searchRecords.length > 3).toBe(true)

    // search records include test cases
    expect(searchRecords.filter(record => record.url === 'test_with_label').length === 1).toBeTruthy();
    expect(searchRecords.filter(record => record.url.includes('without_label')).length === 2).toBeTruthy();
})

// save search history
it("save search history successfully", async () => {
    const tag = "Chat-GPT query";
    const cookie = await global.signin();
    const concept = await global.selectConcept(cookie);
    await global.setTestcase(cookie);

    const data = await doSearch(tag, cookie, concept);

    // change the relevant field
    for (let i = 0; i < data.length; i++) {
        data[i].isRelevant = 2;
    }

    // save search history
    await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data,
        query: "cellphone",
        tag: tag,
        concept: concept,
        link: "https://www.google.com",
    })
    .expect(200);

    // check the search history
    const searchHistory = await SearchHistory.find({  });
    expect(searchHistory.length).toBe(1);
    expect(searchHistory[0].searchKeyword).toBe("cellphone");
    expect(searchHistory[0].tag).toBe(tag);
    expect(searchHistory[0].concept).toBe(concept);
    expect(searchHistory[0].link).toBe("https://www.google.com");
    for (let i = 0; i < searchHistory[0].searchRecordIds.length; i++) {
        expect(searchHistory[0].searchRecordIds[i]).toEqual(data[i].id);
    }
});

it("save search history failed due to incorrect answer for pre-set test case", async () => {
    const tag = "Chat-GPT query";
    const cookie = await global.signin();
    const concept = await global.selectConcept(cookie);
    await global.setTestcase(cookie);

    const data = await doSearch(tag, cookie, concept);

    // do not finish all records
    const response1 = await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data,
        query: "cellphone",
        tag: tag,
        concept: concept,
        link: "https://www.google.com",
    })
    .expect(500);

    expect(response1.text).toBe("Please make sure you finished all parts carefully, you have 49 attempts left");

    // check the search history
    const searchHistory1 = await SearchHistory.find({  });
    expect(searchHistory1.length).toBe(0);

    // wrong answer for pre-set test case
    for (let i = 0; i < data.length; i++) {
        data[i].isRelevant = 1;
    }

    // save search history
    const response2 = await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data,
        query: "cellphone",
        tag: tag,
        concept: concept,
        link: "https://www.google.com",
    })
    .expect(500);

    expect(response2.text).toBe("Please make sure you finished all parts carefully, you have 48 attempts left");

    // check the search history
    const searchHistory2 = await SearchHistory.find({  });
    expect(searchHistory2.length).toBe(0);
});

it("wasted all search history save chances", async () => {
    const tag = "Chat-GPT query";
    const cookie = await global.signin();
    const concept = await global.selectConcept(cookie);
    await global.setTestcase(cookie);

    const data = await doSearch(tag, cookie, concept);

    for(let i = 0; i < 50; i++){
        await request(app)
        .post("/api/search/saveSearchHistory")
        .set("Cookie", cookie)
        .send({
            searchRecords: data,
            query: "cellphone",
            tag: tag,
            concept: concept,
            link: "https://www.google.com",
        })
        .expect(500);
    }

    const response = await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data,
        query: "cellphone",
        tag: tag,
        concept: concept,
        link: "https://www.google.com",
    })
    .expect(500);

    expect(response.text).toBe("You wasted all attempts, please contact the TA");
});

// submit search history
it("submit search history successfully", async () => {
    const cookie = await global.signin();
    const concept = await global.selectConcept(cookie);
    await global.setTestcase(cookie);

    const data1 = await doSearch("Self-generated", cookie, concept);
    for (let i = 0; i < data1.length; i++) {
        data1[i].isRelevant = 2;
    }
    await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data1,
        query: "cellphone",
        tag: "Self-generated",
        concept: concept,
    })
    .expect(200);

    const data2 = await doSearch("Chat-GPT query", cookie, concept);
    for (let i = 0; i < data2.length; i++) {
        data2[i].isRelevant = 2;
    }
    await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data2,
        query: "cellphone",
        tag: "Chat-GPT query",
        concept: concept,
        link: "https://www.google.com"
    })
    .expect(200);

    const data3 = await doSearch("Chat-GPT analogy", cookie, concept);
    for (let i = 0; i < data3.length; i++) {
        data3[i].isRelevant = 2;
    }
    await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data3,
        query: "cellphone",
        tag: "Chat-GPT analogy",
        concept: concept,
        link: "https://www.google.com"
    })
    .expect(200);

    // submit search history
    const response = await request(app)
    .post("/api/search/submitSearchHistory")
    .set("Cookie", cookie)
    .send({
        conceptId: concept,
    })
    .expect(200);

    expect(response.text).toBe("Search history submitted");

    // check the search history
    const searchHistory = await SearchHistory.find({  });
    expect(searchHistory.length).toBe(3);
    for (let i = 0; i < searchHistory.length; i++) {
        expect(searchHistory[i].submitted).toBe(true);
    }

    const submittedConcept = await Concept.findById(concept);
    expect(submittedConcept!.status).toBe(true);
    expect(submittedConcept!.submitted).toBe(true);
});

it("submit search history failed due to not finishing all 3 type searches", async () => {
    const cookie = await global.signin();
    const concept = await global.selectConcept(cookie);
    await global.setTestcase(cookie);

    const data1 = await doSearch("Self-generated", cookie, concept);
    for (let i = 0; i < data1.length; i++) {
        data1[i].isRelevant = 2;
    }
    await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data1,
        query: "cellphone",
        tag: "Self-generated",
        concept: concept,
    })
    .expect(200);

    const data2 = await doSearch("Chat-GPT query", cookie, concept);
    for (let i = 0; i < data2.length; i++) {
        data2[i].isRelevant = 2;
    }
    await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data2,
        query: "cellphone",
        tag: "Chat-GPT query",
        concept: concept,
        link: "https://www.google.com"
    })
    .expect(200);

    // submit search history
    const response = await request(app)
    .post("/api/search/submitSearchHistory")
    .set("Cookie", cookie)
    .send({
        conceptId: concept,
    })
    .expect(500);

    expect(response.text).toBe("Search history submit failed, please make sure you have finished 3 different types (tags) of queries");

    // check the search history
    const searchHistory = await SearchHistory.find({  });
    expect(searchHistory.length).toBe(2);

    const submittedConcept = await Concept.findById(concept);
    expect(submittedConcept!.submitted).toBe(false);
});

it("submit search history failed because the search history already be submitted", async () => {
    const cookie = await global.signin();
    const concept = await global.selectConcept(cookie);
    await global.setTestcase(cookie);

    const data1 = await doSearch("Self-generated", cookie, concept);
    for (let i = 0; i < data1.length; i++) {
        data1[i].isRelevant = 2;
    }
    await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data1,
        query: "cellphone",
        tag: "Self-generated",
        concept: concept,
    })
    .expect(200);

    const data2 = await doSearch("Chat-GPT query", cookie, concept);
    for (let i = 0; i < data2.length; i++) {
        data2[i].isRelevant = 2;
    }
    await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data2,
        query: "cellphone",
        tag: "Chat-GPT query",
        concept: concept,
        link: "https://www.google.com"
    })
    .expect(200);

    const data3 = await doSearch("Chat-GPT analogy", cookie, concept);
    for (let i = 0; i < data3.length; i++) {
        data3[i].isRelevant = 2;
    }
    await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data3,
        query: "cellphone",
        tag: "Chat-GPT analogy",
        concept: concept,
        link: "https://www.google.com"
    })
    .expect(200);

    // submit search history
    const response1 = await request(app)
    .post("/api/search/submitSearchHistory")
    .set("Cookie", cookie)
    .send({
        conceptId: concept,
    })
    .expect(200);

    expect(response1.text).toBe("Search history submitted");

    // submit again
    const response2 = await request(app)
    .post("/api/search/submitSearchHistory")
    .set("Cookie", cookie)
    .send({
        conceptId: concept,
    })
    .expect(500);

    expect(response2.text).toBe("Search history submit failed, this concept not be selected by the user or already be submitted");
});

it("submit search history failed because the user did not select the concept", async () => {
    const cookie = await global.signin();
    const concept = await global.selectConcept(cookie);
    await global.setTestcase(cookie);

    const data1 = await doSearch("Self-generated", cookie, concept);
    for (let i = 0; i < data1.length; i++) {
        data1[i].isRelevant = 2;
    }
    await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data1,
        query: "cellphone",
        tag: "Self-generated",
        concept: concept,
    })
    .expect(200);

    const data2 = await doSearch("Chat-GPT query", cookie, concept);
    for (let i = 0; i < data2.length; i++) {
        data2[i].isRelevant = 2;
    }
    await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data2,
        query: "cellphone",
        tag: "Chat-GPT query",
        concept: concept,
        link: "https://www.google.com"
    })
    .expect(200);

    const data3 = await doSearch("Chat-GPT analogy", cookie, concept);
    for (let i = 0; i < data3.length; i++) {
        data3[i].isRelevant = 2;
    }
    await request(app)
    .post("/api/search/saveSearchHistory")
    .set("Cookie", cookie)
    .send({
        searchRecords: data3,
        query: "cellphone",
        tag: "Chat-GPT analogy",
        concept: concept,
        link: "https://www.google.com"
    })
    .expect(200);

    // ubnselct the concept
    await global.unselectConcept(cookie, concept);

    // submit search history
    const response = await request(app)
    .post("/api/search/submitSearchHistory")
    .set("Cookie", cookie)
    .send({
        conceptId: concept,
    })
    .expect(500);

    expect(response.text).toBe("Search history submit failed, this concept not be selected by the user or already be submitted");
});