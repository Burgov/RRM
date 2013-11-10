var RRM = RRM || {};
RRM.Property = RRM.Property || {};

RRM.Property.Base = function(name, options) {
    options = options || {};

    if (!('readable' in options && options.readable === false)) {
        Object.defineProperty(this, 'get', {
            value: 'get' in options ? options.get : function() {
                return this.$values[name];
            },
            enumerable: true
        })
    }

    if (!('writable' in options && options.writable === false)) {
        Object.defineProperty(this, 'set', {
            value: 'set' in options ? options.set : function(value) {
                this.$values.name = value;
            },
            enumerable: true
        });
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
                json.name = this.name;
            },
            enumerable: true
        });
    }

}

RRM.Property.Int = function(name, options) {
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.String = function(name, options) {
    RRM.Property.Base.call(this, name, options);
};
RRM.Property.ManyToOne = function(name, options) {
    options = options || {};

    if (!('transform' in options)) {
        options.transform = function(json) {
            if (json[name] instanceof Object) {
                /* load the object */
            } else if (typeof(json[name]) == 'number') {
                /* delegate proxy creation to the ObjectManager so it can keep track of it */
                return new Proxy(options.entityClass, json[name]);
            } else {
                throw Error('Unexpected value');
            }
        }
    }

    RRM.Property.Base.call(this, name, options);
}