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

var _ = require('underscore');
var Joi = require('joi');
var config = require('../config');
var validateAction = require('pa11y').validateAction;

// Routes relating to org
module.exports = function(app) {
  var model = app.model;
  var server = app.server;

  /**
   * Helper checks if over limit
   * @param id
   * @param tasks
   * @return {Promise<any>}
   */
  function checkLimit (id, tasks) {
    return new Promise(function(resolve, reject) {
      model.org.getById(id, function(error, org) {
        if (error) {
          return reject(error);
        } else if (!org) {
          return reject(new Error('Not Found'));
        }

        var count = tasks.reduce((acc, cur) => {
          return (cur.type === 'recurring') ? acc + 1 : acc;
        }, 0);

        const limit = org.limit || 0;
        resolve({
          count: count,
          limit: limit,
          message: (limit <= count) ? 'Over limit' : ''
        });
      });
    });
  }

  // Check org recurring task limit
  server.route({
    method: 'GET',
    path: '/org/{id}/limit',
    handler: function(request, reply) {
      model.task.getAllByOrg(request.params.id, function(error, tasks) {
        if (error || !tasks) {
          return reply().code(500);
        }
        // Check our limit
        checkLimit(request.params.id, tasks).then(function(limitCheck) {
          // If .message, over limit
          const code = limitCheck.message ? 403 : 200;
          reply(limitCheck).code(code);
        }).catch(function(limitError) {
          console.log(limitError);
          return reply().code(500);
        });
      });
    },
    config: {
      validate: {
        payload: false
      }
    }
  });

  // Get all tasks for an org
  server.route({
    method: 'GET',
    path: '/org/{id}/tasks',
    handler: function(request, reply) {
      model.task.getAllByOrg(request.params.id, function(error, tasks) {
        if (error || !tasks) {
          return reply().code(500);
        }
        // Check our limit
        checkLimit(request.params.id, tasks).then(function(limitCheck) {
          // Include last result?
          if (request.query.lastres) {
            model.result.getAll({}, function(error, results) {
              if (error || !results) {
                return reply().code(500);
              }
              var resultsByTask = _.groupBy(results, 'task');
              tasks = tasks.map(function(task) {
                if (resultsByTask[task.id] && resultsByTask[task.id].length) {
                  task.last_result = resultsByTask[task.id][0];
                } else {
                  task.last_result = null;
                }
                return task;
              });
              reply(Object.assign(limitCheck, { tasks: tasks })).code(200);
            });
          } else {
            reply(Object.assign(limitCheck, { tasks: tasks })).code(200);
          }
        }).catch(function(limitError) {
          console.log(limitError);
          return reply().code(500);
        });
      });
    },
    config: {
      validate: {
        query: {
          lastres: Joi.boolean()
        },
        payload: false
      }
    }
  });

  // // Create a task
  // server.route({
  //   method: 'POST',
  //   path: '/org/{id}/tasks',
  //   handler: function(request, reply) {
  //     console.log(request.params.id);
  //     if (!request.params.id) {
  //       return reply({
  //         statusCode: 400,
  //         message: 'Invalid, organization must be specified'
  //       }).code(400);
  //     }
  //     else {
  //       model.org.getById(request.params.id, function(error) {
  //         if (error) {
  //           return reply({
  //             statusCode: 400,
  //             message: 'Invalid organization ' + request.params.id
  //           }).code(400);
  //         }
  //         request.payload.org = request.params.id;
  //         reply.proxy({'uri' :'/tasks', passThrough : true});
  //         // return reply(request.payload)
  //         //   .redirect('/tasks')
  //         //   .rewritable(true)
  //         //   .temporary(true);
  //         // return reply(request.payload);
  //
  //       });
  //     }
  //   }
  // });

};
