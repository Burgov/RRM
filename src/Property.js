"use strict";

var RRM = RRM || {};
RRM.Property = RRM.Property || {};
RRM.Relation = RRM.Relation || {};

RRM.Property.Base = function(name, options) {
    options = options || {};

    this.readable = 'readable' in options ? options.readable : true;
    this.writable = 'writable' in options ? options.writable : true;

    if (!('loadable' in options && options.loadable === false)) {
        Object.defineProperty(this, 'transform', {
            value: 'transform' in options ? options.transform :function(value) {
                return value;
            },
            enumerable: true
        });
    }
    if (!('persistable' in options && options.persistable === false)) {
        Object.defineProperty(this, 'reverseTransform', {
            value: 'reverseTransform' in options ? options.reverseTransform : function(value) {
                return value
            },
            enumerable: true
        });
    }
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
RRM.Property.Int = function(name, options) {
    options = options || {};
    options.transform = options.transform || function(value) {
        return parseInt(RRM.Property.Base.prototype.transform(value), 10);
    };
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.Int.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Int.prototype.constructor = RRM.Property.Int;

// String
RRM.Property.String = function(name, options) {
    options = options || {};
    options.transform = options.transform || function(value) {
        value = RRM.Property.Base.prototype.transform(value);
        if (value === undefined || value === null) {
            return null;
        }
        return value + "";
    };
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.String.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.String.prototype.constructor = RRM.Property.String;

// Boolean
RRM.Property.Boolean = function(name, options) {
    options = options || {};
    options.transform = options.transform || function(value) {
        return !!RRM.Property.Base.prototype.transform(value);
    };
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.Boolean.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Boolean.prototype.constructor = RRM.Property.Boolean;

// Array
RRM.Property.Array = function(name, options) {
    options = options || {};
    options.transform = options.transform || function(value) {
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
    };
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.Array.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Array.prototype.constructor = RRM.Property.Array;

// Object
RRM.Property.Object = function(name, options) {
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.Object.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Object.prototype.constructor = RRM.Property.Object;

// Date
RRM.Property.Date = function(name, options) {
    options = options || {};
    options.transform = options.transform || function(value) {
        return new Date(RRM.Property.Base.prototype.transform(value));
    };
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.Date.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Date.prototype.constructor = RRM.Property.Date;
//
//// Relation
RRM.Relation.Base = function(name, options) {
    this._om = null;
    RRM.Property.Base.call(this, name, options);
}
RRM.Relation.Base.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Relation.Base.prototype.constructor = RRM.Relation.Base;

// ManyToOne
RRM.Relation.ManyToOne = function(name, options) {
    options = options || {};

    options.transform = options.transform || function(value, om) {
        if (value === undefined || value === null) {
            return null;
        } else if (value instanceof Object) {
            return om.create(options.entityClass, value);
        } else {
            return om.getReference(options.entityClass, value);
        }
    };

    options.reverseTransform = options.reverseTransform || function(value) {
        return value ? value.id : null;
    }

    RRM.Relation.Base.call(this, name, options);
}
RRM.Relation.ManyToOne.prototype = Object.create(RRM.Relation.Base.prototype);
RRM.Relation.ManyToOne.prototype.constructor = RRM.Relation.ManyToOne;

// ManyToMany
RRM.Relation.ManyToMany = function(name, options) {
    options = options || {};

    if (!('transform' in options)) {
        options.transform = function(value, om) {
            var data = [];
            for (var i in value) {
                var reference;
                if (value[i] instanceof Object) {
                    reference = om.create(options.entityClass, value[i]);
                } else {
                    reference = om.getReference(options.entityClass, value[i]);
                }
                data.push(reference);
            }
            return data;
        }
    }

    if (!('reverseTransform' in options)) {
        options.reverseTransform = function(value) {
            var data = [];
            for (var i in value) {
                data.push(value[i].id);
            }
            return data;
        }
    }

    RRM.Relation.Base.call(this, name, options);
}
RRM.Relation.ManyToMany.prototype = Object.create(RRM.Relation.Base.prototype);
RRM.Relation.ManyToMany.prototype.constructor = RRM.Relation.ManyToMany;

// OneToMany
RRM.Relation.OneToMany = function(name, options) {
    options = options || {};
    options.transform = function(value, om) {
        var data = [];
        for (var i in value) {
            var reference;
            if (value[i] instanceof Object) {
                reference = om.create(options.entityClass, value[i]);
            } else {
                reference = om.getReference(options.entityClass, value[i]);
            }
            data.push(reference);
        }
        return data;
    }

    options.reverseTransform = function(value, om) {
        return value.map(function(value) {
            om.toArray(value)
        });
    }

    RRM.Relation.Base.call(this, name, options);
}
RRM.Relation.OneToMany.prototype = Object.create(RRM.Relation.Base.prototype);
RRM.Relation.OneToMany.prototype.constructor = RRM.Relation.OneToMany;

// OneToOne
RRM.Relation.OneToOne = function(name, options) {
    options = options || {};
    options.transform = function(value, om) {
        if (!options.entityClass) {
            return value;
        }
        return om.create(options.entityClass, value);
    }

    options.reverseTransform = function(value, om) {
        return value ? om.toArray(value) : undefined;
    }

    RRM.Relation.Base.call(this, name, options);
}
RRM.Relation.OneToOne.prototype = Object.create(RRM.Relation.Base.prototype);
RRM.Relation.OneToOne.prototype.constructor = RRM.Relation.OneToOne;
