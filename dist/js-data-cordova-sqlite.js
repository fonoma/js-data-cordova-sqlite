module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

	var _array = __webpack_require__(1);

	var _lang = __webpack_require__(67);

	var _object = __webpack_require__(99);

	var _string = __webpack_require__(130);

	var _squel = __webpack_require__(171);

	var _squel2 = _interopRequireDefault(_squel);

	var _jsData = __webpack_require__(172);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	var removeCircular = _jsData.DSUtils.removeCircular;


	var reserved = ['orderBy', 'sort', 'limit', 'offset', 'skip', 'where'];

	function getTable(resourceConfig) {
	    return resourceConfig.table || (0, _string.underscore)(resourceConfig.name);
	}

	function processRelationField(resourceConfig, query, field, criteria, joinedTables) {
	    var fieldParts = field.split('.');
	    var localResourceConfig = resourceConfig;
	    var relationPath = [];
	    var relationName = null;

	    while (fieldParts.length >= 2) {
	        relationName = fieldParts.shift();

	        var _localResourceConfig$ = localResourceConfig.relationList.filter(function (r) {
	            return r.relation === relationName || r.localField === relationName;
	        });

	        var _localResourceConfig$2 = _slicedToArray(_localResourceConfig$, 1);

	        var relation = _localResourceConfig$2[0];


	        if (relation) {
	            var relationResourceConfig = resourceConfig.getResource(relation.relation);
	            relationPath.push(relation.relation);

	            if (relation.type === 'belongsTo' || relation.type === 'hasOne') {
	                // Apply table join for belongsTo/hasOne property (if not done already)
	                if (!joinedTables.some(function (t) {
	                    return t === relationPath.join('.');
	                })) {
	                    var table = getTable(localResourceConfig);
	                    var localId = table + '.' + relation.localKey;

	                    var relationTable = getTable(relationResourceConfig);
	                    var foreignId = relationTable + '.' + relationResourceConfig.idAttribute;

	                    query.left_join(relationTable, null, localId + ' = ' + foreignId);
	                    joinedTables.push(relationPath.join('.'));
	                }
	            } else if (relation.type === 'hasMany') {
	                // Perform `WHERE EXISTS` subquery for hasMany property
	                var existsParams = _defineProperty({}, relationName + '.' + fieldParts.splice(0).join('.'), criteria);
	                var subQueryTable = getTable(relationResourceConfig);
	                var subQuery = _squel2.default.select().from(subQueryTable);
	                subQuery = this.__filterQuery(relationResourceConfig, existsParams, subQuery).where(getTable(relationResourceConfig) + '.' + relation.foreignKey + ' == ' + getTable(localResourceConfig) + '.' + localResourceConfig.idAttribute);
	                if (Object.keys(criteria).some(function (k) {
	                    return k.indexOf('|') > -1;
	                })) {
	                    query = query.where(subQuery);
	                } else {
	                    query = query.where(_squel2.default.expr().or(subQuery));
	                }
	            }

	            localResourceConfig = relationResourceConfig;
	        } else {
	            // hopefully a qualified local column
	        }
	    }
	    relationName = fieldParts.shift();

	    return relationName ? getTable(localResourceConfig) + '.' + relationName : null;
	}

	function loadWithRelations(items, resourceConfig, options) {
	    var _this = this;

	    var tasks = [];
	    var instance = Array.isArray(items) ? null : items;

	    if (resourceConfig.relationList) {
	        resourceConfig.relationList.forEach(function (def) {
	            var relationName = def.relation;
	            var relationDef = resourceConfig.getResource(relationName);

	            var containedName = null;
	            if ((0, _array.contains)(options.with, relationName)) {
	                containedName = relationName;
	            } else if ((0, _array.contains)(options.with, def.localField)) {
	                containedName = def.localField;
	            } else {
	                return;
	            }

	            var __options = (0, _object.deepMixIn)({}, options.orig ? options.orig() : options);

	            // Filter to only properties under current relation
	            __options.with = options.with.filter(function (relation) {
	                return relation !== containedName && relation.indexOf(containedName) === 0 && relation.length >= containedName.length && relation[containedName.length] === '.';
	            }).map(function (relation) {
	                return relation.substr(containedName.length + 1);
	            });

	            var task = void 0;

	            if ((def.type === 'hasOne' || def.type === 'hasMany') && def.foreignKey) {
	                task = _this.findAll(resourceConfig.getResource(relationName), {
	                    where: _defineProperty({}, def.foreignKey, instance ? { '==': instance[def.localKey || resourceConfig.idAttribute] } : { 'in': items.map(function (item) {
	                            return item[def.localKey || resourceConfig.idAttribute];
	                        }) })
	                }, __options).then(function (relatedItems) {
	                    if (instance) {
	                        if (def.type === 'hasOne' && relatedItems.length) {
	                            instance[def.localField] = relatedItems[0];
	                        } else {
	                            instance[def.localField] = relatedItems;
	                        }
	                    } else {
	                        items.forEach(function (item) {
	                            var attached = relatedItems.filter(function (ri) {
	                                return ri[def.foreignKey] === item[def.localKey || resourceConfig.idAttribute];
	                            });
	                            if (def.type === 'hasOne' && attached.length) {
	                                item[def.localField] = attached[0];
	                            } else {
	                                item[def.localField] = attached;
	                            }
	                        });
	                    }

	                    return relatedItems;
	                });
	            } else if (def.type === 'hasMany' && def.localKeys) {
	                (function () {
	                    // TODO: Write test for with: hasMany property with localKeys
	                    var localKeys = [];

	                    if (instance) {
	                        var itemKeys = instance[def.localKeys] || [];
	                        itemKeys = Array.isArray(itemKeys) ? itemKeys : Object.keys(itemKeys);
	                        localKeys = localKeys.concat(itemKeys || []);
	                    } else {
	                        items.forEach(function (item) {
	                            var itemKeys = item[def.localKeys] || [];
	                            itemKeys = Array.isArray(itemKeys) ? itemKeys : Object.keys(itemKeys);
	                            localKeys = localKeys.concat(itemKeys || []);
	                        });
	                    }

	                    task = _this.findAll(resourceConfig.getResource(relationName), {
	                        where: _defineProperty({}, relationDef.idAttribute, {
	                            'in': filter((0, _array.unique)(localKeys), function (x) {
	                                return x;
	                            })
	                        })
	                    }, __options).then(function (relatedItems) {
	                        if (instance) {
	                            instance[def.localField] = relatedItems;
	                        } else {
	                            items.forEach(function (item) {
	                                var itemKeys = item[def.localKeys] || [];
	                                var attached = relatedItems.filter(function (ri) {
	                                    return itemKeys && (0, _array.contains)(itemKeys, ri[relationDef.idAttribute]);
	                                });
	                                item[def.localField] = attached;
	                            });
	                        }

	                        return relatedItems;
	                    });
	                })();
	            } else if (def.type === 'belongsTo' || def.type === 'hasOne' && def.localKey) {
	                if (instance) {
	                    var id = (0, _object.get)(instance, def.localKey);
	                    if (id) {
	                        task = _this.findAll(resourceConfig.getResource(relationName), {
	                            where: _defineProperty({}, def.foreignKey || relationDef.idAttribute, { '==': id })
	                        }, __options).then(function (relatedItems) {
	                            var relatedItem = relatedItems && relatedItems[0];
	                            instance[def.localField] = relatedItem;
	                            return relatedItem;
	                        });
	                    }
	                } else {
	                    var ids = items.map(function (item) {
	                        return (0, _object.get)(item, def.localKey);
	                    }).filter(function (x) {
	                        return x;
	                    });
	                    if (ids.length) {
	                        task = _this.findAll(resourceConfig.getResource(relationName), {
	                            where: _defineProperty({}, def.foreignKey || relationDef.idAttribute, { 'in': ids })
	                        }, __options).then(function (relatedItems) {
	                            items.forEach(function (item) {
	                                relatedItems.forEach(function (relatedItem) {
	                                    if (relatedItem[def.foreignKey || relationDef.idAttribute] === item[def.localKey]) {
	                                        item[def.localField] = relatedItem;
	                                    }
	                                });
	                            });
	                            return relatedItems;
	                        });
	                    }
	                }
	            }

	            if (task) {
	                tasks.push(task);
	            }
	        });
	    }

	    return Promise.all(tasks);
	}

	var DSCordovaSQLiteAdapter = function () {
	    function DSCordovaSQLiteAdapter(options) {
	        _classCallCheck(this, DSCordovaSQLiteAdapter);

	        this.defaults = {
	            name: 'data.db',
	            location: 'default'
	        };
	        options = options || {};

	        if (options.queryOperators) {
	            this.queryOperators = options.queryOperators;
	            delete options.queryOperators;
	        }

	        (0, _object.deepMixIn)(this.defaults, options);

	        if (window.sqlitePlugin) {
	            this.db = window.sqlitePlugin.openDatabase({ name: options.name, location: options.location });
	        }
	    }

	    _createClass(DSCordovaSQLiteAdapter, [{
	        key: 'find',
	        value: function find(resourceConfig, id, options, tx) {
	            var _this2 = this;

	            var instance = void 0;
	            options = options || {};
	            options.with = options.with || [];
	            var table = getTable(resourceConfig);

	            var query = _squel2.default.select().from(table).where(table + '.' + resourceConfig.idAttribute + ' = ?', (0, _lang.toString)(id)).toString();
	            //TODO Remove
	            console.log('Find SQL: ' + query);

	            return new Promise(function (resolve, reject) {
	                if (_this2.db) {
	                    (function () {
	                        var successCallback = function successCallback(tx, rs) {
	                            if (rs.rows.length < 1) {
	                                reject(new Error('Not Found!'));
	                            } else {
	                                instance = rs.rows.item(0);
	                                return loadWithRelations.call(_this2, instance, resourceConfig, options).then(function () {
	                                    return _this2.__denormalizeAttributes(instance);
	                                }).then(function (item) {
	                                    return resolve(item);
	                                });
	                            }
	                        };
	                        var errorCallback = function errorCallback(tx, error) {
	                            reject(new Error(error.message));
	                            return false;
	                        };

	                        //Use current transaction if it exists
	                        if (tx) {
	                            tx.executeSql(query, [], successCallback, errorCallback);
	                        } else {
	                            _this2.db.transaction(function (tx) {
	                                tx.executeSql(query, [], successCallback, errorCallback);
	                            });
	                        }
	                    })();
	                } else {
	                    reject(new Error('Cordova SQLite plugin is not loaded!'));
	                }
	            });
	        }
	    }, {
	        key: 'findAll',
	        value: function findAll(resourceConfig, params, options) {
	            var _this3 = this;

	            var table = getTable(resourceConfig);
	            var items = null;
	            options = options || {};
	            options.with = options.with || [];

	            var query = _squel2.default.select().from(table);
	            query = this.__filterQuery(resourceConfig, params, query);
	            var queryStr = query.toString();
	            //TODO Remove
	            console.log('FindAll SQL: ' + queryStr);

	            return new Promise(function (resolve, reject) {
	                if (_this3.db) {
	                    _this3.db.transaction(function (tx) {
	                        tx.executeSql(queryStr, [], function (tx, rs) {
	                            items = [];
	                            for (var i = 0; i < rs.rows.length; i++) {
	                                items.push(rs.rows.item(i));
	                            }
	                            loadWithRelations.call(_this3, items, resourceConfig, options).then(function () {
	                                return items.map(function (value) {
	                                    return _this3.__denormalizeAttributes(value);
	                                });
	                            }).then(function (denormalizedItems) {
	                                return resolve(denormalizedItems);
	                            });
	                        }, function (tx, error) {
	                            resolve([]);
	                            return false;
	                        });
	                    });
	                } else {
	                    reject(new Error('Cordova SQLite plugin is not loaded!'));
	                }
	            });
	        }
	    }, {
	        key: 'create',
	        value: function create(resourceConfig, attrs, options) {
	            var _this4 = this;

	            var table = getTable(resourceConfig);
	            attrs = this.__normalizeAttributes(resourceConfig, attrs);

	            var query = _squel2.default.insert().into(table).setFields(attrs).toString();
	            var selectQuery = _squel2.default.select().from(table).where('ROWID = last_insert_rowid()').toString();
	            //TODO Remove
	            console.log('Create SQL: ' + query);

	            return new Promise(function (resolve, reject) {
	                if (_this4.db) {
	                    _this4.db.transaction(function (tx) {
	                        var successCallback = function successCallback(tx, rs) {
	                            var instance = rs.rows.item(0);
	                            return loadWithRelations.call(_this4, instance, resourceConfig, options).then(function () {
	                                return _this4.__denormalizeAttributes(instance);
	                            }).then(function (item) {
	                                return resolve(item);
	                            });
	                        };
	                        var errorCallback = function errorCallback(tx, error) {
	                            //If the table doesn't have one of the columns, add it and regenerate indexes
	                            if (error.message.indexOf('has no column named') != -1) {
	                                var words = error.message.split(' ');
	                                var columnName = words[words.length - 1];
	                                var alterQuery = 'ALTER TABLE ' + table + ' ADD COLUMN ' + columnName + '; REINDEX ' + table;
	                                tx.executeSql(alterQuery, [], function (tx, rs) {
	                                    //Try again to insert and retrieve the row
	                                    tx.executeSql(query, [], function (tx, rs) {
	                                        tx.executeSql(selectQuery, [], successCallback);
	                                    }, errorCallback);
	                                });
	                            }
	                            return false;
	                        };

	                        _this4.__createTable(resourceConfig, attrs, tx);
	                        tx.executeSql(query, [], function (tx, rs) {
	                            tx.executeSql(selectQuery, [], successCallback);
	                        }, errorCallback);
	                    }, function (error) {
	                        reject(new Error(error.message));
	                        return false;
	                    });
	                } else {
	                    reject(new Error('Cordova SQLite plugin is not loaded!'));
	                }
	            });
	        }
	    }, {
	        key: 'update',
	        value: function update(resourceConfig, id, attrs, options) {
	            var _this5 = this;

	            var table = getTable(resourceConfig);
	            attrs = this.__normalizeAttributes(resourceConfig, attrs);

	            var updateQuery = _squel2.default.update().table(table).setFields(attrs).where(table + '.' + resourceConfig.idAttribute + ' = ?', (0, _lang.toString)(id)).toString();
	            var insertQuery = _squel2.default.insert().into(table).setFields(attrs).toString();
	            insertQuery = insertQuery.replace('INSERT INTO', 'INSERT OR IGNORE INTO');
	            //TODO Remove
	            console.log('Update SQL: ' + updateQuery);

	            return new Promise(function (resolve, reject) {
	                if (_this5.db) {
	                    _this5.db.transaction(function (tx) {
	                        var successCallback = function successCallback(tx, rs) {
	                            _this5.find(resourceConfig, id, options, tx).then(function (item) {
	                                return resolve(item);
	                            });
	                        };
	                        var errorCallback = function errorCallback(tx, error) {
	                            //If the table doesn't have one of the columns, add it
	                            if (error.message.indexOf('no such column') != -1 || error.message.indexOf('has no column named') != -1) {
	                                var words = error.message.split(' ');
	                                var columnName = words[words.length - 1];
	                                var alterQuery = 'ALTER TABLE ' + table + ' ADD COLUMN ' + columnName;
	                                tx.executeSql(alterQuery, [], function (tx, rs) {
	                                    //Try again to update/insert and retrieve the row
	                                    tx.executeSql(updateQuery, [], function (tx, rs) {
	                                        tx.executeSql(insertQuery, [], successCallback, errorCallback);
	                                    }, errorCallback);
	                                });
	                            }
	                            return false;
	                        };

	                        _this5.__createTable(resourceConfig, attrs, tx);
	                        //Try to update an existing row
	                        tx.executeSql(updateQuery, [], function (tx, rs) {
	                            //Try to insert the row if the update didn't happen
	                            tx.executeSql(insertQuery, [], successCallback);
	                        }, errorCallback);
	                    }, function (error) {
	                        reject(new Error(error.message));
	                        return false;
	                    });
	                } else {
	                    reject(new Error('Cordova SQLite plugin is not loaded!'));
	                }
	            });
	        }
	    }, {
	        key: 'updateAll',
	        value: function updateAll(resourceConfig, attrs, params, options) {
	            var _this6 = this;

	            var table = getTable(resourceConfig);
	            attrs = this.__normalizeAttributes(resourceConfig, attrs);

	            //First, we get the ROWID of every row thatis going to be updated
	            var query = _squel2.default.select().from(table);
	            //let query = squel.update().table(table).setFields(attrs);
	            query = this.__filterQuery(resourceConfig, params, query);
	            var queryStr = query.toString();
	            //TODO Remove
	            console.log('UpdateAll SQL: ' + queryStr);

	            return new Promise(function (resolve, reject) {
	                if (_this6.db) {
	                    _this6.db.transaction(function (tx) {
	                        tx.executeSql(queryStr, [], function (tx, rs) {
	                            var ids = [];
	                            for (var i = 0; i < rs.rows.length; i++) {
	                                ids.push(rs.rows.item(i).rowid);
	                            }
	                            var updateQuery = _squel2.default.update().table(table).setFields(attrs).where('ROWID IN ?', ids).toString();
	                            tx.executeSql(updateQuery, [], function (tx, rs) {

	                                resolve(rs);
	                            });
	                        });
	                    }, function (error) {
	                        reject(new Error(error.message));
	                        return false;
	                    });
	                } else {
	                    reject(new Error('Cordova SQLite plugin is not loaded!'));
	                }
	            });
	        }
	    }, {
	        key: 'destroy',
	        value: function destroy(resourceConfig, id, options) {
	            var _this7 = this;

	            var table = getTable(resourceConfig);

	            var query = _squel2.default.delete().from(table).where(table + '.' + resourceConfig.idAttribute + ' = ?', (0, _lang.toString)(id)).toString();
	            //TODO Remove
	            console.log('Destroy SQL: ' + query);

	            return new Promise(function (resolve, reject) {
	                if (_this7.db) {
	                    _this7.db.transaction(function (tx) {
	                        tx.executeSql(query, [], function (tx, rs) {
	                            resolve();
	                        }, function (tx, error) {
	                            reject(new Error(error.message));
	                            return false;
	                        });
	                    });
	                } else {
	                    reject(new Error('Cordova SQLite plugin is not loaded!'));
	                }
	            });
	        }
	    }, {
	        key: 'destroyAll',
	        value: function destroyAll(resourceConfig, params, options) {
	            var _this8 = this;

	            var table = getTable(resourceConfig);

	            var query = _squel2.default.delete().from(table);
	            query = this.__filterQuery(resourceConfig, params, query);
	            var queryStr = query.toString();
	            //TODO Remove
	            console.log('DestroyAll SQL: ' + queryStr);

	            return new Promise(function (resolve, reject) {
	                if (_this8.db) {
	                    _this8.db.transaction(function (tx) {
	                        tx.executeSql(queryStr, [], function (tx, rs) {
	                            resolve();
	                        }, function (tx, error) {
	                            //Don't show an error if the table doesn't exist
	                            resolve();
	                            return false;
	                        });
	                    });
	                } else {
	                    reject(new Error('Cordova SQLite plugin is not loaded!'));
	                }
	            });
	        }
	    }, {
	        key: 'createIndex',
	        value: function createIndex(resourceConfig, name, params) {
	            var _this9 = this;

	            var table = getTable(resourceConfig);
	            var suffix = Math.floor(Math.random() * 10);

	            var columnsArr = [];
	            Object.keys(params).forEach(function (key) {
	                var str = key;
	                var value = params[key];
	                if (typeof value === 'string') {
	                    var upperValue = value.toUpperCase();
	                    if (upperValue === 'ASC' || upperValue === 'DESC') {
	                        str = str + ' ' + value;
	                    }
	                }
	                columnsArr.push(str);
	            });
	            var columns = columnsArr.join(', ');

	            var query = 'CREATE INDEX IF NOT EXISTS ' + name + ' ON ' + table + ' (' + columns + ')';
	            return new Promise(function (resolve, reject) {
	                if (_this9.db) {
	                    _this9.db.transaction(function (tx) {
	                        tx.executeSql(query);
	                    }, function (error) {
	                        reject(new Error(error.message));
	                        return false;
	                    }, function () {
	                        return resolve();
	                    });
	                } else {
	                    reject(new Error('Cordova SQLite plugin is not loaded!'));
	                }
	            });
	        }
	    }, {
	        key: '__filterQuery',
	        value: function __filterQuery(resourceConfig, params, query) {
	            var _this10 = this;

	            var joinedTables = [];

	            params = params || {};
	            params.where = params.where || {};
	            params.orderBy = params.orderBy || params.sort;
	            params.skip = params.skip || params.offset;

	            Object.keys(params).forEach(function (k) {
	                var v = params[k];
	                if (!(0, _array.contains)(reserved, k)) {
	                    if ((0, _lang.isObject)(v)) {
	                        params.where[k] = v;
	                    } else {
	                        params.where[k] = {
	                            '==': v
	                        };
	                    }
	                    delete params[k];
	                }
	            });

	            if (!(0, _lang.isEmpty)(params.where)) {
	                (0, _object.forOwn)(params.where, function (criteria, field) {
	                    if (!(0, _lang.isObject)(criteria)) {
	                        criteria = {
	                            '==': criteria
	                        };
	                        params.where[field] = criteria;
	                    }

	                    if ((0, _array.contains)(field, '.')) {
	                        if ((0, _array.contains)(field, ',')) {
	                            var splitFields = field.split(',').map(function (c) {
	                                return c.trim();
	                            });
	                            field = splitFields.map(function (splitField) {
	                                return processRelationField.call(_this10, resourceConfig, query, splitField, criteria, joinedTables);
	                            }).join(',');
	                        } else {
	                            field = processRelationField.call(_this10, resourceConfig, query, field, criteria, joinedTables);
	                        }
	                    }

	                    if (field) {
	                        (0, _object.forOwn)(criteria, function (v, op) {
	                            if (typeof v === 'boolean') {
	                                v = v ? 'true' : 'false';
	                            }

	                            // Builtin operators
	                            if (op === '==' || op === '===') {
	                                if (v === null) {
	                                    query = query.where(field + ' IS NULL');
	                                } else {
	                                    query = query.where(field + ' = ?', v);
	                                }
	                            } else if (op === '!=' || op === '!==') {
	                                if (v === null) {
	                                    query = query.where(field + ' IS NOT NULL');
	                                } else {
	                                    query = query.where(field + ' != ?', v);
	                                }
	                            } else if (op === '>') {
	                                query = query.where(field + ' > ?', v);
	                            } else if (op === '>=') {
	                                query = query.where(field + ' >= ?', v);
	                            } else if (op === '<') {
	                                query = query.where(field + ' < ?', v);
	                            } else if (op === '<=') {
	                                query = query.where(field + ' <= ?', v);
	                            } else if (op === 'in') {
	                                query = query.where(field + ' IN ?', v);
	                            } else if (op === 'notIn') {
	                                query = query.where(field + ' NOT IN ?', v);
	                            } else if (op === 'near') {
	                                throw new Error('Operator not supported');
	                            } else if (op === 'like') {
	                                query = query.where(field + ' LIKE ?', v);
	                            } else if (op === '|like') {
	                                query = query.where(_squel2.default.expr().or(field + ' LIKE ?', v));
	                            } else if (op === '|==' || op === '|===') {
	                                if (v === null) {
	                                    query = query.where(_squel2.default.expr().or(field + ' IS NULL'));
	                                } else {
	                                    query = query.where(_squel2.default.expr().or(field + ' = ?', v));
	                                }
	                            } else if (op === '|!=' || op === '|!==') {
	                                if (v === null) {
	                                    query = query.where(_squel2.default.expr().or(field + ' IS NOT NULL'));
	                                } else {
	                                    query = query.where(_squel2.default.expr().or(field + ' != ?', v));
	                                }
	                            } else if (op === '|>') {
	                                query = query.where(_squel2.default.expr().or(field + ' > ?', v));
	                            } else if (op === '|>=') {
	                                query = query.where(_squel2.default.expr().or(field + ' >= ?', v));
	                            } else if (op === '|<') {
	                                query = query.where(_squel2.default.expr().or(field + ' < ?', v));
	                            } else if (op === '|<=') {
	                                query = query.where(_squel2.default.expr().or(field + ' <= ?', v));
	                            } else if (op === '|in') {
	                                query = query.where(_squel2.default.expr().or(field + ' IN ?', v));
	                            } else if (op === '|notIn') {
	                                query = query.where(_squel2.default.expr().or(field + ' NOT IN ?', v));
	                            } else {
	                                throw new Error('Operator not found');
	                            }
	                        });
	                    }
	                });
	            }

	            if (params.orderBy) {
	                if ((0, _lang.isString)(params.orderBy)) {
	                    params.orderBy = [[params.orderBy, 'asc']];
	                }
	                for (var i = 0; i < params.orderBy.length; i++) {
	                    if ((0, _lang.isString)(params.orderBy[i])) {
	                        params.orderBy[i] = [params.orderBy[i], 'asc'];
	                    }
	                    query = params.orderBy[i][1].toUpperCase() === 'DESC' ? query.order(params.orderBy[i][0], false) : query.order(params.orderBy[i][0], true);
	                }
	            }

	            if (params.skip) {
	                query = query.offset(+params.offset);
	            }

	            if (params.limit) {
	                query = query.limit(+params.limit);
	            }

	            return query;
	        }
	    }, {
	        key: '__createTable',
	        value: function __createTable(resourceConfig, attrs, tx) {
	            var table = getTable(resourceConfig);
	            var attrsNames = [];
	            var hasPrimaryKey = false;

	            Object.keys(attrs).forEach(function (key) {
	                var str = key;
	                if (key === resourceConfig.idAttribute) {
	                    str = str.concat(' PRIMARY KEY');
	                    hasPrimaryKey = true;
	                }
	                attrsNames.push(str);
	            });

	            //Add primary key column if it's not included in the attributes
	            if (!hasPrimaryKey && resourceConfig.idAttribute) {
	                attrsNames.push(resourceConfig.idAttribute + ' INTEGER PRIMARY KEY ASC');
	            }

	            var attrsStr = attrsNames.join(', ');

	            //Creates table if it's the first insert of the resource
	            var createSyntax = 'CREATE TABLE IF NOT EXISTS ' + table + ' (' + attrsStr + ')';
	            return tx.executeSql(createSyntax);
	        }
	    }, {
	        key: '__normalizeAttributes',
	        value: function __normalizeAttributes(resourceConfig, attrs) {
	            var processed = (0, _object.deepMixIn)({}, attrs);
	            processed = removeCircular((0, _object.omit)(processed, resourceConfig.relationFields || []));

	            Object.keys(processed).forEach(function (key) {
	                var value = processed[key];
	                if (typeof value === 'boolean' || (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' || Array.isArray(value)) {
	                    processed[key] = JSON.stringify(value);
	                } else if (value === undefined) {
	                    processed[key] = null;
	                }
	            });

	            //Store ids always as strings
	            if (resourceConfig.idAttribute && processed[resourceConfig.idAttribute]) {
	                processed[resourceConfig.idAttribute] = processed[resourceConfig.idAttribute].toString();
	            }

	            return processed;
	        }
	    }, {
	        key: '__denormalizeAttributes',
	        value: function __denormalizeAttributes(item) {
	            var denormalizedItem = (0, _object.deepMixIn)({}, item);

	            Object.keys(denormalizedItem).forEach(function (key) {
	                var value = denormalizedItem[key];
	                if (value === 'true' || value === 'false' || typeof value === 'string' && (value.substr(0, 2) === '[{' || value.substr(0, 1) === '{')) {
	                    denormalizedItem[key] = JSON.parse(value);
	                }
	            });

	            return denormalizedItem;
	        }
	    }]);

	    return DSCordovaSQLiteAdapter;
	}();

	module.exports = DSCordovaSQLiteAdapter;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	

	//automatically generated, do not edit!
	//run `node build` instead
	module.exports = {
	    'append' : __webpack_require__(2),
	    'collect' : __webpack_require__(3),
	    'combine' : __webpack_require__(14),
	    'compact' : __webpack_require__(16),
	    'contains' : __webpack_require__(18),
	    'difference' : __webpack_require__(19),
	    'equals' : __webpack_require__(23),
	    'every' : __webpack_require__(25),
	    'filter' : __webpack_require__(17),
	    'find' : __webpack_require__(26),
	    'findIndex' : __webpack_require__(27),
	    'findLast' : __webpack_require__(28),
	    'findLastIndex' : __webpack_require__(29),
	    'flatten' : __webpack_require__(30),
	    'forEach' : __webpack_require__(31),
	    'groupBy' : __webpack_require__(32),
	    'indexOf' : __webpack_require__(15),
	    'insert' : __webpack_require__(33),
	    'intersection' : __webpack_require__(34),
	    'invoke' : __webpack_require__(35),
	    'join' : __webpack_require__(36),
	    'last' : __webpack_require__(37),
	    'lastIndexOf' : __webpack_require__(38),
	    'map' : __webpack_require__(39),
	    'max' : __webpack_require__(40),
	    'min' : __webpack_require__(41),
	    'pick' : __webpack_require__(42),
	    'pluck' : __webpack_require__(48),
	    'range' : __webpack_require__(49),
	    'reduce' : __webpack_require__(51),
	    'reduceRight' : __webpack_require__(52),
	    'reject' : __webpack_require__(53),
	    'remove' : __webpack_require__(54),
	    'removeAll' : __webpack_require__(55),
	    'reverse' : __webpack_require__(56),
	    'shuffle' : __webpack_require__(57),
	    'slice' : __webpack_require__(22),
	    'some' : __webpack_require__(21),
	    'sort' : __webpack_require__(58),
	    'sortBy' : __webpack_require__(59),
	    'split' : __webpack_require__(60),
	    'take' : __webpack_require__(61),
	    'toLookup' : __webpack_require__(62),
	    'union' : __webpack_require__(64),
	    'unique' : __webpack_require__(20),
	    'xor' : __webpack_require__(65),
	    'zip' : __webpack_require__(66)
	};




/***/ },
/* 2 */
/***/ function(module, exports) {

	

	    /**
	     * Appends an array to the end of another.
	     * The first array will be modified.
	     */
	    function append(arr1, arr2) {
	        if (arr2 == null) {
	            return arr1;
	        }

	        var pad = arr1.length,
	            i = -1,
	            len = arr2.length;
	        while (++i < len) {
	            arr1[pad + i] = arr2[i];
	        }
	        return arr1;
	    }
	    module.exports = append;



/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var append = __webpack_require__(2);
	var makeIterator = __webpack_require__(4);

	    /**
	     * Maps the items in the array and concatenates the result arrays.
	     */
	    function collect(arr, callback, thisObj){
	        callback = makeIterator(callback, thisObj);
	        var results = [];
	        if (arr == null) {
	            return results;
	        }

	        var i = -1, len = arr.length;
	        while (++i < len) {
	            var value = callback(arr[i], i, arr);
	            if (value != null) {
	                append(results, value);
	            }
	        }

	        return results;
	    }

	    module.exports = collect;




/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var identity = __webpack_require__(5);
	var prop = __webpack_require__(6);
	var deepMatches = __webpack_require__(7);

	    /**
	     * Converts argument into a valid iterator.
	     * Used internally on most array/object/collection methods that receives a
	     * callback/iterator providing a shortcut syntax.
	     */
	    function makeIterator(src, thisObj){
	        if (src == null) {
	            return identity;
	        }
	        switch(typeof src) {
	            case 'function':
	                // function is the first to improve perf (most common case)
	                // also avoid using `Function#call` if not needed, which boosts
	                // perf a lot in some cases
	                return (typeof thisObj !== 'undefined')? function(val, i, arr){
	                    return src.call(thisObj, val, i, arr);
	                } : src;
	            case 'object':
	                return function(val){
	                    return deepMatches(val, src);
	                };
	            case 'string':
	            case 'number':
	                return prop(src);
	        }
	    }

	    module.exports = makeIterator;




/***/ },
/* 5 */
/***/ function(module, exports) {

	

	    /**
	     * Returns the first argument provided to it.
	     */
	    function identity(val){
	        return val;
	    }

	    module.exports = identity;




/***/ },
/* 6 */
/***/ function(module, exports) {

	

	    /**
	     * Returns a function that gets a property of the passed object
	     */
	    function prop(name){
	        return function(obj){
	            return obj[name];
	        };
	    }

	    module.exports = prop;




/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);
	var isArray = __webpack_require__(11);

	    function containsMatch(array, pattern) {
	        var i = -1, length = array.length;
	        while (++i < length) {
	            if (deepMatches(array[i], pattern)) {
	                return true;
	            }
	        }

	        return false;
	    }

	    function matchArray(target, pattern) {
	        var i = -1, patternLength = pattern.length;
	        while (++i < patternLength) {
	            if (!containsMatch(target, pattern[i])) {
	                return false;
	            }
	        }

	        return true;
	    }

	    function matchObject(target, pattern) {
	        var result = true;
	        forOwn(pattern, function(val, key) {
	            if (!deepMatches(target[key], val)) {
	                // Return false to break out of forOwn early
	                return (result = false);
	            }
	        });

	        return result;
	    }

	    /**
	     * Recursively check if the objects match.
	     */
	    function deepMatches(target, pattern){
	        if (target && typeof target === 'object') {
	            if (isArray(target) && isArray(pattern)) {
	                return matchArray(target, pattern);
	            } else {
	                return matchObject(target, pattern);
	            }
	        } else {
	            return target === pattern;
	        }
	    }

	    module.exports = deepMatches;




/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var hasOwn = __webpack_require__(9);
	var forIn = __webpack_require__(10);

	    /**
	     * Similar to Array/forEach but works over object properties and fixes Don't
	     * Enum bug on IE.
	     * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
	     */
	    function forOwn(obj, fn, thisObj){
	        forIn(obj, function(val, key){
	            if (hasOwn(obj, key)) {
	                return fn.call(thisObj, obj[key], key, obj);
	            }
	        });
	    }

	    module.exports = forOwn;




/***/ },
/* 9 */
/***/ function(module, exports) {

	

	    /**
	     * Safer Object.hasOwnProperty
	     */
	     function hasOwn(obj, prop){
	         return Object.prototype.hasOwnProperty.call(obj, prop);
	     }

	     module.exports = hasOwn;




/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var hasOwn = __webpack_require__(9);

	    var _hasDontEnumBug,
	        _dontEnums;

	    function checkDontEnum(){
	        _dontEnums = [
	                'toString',
	                'toLocaleString',
	                'valueOf',
	                'hasOwnProperty',
	                'isPrototypeOf',
	                'propertyIsEnumerable',
	                'constructor'
	            ];

	        _hasDontEnumBug = true;

	        for (var key in {'toString': null}) {
	            _hasDontEnumBug = false;
	        }
	    }

	    /**
	     * Similar to Array/forEach but works over object properties and fixes Don't
	     * Enum bug on IE.
	     * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
	     */
	    function forIn(obj, fn, thisObj){
	        var key, i = 0;
	        // no need to check if argument is a real object that way we can use
	        // it for arrays, functions, date, etc.

	        //post-pone check till needed
	        if (_hasDontEnumBug == null) checkDontEnum();

	        for (key in obj) {
	            if (exec(fn, obj, key, thisObj) === false) {
	                break;
	            }
	        }


	        if (_hasDontEnumBug) {
	            var ctor = obj.constructor,
	                isProto = !!ctor && obj === ctor.prototype;

	            while (key = _dontEnums[i++]) {
	                // For constructor, if it is a prototype object the constructor
	                // is always non-enumerable unless defined otherwise (and
	                // enumerated above).  For non-prototype objects, it will have
	                // to be defined on this object, since it cannot be defined on
	                // any prototype objects.
	                //
	                // For other [[DontEnum]] properties, check if the value is
	                // different than Object prototype value.
	                if (
	                    (key !== 'constructor' ||
	                        (!isProto && hasOwn(obj, key))) &&
	                    obj[key] !== Object.prototype[key]
	                ) {
	                    if (exec(fn, obj, key, thisObj) === false) {
	                        break;
	                    }
	                }
	            }
	        }
	    }

	    function exec(fn, obj, key, thisObj){
	        return fn.call(thisObj, obj[key], key, obj);
	    }

	    module.exports = forIn;




/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var isKind = __webpack_require__(12);
	    /**
	     */
	    var isArray = Array.isArray || function (val) {
	        return isKind(val, 'Array');
	    };
	    module.exports = isArray;



/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var kindOf = __webpack_require__(13);
	    /**
	     * Check if value is from a specific "kind".
	     */
	    function isKind(val, kind){
	        return kindOf(val) === kind;
	    }
	    module.exports = isKind;



/***/ },
/* 13 */
/***/ function(module, exports) {

	

	    var _rKind = /^\[object (.*)\]$/,
	        _toString = Object.prototype.toString,
	        UNDEF;

	    /**
	     * Gets the "kind" of value. (e.g. "String", "Number", etc)
	     */
	    function kindOf(val) {
	        if (val === null) {
	            return 'Null';
	        } else if (val === UNDEF) {
	            return 'Undefined';
	        } else {
	            return _rKind.exec( _toString.call(val) )[1];
	        }
	    }
	    module.exports = kindOf;



/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var indexOf = __webpack_require__(15);

	    /**
	     * Combines an array with all the items of another.
	     * Does not allow duplicates and is case and type sensitive.
	     */
	    function combine(arr1, arr2) {
	        if (arr2 == null) {
	            return arr1;
	        }

	        var i = -1, len = arr2.length;
	        while (++i < len) {
	            if (indexOf(arr1, arr2[i]) === -1) {
	                arr1.push(arr2[i]);
	            }
	        }

	        return arr1;
	    }
	    module.exports = combine;



/***/ },
/* 15 */
/***/ function(module, exports) {

	

	    /**
	     * Array.indexOf
	     */
	    function indexOf(arr, item, fromIndex) {
	        fromIndex = fromIndex || 0;
	        if (arr == null) {
	            return -1;
	        }

	        var len = arr.length,
	            i = fromIndex < 0 ? len + fromIndex : fromIndex;
	        while (i < len) {
	            // we iterate over sparse items since there is no way to make it
	            // work properly on IE 7-8. see #64
	            if (arr[i] === item) {
	                return i;
	            }

	            i++;
	        }

	        return -1;
	    }

	    module.exports = indexOf;



/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var filter = __webpack_require__(17);

	    /**
	     * Remove all null/undefined items from array.
	     */
	    function compact(arr) {
	        return filter(arr, function(val){
	            return (val != null);
	        });
	    }

	    module.exports = compact;



/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var makeIterator = __webpack_require__(4);

	    /**
	     * Array filter
	     */
	    function filter(arr, callback, thisObj) {
	        callback = makeIterator(callback, thisObj);
	        var results = [];
	        if (arr == null) {
	            return results;
	        }

	        var i = -1, len = arr.length, value;
	        while (++i < len) {
	            value = arr[i];
	            if (callback(value, i, arr)) {
	                results.push(value);
	            }
	        }

	        return results;
	    }

	    module.exports = filter;




/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var indexOf = __webpack_require__(15);

	    /**
	     * If array contains values.
	     */
	    function contains(arr, val) {
	        return indexOf(arr, val) !== -1;
	    }
	    module.exports = contains;



/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	var unique = __webpack_require__(20);
	var filter = __webpack_require__(17);
	var some = __webpack_require__(21);
	var contains = __webpack_require__(18);
	var slice = __webpack_require__(22);


	    /**
	     * Return a new Array with elements that aren't present in the other Arrays.
	     */
	    function difference(arr) {
	        var arrs = slice(arguments, 1),
	            result = filter(unique(arr), function(needle){
	                return !some(arrs, function(haystack){
	                    return contains(haystack, needle);
	                });
	            });
	        return result;
	    }

	    module.exports = difference;




/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var filter = __webpack_require__(17);

	    /**
	     * @return {array} Array of unique items
	     */
	    function unique(arr, compare){
	        compare = compare || isEqual;
	        return filter(arr, function(item, i, arr){
	            var n = arr.length;
	            while (++i < n) {
	                if ( compare(item, arr[i]) ) {
	                    return false;
	                }
	            }
	            return true;
	        });
	    }

	    function isEqual(a, b){
	        return a === b;
	    }

	    module.exports = unique;




/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var makeIterator = __webpack_require__(4);

	    /**
	     * Array some
	     */
	    function some(arr, callback, thisObj) {
	        callback = makeIterator(callback, thisObj);
	        var result = false;
	        if (arr == null) {
	            return result;
	        }

	        var i = -1, len = arr.length;
	        while (++i < len) {
	            // we iterate over sparse items since there is no way to make it
	            // work properly on IE 7-8. see #64
	            if ( callback(arr[i], i, arr) ) {
	                result = true;
	                break;
	            }
	        }

	        return result;
	    }

	    module.exports = some;



/***/ },
/* 22 */
/***/ function(module, exports) {

	

	    /**
	     * Create slice of source array or array-like object
	     */
	    function slice(arr, start, end){
	        var len = arr.length;

	        if (start == null) {
	            start = 0;
	        } else if (start < 0) {
	            start = Math.max(len + start, 0);
	        } else {
	            start = Math.min(start, len);
	        }

	        if (end == null) {
	            end = len;
	        } else if (end < 0) {
	            end = Math.max(len + end, 0);
	        } else {
	            end = Math.min(end, len);
	        }

	        var result = [];
	        while (start < end) {
	            result.push(arr[start++]);
	        }

	        return result;
	    }

	    module.exports = slice;




/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var is = __webpack_require__(24);
	var isArray = __webpack_require__(11);
	var every = __webpack_require__(25);

	    /**
	     * Compares if both arrays have the same elements
	     */
	    function equals(a, b, callback){
	        callback = callback || is;

	        if (!isArray(a) || !isArray(b)) {
	            return callback(a, b);
	        }

	        if (a.length !== b.length) {
	            return false;
	        }

	        return every(a, makeCompare(callback), b);
	    }

	    function makeCompare(callback) {
	        return function(value, i) {
	            return i in this && callback(value, this[i]);
	        };
	    }

	    module.exports = equals;




/***/ },
/* 24 */
/***/ function(module, exports) {

	

	    /**
	     * Check if both arguments are egal.
	     */
	    function is(x, y){
	        // implementation borrowed from harmony:egal spec
	        if (x === y) {
	          // 0 === -0, but they are not identical
	          return x !== 0 || 1 / x === 1 / y;
	        }

	        // NaN !== NaN, but they are identical.
	        // NaNs are the only non-reflexive value, i.e., if x !== x,
	        // then x is a NaN.
	        // isNaN is broken: it converts its argument to number, so
	        // isNaN("foo") => true
	        return x !== x && y !== y;
	    }

	    module.exports = is;




/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var makeIterator = __webpack_require__(4);

	    /**
	     * Array every
	     */
	    function every(arr, callback, thisObj) {
	        callback = makeIterator(callback, thisObj);
	        var result = true;
	        if (arr == null) {
	            return result;
	        }

	        var i = -1, len = arr.length;
	        while (++i < len) {
	            // we iterate over sparse items since there is no way to make it
	            // work properly on IE 7-8. see #64
	            if (!callback(arr[i], i, arr) ) {
	                result = false;
	                break;
	            }
	        }

	        return result;
	    }

	    module.exports = every;



/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var findIndex = __webpack_require__(27);

	    /**
	     * Returns first item that matches criteria
	     */
	    function find(arr, iterator, thisObj){
	        var idx = findIndex(arr, iterator, thisObj);
	        return idx >= 0? arr[idx] : void(0);
	    }

	    module.exports = find;




/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var makeIterator = __webpack_require__(4);

	    /**
	     * Returns the index of the first item that matches criteria
	     */
	    function findIndex(arr, iterator, thisObj){
	        iterator = makeIterator(iterator, thisObj);
	        if (arr == null) {
	            return -1;
	        }

	        var i = -1, len = arr.length;
	        while (++i < len) {
	            if (iterator(arr[i], i, arr)) {
	                return i;
	            }
	        }

	        return -1;
	    }

	    module.exports = findIndex;



/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var findLastIndex = __webpack_require__(29);

	    /**
	     * Returns last item that matches criteria
	     */
	    function findLast(arr, iterator, thisObj){
	        var idx = findLastIndex(arr, iterator, thisObj);
	        return idx >= 0? arr[idx] : void(0);
	    }

	    module.exports = findLast;




/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	var makeIterator = __webpack_require__(4);

	    /**
	     * Returns the index of the last item that matches criteria
	     */
	    function findLastIndex(arr, iterator, thisObj){
	        iterator = makeIterator(iterator, thisObj);
	        if (arr == null) {
	            return -1;
	        }

	        var n = arr.length;
	        while (--n >= 0) {
	            if (iterator(arr[n], n, arr)) {
	                return n;
	            }
	        }

	        return -1;
	    }

	    module.exports = findLastIndex;




/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var isArray = __webpack_require__(11);
	var append = __webpack_require__(2);

	    /*
	     * Helper function to flatten to a destination array.
	     * Used to remove the need to create intermediate arrays while flattening.
	     */
	    function flattenTo(arr, result, level) {
	        if (level === 0) {
	            append(result, arr);
	            return result;
	        }

	        var value,
	            i = -1,
	            len = arr.length;
	        while (++i < len) {
	            value = arr[i];
	            if (isArray(value)) {
	                flattenTo(value, result, level - 1);
	            } else {
	                result.push(value);
	            }
	        }
	        return result;
	    }

	    /**
	     * Recursively flattens an array.
	     * A new array containing all the elements is returned.
	     * If level is specified, it will only flatten up to that level.
	     */
	    function flatten(arr, level) {
	        if (arr == null) {
	            return [];
	        }

	        level = level == null ? -1 : level;
	        return flattenTo(arr, [], level);
	    }

	    module.exports = flatten;





/***/ },
/* 31 */
/***/ function(module, exports) {

	

	    /**
	     * Array forEach
	     */
	    function forEach(arr, callback, thisObj) {
	        if (arr == null) {
	            return;
	        }
	        var i = -1,
	            len = arr.length;
	        while (++i < len) {
	            // we iterate over sparse items since there is no way to make it
	            // work properly on IE 7-8. see #64
	            if ( callback.call(thisObj, arr[i], i, arr) === false ) {
	                break;
	            }
	        }
	    }

	    module.exports = forEach;




/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var forEach = __webpack_require__(31);
	var identity = __webpack_require__(5);
	var makeIterator = __webpack_require__(4);

	    /**
	     * Bucket the array values.
	     */
	    function groupBy(arr, categorize, thisObj) {
	        if (categorize) {
	            categorize = makeIterator(categorize, thisObj);
	        } else {
	            // Default to identity function.
	            categorize = identity;
	        }

	        var buckets = {};
	        forEach(arr, function(element) {
	            var bucket = categorize(element);
	            if (!(bucket in buckets)) {
	                buckets[bucket] = [];
	            }

	            buckets[bucket].push(element);
	        });

	        return buckets;
	    }

	    module.exports = groupBy;



/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	var difference = __webpack_require__(19);
	var slice = __webpack_require__(22);

	    /**
	     * Insert item into array if not already present.
	     */
	    function insert(arr, rest_items) {
	        var diff = difference(slice(arguments, 1), arr);
	        if (diff.length) {
	            Array.prototype.push.apply(arr, diff);
	        }
	        return arr.length;
	    }
	    module.exports = insert;



/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	var unique = __webpack_require__(20);
	var filter = __webpack_require__(17);
	var every = __webpack_require__(25);
	var contains = __webpack_require__(18);
	var slice = __webpack_require__(22);


	    /**
	     * Return a new Array with elements common to all Arrays.
	     * - based on underscore.js implementation
	     */
	    function intersection(arr) {
	        var arrs = slice(arguments, 1),
	            result = filter(unique(arr), function(needle){
	                return every(arrs, function(haystack){
	                    return contains(haystack, needle);
	                });
	            });
	        return result;
	    }

	    module.exports = intersection;




/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var slice = __webpack_require__(22);

	    /**
	     * Call `methodName` on each item of the array passing custom arguments if
	     * needed.
	     */
	    function invoke(arr, methodName, var_args){
	        if (arr == null) {
	            return arr;
	        }

	        var args = slice(arguments, 2);
	        var i = -1, len = arr.length, value;
	        while (++i < len) {
	            value = arr[i];
	            value[methodName].apply(value, args);
	        }

	        return arr;
	    }

	    module.exports = invoke;



/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	var filter = __webpack_require__(17);

	    function isValidString(val) {
	        return (val != null && val !== '');
	    }

	    /**
	     * Joins strings with the specified separator inserted between each value.
	     * Null values and empty strings will be excluded.
	     */
	    function join(items, separator) {
	        separator = separator || '';
	        return filter(items, isValidString).join(separator);
	    }

	    module.exports = join;



/***/ },
/* 37 */
/***/ function(module, exports) {

	

	    /**
	     * Returns last element of array.
	     */
	    function last(arr){
	        if (arr == null || arr.length < 1) {
	            return undefined;
	        }

	        return arr[arr.length - 1];
	    }

	    module.exports = last;




/***/ },
/* 38 */
/***/ function(module, exports) {

	

	    /**
	     * Array lastIndexOf
	     */
	    function lastIndexOf(arr, item, fromIndex) {
	        if (arr == null) {
	            return -1;
	        }

	        var len = arr.length;
	        fromIndex = (fromIndex == null || fromIndex >= len)? len - 1 : fromIndex;
	        fromIndex = (fromIndex < 0)? len + fromIndex : fromIndex;

	        while (fromIndex >= 0) {
	            // we iterate over sparse items since there is no way to make it
	            // work properly on IE 7-8. see #64
	            if (arr[fromIndex] === item) {
	                return fromIndex;
	            }
	            fromIndex--;
	        }

	        return -1;
	    }

	    module.exports = lastIndexOf;



/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	var makeIterator = __webpack_require__(4);

	    /**
	     * Array map
	     */
	    function map(arr, callback, thisObj) {
	        callback = makeIterator(callback, thisObj);
	        var results = [];
	        if (arr == null){
	            return results;
	        }

	        var i = -1, len = arr.length;
	        while (++i < len) {
	            results[i] = callback(arr[i], i, arr);
	        }

	        return results;
	    }

	     module.exports = map;



/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	var makeIterator = __webpack_require__(4);

	    /**
	     * Return maximum value inside array
	     */
	    function max(arr, iterator, thisObj){
	        if (arr == null || !arr.length) {
	            return Infinity;
	        } else if (arr.length && !iterator) {
	            return Math.max.apply(Math, arr);
	        } else {
	            iterator = makeIterator(iterator, thisObj);
	            var result,
	                compare = -Infinity,
	                value,
	                temp;

	            var i = -1, len = arr.length;
	            while (++i < len) {
	                value = arr[i];
	                temp = iterator(value, i, arr);
	                if (temp > compare) {
	                    compare = temp;
	                    result = value;
	                }
	            }

	            return result;
	        }
	    }

	    module.exports = max;




/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	var makeIterator = __webpack_require__(4);

	    /**
	     * Return minimum value inside array
	     */
	    function min(arr, iterator, thisObj){
	        if (arr == null || !arr.length) {
	            return -Infinity;
	        } else if (arr.length && !iterator) {
	            return Math.min.apply(Math, arr);
	        } else {
	            iterator = makeIterator(iterator, thisObj);
	            var result,
	                compare = Infinity,
	                value,
	                temp;

	            var i = -1, len = arr.length;
	            while (++i < len) {
	                value = arr[i];
	                temp = iterator(value, i, arr);
	                if (temp < compare) {
	                    compare = temp;
	                    result = value;
	                }
	            }

	            return result;
	        }
	    }

	    module.exports = min;




/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var randInt = __webpack_require__(43);

	    /**
	     * Remove random item(s) from the Array and return it.
	     * Returns an Array of items if [nItems] is provided or a single item if
	     * it isn't specified.
	     */
	    function pick(arr, nItems){
	        if (nItems != null) {
	            var result = [];
	            if (nItems > 0 && arr && arr.length) {
	                nItems = nItems > arr.length? arr.length : nItems;
	                while (nItems--) {
	                    result.push( pickOne(arr) );
	                }
	            }
	            return result;
	        }
	        return (arr && arr.length)? pickOne(arr) : void(0);
	    }


	    function pickOne(arr){
	        var idx = randInt(0, arr.length - 1);
	        return arr.splice(idx, 1)[0];
	    }


	    module.exports = pick;




/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	var MIN_INT = __webpack_require__(44);
	var MAX_INT = __webpack_require__(45);
	var rand = __webpack_require__(46);

	    /**
	     * Gets random integer inside range or snap to min/max values.
	     */
	    function randInt(min, max){
	        min = min == null? MIN_INT : ~~min;
	        max = max == null? MAX_INT : ~~max;
	        // can't be max + 0.5 otherwise it will round up if `rand`
	        // returns `max` causing it to overflow range.
	        // -0.5 and + 0.49 are required to avoid bias caused by rounding
	        return Math.round( rand(min - 0.5, max + 0.499999999999) );
	    }

	    module.exports = randInt;



/***/ },
/* 44 */
/***/ function(module, exports) {

	/**
	 * @constant Minimum 32-bit signed integer value (-2^31).
	 */

	    module.exports = -2147483648;



/***/ },
/* 45 */
/***/ function(module, exports) {

	/**
	 * @constant Maximum 32-bit signed integer value. (2^31 - 1)
	 */

	    module.exports = 2147483647;



/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	var random = __webpack_require__(47);
	var MIN_INT = __webpack_require__(44);
	var MAX_INT = __webpack_require__(45);

	    /**
	     * Returns random number inside range
	     */
	    function rand(min, max){
	        min = min == null? MIN_INT : min;
	        max = max == null? MAX_INT : max;
	        return min + (max - min) * random();
	    }

	    module.exports = rand;



/***/ },
/* 47 */
/***/ function(module, exports) {

	

	    /**
	     * Just a wrapper to Math.random. No methods inside mout/random should call
	     * Math.random() directly so we can inject the pseudo-random number
	     * generator if needed (ie. in case we need a seeded random or a better
	     * algorithm than the native one)
	     */
	    function random(){
	        return random.get();
	    }

	    // we expose the method so it can be swapped if needed
	    random.get = Math.random;

	    module.exports = random;




/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	var map = __webpack_require__(39);

	    /**
	     * Extract a list of property values.
	     */
	    function pluck(arr, propName){
	        return map(arr, propName);
	    }

	    module.exports = pluck;




/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	var countSteps = __webpack_require__(50);

	    /**
	     * Returns an Array of numbers inside range.
	     */
	    function range(start, stop, step) {
	        if (stop == null) {
	            stop = start;
	            start = 0;
	        }
	        step = step || 1;

	        var result = [],
	            nSteps = countSteps(stop - start, step),
	            i = start;

	        while (i <= stop) {
	            result.push(i);
	            i += step;
	        }

	        return result;
	    }

	    module.exports = range;




/***/ },
/* 50 */
/***/ function(module, exports) {

	
	    /**
	    * Count number of full steps.
	    */
	    function countSteps(val, step, overflow){
	        val = Math.floor(val / step);

	        if (overflow) {
	            return val % overflow;
	        }

	        return val;
	    }

	    module.exports = countSteps;



/***/ },
/* 51 */
/***/ function(module, exports) {

	

	    /**
	     * Array reduce
	     */
	    function reduce(arr, fn, initVal) {
	        // check for args.length since initVal might be "undefined" see #gh-57
	        var hasInit = arguments.length > 2,
	            result = initVal;

	        if (arr == null || !arr.length) {
	            if (!hasInit) {
	                throw new Error('reduce of empty array with no initial value');
	            } else {
	                return initVal;
	            }
	        }

	        var i = -1, len = arr.length;
	        while (++i < len) {
	            if (!hasInit) {
	                result = arr[i];
	                hasInit = true;
	            } else {
	                result = fn(result, arr[i], i, arr);
	            }
	        }

	        return result;
	    }

	    module.exports = reduce;



/***/ },
/* 52 */
/***/ function(module, exports) {

	

	    /**
	     * Array reduceRight
	     */
	    function reduceRight(arr, fn, initVal) {
	        // check for args.length since initVal might be "undefined" see #gh-57
	        var hasInit = arguments.length > 2;

	        if (arr == null || !arr.length) {
	            if (hasInit) {
	                return initVal;
	            } else {
	                throw new Error('reduce of empty array with no initial value');
	            }
	        }

	        var i = arr.length, result = initVal, value;
	        while (--i >= 0) {
	            // we iterate over sparse items since there is no way to make it
	            // work properly on IE 7-8. see #64
	            value = arr[i];
	            if (!hasInit) {
	                result = value;
	                hasInit = true;
	            } else {
	                result = fn(result, value, i, arr);
	            }
	        }
	        return result;
	    }

	    module.exports = reduceRight;



/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	var makeIterator = __webpack_require__(4);

	    /**
	     * Array reject
	     */
	    function reject(arr, callback, thisObj) {
	        callback = makeIterator(callback, thisObj);
	        var results = [];
	        if (arr == null) {
	            return results;
	        }

	        var i = -1, len = arr.length, value;
	        while (++i < len) {
	            value = arr[i];
	            if (!callback(value, i, arr)) {
	                results.push(value);
	            }
	        }

	        return results;
	    }

	    module.exports = reject;



/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	var indexOf = __webpack_require__(15);

	    /**
	     * Remove a single item from the array.
	     * (it won't remove duplicates, just a single item)
	     */
	    function remove(arr, item){
	        var idx = indexOf(arr, item);
	        if (idx !== -1) arr.splice(idx, 1);
	    }

	    module.exports = remove;



/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	var indexOf = __webpack_require__(15);

	    /**
	     * Remove all instances of an item from array.
	     */
	    function removeAll(arr, item){
	        var idx = indexOf(arr, item);
	        while (idx !== -1) {
	            arr.splice(idx, 1);
	            idx = indexOf(arr, item, idx);
	        }
	    }

	    module.exports = removeAll;



/***/ },
/* 56 */
/***/ function(module, exports) {

	

	    /**
	     * Returns a copy of the array in reversed order.
	     */
	    function reverse(array) {
	        var copy = array.slice();
	        copy.reverse();
	        return copy;
	    }

	    module.exports = reverse;




/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	var randInt = __webpack_require__(43);

	    /**
	     * Shuffle array items.
	     */
	    function shuffle(arr) {
	        var results = [],
	            rnd;
	        if (arr == null) {
	            return results;
	        }

	        var i = -1, len = arr.length, value;
	        while (++i < len) {
	            if (!i) {
	                results[0] = arr[0];
	            } else {
	                rnd = randInt(0, i);
	                results[i] = results[rnd];
	                results[rnd] = arr[i];
	            }
	        }

	        return results;
	    }

	    module.exports = shuffle;



/***/ },
/* 58 */
/***/ function(module, exports) {

	

	    /**
	     * Merge sort (http://en.wikipedia.org/wiki/Merge_sort)
	     */
	    function mergeSort(arr, compareFn) {
	        if (arr == null) {
	            return [];
	        } else if (arr.length < 2) {
	            return arr;
	        }

	        if (compareFn == null) {
	            compareFn = defaultCompare;
	        }

	        var mid, left, right;

	        mid   = ~~(arr.length / 2);
	        left  = mergeSort( arr.slice(0, mid), compareFn );
	        right = mergeSort( arr.slice(mid, arr.length), compareFn );

	        return merge(left, right, compareFn);
	    }

	    function defaultCompare(a, b) {
	        return a < b ? -1 : (a > b? 1 : 0);
	    }

	    function merge(left, right, compareFn) {
	        var result = [];

	        while (left.length && right.length) {
	            if (compareFn(left[0], right[0]) <= 0) {
	                // if 0 it should preserve same order (stable)
	                result.push(left.shift());
	            } else {
	                result.push(right.shift());
	            }
	        }

	        if (left.length) {
	            result.push.apply(result, left);
	        }

	        if (right.length) {
	            result.push.apply(result, right);
	        }

	        return result;
	    }

	    module.exports = mergeSort;




/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	var sort = __webpack_require__(58);
	var makeIterator = __webpack_require__(4);

	    /*
	     * Sort array by the result of the callback
	     */
	    function sortBy(arr, callback, context){
	        callback = makeIterator(callback, context);

	        return sort(arr, function(a, b) {
	            a = callback(a);
	            b = callback(b);
	            return (a < b) ? -1 : ((a > b) ? 1 : 0);
	        });
	    }

	    module.exports = sortBy;




/***/ },
/* 60 */
/***/ function(module, exports) {

	

	    /**
	     * Split array into a fixed number of segments.
	     */
	    function split(array, segments) {
	        segments = segments || 2;
	        var results = [];
	        if (array == null) {
	            return results;
	        }

	        var minLength = Math.floor(array.length / segments),
	            remainder = array.length % segments,
	            i = 0,
	            len = array.length,
	            segmentIndex = 0,
	            segmentLength;

	        while (i < len) {
	            segmentLength = minLength;
	            if (segmentIndex < remainder) {
	                segmentLength++;
	            }

	            results.push(array.slice(i, i + segmentLength));

	            segmentIndex++;
	            i += segmentLength;
	        }

	        return results;
	    }
	    module.exports = split;



/***/ },
/* 61 */
/***/ function(module, exports) {

	

	    /**
	     * Iterates over a callback a set amount of times
	     * returning the results
	     */
	    function take(n, callback, thisObj){
	        var i = -1;
	        var arr = [];
	        if( !thisObj ){
	            while(++i < n){
	                arr[i] = callback(i, n);
	            }
	        } else {
	            while(++i < n){
	                arr[i] = callback.call(thisObj, i, n);
	            }
	        }
	        return arr;
	    }

	    module.exports = take;




/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	var isFunction = __webpack_require__(63);

	    /**
	     * Creates an object that holds a lookup for the objects in the array.
	     */
	    function toLookup(arr, key) {
	        var result = {};
	        if (arr == null) {
	            return result;
	        }

	        var i = -1, len = arr.length, value;
	        if (isFunction(key)) {
	            while (++i < len) {
	                value = arr[i];
	                result[key(value)] = value;
	            }
	        } else {
	            while (++i < len) {
	                value = arr[i];
	                result[value[key]] = value;
	            }
	        }

	        return result;
	    }
	    module.exports = toLookup;



/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	var isKind = __webpack_require__(12);
	    /**
	     */
	    function isFunction(val) {
	        return isKind(val, 'Function');
	    }
	    module.exports = isFunction;



/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var unique = __webpack_require__(20);
	var append = __webpack_require__(2);

	    /**
	     * Concat multiple arrays and remove duplicates
	     */
	    function union(arrs) {
	        var results = [];
	        var i = -1, len = arguments.length;
	        while (++i < len) {
	            append(results, arguments[i]);
	        }

	        return unique(results);
	    }

	    module.exports = union;




/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	var unique = __webpack_require__(20);
	var filter = __webpack_require__(17);
	var contains = __webpack_require__(18);


	    /**
	     * Exclusive OR. Returns items that are present in a single array.
	     * - like ptyhon's `symmetric_difference`
	     */
	    function xor(arr1, arr2) {
	        arr1 = unique(arr1);
	        arr2 = unique(arr2);

	        var a1 = filter(arr1, function(item){
	                return !contains(arr2, item);
	            }),
	            a2 = filter(arr2, function(item){
	                return !contains(arr1, item);
	            });

	        return a1.concat(a2);
	    }

	    module.exports = xor;




/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	var max = __webpack_require__(40);
	var map = __webpack_require__(39);

	    function getLength(arr) {
	        return arr == null ? 0 : arr.length;
	    }

	    /**
	     * Merges together the values of each of the arrays with the values at the
	     * corresponding position.
	     */
	    function zip(arr){
	        var len = arr ? max(map(arguments, getLength)) : 0,
	            results = [],
	            i = -1;
	        while (++i < len) {
	            // jshint loopfunc: true
	            results.push(map(arguments, function(item) {
	                return item == null ? undefined : item[i];
	            }));
	        }

	        return results;
	    }

	    module.exports = zip;




/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	

	//automatically generated, do not edit!
	//run `node build` instead
	module.exports = {
	    'GLOBAL' : __webpack_require__(68),
	    'clone' : __webpack_require__(69),
	    'createObject' : __webpack_require__(72),
	    'ctorApply' : __webpack_require__(73),
	    'deepClone' : __webpack_require__(74),
	    'deepEquals' : __webpack_require__(75),
	    'defaults' : __webpack_require__(79),
	    'inheritPrototype' : __webpack_require__(81),
	    'is' : __webpack_require__(24),
	    'isArguments' : __webpack_require__(82),
	    'isArray' : __webpack_require__(11),
	    'isBoolean' : __webpack_require__(83),
	    'isDate' : __webpack_require__(84),
	    'isEmpty' : __webpack_require__(85),
	    'isFinite' : __webpack_require__(86),
	    'isFunction' : __webpack_require__(63),
	    'isInteger' : __webpack_require__(88),
	    'isKind' : __webpack_require__(12),
	    'isNaN' : __webpack_require__(89),
	    'isNull' : __webpack_require__(91),
	    'isNumber' : __webpack_require__(87),
	    'isObject' : __webpack_require__(76),
	    'isPlainObject' : __webpack_require__(70),
	    'isPrimitive' : __webpack_require__(92),
	    'isRegExp' : __webpack_require__(93),
	    'isString' : __webpack_require__(94),
	    'isUndefined' : __webpack_require__(95),
	    'isnt' : __webpack_require__(96),
	    'kindOf' : __webpack_require__(13),
	    'toArray' : __webpack_require__(80),
	    'toNumber' : __webpack_require__(97),
	    'toString' : __webpack_require__(98)
	};




/***/ },
/* 68 */
/***/ function(module, exports) {

	

	    // Reference to the global context (works on ES3 and ES5-strict mode)
	    //jshint -W061, -W064
	    module.exports = Function('return this')();




/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	var kindOf = __webpack_require__(13);
	var isPlainObject = __webpack_require__(70);
	var mixIn = __webpack_require__(71);

	    /**
	     * Clone native types.
	     */
	    function clone(val){
	        switch (kindOf(val)) {
	            case 'Object':
	                return cloneObject(val);
	            case 'Array':
	                return cloneArray(val);
	            case 'RegExp':
	                return cloneRegExp(val);
	            case 'Date':
	                return cloneDate(val);
	            default:
	                return val;
	        }
	    }

	    function cloneObject(source) {
	        if (isPlainObject(source)) {
	            return mixIn({}, source);
	        } else {
	            return source;
	        }
	    }

	    function cloneRegExp(r) {
	        var flags = '';
	        flags += r.multiline ? 'm' : '';
	        flags += r.global ? 'g' : '';
	        flags += r.ignoreCase ? 'i' : '';
	        return new RegExp(r.source, flags);
	    }

	    function cloneDate(date) {
	        return new Date(+date);
	    }

	    function cloneArray(arr) {
	        return arr.slice();
	    }

	    module.exports = clone;




/***/ },
/* 70 */
/***/ function(module, exports) {

	

	    /**
	     * Checks if the value is created by the `Object` constructor.
	     */
	    function isPlainObject(value) {
	        return (!!value && typeof value === 'object' &&
	            value.constructor === Object);
	    }

	    module.exports = isPlainObject;




/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);

	    /**
	    * Combine properties from all the objects into first one.
	    * - This method affects target object in place, if you want to create a new Object pass an empty object as first param.
	    * @param {object} target    Target Object
	    * @param {...object} objects    Objects to be combined (0...n objects).
	    * @return {object} Target Object.
	    */
	    function mixIn(target, objects){
	        var i = 0,
	            n = arguments.length,
	            obj;
	        while(++i < n){
	            obj = arguments[i];
	            if (obj != null) {
	                forOwn(obj, copyProp, target);
	            }
	        }
	        return target;
	    }

	    function copyProp(val, key){
	        this[key] = val;
	    }

	    module.exports = mixIn;



/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	var mixIn = __webpack_require__(71);

	    /**
	     * Create Object using prototypal inheritance and setting custom properties.
	     * - Mix between Douglas Crockford Prototypal Inheritance <http://javascript.crockford.com/prototypal.html> and the EcmaScript 5 `Object.create()` method.
	     * @param {object} parent    Parent Object.
	     * @param {object} [props] Object properties.
	     * @return {object} Created object.
	     */
	    function createObject(parent, props){
	        function F(){}
	        F.prototype = parent;
	        return mixIn(new F(), props);

	    }
	    module.exports = createObject;




/***/ },
/* 73 */
/***/ function(module, exports) {

	

	    function F(){}

	    /**
	     * Do fn.apply on a constructor.
	     */
	    function ctorApply(ctor, args) {
	        F.prototype = ctor.prototype;
	        var instance = new F();
	        ctor.apply(instance, args);
	        return instance;
	    }

	    module.exports = ctorApply;




/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	var clone = __webpack_require__(69);
	var forOwn = __webpack_require__(8);
	var kindOf = __webpack_require__(13);
	var isPlainObject = __webpack_require__(70);

	    /**
	     * Recursively clone native types.
	     */
	    function deepClone(val, instanceClone) {
	        switch ( kindOf(val) ) {
	            case 'Object':
	                return cloneObject(val, instanceClone);
	            case 'Array':
	                return cloneArray(val, instanceClone);
	            default:
	                return clone(val);
	        }
	    }

	    function cloneObject(source, instanceClone) {
	        if (isPlainObject(source)) {
	            var out = {};
	            forOwn(source, function(val, key) {
	                this[key] = deepClone(val, instanceClone);
	            }, out);
	            return out;
	        } else if (instanceClone) {
	            return instanceClone(source);
	        } else {
	            return source;
	        }
	    }

	    function cloneArray(arr, instanceClone) {
	        var out = [],
	            i = -1,
	            n = arr.length,
	            val;
	        while (++i < n) {
	            out[i] = deepClone(arr[i], instanceClone);
	        }
	        return out;
	    }

	    module.exports = deepClone;





/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	var is = __webpack_require__(24);
	var isObject = __webpack_require__(76);
	var isArray = __webpack_require__(11);
	var objEquals = __webpack_require__(77);
	var arrEquals = __webpack_require__(23);

	    /**
	     * Recursively checks for same properties and values.
	     */
	    function deepEquals(a, b, callback){
	        callback = callback || is;

	        var bothObjects = isObject(a) && isObject(b);
	        var bothArrays = !bothObjects && isArray(a) && isArray(b);

	        if (!bothObjects && !bothArrays) {
	            return callback(a, b);
	        }

	        function compare(a, b){
	            return deepEquals(a, b, callback);
	        }

	        var method = bothObjects ? objEquals : arrEquals;
	        return method(a, b, compare);
	    }

	    module.exports = deepEquals;




/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	var isKind = __webpack_require__(12);
	    /**
	     */
	    function isObject(val) {
	        return isKind(val, 'Object');
	    }
	    module.exports = isObject;



/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	var hasOwn = __webpack_require__(9);
	var every = __webpack_require__(78);
	var isObject = __webpack_require__(76);
	var is = __webpack_require__(24);

	    // Makes a function to compare the object values from the specified compare
	    // operation callback.
	    function makeCompare(callback) {
	        return function(value, key) {
	            return hasOwn(this, key) && callback(value, this[key]);
	        };
	    }

	    function checkProperties(value, key) {
	        return hasOwn(this, key);
	    }

	    /**
	     * Checks if two objects have the same keys and values.
	     */
	    function equals(a, b, callback) {
	        callback = callback || is;

	        if (!isObject(a) || !isObject(b)) {
	            return callback(a, b);
	        }

	        return (every(a, makeCompare(callback), b) &&
	                every(b, checkProperties, a));
	    }

	    module.exports = equals;



/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);
	var makeIterator = __webpack_require__(4);

	    /**
	     * Object every
	     */
	    function every(obj, callback, thisObj) {
	        callback = makeIterator(callback, thisObj);
	        var result = true;
	        forOwn(obj, function(val, key) {
	            // we consider any falsy values as "false" on purpose so shorthand
	            // syntax can be used to check property existence
	            if (!callback(val, key, obj)) {
	                result = false;
	                return false; // break
	            }
	        });
	        return result;
	    }

	    module.exports = every;




/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	var toArray = __webpack_require__(80);
	var find = __webpack_require__(26);

	    /**
	     * Return first non void argument
	     */
	    function defaults(var_args){
	        return find(toArray(arguments), nonVoid);
	    }

	    function nonVoid(val){
	        return val != null;
	    }

	    module.exports = defaults;




/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	var kindOf = __webpack_require__(13);
	var GLOBAL = __webpack_require__(68);

	    /**
	     * Convert array-like object into array
	     */
	    function toArray(val){
	        var ret = [],
	            kind = kindOf(val),
	            n;

	        if (val != null) {
	            if ( val.length == null || kind === 'String' || kind === 'Function' || kind === 'RegExp' || val === GLOBAL ) {
	                //string, regexp, function have .length but user probably just want
	                //to wrap value into an array..
	                ret[ret.length] = val;
	            } else {
	                //window returns true on isObject in IE7 and may have length
	                //property. `typeof NodeList` returns `function` on Safari so
	                //we can't use it (#58)
	                n = val.length;
	                while (n--) {
	                    ret[n] = val[n];
	                }
	            }
	        }
	        return ret;
	    }
	    module.exports = toArray;



/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	var createObject = __webpack_require__(72);

	    /**
	    * Inherit prototype from another Object.
	    * - inspired by Nicholas Zackas <http://nczonline.net> Solution
	    * @param {object} child Child object
	    * @param {object} parent    Parent Object
	    */
	    function inheritPrototype(child, parent){
	        var p = createObject(parent.prototype);
	        p.constructor = child;
	        child.prototype = p;
	        child.super_ = parent;
	        return p;
	    }

	    module.exports = inheritPrototype;



/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	var isKind = __webpack_require__(12);

	    /**
	     */
	    var isArgs = isKind(arguments, 'Arguments')?
	            function(val){
	                return isKind(val, 'Arguments');
	            } :
	            function(val){
	                // Arguments is an Object on IE7
	                return !!(val && Object.prototype.hasOwnProperty.call(val, 'callee'));
	            };

	    module.exports = isArgs;



/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	var isKind = __webpack_require__(12);
	    /**
	     */
	    function isBoolean(val) {
	        return isKind(val, 'Boolean');
	    }
	    module.exports = isBoolean;



/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	var isKind = __webpack_require__(12);
	    /**
	     */
	    function isDate(val) {
	        return isKind(val, 'Date');
	    }
	    module.exports = isDate;



/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);
	var isArray = __webpack_require__(11);

	    function isEmpty(val){
	        if (val == null) {
	            // typeof null == 'object' so we check it first
	            return true;
	        } else if ( typeof val === 'string' || isArray(val) ) {
	            return !val.length;
	        } else if ( typeof val === 'object' ) {
	            var result = true;
	            forOwn(val, function(){
	                result = false;
	                return false; // break loop
	            });
	            return result;
	        } else {
	            return true;
	        }
	    }

	    module.exports = isEmpty;




/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	var isNumber = __webpack_require__(87);
	var GLOBAL = __webpack_require__(68);

	    /**
	     * Check if value is finite
	     */
	    function isFinite(val){
	        var is = false;
	        if (typeof val === 'string' && val !== '') {
	            is = GLOBAL.isFinite( parseFloat(val) );
	        } else if (isNumber(val)){
	            // need to use isNumber because of Number constructor
	            is = GLOBAL.isFinite( val );
	        }
	        return is;
	    }

	    module.exports = isFinite;




/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	var isKind = __webpack_require__(12);
	    /**
	     */
	    function isNumber(val) {
	        return isKind(val, 'Number');
	    }
	    module.exports = isNumber;



/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	var isNumber = __webpack_require__(87);

	    /**
	     * Check if value is an integer
	     */
	    function isInteger(val){
	        return isNumber(val) && (val % 1 === 0);
	    }

	    module.exports = isInteger;




/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	var isNumber = __webpack_require__(87);
	var $isNaN = __webpack_require__(90);

	    /**
	     * Check if value is NaN for realz
	     */
	    function isNaN(val){
	        // based on the fact that NaN !== NaN
	        // need to check if it's a number to avoid conflicts with host objects
	        // also need to coerce ToNumber to avoid edge case `new Number(NaN)`
	        return !isNumber(val) || $isNaN(Number(val));
	    }

	    module.exports = isNaN;




/***/ },
/* 90 */
/***/ function(module, exports) {

	

	    /**
	     * ES6 Number.isNaN
	     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
	     */
	    function isNaN(val){
	        // jshint eqeqeq:false
	        return typeof val === 'number' && val != val;
	    }

	    module.exports = isNaN;




/***/ },
/* 91 */
/***/ function(module, exports) {

	
	    /**
	     */
	    function isNull(val){
	        return val === null;
	    }
	    module.exports = isNull;




/***/ },
/* 92 */
/***/ function(module, exports) {

	

	    /**
	     * Checks if the object is a primitive
	     */
	    function isPrimitive(value) {
	        // Using switch fallthrough because it's simple to read and is
	        // generally fast: http://jsperf.com/testing-value-is-primitive/5
	        switch (typeof value) {
	            case "string":
	            case "number":
	            case "boolean":
	                return true;
	        }

	        return value == null;
	    }

	    module.exports = isPrimitive;




/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	var isKind = __webpack_require__(12);
	    /**
	     */
	    function isRegExp(val) {
	        return isKind(val, 'RegExp');
	    }
	    module.exports = isRegExp;



/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	var isKind = __webpack_require__(12);
	    /**
	     */
	    function isString(val) {
	        return isKind(val, 'String');
	    }
	    module.exports = isString;



/***/ },
/* 95 */
/***/ function(module, exports) {

	
	    var UNDEF;

	    /**
	     */
	    function isUndef(val){
	        return val === UNDEF;
	    }
	    module.exports = isUndef;



/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	var is = __webpack_require__(24);

	    /**
	     * Check if both values are not identical/egal
	     */
	    function isnt(x, y){
	        return !is(x, y);
	    }

	    module.exports = isnt;




/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	var isArray = __webpack_require__(11);

	    /**
	     * covert value into number if numeric
	     */
	    function toNumber(val){
	        // numberic values should come first because of -0
	        if (typeof val === 'number') return val;
	        // we want all falsy values (besides -0) to return zero to avoid
	        // headaches
	        if (!val) return 0;
	        if (typeof val === 'string') return parseFloat(val);
	        // arrays are edge cases. `Number([4]) === 4`
	        if (isArray(val)) return NaN;
	        return Number(val);
	    }

	    module.exports = toNumber;




/***/ },
/* 98 */
/***/ function(module, exports) {

	

	    /**
	     * Typecast a value to a String, using an empty string value for null or
	     * undefined.
	     */
	    function toString(val){
	        return val == null ? '' : val.toString();
	    }

	    module.exports = toString;




/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	

	//automatically generated, do not edit!
	//run `node build` instead
	module.exports = {
	    'bindAll' : __webpack_require__(100),
	    'contains' : __webpack_require__(103),
	    'deepFillIn' : __webpack_require__(105),
	    'deepMatches' : __webpack_require__(7),
	    'deepMixIn' : __webpack_require__(106),
	    'equals' : __webpack_require__(77),
	    'every' : __webpack_require__(78),
	    'fillIn' : __webpack_require__(107),
	    'filter' : __webpack_require__(108),
	    'find' : __webpack_require__(109),
	    'flatten' : __webpack_require__(110),
	    'forIn' : __webpack_require__(10),
	    'forOwn' : __webpack_require__(8),
	    'functions' : __webpack_require__(101),
	    'get' : __webpack_require__(111),
	    'has' : __webpack_require__(112),
	    'hasOwn' : __webpack_require__(9),
	    'keys' : __webpack_require__(113),
	    'map' : __webpack_require__(114),
	    'matches' : __webpack_require__(115),
	    'max' : __webpack_require__(116),
	    'merge' : __webpack_require__(118),
	    'min' : __webpack_require__(119),
	    'mixIn' : __webpack_require__(71),
	    'namespace' : __webpack_require__(120),
	    'omit' : __webpack_require__(121),
	    'pick' : __webpack_require__(122),
	    'pluck' : __webpack_require__(123),
	    'reduce' : __webpack_require__(124),
	    'reject' : __webpack_require__(126),
	    'result' : __webpack_require__(127),
	    'set' : __webpack_require__(128),
	    'size' : __webpack_require__(125),
	    'some' : __webpack_require__(104),
	    'unset' : __webpack_require__(129),
	    'values' : __webpack_require__(117)
	};




/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	var functions = __webpack_require__(101);
	var bind = __webpack_require__(102);
	var forEach = __webpack_require__(31);
	var slice = __webpack_require__(22);

	    /**
	     * Binds methods of the object to be run in it's own context.
	     */
	    function bindAll(obj, rest_methodNames){
	        var keys = arguments.length > 1?
	                    slice(arguments, 1) : functions(obj);
	        forEach(keys, function(key){
	            obj[key] = bind(obj[key], obj);
	        });
	    }

	    module.exports = bindAll;




/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	var forIn = __webpack_require__(10);

	    /**
	     * return a list of all enumerable properties that have function values
	     */
	    function functions(obj){
	        var keys = [];
	        forIn(obj, function(val, key){
	            if (typeof val === 'function'){
	                keys.push(key);
	            }
	        });
	        return keys.sort();
	    }

	    module.exports = functions;




/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	var slice = __webpack_require__(22);

	    /**
	     * Return a function that will execute in the given context, optionally adding any additional supplied parameters to the beginning of the arguments collection.
	     * @param {Function} fn  Function.
	     * @param {object} context   Execution context.
	     * @param {rest} args    Arguments (0...n arguments).
	     * @return {Function} Wrapped Function.
	     */
	    function bind(fn, context, args){
	        var argsArr = slice(arguments, 2); //curried args
	        return function(){
	            return fn.apply(context, argsArr.concat(slice(arguments)));
	        };
	    }

	    module.exports = bind;




/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

	var some = __webpack_require__(104);

	    /**
	     * Check if object contains value
	     */
	    function contains(obj, needle) {
	        return some(obj, function(val) {
	            return (val === needle);
	        });
	    }
	    module.exports = contains;




/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);
	var makeIterator = __webpack_require__(4);

	    /**
	     * Object some
	     */
	    function some(obj, callback, thisObj) {
	        callback = makeIterator(callback, thisObj);
	        var result = false;
	        forOwn(obj, function(val, key) {
	            if (callback(val, key, obj)) {
	                result = true;
	                return false; // break
	            }
	        });
	        return result;
	    }

	    module.exports = some;




/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);
	var isPlainObject = __webpack_require__(70);

	    /**
	     * Deeply copy missing properties in the target from the defaults.
	     */
	    function deepFillIn(target, defaults){
	        var i = 0,
	            n = arguments.length,
	            obj;

	        while(++i < n) {
	            obj = arguments[i];
	            if (obj) {
	                // jshint loopfunc: true
	                forOwn(obj, function(newValue, key) {
	                    var curValue = target[key];
	                    if (curValue == null) {
	                        target[key] = newValue;
	                    } else if (isPlainObject(curValue) &&
	                               isPlainObject(newValue)) {
	                        deepFillIn(curValue, newValue);
	                    }
	                });
	            }
	        }

	        return target;
	    }

	    module.exports = deepFillIn;




/***/ },
/* 106 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);
	var isPlainObject = __webpack_require__(70);

	    /**
	     * Mixes objects into the target object, recursively mixing existing child
	     * objects.
	     */
	    function deepMixIn(target, objects) {
	        var i = 0,
	            n = arguments.length,
	            obj;

	        while(++i < n){
	            obj = arguments[i];
	            if (obj) {
	                forOwn(obj, copyProp, target);
	            }
	        }

	        return target;
	    }

	    function copyProp(val, key) {
	        var existing = this[key];
	        if (isPlainObject(val) && isPlainObject(existing)) {
	            deepMixIn(existing, val);
	        } else {
	            this[key] = val;
	        }
	    }

	    module.exports = deepMixIn;




/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	var forEach = __webpack_require__(31);
	var slice = __webpack_require__(22);
	var forOwn = __webpack_require__(8);

	    /**
	     * Copy missing properties in the obj from the defaults.
	     */
	    function fillIn(obj, var_defaults){
	        forEach(slice(arguments, 1), function(base){
	            forOwn(base, function(val, key){
	                if (obj[key] == null) {
	                    obj[key] = val;
	                }
	            });
	        });
	        return obj;
	    }

	    module.exports = fillIn;




/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);
	var makeIterator = __webpack_require__(4);

	    /**
	     * Creates a new object with all the properties where the callback returns
	     * true.
	     */
	    function filterValues(obj, callback, thisObj) {
	        callback = makeIterator(callback, thisObj);
	        var output = {};
	        forOwn(obj, function(value, key, obj) {
	            if (callback(value, key, obj)) {
	                output[key] = value;
	            }
	        });

	        return output;
	    }
	    module.exports = filterValues;



/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	var some = __webpack_require__(104);
	var makeIterator = __webpack_require__(4);

	    /**
	     * Returns first item that matches criteria
	     */
	    function find(obj, callback, thisObj) {
	        callback = makeIterator(callback, thisObj);
	        var result;
	        some(obj, function(value, key, obj) {
	            if (callback(value, key, obj)) {
	                result = value;
	                return true; //break
	            }
	        });
	        return result;
	    }

	    module.exports = find;




/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);
	var isPlainObject = __webpack_require__(70);

	    /*
	     * Helper function to flatten to a destination object.
	     * Used to remove the need to create intermediate objects while flattening.
	     */
	    function flattenTo(obj, result, prefix, level) {
	        forOwn(obj, function (value, key) {
	            var nestedPrefix = prefix ? prefix + '.' + key : key;

	            if (level !== 0 && isPlainObject(value)) {
	                flattenTo(value, result, nestedPrefix, level - 1);
	            } else {
	                result[nestedPrefix] = value;
	            }
	        });

	        return result;
	    }

	    /**
	     * Recursively flattens an object.
	     * A new object containing all the elements is returned.
	     * If level is specified, it will only flatten up to that level.
	     */
	    function flatten(obj, level) {
	        if (obj == null) {
	            return {};
	        }

	        level = level == null ? -1 : level;
	        return flattenTo(obj, {}, '', level);
	    }

	    module.exports = flatten;




/***/ },
/* 111 */
/***/ function(module, exports, __webpack_require__) {

	var isPrimitive = __webpack_require__(92);

	    /**
	     * get "nested" object property
	     */
	    function get(obj, prop){
	        var parts = prop.split('.'),
	            last = parts.pop();

	        while (prop = parts.shift()) {
	            obj = obj[prop];
	            if (obj == null) return;
	        }

	        return obj[last];
	    }

	    module.exports = get;




/***/ },
/* 112 */
/***/ function(module, exports, __webpack_require__) {

	var get = __webpack_require__(111);

	    var UNDEF;

	    /**
	     * Check if object has nested property.
	     */
	    function has(obj, prop){
	        return get(obj, prop) !== UNDEF;
	    }

	    module.exports = has;





/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);

	    /**
	     * Get object keys
	     */
	     var keys = Object.keys || function (obj) {
	            var keys = [];
	            forOwn(obj, function(val, key){
	                keys.push(key);
	            });
	            return keys;
	        };

	    module.exports = keys;




/***/ },
/* 114 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);
	var makeIterator = __webpack_require__(4);

	    /**
	     * Creates a new object where all the values are the result of calling
	     * `callback`.
	     */
	    function mapValues(obj, callback, thisObj) {
	        callback = makeIterator(callback, thisObj);
	        var output = {};
	        forOwn(obj, function(val, key, obj) {
	            output[key] = callback(val, key, obj);
	        });

	        return output;
	    }
	    module.exports = mapValues;



/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);

	    /**
	     * checks if a object contains all given properties/values
	     */
	    function matches(target, props){
	        // can't use "object/every" because of circular dependency
	        var result = true;
	        forOwn(props, function(val, key){
	            if (target[key] !== val) {
	                // break loop at first difference
	                return (result = false);
	            }
	        });
	        return result;
	    }

	    module.exports = matches;




/***/ },
/* 116 */
/***/ function(module, exports, __webpack_require__) {

	var arrMax = __webpack_require__(40);
	var values = __webpack_require__(117);

	    /**
	     * Returns maximum value inside object.
	     */
	    function max(obj, compareFn) {
	        return arrMax(values(obj), compareFn);
	    }

	    module.exports = max;



/***/ },
/* 117 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);

	    /**
	     * Get object values
	     */
	    function values(obj) {
	        var vals = [];
	        forOwn(obj, function(val, key){
	            vals.push(val);
	        });
	        return vals;
	    }

	    module.exports = values;




/***/ },
/* 118 */
/***/ function(module, exports, __webpack_require__) {

	var hasOwn = __webpack_require__(9);
	var deepClone = __webpack_require__(74);
	var isObject = __webpack_require__(76);

	    /**
	     * Deep merge objects.
	     */
	    function merge() {
	        var i = 1,
	            key, val, obj, target;

	        // make sure we don't modify source element and it's properties
	        // objects are passed by reference
	        target = deepClone( arguments[0] );

	        while (obj = arguments[i++]) {
	            for (key in obj) {
	                if ( ! hasOwn(obj, key) ) {
	                    continue;
	                }

	                val = obj[key];

	                if ( isObject(val) && isObject(target[key]) ){
	                    // inception, deep merge objects
	                    target[key] = merge(target[key], val);
	                } else {
	                    // make sure arrays, regexp, date, objects are cloned
	                    target[key] = deepClone(val);
	                }

	            }
	        }

	        return target;
	    }

	    module.exports = merge;




/***/ },
/* 119 */
/***/ function(module, exports, __webpack_require__) {

	var arrMin = __webpack_require__(41);
	var values = __webpack_require__(117);

	    /**
	     * Returns minimum value inside object.
	     */
	    function min(obj, iterator) {
	        return arrMin(values(obj), iterator);
	    }

	    module.exports = min;



/***/ },
/* 120 */
/***/ function(module, exports, __webpack_require__) {

	var forEach = __webpack_require__(31);

	    /**
	     * Create nested object if non-existent
	     */
	    function namespace(obj, path){
	        if (!path) return obj;
	        forEach(path.split('.'), function(key){
	            if (!obj[key]) {
	                obj[key] = {};
	            }
	            obj = obj[key];
	        });
	        return obj;
	    }

	    module.exports = namespace;




/***/ },
/* 121 */
/***/ function(module, exports, __webpack_require__) {

	var slice = __webpack_require__(22);
	var contains = __webpack_require__(18);

	    /**
	     * Return a copy of the object, filtered to only contain properties except the blacklisted keys.
	     */
	    function omit(obj, var_keys){
	        var keys = typeof arguments[1] !== 'string'? arguments[1] : slice(arguments, 1),
	            out = {};

	        for (var property in obj) {
	            if (obj.hasOwnProperty(property) && !contains(keys, property)) {
	                out[property] = obj[property];
	            }
	        }
	        return out;
	    }

	    module.exports = omit;




/***/ },
/* 122 */
/***/ function(module, exports, __webpack_require__) {

	var slice = __webpack_require__(22);

	    /**
	     * Return a copy of the object, filtered to only have values for the whitelisted keys.
	     */
	    function pick(obj, var_keys){
	        var keys = typeof arguments[1] !== 'string'? arguments[1] : slice(arguments, 1),
	            out = {},
	            i = 0, key;
	        while (key = keys[i++]) {
	            out[key] = obj[key];
	        }
	        return out;
	    }

	    module.exports = pick;




/***/ },
/* 123 */
/***/ function(module, exports, __webpack_require__) {

	var map = __webpack_require__(114);
	var prop = __webpack_require__(6);

	    /**
	     * Extract a list of property values.
	     */
	    function pluck(obj, propName){
	        return map(obj, prop(propName));
	    }

	    module.exports = pluck;




/***/ },
/* 124 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);
	var size = __webpack_require__(125);

	    /**
	     * Object reduce
	     */
	    function reduce(obj, callback, memo, thisObj) {
	        var initial = arguments.length > 2;

	        if (!size(obj) && !initial) {
	            throw new Error('reduce of empty object with no initial value');
	        }

	        forOwn(obj, function(value, key, list) {
	            if (!initial) {
	                memo = value;
	                initial = true;
	            }
	            else {
	                memo = callback.call(thisObj, memo, value, key, list);
	            }
	        });

	        return memo;
	    }

	    module.exports = reduce;




/***/ },
/* 125 */
/***/ function(module, exports, __webpack_require__) {

	var forOwn = __webpack_require__(8);

	    /**
	     * Get object size
	     */
	    function size(obj) {
	        var count = 0;
	        forOwn(obj, function(){
	            count++;
	        });
	        return count;
	    }

	    module.exports = size;




/***/ },
/* 126 */
/***/ function(module, exports, __webpack_require__) {

	var filter = __webpack_require__(108);
	var makeIterator = __webpack_require__(4);

	    /**
	     * Object reject
	     */
	    function reject(obj, callback, thisObj) {
	        callback = makeIterator(callback, thisObj);
	        return filter(obj, function(value, index, obj) {
	            return !callback(value, index, obj);
	        }, thisObj);
	    }

	    module.exports = reject;




/***/ },
/* 127 */
/***/ function(module, exports, __webpack_require__) {

	var isFunction = __webpack_require__(63);

	    function result(obj, prop) {
	        var property = obj[prop];

	        if(property === undefined) {
	            return;
	        }

	        return isFunction(property) ? property.call(obj) : property;
	    }

	    module.exports = result;



/***/ },
/* 128 */
/***/ function(module, exports, __webpack_require__) {

	var namespace = __webpack_require__(120);

	    /**
	     * set "nested" object property
	     */
	    function set(obj, prop, val){
	        var parts = (/^(.+)\.(.+)$/).exec(prop);
	        if (parts){
	            namespace(obj, parts[1])[parts[2]] = val;
	        } else {
	            obj[prop] = val;
	        }
	    }

	    module.exports = set;




/***/ },
/* 129 */
/***/ function(module, exports, __webpack_require__) {

	var has = __webpack_require__(112);

	    /**
	     * Unset object property.
	     */
	    function unset(obj, prop){
	        if (has(obj, prop)) {
	            var parts = prop.split('.'),
	                last = parts.pop();
	            while (prop = parts.shift()) {
	                obj = obj[prop];
	            }
	            return (delete obj[last]);

	        } else {
	            // if property doesn't exist treat as deleted
	            return true;
	        }
	    }

	    module.exports = unset;




/***/ },
/* 130 */
/***/ function(module, exports, __webpack_require__) {

	

	//automatically generated, do not edit!
	//run `node build` instead
	module.exports = {
	    'WHITE_SPACES' : __webpack_require__(131),
	    'camelCase' : __webpack_require__(132),
	    'contains' : __webpack_require__(137),
	    'crop' : __webpack_require__(138),
	    'endsWith' : __webpack_require__(143),
	    'escapeHtml' : __webpack_require__(144),
	    'escapeRegExp' : __webpack_require__(145),
	    'escapeUnicode' : __webpack_require__(146),
	    'hyphenate' : __webpack_require__(147),
	    'insert' : __webpack_require__(150),
	    'interpolate' : __webpack_require__(152),
	    'lowerCase' : __webpack_require__(136),
	    'lpad' : __webpack_require__(153),
	    'ltrim' : __webpack_require__(141),
	    'makePath' : __webpack_require__(156),
	    'normalizeLineBreaks' : __webpack_require__(157),
	    'pascalCase' : __webpack_require__(158),
	    'properCase' : __webpack_require__(159),
	    'removeNonASCII' : __webpack_require__(160),
	    'removeNonWord' : __webpack_require__(134),
	    'repeat' : __webpack_require__(154),
	    'replace' : __webpack_require__(161),
	    'replaceAccents' : __webpack_require__(133),
	    'rpad' : __webpack_require__(162),
	    'rtrim' : __webpack_require__(142),
	    'sentenceCase' : __webpack_require__(163),
	    'slugify' : __webpack_require__(148),
	    'startsWith' : __webpack_require__(164),
	    'stripHtmlTags' : __webpack_require__(165),
	    'trim' : __webpack_require__(140),
	    'truncate' : __webpack_require__(139),
	    'typecast' : __webpack_require__(166),
	    'unCamelCase' : __webpack_require__(149),
	    'underscore' : __webpack_require__(167),
	    'unescapeHtml' : __webpack_require__(168),
	    'unescapeUnicode' : __webpack_require__(169),
	    'unhyphenate' : __webpack_require__(170),
	    'upperCase' : __webpack_require__(135)
	};




/***/ },
/* 131 */
/***/ function(module, exports) {

	
	    /**
	     * Contains all Unicode white-spaces. Taken from
	     * http://en.wikipedia.org/wiki/Whitespace_character.
	     */
	    module.exports = [
	        ' ', '\n', '\r', '\t', '\f', '\v', '\u00A0', '\u1680', '\u180E',
	        '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006',
	        '\u2007', '\u2008', '\u2009', '\u200A', '\u2028', '\u2029', '\u202F',
	        '\u205F', '\u3000'
	    ];



/***/ },
/* 132 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var replaceAccents = __webpack_require__(133);
	var removeNonWord = __webpack_require__(134);
	var upperCase = __webpack_require__(135);
	var lowerCase = __webpack_require__(136);
	    /**
	    * Convert string to camelCase text.
	    */
	    function camelCase(str){
	        str = toString(str);
	        str = replaceAccents(str);
	        str = removeNonWord(str)
	            .replace(/[\-_]/g, ' ') //convert all hyphens and underscores to spaces
	            .replace(/\s[a-z]/g, upperCase) //convert first char of each word to UPPERCASE
	            .replace(/\s+/g, '') //remove spaces
	            .replace(/^[A-Z]/g, lowerCase); //convert first char to lowercase
	        return str;
	    }
	    module.exports = camelCase;



/***/ },
/* 133 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	    /**
	    * Replaces all accented chars with regular ones
	    */
	    function replaceAccents(str){
	        str = toString(str);

	        // verifies if the String has accents and replace them
	        if (str.search(/[\xC0-\xFF]/g) > -1) {
	            str = str
	                    .replace(/[\xC0-\xC5]/g, "A")
	                    .replace(/[\xC6]/g, "AE")
	                    .replace(/[\xC7]/g, "C")
	                    .replace(/[\xC8-\xCB]/g, "E")
	                    .replace(/[\xCC-\xCF]/g, "I")
	                    .replace(/[\xD0]/g, "D")
	                    .replace(/[\xD1]/g, "N")
	                    .replace(/[\xD2-\xD6\xD8]/g, "O")
	                    .replace(/[\xD9-\xDC]/g, "U")
	                    .replace(/[\xDD]/g, "Y")
	                    .replace(/[\xDE]/g, "P")
	                    .replace(/[\xE0-\xE5]/g, "a")
	                    .replace(/[\xE6]/g, "ae")
	                    .replace(/[\xE7]/g, "c")
	                    .replace(/[\xE8-\xEB]/g, "e")
	                    .replace(/[\xEC-\xEF]/g, "i")
	                    .replace(/[\xF1]/g, "n")
	                    .replace(/[\xF2-\xF6\xF8]/g, "o")
	                    .replace(/[\xF9-\xFC]/g, "u")
	                    .replace(/[\xFE]/g, "p")
	                    .replace(/[\xFD\xFF]/g, "y");
	        }
	        return str;
	    }
	    module.exports = replaceAccents;



/***/ },
/* 134 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	    // This pattern is generated by the _build/pattern-removeNonWord.js script
	    var PATTERN = /[^\x20\x2D0-9A-Z\x5Fa-z\xC0-\xD6\xD8-\xF6\xF8-\xFF]/g;

	    /**
	     * Remove non-word chars.
	     */
	    function removeNonWord(str){
	        str = toString(str);
	        return str.replace(PATTERN, '');
	    }

	    module.exports = removeNonWord;



/***/ },
/* 135 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	    /**
	     * "Safer" String.toUpperCase()
	     */
	    function upperCase(str){
	        str = toString(str);
	        return str.toUpperCase();
	    }
	    module.exports = upperCase;



/***/ },
/* 136 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	    /**
	     * "Safer" String.toLowerCase()
	     */
	    function lowerCase(str){
	        str = toString(str);
	        return str.toLowerCase();
	    }

	    module.exports = lowerCase;



/***/ },
/* 137 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);

	    /**
	     * Searches for a given substring
	     */
	    function contains(str, substring, fromIndex){
	        str = toString(str);
	        substring = toString(substring);
	        return str.indexOf(substring, fromIndex) !== -1;
	    }

	    module.exports = contains;




/***/ },
/* 138 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var truncate = __webpack_require__(139);
	    /**
	     * Truncate string at full words.
	     */
	     function crop(str, maxChars, append) {
	         str = toString(str);
	         return truncate(str, maxChars, append, true);
	     }

	     module.exports = crop;



/***/ },
/* 139 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var trim = __webpack_require__(140);
	    /**
	     * Limit number of chars.
	     */
	    function truncate(str, maxChars, append, onlyFullWords){
	        str = toString(str);
	        append = append || '...';
	        maxChars = onlyFullWords? maxChars + 1 : maxChars;

	        str = trim(str);
	        if(str.length <= maxChars){
	            return str;
	        }
	        str = str.substr(0, maxChars - append.length);
	        //crop at last space or remove trailing whitespace
	        str = onlyFullWords? str.substr(0, str.lastIndexOf(' ')) : trim(str);
	        return str + append;
	    }
	    module.exports = truncate;



/***/ },
/* 140 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var WHITE_SPACES = __webpack_require__(131);
	var ltrim = __webpack_require__(141);
	var rtrim = __webpack_require__(142);
	    /**
	     * Remove white-spaces from beginning and end of string.
	     */
	    function trim(str, chars) {
	        str = toString(str);
	        chars = chars || WHITE_SPACES;
	        return ltrim(rtrim(str, chars), chars);
	    }

	    module.exports = trim;



/***/ },
/* 141 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var WHITE_SPACES = __webpack_require__(131);
	    /**
	     * Remove chars from beginning of string.
	     */
	    function ltrim(str, chars) {
	        str = toString(str);
	        chars = chars || WHITE_SPACES;

	        var start = 0,
	            len = str.length,
	            charLen = chars.length,
	            found = true,
	            i, c;

	        while (found && start < len) {
	            found = false;
	            i = -1;
	            c = str.charAt(start);

	            while (++i < charLen) {
	                if (c === chars[i]) {
	                    found = true;
	                    start++;
	                    break;
	                }
	            }
	        }

	        return (start >= len) ? '' : str.substr(start, len);
	    }

	    module.exports = ltrim;



/***/ },
/* 142 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var WHITE_SPACES = __webpack_require__(131);
	    /**
	     * Remove chars from end of string.
	     */
	    function rtrim(str, chars) {
	        str = toString(str);
	        chars = chars || WHITE_SPACES;

	        var end = str.length - 1,
	            charLen = chars.length,
	            found = true,
	            i, c;

	        while (found && end >= 0) {
	            found = false;
	            i = -1;
	            c = str.charAt(end);

	            while (++i < charLen) {
	                if (c === chars[i]) {
	                    found = true;
	                    end--;
	                    break;
	                }
	            }
	        }

	        return (end >= 0) ? str.substring(0, end + 1) : '';
	    }

	    module.exports = rtrim;



/***/ },
/* 143 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	    /**
	     * Checks if string ends with specified suffix.
	     */
	    function endsWith(str, suffix) {
	        str = toString(str);
	        suffix = toString(suffix);

	        return str.indexOf(suffix, str.length - suffix.length) !== -1;
	    }

	    module.exports = endsWith;



/***/ },
/* 144 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);

	    /**
	     * Escapes a string for insertion into HTML.
	     */
	    function escapeHtml(str){
	        str = toString(str)
	            .replace(/&/g, '&amp;')
	            .replace(/</g, '&lt;')
	            .replace(/>/g, '&gt;')
	            .replace(/'/g, '&#39;')
	            .replace(/"/g, '&quot;');
	        return str;
	    }

	    module.exports = escapeHtml;




/***/ },
/* 145 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);

	    /**
	     * Escape RegExp string chars.
	     */
	    function escapeRegExp(str) {
	        return toString(str).replace(/\W/g,'\\$&');
	    }

	    module.exports = escapeRegExp;




/***/ },
/* 146 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);

	    /**
	     * Escape string into unicode sequences
	     */
	    function escapeUnicode(str, shouldEscapePrintable){
	        str = toString(str);
	        return str.replace(/[\s\S]/g, function(ch){
	            // skip printable ASCII chars if we should not escape them
	            if (!shouldEscapePrintable && (/[\x20-\x7E]/).test(ch)) {
	                return ch;
	            }
	            // we use "000" and slice(-4) for brevity, need to pad zeros,
	            // unicode escape always have 4 chars after "\u"
	            return '\\u'+ ('000'+ ch.charCodeAt(0).toString(16)).slice(-4);
	        });
	    }

	    module.exports = escapeUnicode;




/***/ },
/* 147 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var slugify = __webpack_require__(148);
	var unCamelCase = __webpack_require__(149);
	    /**
	     * Replaces spaces with hyphens, split camelCase text, remove non-word chars, remove accents and convert to lower case.
	     */
	    function hyphenate(str){
	        str = toString(str);
	        str = unCamelCase(str);
	        return slugify(str, "-");
	    }

	    module.exports = hyphenate;



/***/ },
/* 148 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var replaceAccents = __webpack_require__(133);
	var removeNonWord = __webpack_require__(134);
	var trim = __webpack_require__(140);
	    /**
	     * Convert to lower case, remove accents, remove non-word chars and
	     * replace spaces with the specified delimeter.
	     * Does not split camelCase text.
	     */
	    function slugify(str, delimeter){
	        str = toString(str);

	        if (delimeter == null) {
	            delimeter = "-";
	        }
	        str = replaceAccents(str);
	        str = removeNonWord(str);
	        str = trim(str) //should come after removeNonWord
	                .replace(/ +/g, delimeter) //replace spaces with delimeter
	                .toLowerCase();
	        return str;
	    }
	    module.exports = slugify;



/***/ },
/* 149 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);

	    var CAMEL_CASE_BORDER = /([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g;

	    /**
	     * Add space between camelCase text.
	     */
	    function unCamelCase(str, delimiter){
	        if (delimiter == null) {
	            delimiter = ' ';
	        }

	        function join(str, c1, c2) {
	            return c1 + delimiter + c2;
	        }

	        str = toString(str);
	        str = str.replace(CAMEL_CASE_BORDER, join);
	        str = str.toLowerCase(); //add space between camelCase text
	        return str;
	    }
	    module.exports = unCamelCase;



/***/ },
/* 150 */
/***/ function(module, exports, __webpack_require__) {

	var clamp = __webpack_require__(151);
	var toString = __webpack_require__(98);

	    /**
	     * Inserts a string at a given index.
	     */
	    function insert(string, index, partial){
	        string = toString(string);

	        if (index < 0) {
	            index = string.length + index;
	        }

	        index = clamp(index, 0, string.length);

	        return string.substr(0, index) + partial + string.substr(index);
	    }

	    module.exports = insert;




/***/ },
/* 151 */
/***/ function(module, exports) {

	
	    /**
	     * Clamps value inside range.
	     */
	    function clamp(val, min, max){
	        return val < min? min : (val > max? max : val);
	    }
	    module.exports = clamp;



/***/ },
/* 152 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var get = __webpack_require__(111);

	    var stache = /\{\{([^\}]+)\}\}/g; //mustache-like

	    /**
	     * String interpolation
	     */
	    function interpolate(template, replacements, syntax){
	        template = toString(template);
	        var replaceFn = function(match, prop){
	            return toString( get(replacements, prop) );
	        };
	        return template.replace(syntax || stache, replaceFn);
	    }

	    module.exports = interpolate;




/***/ },
/* 153 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var repeat = __webpack_require__(154);

	    /**
	     * Pad string with `char` if its' length is smaller than `minLen`
	     */
	    function lpad(str, minLen, ch) {
	        str = toString(str);
	        ch = ch || ' ';

	        return (str.length < minLen) ?
	            repeat(ch, minLen - str.length) + str : str;
	    }

	    module.exports = lpad;




/***/ },
/* 154 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var toInt = __webpack_require__(155);

	    /**
	     * Repeat string n times
	     */
	     function repeat(str, n){
	         var result = '';
	         str = toString(str);
	         n = toInt(n);
	        if (n < 1) {
	            return '';
	        }
	        while (n > 0) {
	            if (n % 2) {
	                result += str;
	            }
	            n = Math.floor(n / 2);
	            str += str;
	        }
	        return result;
	     }

	     module.exports = repeat;




/***/ },
/* 155 */
/***/ function(module, exports) {

	

	    /**
	     * "Convert" value into an 32-bit integer.
	     * Works like `Math.floor` if val > 0 and `Math.ceil` if val < 0.
	     * IMPORTANT: val will wrap at 2^31 and -2^31.
	     * Perf tests: http://jsperf.com/vs-vs-parseint-bitwise-operators/7
	     */
	    function toInt(val){
	        // we do not use lang/toNumber because of perf and also because it
	        // doesn't break the functionality
	        return ~~val;
	    }

	    module.exports = toInt;




/***/ },
/* 156 */
/***/ function(module, exports, __webpack_require__) {

	var join = __webpack_require__(36);
	var slice = __webpack_require__(22);

	    /**
	     * Group arguments as path segments, if any of the args is `null` or an
	     * empty string it will be ignored from resulting path.
	     */
	    function makePath(var_args){
	        var result = join(slice(arguments), '/');
	        // need to disconsider duplicate '/' after protocol (eg: 'http://')
	        return result.replace(/([^:\/]|^)\/{2,}/g, '$1/');
	    }

	    module.exports = makePath;



/***/ },
/* 157 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);

	    /**
	     * Convert line-breaks from DOS/MAC to a single standard (UNIX by default)
	     */
	    function normalizeLineBreaks(str, lineEnd) {
	        str = toString(str);
	        lineEnd = lineEnd || '\n';

	        return str
	            .replace(/\r\n/g, lineEnd) // DOS
	            .replace(/\r/g, lineEnd)   // Mac
	            .replace(/\n/g, lineEnd);  // Unix
	    }

	    module.exports = normalizeLineBreaks;




/***/ },
/* 158 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var camelCase = __webpack_require__(132);
	var upperCase = __webpack_require__(135);
	    /**
	     * camelCase + UPPERCASE first char
	     */
	    function pascalCase(str){
	        str = toString(str);
	        return camelCase(str).replace(/^[a-z]/, upperCase);
	    }

	    module.exports = pascalCase;



/***/ },
/* 159 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var lowerCase = __webpack_require__(136);
	var upperCase = __webpack_require__(135);
	    /**
	     * UPPERCASE first char of each word.
	     */
	    function properCase(str){
	        str = toString(str);
	        return lowerCase(str).replace(/^\w|\s\w/g, upperCase);
	    }

	    module.exports = properCase;



/***/ },
/* 160 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	    /**
	     * Remove non-printable ASCII chars
	     */
	    function removeNonASCII(str){
	        str = toString(str);

	        // Matches non-printable ASCII chars -
	        // http://en.wikipedia.org/wiki/ASCII#ASCII_printable_characters
	        return str.replace(/[^\x20-\x7E]/g, '');
	    }

	    module.exports = removeNonASCII;



/***/ },
/* 161 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var toArray = __webpack_require__(80);

	    /**
	     * Replace string(s) with the replacement(s) in the source.
	     */
	    function replace(str, search, replacements) {
	        str = toString(str);
	        search = toArray(search);
	        replacements = toArray(replacements);

	        var searchLength = search.length,
	            replacementsLength = replacements.length;

	        if (replacementsLength !== 1 && searchLength !== replacementsLength) {
	            throw new Error('Unequal number of searches and replacements');
	        }

	        var i = -1;
	        while (++i < searchLength) {
	            // Use the first replacement for all searches if only one
	            // replacement is provided
	            str = str.replace(
	                search[i],
	                replacements[(replacementsLength === 1) ? 0 : i]);
	        }

	        return str;
	    }

	    module.exports = replace;




/***/ },
/* 162 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var repeat = __webpack_require__(154);

	    /**
	     * Pad string with `char` if its' length is smaller than `minLen`
	     */
	    function rpad(str, minLen, ch) {
	        str = toString(str);
	        ch = ch || ' ';
	        return (str.length < minLen)? str + repeat(ch, minLen - str.length) : str;
	    }

	    module.exports = rpad;




/***/ },
/* 163 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var lowerCase = __webpack_require__(136);
	var upperCase = __webpack_require__(135);
	    /**
	     * UPPERCASE first char of each sentence and lowercase other chars.
	     */
	    function sentenceCase(str){
	        str = toString(str);

	        // Replace first char of each sentence (new line or after '.\s+') to
	        // UPPERCASE
	        return lowerCase(str).replace(/(^\w)|\.\s+(\w)/gm, upperCase);
	    }
	    module.exports = sentenceCase;



/***/ },
/* 164 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	    /**
	     * Checks if string starts with specified prefix.
	     */
	    function startsWith(str, prefix) {
	        str = toString(str);
	        prefix = toString(prefix);

	        return str.indexOf(prefix) === 0;
	    }

	    module.exports = startsWith;



/***/ },
/* 165 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	    /**
	     * Remove HTML tags from string.
	     */
	    function stripHtmlTags(str){
	        str = toString(str);

	        return str.replace(/<[^>]*>/g, '');
	    }
	    module.exports = stripHtmlTags;



/***/ },
/* 166 */
/***/ function(module, exports) {

	

	    var UNDEF;

	    /**
	     * Parses string and convert it into a native value.
	     */
	    function typecast(val) {
	        var r;
	        if ( val === null || val === 'null' ) {
	            r = null;
	        } else if ( val === 'true' ) {
	            r = true;
	        } else if ( val === 'false' ) {
	            r = false;
	        } else if ( val === UNDEF || val === 'undefined' ) {
	            r = UNDEF;
	        } else if ( val === '' || isNaN(val) ) {
	            //isNaN('') returns false
	            r = val;
	        } else {
	            //parseFloat(null || '') returns NaN
	            r = parseFloat(val);
	        }
	        return r;
	    }

	    module.exports = typecast;



/***/ },
/* 167 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	var slugify = __webpack_require__(148);
	var unCamelCase = __webpack_require__(149);
	    /**
	     * Replaces spaces with underscores, split camelCase text, remove non-word chars, remove accents and convert to lower case.
	     */
	    function underscore(str){
	        str = toString(str);
	        str = unCamelCase(str);
	        return slugify(str, "_");
	    }
	    module.exports = underscore;



/***/ },
/* 168 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);

	    /**
	     * Unescapes HTML special chars
	     */
	    function unescapeHtml(str){
	        str = toString(str)
	            .replace(/&amp;/g , '&')
	            .replace(/&lt;/g  , '<')
	            .replace(/&gt;/g  , '>')
	            .replace(/&#0*39;/g , "'")
	            .replace(/&quot;/g, '"');
	        return str;
	    }

	    module.exports = unescapeHtml;




/***/ },
/* 169 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);

	    /**
	     * Unescape unicode char sequences
	     */
	    function unescapeUnicode(str){
	        str = toString(str);
	        return str.replace(/\\u[0-9a-f]{4}/g, function(ch){
	            var code = parseInt(ch.slice(2), 16);
	            return String.fromCharCode(code);
	        });
	    }

	    module.exports = unescapeUnicode;




/***/ },
/* 170 */
/***/ function(module, exports, __webpack_require__) {

	var toString = __webpack_require__(98);
	    /**
	     * Replaces hyphens with spaces. (only hyphens between word chars)
	     */
	    function unhyphenate(str){
	        str = toString(str);
	        return str.replace(/(\w)(-)(\w)/g, '$1 $3');
	    }
	    module.exports = unhyphenate;



/***/ },
/* 171 */
/***/ function(module, exports) {

	module.exports = require("squel");

/***/ },
/* 172 */
/***/ function(module, exports) {

	module.exports = require("js-data");

/***/ }
/******/ ]);