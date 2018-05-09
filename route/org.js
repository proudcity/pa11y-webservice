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
var validateAction = require('pa11y').validateAction;

// Routes relating to org
module.exports = function(app) {
  var model = app.model;
  var server = app.server;

  // Create a org
  server.route({
    method: 'GET',
    path: '/orgs/{id}',
    handler: function(request, reply) {
      model.org.getById(request.params.id, function(error, org) {
        if (error) {
          return reply().code(500);
        }
        if (!org) {
          return reply({
            code: 404,
            error: 'Not Found'
          }).code(404);
        }
        reply(org).code(200);
      });
    },
    config: {
      validate: {
        payload: false
      }
    }
  });

  // Get org by name
  server.route({
    method: 'GET',
    path: '/orgs/name/{name}',
    handler: function(request, reply) {
      model.org.getByName(request.params.name, function(error, orgs) {
        if (error) {
          return reply().code(500);
        } else if (!orgs || !orgs.length) {
          return reply().code(404);
        }
        reply(orgs).code(200);
      });
    },
    config: {
      validate: {
        payload: false
      }
    }
  });

  // Get orgs
  server.route({
    method: 'GET',
    path: '/orgs',
    handler: function(request, reply) {
      model.org.getAll(function(error, orgs) {
        if (error || !orgs) {
          return reply().code(500);
        }
        reply(orgs).code(200);
      });
    },
    config: {
      validate: {
        payload: false
      }
    }
  });


  // Create a org
  server.route({
    method: 'POST',
    path: '/orgs',
    handler: function(request, reply) {
      model.org.create(request.payload, function(error, org) {
        if (error || !org) {
          // Org already exists
          if (org) {
            return reply({
              statusCode: 400,
              message: 'Org with name: "' + org.name + '" already exists'
            }).code(400);
          }
          return reply().code(500);
        }
        reply(org)
          .header('Location', 'http://' + request.info.host + '/org/' + org.id)
          .code(201);
      });
    },
    config: {
      validate: {
        query: {},
        payload: {
          name: Joi.string().required(),
          limit: Joi.number().integer().required()
        }
      }
    }
  });

  // Edit an Org
  server.route({
    method: 'PATCH',
    path: '/org/{id}',
    handler: function(request, reply) {
      model.org.getById(request.params.id, function(error, org) {
        if (error) {
          return reply().code(500);
        }
        if (!org) {
          return reply({
            code: 404,
            error: 'Not Found'
          }).code(404);
        }
        if (request.payload.actions && request.payload.actions.length) {
          for (var action of request.payload.actions) {
            if (!validateAction(action)) {
              return reply({
                statusCode: 400,
                message: 'Invalid action: "' + action + '"'
              }).code(400);
            }
          }
        }
        model.org.editById(org.id, request.payload, function(error, updateCount) {
          if (error || updateCount < 1) {
            return reply().code(500);
          }
          model.org.getById(org.id, function(error, org) {
            if (error) {
              return reply().code(500);
            }
            reply(org).code(200);
          });
        });
      });
    },
    config: {
      validate: {
        query: {},
        payload: {
          name: Joi.string().required(),
          limit: Joi.number().integer().required(),
          headers: [
            Joi.string().allow(''),
            Joi.object().pattern(/.*/, Joi.string().allow(''))
          ]
        }
      }
    }
  });
};
