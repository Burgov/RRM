var ObjectManager = function() {
    this.proxyFactory = new ProxyFactory(this);

    var self = this;

    var objectMap = {};

    var addToObjectMap = function(entityClass, entity) {
        var name = entityClass.$name;
        objectMap[name] = objectMap[name] || [];
        if (objectMap[name].indexOf(entity) < 0) {
            objectMap[name].push(entity);
        }
    }
    var getFromObjectMap = function(entityClass, id) {
        if (id === undefined) {
            return null;
        }
        if (!(entityClass.$name in objectMap)) {
            return null;
        }
        var map = objectMap[entityClass.$name];
        for (var i in map) {
            if (map[i].id == id) {
                return map[i];
            }
        }
        return null;
    }

    var defineProperty = function(entity, name, property, data) {
        if (!('transform' in property)) {
            throw Error('transform is mandatory');
        }

        self.loadPropertyValue(entity, name, property, data);

        var definition = {};
        if ('get' in property) {
            definition.get = function() {
                return property.get.call(entity);
            }
        }
        if ('set' in property) {
            definition.set = function(value) {
                entity.$dirty = true;
                return property.set.call(entity, value);
            }
        }

        definition.enumerable = true;

        Object.defineProperty(entity, name, definition);
    };

    this.loadPropertyValue = function(entity, name, property, data) {
        entity.$raw[name] = data[name];
        var value = property.transform(data);
        entity.$values[name] = value;
    }

    this.update = function(existing, data) {
        for (var i in existing.$schema) {
            self.loadPropertyValue(existing, i, existing.$schema[i], data);
        }
    }

    this.create = function(entityClass, data) {
        var entity = new entityClass;

        data = data || {};

        for (var i in entity.$schema) {
            defineProperty(entity, i, entity.$schema[i], data);
        }


        var existing = getFromObjectMap(entityClass, data.id);
        if (null !== existing) {
            if (!(existing instanceof this.proxyFactory.getProxyClass(entityClass))) {
                this.update(existing, data);
                return existing;
            }

            existing.object = entity;
            existing.initialize(this);
            return existing;
        }
        entity.initialize(this);

        addToObjectMap(entityClass, entity);
        return entity;
    };

    this.get = function(entityClass, id) {
        var entity = getFromObjectMap(entityClass, id);
        if (null === entity) {
            throw Error('not loaded');
        }

        return entity;
    }

    this.getAll = function(entityClass) {
        return objectMap[entityClass.$name] || {};
    }

    this.toArray = function(entity) {
        var data = {};
        for (var i in entity.$schema) {
            if ('reverseTransform' in entity.$schema[i]) {
                entity.$schema[i].reverseTransform.call(entity, data);
            }
        }
        return data;
    }

    this.save = function(entity) {
        var data = {};

        for (var i in entity.$schema) {
            var property = entity.$schema[i];
            if (!('reverseTransform' in property)) {
                continue;
            }

            property.reverseTransform.call(entity, data);
        }
        entity.$dirty = false;

        repo.update(entity, data);
    };

    this.getReference = function(entityClass, id) {
        var reference;

        reference = getFromObjectMap(entityClass, id);
        if (null === reference) {
            reference = this.createProxy(entityClass, id);
        }

        return reference;
    }
    this.createProxy = function(entityClass, id) {
        var proxy = this.proxyFactory.createProxy(entityClass, id);
        addToObjectMap(entityClass, proxy);
        return proxy;
    }

    this.loadSchema = function(className, schemaClassName) {

        className.prototype = Object.create(Entity.prototype);
        className.prototype.constructor = className;
        className.prototype.$schema = new schemaClassName;

        var schema = className.prototype.$schema;
        for (var i in schema) {
            if (schema[i] instanceof RRM.Relation.Base) {
                schema[i].om = self;
            }
        }
    }
}