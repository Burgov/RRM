var ObjectManager = function() {

    var self = this;

    var objectMap = {};

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

        Object.defineProperty(entity, name, definition);
    };

    this.loadPropertyValue = function(entity, name, property, data) {
        var value = property.transform(data);
        entity.$values[name] = value;
    }

    this.create = function(entityClass, data) {
        var entity = new entityClass;

        for (var i in entity.$schema) {
            defineProperty(entity, i, entity.$schema[i], data);
        }

        objectMap[entityClass.$name] = objectMap[entityClass.$name] || {};
        if (entity.id in objectMap[entityClass.$name]) {
            if (!(objectMap[entityClass.$name][entity.id] instanceof Proxy)) {
                // update the entity data
                return;
            }

            objectMap[entityClass.$name][entity.id].object = entity;
            return entity;
        }
        objectMap[entityClass.$name][entity.id] = entity;

        return entity;
    };

    this.get = function(entityClass, id) {
        if (objectMap[entityClass.$name][id] === undefined) {
            throw Error('not loaded');
        }

        return objectMap[entityClass.$name][id];
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

    this.createProxy = function(entityClass, id) {
        var proxy = new Proxy(self, entityClass, id);
        objectMap[entityClass] = objectMap[entityClass] || {};
        objectMap[entityClass][id] = proxy;
        return proxy;
    }

    this.loadSchema = function(className, schemaClassName) {

        className.prototype = Object.create(Entity.prototype);
        className.prototype.$schema = new schemaClassName;

        var schema = className.prototype.$schema;
        for (var i in schema) {
            if (schema[i] instanceof RRM.Relation.Base) {
                schema[i].om = self;
            }
        }
    }
}