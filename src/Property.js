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
                    reference[this.backReference] = entity;
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
