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
            value: 'reverseTransform' in options ? options.options : function(json) {
                json[name] = this.name;
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
            if (json[name] instanceof Object) {
                return self.om.create(options.entityClass, json[name]);
            } else if (typeof(json[name]) == 'number') {
                return self.om.createProxy(options.entityClass, json[name]);
            } else {
                throw Error('Unexpected value');
            }
        }
    }

    RRM.Relation.Base.call(this, name, options);
}
RRM.Relation.ManyToOne.prototype = Object.create(RRM.Relation.Base.prototype);
RRM.Relation.ManyToOne.prototype.constructor = RRM.Relation.ManyToOne;
