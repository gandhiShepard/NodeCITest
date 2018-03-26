const Page = require('./helpers/page');

let page;

beforeEach( async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

afterEach( async () => {
  // Now we can do page.close instead of browser.close
  await page.close();
});


describe('When logged in', async () => {
  beforeEach( async () => {
    await page.login();
    await page.click('a.btn-floating');
  })

  test('Can see blog create form', async () => {
    const label = await page.getContentsOf('form label');
    expect(label).toEqual('Blog Title');
  });


  describe('And using valid inputs', async () => {
    beforeEach(async () => {
      await page.type('.title input', 'Hello world');
      await page.type('.content input', '(ノ°ο°)ノ wootWOOT !!!');
      await page.click('form button');
    })

    test('submitting takes user to review screen', async () => {
      const text = await page.getContentsOf('h5');
      expect(text).toEqual('Please confirm your entries')
    })

    test('Submitting then saving adds blog to index page', async () => {
      await page.click('button.green');
      
      // now its going to take some time and we need
      // puppeteer to wait
      await page.waitFor('.card')
      const title = await page.getContentsOf('.card-title');
      const content = await page.getContentsOf('p');

      expect(title).toEqual('Hello world');
      expect(content).toEqual('(ノ°ο°)ノ wootWOOT !!!');
    })
  });


  describe('And using invalid inputs', async () => {
    // all we want to do is try to submit the form before 
    // each of these tests
    beforeEach(async () => {
      await page.click('form button');
    })
    test('the form show and error message', async () => {
      const titleErr = await page.getContentsOf('.title .red-text');
      const contentErr = await page.getContentsOf('.content .red-text');

      expect(titleErr).toEqual('You must provide a value');
      expect(contentErr).toEqual('You must provide a value');
    });
  });
});


describe('User is not logged in', async () => {

  const actions = [
    {
      method: 'get',
      path: '/api/blogs'
    },
    {
      method: 'post',
      path: 'api/blogs',
      data: {
        title: 'T',
        content: 'C'
      }
    }
  ]

  test('Blog related actions are prohibited', async () => {
    // We will get an array of results
    const results = await page.execRequests(actions);
    for (let result of results) {
      expect(result).toEqual({ error: 'You must log in!' });
    }
  });

  // test('User cannot create blog posts', async () => {
  //   const result = await page.get('/api/blogs')

  //   expect(result).toEqual({ error: 'You must log in!' });
  // })

  // test('User cannot get a list of posts', async () => {
  //   const result = await page.post('/api/blogs', {title: 'My title', content: 'My content'})

  //   expect(result).toEqual({ error: 'You must log in!' });
  // })

})