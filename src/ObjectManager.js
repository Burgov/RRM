"use strict";

var ObjectManager = function() {
    this.proxyFactory = new ProxyFactory();

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
            if (map[i].id == id) {
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
     * @param property
     * @param data the value
     */
    var defineProperty = function(entity, name, property, data) {
        if (!('transform' in property)) {
            throw Error('transform is mandatory');
        }

        self.loadPropertyValue(entity, name, property, data);

        var definition = {};

        if (property.readable) {
            definition.get = function() {
                return entity.$values[name];
            }
        }

        if (property.writable) {
            definition.set = function(value) {
                entity.$dirty = true;
                entity.$values[name] = property.transform(value, self);
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
     * @param property
     * @param data
     */
    this.loadPropertyValue = function(entity, name, property, data) {
        entity.$raw[name] = data[name];
        entity.$values[name] = property.transform(data[name], this);
    }

    /**
     * Update the data of an existing entity
     *
     * @param existing
     * @param data
     */
    this.update = function(existing, data) {
        for (var i in existing.$schema) {
            self.loadPropertyValue(existing, i, existing.$schema[i], data);
        }
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
                defineProperty(entity, i, entity.$schema[i], data);
            }

            entityClassMap[entityName].constructor.call(entity);

            return entity;
        }

        var existing = getFromObjectMap(entityName, data.id);
        if (null !== existing) {
            if (!(existing instanceof this.proxyFactory.getProxyClass(entityClassMap[entityName]))) {
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
        for (var i in entity.$schema) {
            if (entity.$schema[i].persistable) {
                data[i] = entity.$schema[i].reverseTransform(entity[i], this);
            }
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
