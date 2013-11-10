var ObjectManager = function() {

    var self = this;

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

        return entity;
    };

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
}