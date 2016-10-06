import { contains, unique } from 'mout/array'
import { isEmpty, isObject, isString, toString } from 'mout/lang';
import { deepMixIn, forOwn, get, omit } from 'mout/object'
import { underscore } from 'mout/string';
import squel from 'squel';
import { DSUtils } from 'js-data';
const { removeCircular } = DSUtils;


let reserved = [
    'orderBy',
    'sort',
    'limit',
    'offset',
    'skip',
    'where'
];


function getTable(resourceConfig) {
    return resourceConfig.table || underscore(resourceConfig.name);
}


function processRelationField(resourceConfig, query, field, criteria, joinedTables) {
    let fieldParts = field.split('.');
    let localResourceConfig = resourceConfig;
    let relationPath = [];
    let relationName = null;

    while (fieldParts.length >= 2) {
        relationName = fieldParts.shift();
        let [relation] = localResourceConfig.relationList.filter(r => r.relation === relationName || r.localField === relationName);

        if (relation) {
            let relationResourceConfig = resourceConfig.getResource(relation.relation);
            relationPath.push(relation.relation);

            if (relation.type === 'belongsTo' || relation.type === 'hasOne') {
                // Apply table join for belongsTo/hasOne property (if not done already)
                if (!joinedTables.some(t => t === relationPath.join('.'))) {
                    let table = getTable(localResourceConfig);
                    let localId = `${table}.${relation.localKey}`;

                    let relationTable = getTable(relationResourceConfig);
                    let foreignId = `${relationTable}.${relationResourceConfig.idAttribute}`;

                    query.left_join(relationTable, null, `${localId} = ${foreignId}`);
                    joinedTables.push(relationPath.join('.'))
                }
            } else if (relation.type === 'hasMany') {
                // Perform `WHERE EXISTS` subquery for hasMany property
                let existsParams = {
                    [`${relationName}.${fieldParts.splice(0).join('.')}`]: criteria // remaining field(s) handled by EXISTS subquery
                };
                let subQueryTable = getTable(relationResourceConfig);
                let subQuery = squel.select().from(subQueryTable);
                subQuery = this.__filterQuery(relationResourceConfig, existsParams, subQuery)
                    .where(`${getTable(relationResourceConfig)}.${relation.foreignKey} == ${getTable(localResourceConfig)}.${localResourceConfig.idAttribute}`)
                if (Object.keys(criteria).some(k => k.indexOf('|') > -1)) {
                    query = query.where(subQuery);
                } else {
                    query = query.where(
                        squel.expr().or(subQuery)
                    );
                }
            }

            localResourceConfig = relationResourceConfig;
        } else {
            // hopefully a qualified local column
        }
    }
    relationName = fieldParts.shift();

    return relationName ? `${getTable(localResourceConfig)}.${relationName}` : null;
}

function loadWithRelations(items, resourceConfig, options) {
    let tasks = [];
    let instance = Array.isArray(items) ? null : items;

    if (resourceConfig.relationList) {
        resourceConfig.relationList.forEach(def => {
            let relationName = def.relation;
            let relationDef = resourceConfig.getResource(relationName);

            let containedName = null;
            if (contains(options.with, relationName)) {
                containedName = relationName;
            } else if (contains(options.with, def.localField)) {
                containedName = def.localField;
            } else {
                return;
            }

            let __options = deepMixIn({}, options.orig ? options.orig() : options);

            // Filter to only properties under current relation
            __options.with = options.with.filter(relation => {
                return relation !== containedName &&
                    relation.indexOf(containedName) === 0 &&
                    relation.length >= containedName.length &&
                    relation[containedName.length] === '.'
            }).map(relation => relation.substr(containedName.length + 1));

            let task;

            if ((def.type === 'hasOne' || def.type === 'hasMany') && def.foreignKey) {
                task = this.findAll(resourceConfig.getResource(relationName), {
                        where: {
                            [def.foreignKey]: instance ?
                            {'==': instance[def.localKey || resourceConfig.idAttribute]} :
                            {'in': items.map(item => item[def.localKey || resourceConfig.idAttribute])}
                        }
                    }, __options)
                    .then(relatedItems => {
                        if (instance) {
                            if (def.type === 'hasOne' && relatedItems.length) {
                                instance[def.localField] = relatedItems[0];
                            } else {
                                instance[def.localField] = relatedItems;
                            }
                        } else {
                            items.forEach(item => {
                                let attached = relatedItems.filter(ri => ri[def.foreignKey] === item[def.localKey || resourceConfig.idAttribute]);
                                if (def.type === 'hasOne' && attached.length) {
                                    item[def.localField] = attached[0];
                                } else {
                                    item[def.localField] = attached;
                                }
                            })
                        }

                        return relatedItems;
                    })
            } else if (def.type === 'hasMany' && def.localKeys) {
                let localKeys = [];

                if (instance) {
                    let itemKeys = instance[def.localKeys] || [];
                    itemKeys = Array.isArray(itemKeys) ? itemKeys : Object.keys(itemKeys);
                    localKeys = localKeys.concat(itemKeys || []);
                } else {
                    items.forEach(item => {
                        let itemKeys = item[def.localKeys] || [];
                        itemKeys = Array.isArray(itemKeys) ? itemKeys : Object.keys(itemKeys);
                        localKeys = localKeys.concat(itemKeys || []);
                    })
                }

                task = this.findAll(resourceConfig.getResource(relationName), {
                        where: {
                            [relationDef.idAttribute]: {
                                'in': filter(unique(localKeys), x => x)
                            }
                        }
                    }, __options)
                    .then(relatedItems => {
                        if (instance) {
                            instance[def.localField] = relatedItems
                        } else {
                            items.forEach(item => {
                                let itemKeys = item[def.localKeys] || [];
                                let attached = relatedItems.filter(ri => itemKeys && contains(itemKeys, ri[relationDef.idAttribute]));
                                item[def.localField] = attached;
                            })
                        }

                        return relatedItems;
                    })
            } else if (def.type === 'belongsTo' || (def.type === 'hasOne' && def.localKey)) {
                if (instance) {
                    let id = get(instance, def.localKey);
                    if (id) {
                        task = this.findAll(resourceConfig.getResource(relationName), {
                                where: {
                                    [def.foreignKey || relationDef.idAttribute]: {'==': id}
                                }
                            }, __options)
                            .then(relatedItems => {
                                let relatedItem = relatedItems && relatedItems[0];
                                instance[def.localField] = relatedItem;
                                return relatedItem;
                            })
                    }
                } else {
                    let ids = items.map(item => get(item, def.localKey)).filter(x => x);
                    if (ids.length) {
                        task = this.findAll(resourceConfig.getResource(relationName), {
                                where: {
                                    [def.foreignKey || relationDef.idAttribute]: {'in': ids}
                                }
                            }, __options)
                            .then(relatedItems => {
                                items.forEach(item => {
                                    relatedItems.forEach(relatedItem => {
                                        if (relatedItem[def.foreignKey || relationDef.idAttribute] === item[def.localKey]) {
                                            item[def.localField] = relatedItem
                                        }
                                    })
                                });
                                return relatedItems;
                            })
                    }
                }
            }

            if (task) {
                tasks.push(task);
            }
        })
    }

    return Promise.all(tasks);
}


class DSCordovaSQLiteAdapter {

    constructor(options) {
        const DEFAULT_OPTS = {
            name: 'data.db',
            location: 'default',
            verbose: false
        };

        options = options || {};

        if (options.queryOperators) {
            this.queryOperators = options.queryOperators;
            delete options.queryOperators;
        }

        this.options = deepMixIn({}, DEFAULT_OPTS, options);

        if (window.sqlitePlugin) {
            this.db = window.sqlitePlugin.openDatabase({name: options.name, location: options.location});
        }
    }

    find(resourceConfig, id, options, tx) {
        let instance;
        options = options || {};
        options.with = options.with || [];
        let table = getTable(resourceConfig);

        let query =
            squel.select()
                .from(table)
                .where(`${table}.${resourceConfig.idAttribute} = ?`, id)
                .toString();

        if (this.options.verbose) { console.log(`Find SQL: ${query}`); }

        return new Promise((resolve, reject) => {
            if (this.db) {
                let successCallback = (tx, rs) => {
                    if (rs.rows.length < 1) {
                        reject(new Error('Not Found!'));
                    } else {
                        instance = rs.rows.item(0);
                        return loadWithRelations
                            .call(this, instance, resourceConfig, options)
                            .then(() => this.__denormalizeAttributes(instance))
                            .then((item) => resolve(item));
                    }
                };
                let errorCallback = (tx, error) => {
                    reject(new Error(error.message));
                    return false;
                };

                //Use current transaction if it exists
                if (tx) {
                    tx.executeSql(query, [], successCallback, errorCallback);
                } else {
                    this.db.transaction((tx) => {
                        tx.executeSql(query, [], successCallback, errorCallback);
                    });
                }
            } else {
                reject(new Error('Cordova SQLite plugin is not loaded!'));
            }
        });
    }

    findAll(resourceConfig, params, options) {
        let table = getTable(resourceConfig);
        let items = null;
        options = options || {};
        options.with = options.with || [];

        let query = squel.select().from(table);
        query = this.__filterQuery(resourceConfig, params, query);
        let queryStr = query.toString();

        if (this.options.verbose) { console.log(`FindAll SQL: ${queryStr}`); }

        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.transaction((tx) => {
                    tx.executeSql(queryStr, [],
                        (tx, rs) => {
                            items = [];
                            for (let i = 0; i < rs.rows.length; i++) {
                                items.push(rs.rows.item(i));
                            }
                            loadWithRelations.call(this, items, resourceConfig, options)
                                .then(() => {
                                    return items.map((value) => this.__denormalizeAttributes(value));
                                })
                                .then((denormalizedItems) => resolve(denormalizedItems));
                        },
                        (tx, error) => {
                            resolve([]);
                            return false;
                        })
                });
            } else {
                reject(new Error('Cordova SQLite plugin is not loaded!'));
            }
        });
    }

    create(resourceConfig, attrs, options) {
        let table = getTable(resourceConfig);
        attrs = this.__normalizeAttributes(resourceConfig, attrs);

        let query =
            squel.insert()
                .into(table)
                .setFields(attrs)
                .toParam();
        let selectQuery =
            squel.select()
                .from(table)
                .where('ROWID = last_insert_rowid()')
                .toString();

        if (this.options.verbose) { console.log(`Create SQL: ${query.text}, values: [${query.values}]`); }

        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.transaction((tx) => {
                        let successCallback = (tx, rs) => {
                            let instance = rs.rows.item(0);
                            return loadWithRelations
                                .call(this, instance, resourceConfig, options)
                                .then(() => this.__denormalizeAttributes(instance))
                                .then((item) => resolve(item));
                        };
                        let errorCallback = (tx, error) => {
                            //If the table doesn't have one of the columns, add it and regenerate indexes
                            if (error.message.indexOf('has no column named') != -1) {
                                let words = error.message.split(' ');
                                let columnName = words[words.length - 1];
                                let alterQuery = `ALTER TABLE ${table} ADD COLUMN ${columnName}; REINDEX ${table}`;
                                tx.executeSql(alterQuery, [], (tx, rs)=> {
                                    //Try again to insert and retrieve the row
                                    tx.executeSql(query.text, query.values, (tx, rs)=> {
                                        tx.executeSql(selectQuery, [], successCallback);
                                    }, errorCallback);
                                });
                            }
                            return false;
                        };

                        this.__createTable(resourceConfig, attrs, tx);
                        tx.executeSql(query.text, query.values,
                            (tx, rs) => {
                                tx.executeSql(selectQuery, [], successCallback);
                            }, errorCallback);
                    },
                    (error) => {
                        reject(new Error(error.message));
                        return false;
                    });
            } else {
                reject(new Error('Cordova SQLite plugin is not loaded!'));
            }
        });
    }

    update(resourceConfig, id, attrs, options) {
        let table = getTable(resourceConfig);
        attrs = this.__normalizeAttributes(resourceConfig, attrs);
        if (!attrs['id']) {
            attrs['id'] = id;
        }

        let updateQuery =
            squel.update()
                .table(table)
                .setFields(attrs)
                .where(`${table}.${resourceConfig.idAttribute} = ?`, id)
                .toParam();
        let insertQuery =
            squel.insert()
                .into(table)
                .setFields(attrs)
                .toParam();
        insertQuery.text = insertQuery.text.replace('INSERT INTO', 'INSERT OR IGNORE INTO');

        if (this.options.verbose) { console.log(`Update SQL: ${updateQuery.text}, values: [${updateQuery.values}]`); }

        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.transaction((tx) => {
                        let successCallback = (tx, rs) => {
                            this.find(resourceConfig, id, options, tx)
                                .then((item) => resolve(item));
                        };
                        let errorCallback = (tx, error) => {
                            //If the table doesn't have one of the columns, add it
                            if (error.message.indexOf('no such column') != -1
                                || error.message.indexOf('has no column named') != -1) {
                                let words = error.message.split(' ');
                                let columnName = words[words.length - 1];
                                let alterQuery = `ALTER TABLE ${table} ADD COLUMN ${columnName}`;
                                tx.executeSql(alterQuery, [], (tx, rs) => {
                                    //Try again to update/insert and retrieve the row
                                    tx.executeSql(updateQuery.text, updateQuery.values, (tx, rs)=> {
                                        tx.executeSql(insertQuery.text, insertQuery.values, successCallback, errorCallback);
                                    }, errorCallback);
                                });
                            }
                            return false;
                        };

                        this.__createTable(resourceConfig, attrs, tx);
                        //Try to update an existing row
                        tx.executeSql(updateQuery.text, updateQuery.values,
                            (tx, rs) => {
                                //Try to insert the row if the update didn't happen
                                tx.executeSql(insertQuery.text, insertQuery.values, successCallback);
                            }, errorCallback);
                    },
                    (error) => {
                        reject(new Error(error.message));
                        return false;
                    });
            } else {
                reject(new Error('Cordova SQLite plugin is not loaded!'));
            }
        });
    }

    updateAll(resourceConfig, attrs, params, options) {
        let table = getTable(resourceConfig);
        attrs = this.__normalizeAttributes(resourceConfig, attrs);

        //First, we get the ROWID of every row that is going to be updated
        let query = squel.select().from(table).field('ROWID');
        query = this.__filterQuery(resourceConfig, params, query);
        let queryStr = query.toString();

        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.transaction((tx) => {
                        tx.executeSql(queryStr, [],
                            (tx, rs) => {
                                let ids = [];
                                for (let i = 0; i < rs.rows.length; i++) {
                                    ids.push(rs.rows.item(i).id.toString());
                                }
                                let updateQuery = squel.update()
                                                    .table(table)
                                                    .setFields(attrs)
                                                    .where('ROWID IN ?', ids)
                                                    .toParam();

                                if (this.options.verbose) { console.log(`UpdateAll SQL: ${updateQuery.text}, values: [${updateQuery.values}]`); }

                                tx.executeSql(updateQuery.text, updateQuery.values,
                                    (tx, rs) => {
                                        //Fetch all the rows to return them
                                        let selectQuery = squel.select()
                                                            .from(table)
                                                            .where('ROWID IN ?', ids)
                                                            .toString();
                                        tx.executeSql(selectQuery, [],
                                            (tx, rs) => {
                                                let items = [];
                                                for (let i = 0; i < rs.rows.length; i++) {
                                                    items.push(rs.rows.item(i));
                                                }
                                                loadWithRelations.call(this, items, resourceConfig, options)
                                                    .then(() => {
                                                        return items.map((value) => this.__denormalizeAttributes(value));
                                                    })
                                                    .then((denormalizedItems) => resolve(denormalizedItems));
                                            });
                                    });
                            })
                    },
                    (error) => {
                        reject(new Error(error.message));
                        return false;
                    });
            } else {
                reject(new Error('Cordova SQLite plugin is not loaded!'));
            }
        });
    }

    destroy(resourceConfig, id, options) {
        let table = getTable(resourceConfig);

        let query =
            squel.delete()
                .from(table)
                .where(`${table}.${resourceConfig.idAttribute} = ?`, id)
                .toString();

        if (this.options.verbose) { console.log(`Destroy SQL: ${query}`); }

        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.transaction((tx) => {
                    tx.executeSql(query, [],
                        (tx, rs) => {
                            resolve();
                        },
                        (tx, error) => {
                            reject(new Error(error.message));
                            return false;
                        })
                });
            } else {
                reject(new Error('Cordova SQLite plugin is not loaded!'));
            }
        });
    }

    destroyAll(resourceConfig, params, options) {
        let table = getTable(resourceConfig);

        let query = squel.delete().from(table);
        query = this.__filterQuery(resourceConfig, params, query);
        let queryStr = query.toString();

        if (this.options.verbose) { console.log(`DestroyAll SQL: ${queryStr}`); }

        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.transaction((tx) => {
                    tx.executeSql(queryStr, [],
                        (tx, rs) => {
                            resolve();
                        },
                        (tx, error) => {
                            //Don't show an error if the table doesn't exist
                            resolve();
                            return false;
                        })
                });
            } else {
                reject(new Error('Cordova SQLite plugin is not loaded!'));
            }
        });
    }

    createIndex(resourceConfig, name, params) {
        let table = getTable(resourceConfig);
        let suffix = Math.floor(Math.random()*10);

        let columnsArr = [];
        Object.keys(params).forEach((key) => {
            let str = key;
            let value = params[key];
            if (typeof value === 'string'){
                let upperValue = value.toUpperCase();
                if (upperValue === 'ASC' || upperValue === 'DESC') {
                    str = `${str} ${value}`;
                }
            }
            columnsArr.push(str);
        });
        let columns = columnsArr.join(', ');

        let query = `CREATE INDEX IF NOT EXISTS ${name} ON ${table} (${columns})`;
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.transaction((tx) => {
                        tx.executeSql(query);
                    },
                    (error) => {
                        reject(new Error(error.message));
                        return false;
                    },
                    () => resolve());
            } else {
                reject(new Error('Cordova SQLite plugin is not loaded!'));
            }
        });

    }


    __filterQuery(resourceConfig, params, query) {
        let joinedTables = [];

        params = params || {};
        params.where = params.where || {};
        params.orderBy = params.orderBy || params.sort;
        params.skip = params.skip || params.offset;

        Object.keys(params).forEach(k => {
            let v = params[k];
            if (!contains(reserved, k)) {
                if (isObject(v)) {
                    params.where[k] = v;
                } else {
                    params.where[k] = {
                        '==': v
                    }
                }
                delete params[k];
            }
        });

        if (!isEmpty(params.where)) {
            forOwn(params.where, (criteria, field) => {
                if (!isObject(criteria)) {
                    criteria = {
                        '==': criteria
                    };
                    params.where[field] = criteria;
                }

                if (contains(field, '.')) {
                    if (contains(field, ',')) {
                        let splitFields = field.split(',').map(c => c.trim());
                        field = splitFields.map(splitField => processRelationField.call(this, resourceConfig, query, splitField, criteria, joinedTables)).join(',');
                    } else {
                        field = processRelationField.call(this, resourceConfig, query, field, criteria, joinedTables)
                    }
                }

                if (field) {
                    forOwn(criteria, (v, op) => {
                        if (typeof v === 'boolean') {
                            v = v ? 'true' : 'false';
                        }

                        // Builtin operators
                        if (op === '==' || op === '===') {
                            if (v === null) {
                                query = query.where(`${field} IS NULL`);
                            } else {
                                query = query.where(`${field} = ?`, v)
                            }
                        } else if (op === '!=' || op === '!==') {
                            if (v === null) {
                                query = query.where(`${field} IS NOT NULL`);
                            } else {
                                query = query.where(`${field} != ?`, v);
                            }
                        } else if (op === '>') {
                            query = query.where(`${field} > ?`, v);
                        } else if (op === '>=') {
                            query = query.where(`${field} >= ?`, v);
                        } else if (op === '<') {
                            query = query.where(`${field} < ?`, v);
                        } else if (op === '<=') {
                            query = query.where(`${field} <= ?`, v);
                        } else if (op === 'in') {
                            query = query.where(`${field} IN ?`, v);
                        } else if (op === 'notIn') {
                            query = query.where(`${field} NOT IN ?`, v);
                        } else if (op === 'near') {
                            throw new Error('Operator not supported');
                        } else if (op === 'like') {
                            query = query.where(`${field} LIKE ?`, v);
                        } else if (op === '|like') {
                            query = query.where(
                                squel.expr()
                                    .or(`${field} LIKE ?`, v)
                            );
                        } else if (op === '|==' || op === '|===') {
                            if (v === null) {
                                query = query.where(
                                    squel.expr()
                                        .or(`${field} IS NULL`)
                                );
                            } else {
                                query = query.where(
                                    squel.expr()
                                        .or(`${field} = ?`, v)
                                );
                            }
                        } else if (op === '|!=' || op === '|!==') {
                            if (v === null) {
                                query = query.where(
                                    squel.expr()
                                        .or(`${field} IS NOT NULL`)
                                );
                            } else {
                                query = query.where(
                                    squel.expr()
                                        .or(`${field} != ?`, v)
                                );
                            }
                        } else if (op === '|>') {
                            query = query.where(
                                squel.expr()
                                    .or(`${field} > ?`, v)
                            );
                        } else if (op === '|>=') {
                            query = query.where(
                                squel.expr()
                                    .or(`${field} >= ?`, v)
                            );
                        } else if (op === '|<') {
                            query = query.where(
                                squel.expr()
                                    .or(`${field} < ?`, v)
                            );
                        } else if (op === '|<=') {
                            query = query.where(
                                squel.expr()
                                    .or(`${field} <= ?`, v)
                            );
                        } else if (op === '|in') {
                            query = query.where(
                                squel.expr()
                                    .or(`${field} IN ?`, v)
                            )
                        } else if (op === '|notIn') {
                            query = query.where(
                                squel.expr()
                                    .or(`${field} NOT IN ?`, v)
                            )
                        } else {
                            throw new Error('Operator not found')
                        }
                    })
                }
            })
        }

        if (params.orderBy) {
            if (isString(params.orderBy)) {
                params.orderBy = [
                    [params.orderBy, 'asc']
                ]
            }
            for (var i = 0; i < params.orderBy.length; i++) {
                if (isString(params.orderBy[i])) {
                    params.orderBy[i] = [params.orderBy[i], 'asc']
                }
                query = params.orderBy[i][1].toUpperCase() === 'DESC'
                    ? query.order(params.orderBy[i][0], false)
                    : query.order(params.orderBy[i][0], true);
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

    __createTable(resourceConfig, attrs, tx) {
        let table = getTable(resourceConfig);
        let attrsNames = [];
        let hasPrimaryKey = false;

        Object.keys(attrs).forEach((key) => {
            let str = key;
            if (key === resourceConfig.idAttribute) {
                str = str.concat(' PRIMARY KEY');
                hasPrimaryKey = true;
            }
            attrsNames.push(str);
        });

        //Add primary key column if it's not included in the attributes
        if (!hasPrimaryKey && resourceConfig.idAttribute) {
            attrsNames.push(`${resourceConfig.idAttribute} INTEGER PRIMARY KEY ASC`);
        }

        let attrsStr = attrsNames.join(', ');

        //Creates table if it's the first insert of the resource
        let createSyntax = `CREATE TABLE IF NOT EXISTS ${table} (${attrsStr})`;
        return tx.executeSql(createSyntax);
    }

    __normalizeAttributes(resourceConfig, attrs) {
        let processed = deepMixIn({}, attrs);
        processed = removeCircular(omit(processed, resourceConfig.relationFields || []));

        Object.keys(processed).forEach((key) => {
            let value = processed[key];
            if (typeof value === 'boolean' || typeof value === 'object' || Array.isArray(value)) {
                processed[key] = JSON.stringify(value);
            } else if (value === undefined || value === null) {
                processed[key] = null;
            }
        });

        return processed;
    }


    __denormalizeAttributes(item) {
        let denormalizedItem = deepMixIn({}, item);

        Object.keys(denormalizedItem).forEach((key) => {
            let value = denormalizedItem[key];
            if (value === 'true' || value === 'false'
                || (typeof value === 'string' && (value.substr(0, 2) === '[{' || value.substr(0, 1) === '{'))) {
                denormalizedItem[key] = JSON.parse(value);
            }
        });

        return denormalizedItem;
    }

}


module.exports = DSCordovaSQLiteAdapter;