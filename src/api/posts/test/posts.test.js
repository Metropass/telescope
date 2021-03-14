const request = require('supertest');
const { hash } = require('@senecacdot/satellite');
const { app } = require('../src');
const { addPost, getPost } = require('../src/storage');

describe('/posts', () => {
  const requestedItems = 50;
  const maxItems = 100;
  const createdItems = 150;
  const nonInteger = 'test';

  const posts = [...Array(createdItems).keys()].map((item) => {
    const guid = `http://telescope${item}.cdot.systems`;
    const id = hash(guid);
    return {
      id,
      guid,
      author: 'author',
      title: 'title',
      html: 'html',
      updated: new Date('2009-09-07T22:23:00.544Z'),
      published: new Date('2009-09-07T22:20:00.000Z'),
      url: 'foo',
      site: 'foo',
    };
  });

  beforeAll(() => posts.map((post) => addPost(post)));

  test('default number of items should be returned', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.get('Content-type')).toContain('application/json');
    expect(res.get('X-Total-Count')).toBe(createdItems.toString());
    expect(res.body.length).toBeGreaterThan(0);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('requests a specific number of items', async () => {
    const res = await request(app).get('/?per_page=50');

    expect(res.status).toEqual(200);
    expect(res.get('Content-type')).toContain('application/json');
    expect(res.get('X-Total-Count')).toBe(createdItems.toString());
    expect(res.body.length).toBe(requestedItems);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('requests more items than the limit set by the server', async () => {
    const res = await request(app).get('/?per_page=150');

    expect(res.status).toEqual(200);
    expect(res.body.length).toBe(maxItems);
  });

  test('request posts with both query params', async () => {
    const res = await request(app).get('/?page=2&per_page=50');
    expect(res.status).toEqual(200);
    expect(res.body.length).toBe(requestedItems);
  });

  test('request posts with both only page param', async () => {
    const res = await request(app).get('/?page=3');
    expect(res.status).toEqual(200);
    // This will depend on the env value, so as long as we get back something.
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('request posts with non-integer page param', async () => {
    const res = await request(app).get(`/?page=${nonInteger}`);
    expect(res.status).toEqual(400);
  });

  test('request posts with non-integer per_page param', async () => {
    const res = await request(app).get(`/?per_page=${nonInteger}`);
    expect(res.status).toEqual(400);
  });
});

describe('test /posts/:id responses', () => {
  const missingGuid = 'http://missing-guid';

  test('A post with an id should be returned', async () => {
    const res = await request(app).get('/');
    const postIDRes = await request(app).get(`/${res.body[0].id}`);
    const post = await getPost(postIDRes.body.id);
    expect(postIDRes.status).toEqual(200);
    expect(postIDRes.get('Content-type')).toContain('application/json');
    expect(postIDRes.body.id).toEqual(post.id);
  });

  test('The id of a post should match the id the post object returns', async () => {
    const res = await request(app).get('/');
    const postIDRes = await request(app).get(`/${res.body[0].id}`);

    expect(postIDRes.status).toEqual(200);
    expect(postIDRes.body.id).toEqual(res.body[0].id);
  });

  test("Pass an id that doesn't exist", async () => {
    const res = await request(app).get(`/${hash(missingGuid)}`);
    expect(res.status).toEqual(404);
  });

  test('requests text', async () => {
    const postArray = await request(app).get('/');
    const res = await request(app).get(`/${postArray.body[2].id}`).set('Accept', 'text/plain');
    expect(res.status).toEqual(200);
    expect(res.get('Content-type')).toContain('text/plain');
    expect(res.text).toEqual('html');
  });

  test('requests JSON', async () => {
    const postArray = await request(app).get('/');
    const post = await request(app).get(`/${postArray.body[3].id}`);
    const res = await request(app)
      .get(`/${postArray.body[3].id}`)
      .set('Accept', 'application/json');
    expect(res.status).toEqual(200);
    expect(res.get('Content-type')).toContain('application/json');
    expect(res.body).toEqual(JSON.parse(JSON.stringify(post.body)));
  });

  test('requests HTML', async () => {
    const postArray = await request(app).get('/');
    const res = await request(app).get(`/${postArray.body[2].id}`).set('Accept', 'text/html');
    expect(res.status).toEqual(200);
    expect(res.get('Content-type')).toContain('text/html');
    expect(res.text).toEqual('html');
  });

  test('requests ID with 6 characters Test', async () => {
    const res = await request(app).get(`/123456`).set('Accept', 'text/html');
    expect(res.status).toEqual(400);
  });

  test('requests ID with 14 characters Test', async () => {
    const res = await request(app).get(`/12345678901234`).set('Accept', 'text/html');
    expect(res.status).toEqual(400);
  });

  test('requests ID with valid length but not exist Test', async () => {
    const res = await request(app).get(`/1234567890`).set('Accept', 'text/html');
    expect(res.status).toEqual(404);
    expect(res.get('Content-length')).toEqual('46');
  });
});