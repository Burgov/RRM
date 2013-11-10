var Proxy = function(om, entityClass, id) {
    this.object = undefined;

    var self = this;

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
        var property = entityClass.prototype.$schema[i];

        if (i == 'id') {
            continue;
        }

        this.addProperty(i);
    }

    Object.defineProperty(this, 'id', {
        get: function() {
            return id;
        }
    });
}