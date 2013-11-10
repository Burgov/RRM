var Proxy = function(entityClass, id) {
    var self = this;

    this.load = function() {
        self.object = { id: id, name: "Hello" };
    }

    for (var i in entityClass.prototype.$schema) {
        var property = entityClass.prototype.$schema[i];

        if (i == 'id') {
            continue;
        }

        Object.defineProperty(this, i, {
            get: function() {
                self.load();
                return self.object[i];
            },
            set: function(value) {
                self.load();
                self.object[i] = value;
            },
            enumerable: true
        })
    }

    Object.defineProperty(this, 'id', {
        get: function() {
            return id;
        }
    });
}