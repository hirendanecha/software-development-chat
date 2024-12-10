import 'zone.js/node';

import { APP_BASE_HREF } from '@angular/common';
import { ngExpressEngine } from '@nguniversal/express-engine';
import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import fetch from 'node-fetch';
import { AppServerModule } from './src/main.server';
import 'localstorage-polyfill';
import 'reflect-metadata';
import { environment } from 'src/environments/environment.prod';

const api_url = environment.serverUrl;

export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/software-development-chat/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? 'index.original.html'
    : 'index';

  const domino = require('domino-ext');
  const fs = require('fs');
  const path = require('path');
  const template = fs
    .readFileSync(
      path.join(join(process.cwd(), 'dist/software-development-chat/browser'), 'index.html')
    )
    .toString();
  const window = domino.createWindow(template);

  global['localStorage'] = localStorage;
  global['window'] = window;
  global['document'] = window.document;
  global['self'] = window;
  global['sessionStorage'] = window.sessionStorage;
  global['IDBIndex'] = window.IDBIndex;
  global['navigator'] = window.navigator;
  global['Event'] = window.Event;
  global['Event']['prototype'] = window.Event.prototype;
  global['HTMLElement'] = window.HTMLElement;
  global['jwplayer'] = window.jwplayer;
  global['getComputedStyle'] = window.getComputedStyle;
  server.engine(
    'html',
    ngExpressEngine({
      bootstrap: AppServerModule,
      inlineCriticalCss: false,
    })
  );

  server.set('view engine', 'html');
  server.set('views', distFolder);
  server.get(
    '*.*',
    express.static(distFolder, {
      maxAge: '1y',
    })
  );

  server.get('*', (req, res) => {
    res.render(
      indexHtml,
      { req, providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }] },
      async (err, html) => {
        if (err) {
          console.log('Error', err);
        }
        const params = req.params[0];
        var seo: any = {
          title: 'SoftwareDevelopment.chat',
          description:
            `> Enterprise on-premises Secure Live Chat Solution hosted on your server
             > Individual or Group Secure Chat
            `,
          image:
            'https://softwaredevelopment.chat/assets/images/meta-image.jpg',
          site: 'https://softwaredevelopment.chat/',
          url: 'https://softwaredevelopment.chat' + params,
          keywords: 'SoftwareDevelopment.chat, SoftwareDevelopment',
        };
        if (params.indexOf('settings/view-profile/') > -1) {
          let id = params.split('/');
          id = +id[id.length - 1];
          const { data: profile }: any = await getProfile(id);
          const talent = {
            name: profile[0]?.Username,
            description: profile[0].FirstName + ' ' + profile[0].LastName,
            image: profile[0].ProfilePicName,
          };
          seo.title = talent.name;
          seo.description = strip_html_tags(talent.description);
          seo.image = `${talent.image}`;
        }

        html = html.replace(/\$TITLE/g, seo.title);
        html = html.replace(/\$DESCRIPTION/g, strip_html_tags(seo.description));
        html = html.replace(
          /\$OG_DESCRIPTION/g,
          strip_html_tags(seo.description)
        );
        html = html.replace(
          /\$OG_META_DESCRIPTION/g,
          strip_html_tags(seo.description)
        );
        html = html.replace(/\$OG_TITLE/g, seo.title);
        html = html.replace(/\$OG_IMAGE/g, seo.image);
        html = html.replace(/\$OG_SITE/g, seo.site);
        html = html.replace(/\$OG_URL/g, seo.url);
        html = html.replace(/\$OG_META_KEYWORDS/g, seo.keywords);
        res.send(html);
      }
    );
  });
  return server;
}

async function getProfile(id: any) {
  return fetch(api_url + 'customers/profile/' + id).then((resp: any) =>
    resp.json()
  );
}

function strip_html_tags(str: any) {
  if (str === null || str === '') {
    return false;
  } else {
    str = str.toString();
    return str.replace(/<[^>]*>/g, '');
  }
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = (mainModule && mainModule.filename) || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
