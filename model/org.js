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

/* eslint id-length: 'off' */
/* eslint no-catch-shadow: 'off' */
/* eslint no-underscore-dangle: 'off' */
'use strict';

var async = require('async');
var chalk = require('chalk');
var ObjectID = require('mongodb').ObjectID;
var pa11y = require('pa11y');
var config = require('../config');

function pa11yLog(message) {
  console.log(chalk.grey('  > ' + message));
}

// Org model
module.exports = function(app, callback) {
  app.db.collection('orgs', function(error, collection) {
    collection.ensureIndex({
      name: 1,
    }, {
      w: -1
    });
    var model = {

      collection: collection,

      // Create a org
      create: function(newOrg, callback) {
        newOrg.headers = model.sanitizeHeaderInput(newOrg.headers);
        // @TODO allow individual orgs to have a limit
        // newOrg.limit = newOrg.limit || config.maxTrackedTasks;
        collection
          .findOne({ name: newOrg.name }, function(error, org) {
            if (error) {
              return callback(error);
            } else if (org) {
              return callback(true, org);
            }
            collection.insert(newOrg, function(error, result) {
              if (error) {
                return callback(error);
              }
              callback(null, model.prepareForOutput(result.ops[0]));
            });
          });
      },

      getAll: function(callback) {
        collection
          .find()
          .sort({
            name: 1
          })
          .toArray(function(error, orgs) {
            if (error) {
              return callback(error);
            }
            callback(null, orgs.map(model.prepareForOutput));
          });
      },

      // Get a org by ID
      getById: function(id, callback) {
        try {
          id = new ObjectID(id);
        } catch (error) {
          return callback(null, null);
        }
        collection.findOne({_id: id}, function(error, org) {
          if (error) {
            return callback(error);
          }
          if (org) {
            org = model.prepareForOutput(org);
          }
          callback(null, org);
        });
      },

      // Get a org by name
      getByName: function(name, callback) {
        collection.findOne({name: name}, function(error, org) {
          if (error) {
            return callback(error);
          }
          if (org) {
            org = model.prepareForOutput(org);
          }
          callback(null, org);
        });
      },

      // Edit a task by ID
      editById: function(id, edits, callback) {
        var idString = id;
        try {
          id = new ObjectID(id);
        } catch (error) {
          return callback(null, 0);
        }
        var orgEdits = {
          name: edits.name,
          // @TODO allow individual orgs to have a limit
          // limit: edits.limit || config.maxTrackedTasks
        };
        collection.update({_id: id}, {$set: orgEdits}, function(error, updateCount) {
          if (error || updateCount < 1) {
            return callback(error, 0);
          }
          callback(error, updateCount);
        });
      },

      // Delete a org by ID
      deleteById: function(id, callback) {
        try {
          id = new ObjectID(id);
        } catch (error) {
          return callback(null);
        }
        // @TODO delete tasks
        collection.deleteOne({_id: id}, function(error, result) {
          callback(error, result ? result.deletedCount : null);
        });
      },

      // Prepare a org for output
      prepareForOutput: function(org) {
        var output = {
          id: org._id.toString(),
          name: org.name,
          // limit: org.limit
          // @TODO allow individual orgs to have a limit
          limit: config.maxTrackedTasks,
        };
        if (org.headers) {
          if (typeof org.headers === 'string') {
            try {
              output.headers = JSON.parse(org.headers);
            } catch (error) {}
          } else {
            output.headers = org.headers;
          }
        }
        return output;
      },

      sanitizeHeaderInput: function(headers) {
        if (typeof headers === 'string') {
          try {
            return JSON.parse(headers);
          } catch (error) {
            console.error('Header input contains invalid JSON:', headers);
            return undefined;
          }
        }
        return headers;
      }

    };
    callback(error, model);
  });
};
