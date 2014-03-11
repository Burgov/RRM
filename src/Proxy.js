var ProxyFactory = function(om) {

    var proxyClasses = {};

    var createProxyClass = function(entityClass) {
        var Proxy = function(id) {
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

        proxyClasses[entityClass.$name + 'Proxy'] = Proxy;
    }

    this.getProxyClass = function(entityClass) {
        if (!((entityClass.$name + 'Proxy') in proxyClasses)) {
            createProxyClass(entityClass);
        }
        return proxyClasses[entityClass.$name + 'Proxy'];
    }

    this.createProxy = function(entityClass, id) {
        var proxyClass = this.getProxyClass(entityClass);
        return new proxyClass(id);
    }
}
