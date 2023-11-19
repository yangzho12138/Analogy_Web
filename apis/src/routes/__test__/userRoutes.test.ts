import request from "supertest";
import { app } from "../../app";

// sign up test
it('fails when the email is not valid', async() => {
    const response1 = await request(app)
    .post('/api/users/signup')
    .send({
        'email': 'yz96@acm.org',
        'password': '123456'
    })
    .expect(400)
    expect(response1.body.errors[0].message).toBe('Email must be valid');

    const response2 = await request(app)
    .post('/api/users/signup')
    .send({
        'email': 'yz96',
        'password': '123456'
    })
    .expect(400)
    expect(response2.body.errors[0].message).toBe('Invalid value');
})

it('fails when the password is not valid', async() => {
    const response1 = await request(app)
    .post('/api/users/signup')
    .send({
        'email': 'yz96@illinois.edu',
        'password': 'wq'
    })
    .expect(400)
    expect(response1.body.errors[0].message).toBe('Password must be between 4 and 20 characters');
})

it('fails when the email is already in use', async() => {
    await request(app)
    .post('/api/users/signup')
    .send({
        'email': 'yz96@illinois.edu',
        'password': '123456'
    })
    .expect(201)

    await request(app)
    .post('/api/users/signup')
    .send({
        'email': 'yz96@illinois.edu',
        'password': '123456'
    })
    .expect(400)
})

it('signup successfully', async() => {
    await request(app)
    .post('/api/users/signup')
    .send({
        'email': 'yz96@illinois.edu',
        'password': '123456'
    })
    .expect(201)
})

// sign in test
it('fails when the email is not valid', async() => {
    const response = await request(app)
    .post('/api/users/signin')
    .send({
        'email': 'yz96',
        'password': '123456'
    })
    .expect(400)
    expect(response.body.errors[0].message === 'Email must be valid')
})

it('fails when the password is not valid', async() => {
    const response1 = await request(app)
    .post('/api/users/signin')
    .send({
        'email': 'yz96@illinois.edu',
        'password': ''
    })
    .expect(400)
    expect(response1.body.errors[0].message).toBe('Password can not be empty');
})

it('fails when the user does not exist', async() => {
    const response = await request(app)
    .post('/api/users/signin')
    .send({
        'email': 'test@illinois.edu',
        'password': '123456'
    })
    .expect(400)
    expect(response.body.errors[0].message).toBe('Invalid email or password');
})

it('fails when the password is not correct', async() => {
    const response = await request(app)
    .post('/api/users/signin')
    .set('Cookie', await global.signin())
    .send({
        'email': 'test@illinois.edu',
        'password': '12345'
    })
    .expect(400)
    expect(response.body.errors[0].message).toBe('Invalid email or password');
})

it('response a cookie when given valid credentials', async() => {
    await request(app)
    .post('/api/users/signup')
    .send({
        email: 'test@illinois.edu',
        password: '123456'
    })
    .expect(201)

    const response = await request(app)
    .post('/api/users/signin')
    .send({
        email: 'test@illinois.edu',
        password: '123456'
    })
    .expect(200)
    expect(response.get('Set-Cookie') ).toBeDefined()
    // console.log(response.get('Set-Cookie'))
})

// sign out test
it('clear the cookie after signout', async() => {
    await request(app)
    .post("/api/users/signup")
    .send({
      email: "test@illinois.edu",
      password: "123456",
    })
    .expect(201);

    const response = await request(app)
    .post('/api/users/signout')
    .send({})
    .expect(200)

    expect(response.get('Set-Cookie')).toBeDefined()
})