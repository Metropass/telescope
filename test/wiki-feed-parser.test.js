const parser = require('../src/backend/utils/wiki-feed-parser');
global.fetch = require('node-fetch');

const mockFeed = `################# Failing Feeds Commented Out [Start] #################

#Feed excluded due to getaddrinfo ENOTFOUND s-aleinikov.blog.ca s-aleinikov.blog.ca:80
#[http://s-aleinikov.blog.ca/feed/atom/posts/]
#name=Sergey Aleinikov


#Feed excluded due to getaddrinfo ENOTFOUND ejtorre.blog.ca ejtorre.blog.ca:80
#[http://ejtorre.blog.ca/feed/rss2/posts/]
#name=Eugene Torre


#Feed excluded due to getaddrinfo ENOTFOUND rickeyre.ca rickeyre.ca:80
#[http://rickeyre.ca/open-source-feed.xml]
#name=Rick Eyre

[http://kopay.wordpress.com/category/sbr600-win2011/feed]
name=Pirathapan Sivalingam


[http://jessefulton.wordpress.com/category/SBR600/feed/]
name=Jesse Fulton


[http://eric-spo600.blogspot.com/feeds/posts/default]
name=Eric Ferguson

#Feed excluded due to getaddrinfo ENOTFOUND rickeyre.ca rickeyre.ca:80
#[http://rickeyre.ca/open-source-feed.xml]
#name=Rick Eyre

[http://armenzg.blogspot.com/feeds/posts/default/-/open%20source]
name=Armen Zambrano G. (armenzg)`;

const noPreErr = TypeError("Cannot read property 'textContent' of null");

beforeEach(() => {
  fetch.resetMocks();
});

test('Testing wiki-feed-parser.getData with pre tag', async () => {
  const mockBody = `<html><pre>${mockFeed}</pre></html>`;
  fetch.mockResponseOnce(mockBody);

  const response = await parser.getData();
  expect(response).toStrictEqual(mockFeed.split('\n'));
});

test('Testing wiki-feed-parser.getData with no pre tag', async () => {
  const mockBody = `<html>${mockFeed}</html>`;

  fetch.mockResponseOnce(mockBody);

  await parser.getData().catch(err => {
    expect(err).toStrictEqual(noPreErr);
  });
});

test('Testing wiki-feed-parser.getData when fetch fails', async () => {
  fetch.mockReject(new Error('fake error message'));
  await parser.getData().catch(err => {
    expect(err).toStrictEqual(Error('fake error message'));
  });
});

test('Testing wiki-feed-parser.parseData', async () => {
  const mockBody = `<html><pre>${mockFeed}</pre></html>`;
  fetch.mockResponseOnce(mockBody);

  const expectedData = [
    {
      name: 'Pirathapan Sivalingam',
      url: 'http://kopay.wordpress.com/category/sbr600-win2011/feed',
    },
    { name: 'Jesse Fulton', url: 'http://jessefulton.wordpress.com/category/SBR600/feed/' },
    { name: 'Eric Ferguson', url: 'http://eric-spo600.blogspot.com/feeds/posts/default' },
    {
      name: 'Armen Zambrano G. (armenzg)',
      url: 'http://armenzg.blogspot.com/feeds/posts/default/-/open%20source',
    },
  ];
  const response = await parser.parseData();
  expect(response).toStrictEqual(expectedData);
});

test('Testing wiki-feed-parser.parseData when getData fails with no pre tag', async () => {
  const mockBody = `<html>${mockFeed}</html>`;
  fetch.mockResponseOnce(mockBody);

  await parser.parseData().catch(err => {
    expect(err).toStrictEqual(noPreErr);
  });
});