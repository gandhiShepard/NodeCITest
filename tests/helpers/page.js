const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: function(target, property) {
        return customPage[property] || browser[property] || page[property];
      }
    });
  }

  constructor(page) {
    // whenever we create a new istance of page
    // we are going to set a reference to page here
    this.page = page;
  }

  async login() {
    const user = await userFactory();
    const {session, sig} = sessionFactory(user);

    //console.log({seshStr: sessionString, signature:sig});
    await this.page.setCookie({name: 'session', value: session });
    await this.page.setCookie({name: 'session.sig', value: sig});
    await this.page.goto('http://localhost:3000/blogs');

    await this.page.waitFor('[href="/auth/logout"]');
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }

  async get(path) {
    return this.page.evaluate((_path) => {
        return fetch(_path, {
          method: 'GET',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          }
        }).then( res => res.json() );
      }, path);
  }

  async post(path, data) {
    return this.page.evaluate((_path, _data) => {
        return fetch(_path, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(_data)
        }).then( res => res.json() );
      }, path, data);
  }

  async execRequests(actions) {
    return Promise.all(
      actions.map(({method, path, data}) => {
        return this[method](path, data)
      })
    )
  }
}

module.exports = CustomPage;