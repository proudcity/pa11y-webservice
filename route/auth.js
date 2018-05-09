// This file is part of Pa11y Webservice.
//
// Pa11y Webservice is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Pa11y Webservice is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Pa11y Webservice.  If not, see <http://www.gnu.org/licenses/>.

/* eslint camelcase: 'off' */
'use strict';

// Routes relating to org
module.exports = function(app) {
  var model = app.model;
  var server = app.server;

  // Create a org
  server.route({
    method: ['GET', 'POST'],
    path: '/login',
    config: {
      handler: function (request, reply) {

        if (request.auth.isAuthenticated) {
          return reply.redirect('/');
        }

        let message = '';
        let account = null;

        if (request.method === 'post') {

          if (!request.payload.username ||
            !request.payload.password) {

            message = 'Missing username or password';
          }
          else {
            account = users[request.payload.username];
            if (!account ||
              account.password !== request.payload.password) {

              message = 'Invalid username or password';
            }
          }
        }

        if (request.method === 'get' ||
          message) {

          return reply('<html><head><title>Login page</title></head><body>' +
            (message ? '<h3>' + message + '</h3><br/>' : '') +
            '<form method="post" action="/login">' +
            'Username: <input type="text" name="username"><br>' +
            'Password: <input type="password" name="password"><br/>' +
            '<input type="submit" value="Login"></form></body></html>');
        }

        const sid = String(++uuid);
        request.server.app.cache.set(sid, { account: account }, 0, (err) => {

          if (err) {
            reply(err);
          }

          request.cookieAuth.set({ sid: sid });
          return reply.redirect('/');
        });
      },
      auth: {
        mode: 'try'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    }
  });
};
