var RRM = RRM || {};
RRM.Property = RRM.Property || {};
RRM.Relation = RRM.Relation || {};

RRM.Property.Base = function(name, options) {
    options = options || {};

    if (!('readable' in options && options.readable === false)) {
        this.get = 'get' in options ? options.get : function() {
            return this.$values[name];
        };
    }

    if (!('writable' in options && options.writable === false)) {
        this.set = 'set' in options ? options.set : function(value) {
            this.$values[name] = value;
        };
    }

    if (!('loadable' in options && options.loadable === false)) {
        Object.defineProperty(this, 'transform', {
            value: 'transform' in options ? options.transform :function(json) {
                return json[name];
            },
            enumerable: true
        });
    }
    if (!('persistable' in options && options.persistable === false)) {
        Object.defineProperty(this, 'reverseTransform', {
            value: 'reverseTransform' in options ? options.reverseTransform : function(json) {
                json[name] = this.$values[name];
            },
            enumerable: true
        });
    }

}

// Int
RRM.Property.Int = function(name, options) {
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.Int.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Int.prototype.constructor = RRM.Property.Int;

// String
RRM.Property.String = function(name, options) {
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.String.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.String.prototype.constructor = RRM.Property.String;

// Boolean
RRM.Property.Boolean = function(name, options) {
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.Boolean.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Boolean.prototype.constructor = RRM.Property.Boolean;

// Array
RRM.Property.Array = function(name, options) {
    options = options || {};
    options.transform = options.transform || function(json) {
        var data = [];

        if (json[name] instanceof Array) {
            data = json[name];
        } else if (json[name] instanceof Object) {
            for (var i in Object.getOwnPropertyNames(json[name])) {
                data.push(json.name[i]);
            }
        }

        return data;
    };
    options.reverseTransform = options.reverseTransform || function(json) {
        if (this.$values[name]) {
            json[name] = this.$values[name];
        }
    }
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.Array.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Array.prototype.constructor = RRM.Property.Array;

// Object
RRM.Property.Object = function(name, options) {
    options = options || {};
    options.transform = options.transform || function(json) {
        return angular.copy(json[name]);
    };
    options.reverseTransform = options.reverseTransform || function(json) {
        json[name] = angular.copy(this.$values[name]);
    }
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.Object.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Object.prototype.constructor = RRM.Property.Object;

// Date
RRM.Property.Date = function(name, options) {
    options = options || {};
    options.transform = function(json) {
        if (null === json[name] || undefined === json[name]) {
            return null;
        }
        return new Date(json[name]);
    }
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.Date.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Date.prototype.constructor = RRM.Property.Date;

// Relation
RRM.Relation.Base = function(name, options) {
    RRM.Property.Base.call(this, name, options);
}
RRM.Relation.Base.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Relation.Base.prototype.constructor = RRM.Relation.Base;
Object.defineProperty(RRM.Relation.Base.prototype, 'om', {
    set: function(om) {
        if (this._om) {
            throw Error('om was already set!');
        }
        if (!(om instanceof ObjectManager)) {
            throw Error('om should be instance of ObjectManager');
        }
        this._om = om;
    },
    get: function() {
        return this._om;
    }
});

// ManyToOne
RRM.Relation.ManyToOne = function(name, options) {
    var self = this;

    options = options || {};

    if (!('transform' in options)) {
        options.transform = function(json) {
            if (json[name] === undefined || json[name] === null) {
                return null;
            } else if (json[name] instanceof Object) {
                return self.om.create(options.entityClass, json[name]);
            } else {
                return self.om.getReference(options.entityClass, json[name]);
            }
        }
    }

    if (!('reverseTransform' in options)) {
        options.reverseTransform = function(json) {
            json[name] = this.$values[name] ? this.$values[name].id : null;
        }
    }

    RRM.Relation.Base.call(this, name, options);
}
RRM.Relation.ManyToOne.prototype = Object.create(RRM.Relation.Base.prototype);
RRM.Relation.ManyToOne.prototype.constructor = RRM.Relation.ManyToOne;

// ManyToMany
RRM.Relation.ManyToMany = function(name, options) {
    var self = this;

    options = options || {};

    if (!('transform' in options)) {
        options.transform = function(json) {
            var data = [];
            for (var i in json[name]) {
                var reference;
                if (json[name][i] instanceof Object) {
                    reference = self.om.create(options.entityClass, json[name][i]);
                } else {
                    reference = self.om.getReference(options.entityClass, json[name][i]);
                }
                data.push(reference);
            }
            return data;
        }
    }

    if (!('reverseTransform' in options)) {
        options.reverseTransform = function(json) {
            var data = [];
            for (var i in this.$values[name]) {
                data.push(this.$values[name][i].id);
            }
            json[name] = data;
        }
    }

    RRM.Relation.Base.call(this, name, options);
}
RRM.Relation.ManyToMany.prototype = Object.create(RRM.Relation.Base.prototype);
RRM.Relation.ManyToMany.prototype.constructor = RRM.Relation.ManyToMany;

// OneToMany
RRM.Relation.OneToMany = function(name, options) {
    var self = this;

    options = options || {};
    options.transform = function(json) {
        var data = [];
        for (var i in json[name]) {
            var reference;
            if (json[name][i] instanceof Object) {
                reference = self.om.create(options.entityClass, json[name][i]);
            } else {
                reference = self.om.getReference(options.entityClass, json[name][i]);
            }
            data.push(reference);
        }
        return data;
    }

    options.reverseTransform = function(json) {
        var data = [];
        for (var i in this.$values[name]) {
            data.push(self.om.toArray(this.$values[name][i]));
        }
        json[name] = data;
    }

    RRM.Relation.Base.call(this, name, options);
}
RRM.Relation.OneToMany.prototype = Object.create(RRM.Relation.Base.prototype);
RRM.Relation.OneToMany.prototype.constructor = RRM.Relation.OneToMany;

// OneToOne
RRM.Relation.OneToOne = function(name, options) {
    var self = this;

    options = options || {};
    options.transform = function(json) {
        if (!options.entityClass) {
            return json[name];
        }
        return self.om.create(options.entityClass, json[name]);
    }

    options.reverseTransform = function(json) {
        json[name] = this.$values[name] ? self.om.toArray(this.$values[name]) : undefined;
    }

    RRM.Relation.Base.call(this, name, options);
}
RRM.Relation.OneToOne.prototype = Object.create(RRM.Relation.Base.prototype);
RRM.Relation.OneToOne.prototype.constructor = RRM.Relation.OneToOne;
