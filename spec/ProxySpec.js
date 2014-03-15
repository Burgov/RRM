"use strict";

describe('proxy', function() {
    var factory;

    beforeEach(function() {
        factory = new ProxyFactory;
    });

    it('returns the ID even when it is not loaded', function() {
        var proxy = factory.createProxy(Project, 5);

        expect(proxy.id).toBe(5);
    });

    it('will error on any other accessor', function() {
        var proxy = factory.createProxy(Project, 5);

        expect(function() {
            proxy.name
        }).toThrow(Error("Entity cannot be loaded"));
    });

    it('will still return the ID after loading', function() {
        var proxy = factory.createProxy(Project, 5);
        proxy.object = { id: 5, name: 'test' };
        expect(proxy.id).toBe(5);
    });

    it('will return other values after loading', function() {
        var proxy = factory.createProxy(Project, 5);
        proxy.object = { id: 5, name: 'test' };
        expect(proxy.name).toBe('test');
    });
});
