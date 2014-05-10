"use strict";

var ObjectManager = function(proxyFactory) {
    this.proxyFactory = proxyFactory || new ProxyFactory;

    var self = this;

    var objectMap = {};

    var entityClassMap = {};

    /**
     * Register an already prepared entity class within this instance of the ObjectManager
     *
     * @param entityClass
     */
    this.register = function(entityClass) {
        entityClassMap[entityClass.prototype.$name] = entityClass;
    }

    /**
     * Store this entity into the object map for later reference
     *
     * @param string entityName
     * @param entity
     */
    var addToObjectMap = function(entityName, entity) {
        objectMap[entityName] = objectMap[entityName] || [];
        if (objectMap[entityName].indexOf(entity) < 0) {
            objectMap[entityName].push(entity);
        }
    }

    /**
     * Fetch the references entity from the object map or null if it is not stored.
     *
     * @param string entityName
     * @param id
     * @returns entity|null
     */
    var getFromObjectMap = function(entityName, id) {
        if (id === undefined) {
            return null;
        }
        if (!(entityName in objectMap)) {
            return null;
        }

        var map = objectMap[entityName];
        for (var i in map) {
            if (map[i][ObjectManager.getIdProperty(entityClassMap[entityName])] == id) {
                return map[i];
            }
        }
        return null;
    }

    /**
     * When constructing the entity class, this method will add the property as defined in the schema.
     *
     * @param entity
     * @param name
     */
    var defineProperty = function(entity, name) {
        var property = entity.$schema[name];
        if (!('transform' in property)) {
            throw Error('transform is mandatory');
        }

        var definition = {};

        if (property.readable) {
            definition.get = function() {
                if (!(name in entity.$values)) {
                    throw new Error("The property '"+name+"' was not initialized");
                }

                return entity.$values[name];
            }
        }

        if (property.writable) {
            definition.set = function(value) {
                if (!(name in entity.$values)) {
                    throw new Error("The property '"+name+"' was not initialized");
                }

                entity.$dirty = true;
                entity.$values[name] = property.transform(value, self, entity);
            }
        }

        definition.enumerable = true;

        Object.defineProperty(entity, name, definition);
    };

    /**
     * With the original data, first update the $raw object with it, then transform the value and
     * store the result in the $values object
     *
     * @param entity
     * @param name
     * @param value
     */
    this.loadPropertyValue = function(entity, name, value) {
        var property = entity.$schema[name];

        if (property === undefined) {
            return;
        }

        entity.$raw[name] = value;
        this.setPropertyValue(entity, name, property.transform(value, this, entity));
    }

    /**
     * To prevent a call to the transform of the property, this method can be used to directly inject the value into
     * the entity (use with caution. If something unfit for the property is injected, problems may come later)
     *
     * @param entity
     * @param name
     * @param value
     */
    this.setPropertyValue = function(entity, name, value) {
        if (this.isProxy(entity) && !entity.isLoaded()) {
            entity[name] = value;
            return;
        }
        entity.$values[name] = value;
    }

    /**
     * Update the data of an existing entity
     *
     * @param existing
     * @param data
     */
    this.update = function(existing, data) {
        for (var i in existing.$schema) {
            delete existing.$raw[i];
            delete existing.$values[i];
        }

        for (var i in data) {
            self.loadPropertyValue(existing, i, data[i]);
        }
    }

    /**
     * Check to see if an entity is actually a proxy
     *
     * @param entity
     * @returns boolean
     */
    this.isProxy = function(entity) {
        return entity instanceof self.proxyFactory.getProxyClass(entityClassMap[entity.$name]);
    }

    /**
     * Create an entity with the specified data. If the entity already exists, the data is updated in that entity
     * instead. If the entity already exists as an unloaded Proxy, the Proxy will be loaded with the specified data.
     *
     * @param string entityName
     * @param data
     * @returns object entity (new or existing)
     */
    this.create = function(entityName, data) {
        var createEntity = function(doAddToObjectMap) {
            var entity = Object.create(entityClassMap[entityName].prototype, {
                $values: { value: {} },
                $raw: { value: {} },
                $dirty: { value: false, writable: true }
            });

            if (doAddToObjectMap) {
                addToObjectMap(entityName, entity);
            }

            data = data || {};

            for (var i in entity.$schema) {
                defineProperty(entity, i);
            }

            for (var i in data) {
                self.loadPropertyValue(entity, i, data[i]);
            }

            entityClassMap[entityName].constructor.call(entity);

            return entity;
        }

        var existing = getFromObjectMap(entityName, data[ObjectManager.getIdProperty(entityClassMap[entityName])]);
        if (null !== existing) {
            if (!(this.isProxy(existing))) {
                this.update(existing, data);
                return existing;
            }

            var entity = createEntity(false);

            existing.object = entity;

            entityClassMap[entityName].constructor.call(existing);
            return existing;
        }
        var entity = createEntity(true);

        return entity;
    };

    /**
     * Fetch an entity by ID
     *
     * @param string entityName
     * @param id
     * @throws Error if the entity is not loaded or proxied
     * @returns {entity|null}
     */
    this.get = function(entityName, id) {
        var entity = getFromObjectMap(entityName, id);
        if (null === entity) {
            throw Error('not loaded');
        }

        return entity;
    }

    /**
     * Fetch all entities of the specified class
     *
     * @param string entityName
     * @returns Object of entities mapped by ID
     */
    this.getAll = function(entityName) {
        return objectMap[entityName] || {};
    }

    /**
     * Convert the entity to a simple object
     * @param entity
     * @returns object
     */
    this.toArray = function(entity) {
        var data = {};

        var unitializedProperties = [];

        for (var i in entity.$schema) {
            if (entity.$schema[i].persistable) {
                try {
                    data[i] = entity.$schema[i].reverseTransform(entity[i], this);
                } catch (e) {
                    if (e.message == "The property '"+i+"' was not initialized") {
                        unitializedProperties.push(i);
                    } else {
                        throw e;
                    }
                }
            }
        }

        if (unitializedProperties.length) {
            throw new Error('Cannot call toArray() on an entity that is not fully initialized. Uninitialized properties: ' + unitializedProperties.join(", "));
        }

        return data;
    }

    /**
     * Does the same as this.get(), but instead of throwing an Error, it will create a Proxy object if the entity is
     * not loaded.
     *
     * @param string entityName
     * @param id
     * @returns entity
     */
    this.getReference = function(entityName, id) {
        var reference;

        reference = getFromObjectMap(entityName, id);
        if (null === reference) {
            reference = this.createProxy(entityName, id);
        }

        return reference;
    }

    /**
     * Create a new Proxy for the specified entity class and ID
     *
     * @param string entityName
     * @param id
     * @returns Proxy
     */
    this.createProxy = function(entityName, id) {
        var proxy = this.proxyFactory.createProxy(entityClassMap[entityName], id);
        addToObjectMap(entityName, proxy);
        return proxy;
    }
}

/**
 * Combine the entity class and it's schema and assign the $name property
 */
Object.defineProperty(ObjectManager, 'prepareEntity', {
    value: function(identifier, className, schemaClassName) {
        Object.defineProperty(className.prototype, '$name', {
            value: identifier
        });
        Object.defineProperty(className.prototype, '$schema', {
            value: new schemaClassName
        });
    }
});

Object.defineProperty(ObjectManager, 'getIdProperty', { value: function(entityClass) {
    var schemaConstructor = entityClass.prototype.$schema.constructor;
    return 'id' in schemaConstructor ? schemaConstructor.id : 'id';
} });