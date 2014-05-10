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

        var schemaConstructor = entityClassMap[entityName].prototype.$schema.constructor;
        var idProperty = 'id' in schemaConstructor ? schemaConstructor.id : 'id';

        var map = objectMap[entityName];
        for (var i in map) {
            if (map[i][idProperty] == id) {
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

        var existing = getFromObjectMap(entityName, data.id);
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

"use strict";

var RRM = RRM || {};
RRM.Property = RRM.Property || {};
RRM.Relation = RRM.Relation || {};

RRM.Property.Base = function(name, options) {
    options = options || {};

    this.readable = 'readable' in options ? options.readable : true;
    this.writable = 'writable' in options ? options.writable : true;
    this.loadable = 'loadable' in options ? options.loadable: true;
    this.persistable = 'persistable' in options ? options.persistable : true;
}

Object.defineProperty(RRM.Property.Base.prototype, 'transform', {
    value: function(value) {
        return value;
    }
})
Object.defineProperty(RRM.Property.Base.prototype, 'reverseTransform', {
    value: function(value) {
        return value;
    }
})

// Int
RRM.Property.Int = function() {
    RRM.Property.Base.apply(this, arguments);
};
RRM.Property.Int.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Int.prototype.constructor = RRM.Property.Int;
Object.defineProperty(RRM.Property.Int.prototype, 'transform', {
    value: function(value) {
        return parseInt(RRM.Property.Base.prototype.transform.call(this, value), 10);
    }
});

// String
RRM.Property.String = function(name, options) {
    RRM.Property.Base.apply(this, arguments);
}
RRM.Property.String.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.String.prototype.constructor = RRM.Property.String;
Object.defineProperty(RRM.Property.String.prototype, 'transform', {
    value: function(value) {
        value = RRM.Property.Base.prototype.transform.call(this, value);
        if (value === undefined || value === null) {
            return null;
        }
        return value + "";
    }
});

// Boolean
RRM.Property.Boolean = function(name, options) {
    RRM.Property.Base.apply(this, arguments);
};
RRM.Property.Boolean.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Boolean.prototype.constructor = RRM.Property.Boolean;
Object.defineProperty(RRM.Property.Boolean.prototype, 'transform', {
    value: function(value) {
        return !!RRM.Property.Base.prototype.transform.call(this, value);
    }
});

// Array
RRM.Property.Array = function(name, options) {
    RRM.Property.Base.call(this, arguments);
};
RRM.Property.Array.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Array.prototype.constructor = RRM.Property.Array;
Object.defineProperty(RRM.Property.Array.prototype, 'transform', {
    value: function(value) {
        if (value instanceof Array) {
            return value;
        }

        if (value instanceof Object) {
            var data = [];
            var names = Object.getOwnPropertyNames(value);
            for (var i in names) {
                data.push(value[names[i]]);
            }

            return data;
        }

        throw Error("Only Arrays and Objects are supported");
    }
});

// Object
RRM.Property.Object = function(name, options) {
    RRM.Property.Base.apply(this, arguments);
};
RRM.Property.Object.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Object.prototype.constructor = RRM.Property.Object;

// Date
RRM.Property.Date = function(name, options) {
    RRM.Property.Base.apply(this, arguments);
};
RRM.Property.Date.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Date.prototype.constructor = RRM.Property.Date;
Object.defineProperty(RRM.Property.Date.prototype, 'transform', {
    value: function(value) {
        return new Date(RRM.Property.Base.prototype.transform(value));
    }
});

// Relation
RRM.Relation.Base = function(name, options) {
    this.entityClass = options.entityClass;
    RRM.Property.Base.apply(this, arguments);
}
RRM.Relation.Base.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Relation.Base.prototype.constructor = RRM.Relation.Base;

// ManyToOne
RRM.Relation.ManyToOne = function(name, options) {
    RRM.Relation.Base.apply(this, arguments);
}
RRM.Relation.ManyToOne.prototype = Object.create(RRM.Relation.Base.prototype);
RRM.Relation.ManyToOne.prototype.constructor = RRM.Relation.ManyToOne;
Object.defineProperties(RRM.Relation.ManyToOne.prototype, {
    transform: {
        value: function(value, om) {
            if (value === undefined || value === null) {
                return null;
            } else if (value instanceof Object) {
                return om.create(this.entityClass, value);
            } else {
                return om.getReference(this.entityClass, value);
            }
        }
    },
    reverseTransform: {
        value: function(value, om) {
            return value ? value.id : null;
        }
    }
})

// ManyToMany
RRM.Relation.ManyToMany = function(name, options) {
    RRM.Relation.Base.apply(this, arguments);
}
RRM.Relation.ManyToMany.prototype = Object.create(RRM.Relation.Base.prototype);
RRM.Relation.ManyToMany.prototype.constructor = RRM.Relation.ManyToMany;
Object.defineProperties(RRM.Relation.ManyToMany.prototype, {
    transform: {
        value: function(value, om) {
            var self = this;

            return value.map(function(value) {
                return RRM.Relation.ManyToOne.prototype.transform.call(self, value, om);
            });
        }
    },
    reverseTransform: {
        value: function(value, om) {
            var self = this;

            return value.map(function(value) {
                return RRM.Relation.ManyToOne.prototype.reverseTransform.call(self, value, om);
            });
        }
    }
})

// OneToMany
RRM.Relation.OneToMany = function(name, options) {
    RRM.Relation.Base.apply(this, arguments);
    this.backReference = options.backReference || null;
}
RRM.Relation.OneToMany.prototype = Object.create(RRM.Relation.Base.prototype);
RRM.Relation.OneToMany.prototype.constructor = RRM.Relation.OneToMany;
Object.defineProperties(RRM.Relation.OneToMany.prototype, {
    transform: {
        value: function(value, om, entity) {
            var data = [];
            for (var i in value) {
                var reference;
                if (value[i] instanceof Object) {
                    reference = om.create(this.entityClass, value[i]);
                } else {
                    reference = om.getReference(this.entityClass, value[i]);
                }
                data.push(reference);

                if (this.backReference) {
                    om.setPropertyValue(reference, this.backReference, entity);
                }
            }

            return data;
        }
    },
    reverseTransform: {
        value: function(value, om) {
            return value.map(function(value) {
                return om.toArray(value)
            });
        }
    }
});

// OneToOne
RRM.Relation.OneToOne = function(name, options) {
    RRM.Relation.Base.apply(this, arguments);
}
RRM.Relation.OneToOne.prototype = Object.create(RRM.Relation.Base.prototype);
RRM.Relation.OneToOne.prototype.constructor = RRM.Relation.OneToOne;
Object.defineProperties(RRM.Relation.OneToOne.prototype, {
    transform: {
        value: function(value, om) {
            if (!this.entityClass) {
                return value;
            }
            return om.create(this.entityClass, value);
        }
    },
    reverseTransform: {
        value: function(value, om) {
            return value ? om.toArray(value) : undefined;
        }
    }
});

"use strict";

var ProxyFactory = function() {

    var proxyClasses = {};

    /**
     * Create a proxy class for the given entity class. All the properties of entityClass will be added and the Proxy
     * class will still answer true to instanceof calls for entityClass.
     *
     * @param entityClass
     * @return Proxy
     */
    var createProxyClass = function(entityClass) {
        var Proxy = function(id) {
            this.object = undefined;

            var self = this;

            this.isLoaded = function() {
                return this.object !== undefined;
            }

            this.load = function() {
                if (this.object === undefined) {
                    throw Error('Entity cannot be loaded');
                }
            }

            this.addProperty = function(name) {
                Object.defineProperty(this, name, {
                    get: function() {
                        self.load();
                        return self.object[name];
                    },
                    set: function(value) {
                        self.load();
                        self.object[name] = value;
                    },
                    enumerable: true
                })
            }

            for (var i in entityClass.prototype.$schema) {
                if (i == 'id') {
                    continue;
                }

                this.addProperty(i);
            }

            Object.defineProperty(this, 'id', {
                get: function() {
                    return id;
                },
                enumerable: true
            });

            entityClass.call(this);
        };

        Proxy.prototype = Object.create(entityClass.prototype);
        Proxy.constructor = Proxy;

        return Proxy;
    }

    this.getProxyClass = function(entityClass) {
        if (!((entityClass.$name + 'Proxy') in proxyClasses)) {
            proxyClasses[entityClass.$name + 'Proxy'] = createProxyClass(entityClass);
        }
        return proxyClasses[entityClass.$name + 'Proxy'];
    }

    this.createProxy = function(entityClass, id) {
        var proxyClass = this.getProxyClass(entityClass);
        return new proxyClass(id);
    }
}
