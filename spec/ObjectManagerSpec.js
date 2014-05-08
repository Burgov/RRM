"use strict";

describe('instantiate new object', function() {
    var om;
    var project;
    var project2;
    var project3;

    beforeEach(function() {
        om = new ObjectManager();
        om.register(Project);
        om.register(ProjectType);
        om.register(Product);
        project = om.create('project', { id: 10, name: 'Project name', createdAt: '2011-05-06T12:00:00Z', description: null, type: 8, products: [] });
        project2 = om.create('project', { id: 11, name: 'Project 11', createdAt: '2011-05-06T12:00:00Z', type: { id: 5, name: 'Type 5' } });
        project3 = om.create('project', { id: 12, name: 'Project 12', createdAt: '2011-05-06T12:00:00Z', type: { id: 5, name: 'Type 5' } });
    });

    it('will map the right value to the right properties', function() {
        expect(project).toBeInstanceOf(Project);
        expect(project.id).toBe(10);
        expect(project.name).toBe('Project name');
    });

    it('will disallow write access to properties without setter', function() {
        expect(function() {
            project.id = 5;
        }).toThrow();
        expect(project.id).toBe(10);
    });

    it('will apply transform methods to properties', function() {
        expect(project.age).toBe(2);
    });

    it('will load a proxy object if the data of a many2one is unknown', function() {
        expect(project.type).toBeDefined();
        expect(function() {
            project.type.name;
        }).toThrow(Error("Entity cannot be loaded"));
        expect(project.type.id).toBe(8);
        om.create('project-type', { id: 8, name: "Hello" });
        expect(project.type.name).toBe('Hello');
    });

    it('will throw an error on trying to fetch an unloaded entity', function() {
        expect(function() {
            om.get('project', 100);
        }).toThrow(Error("not loaded"));
    });

    it('will throw an error on trying to access an unloaded Proxy property', function() {
        expect(function() {
            project.type.name;
        }).toThrow(Error("Entity cannot be loaded"));
    });

    it('will understand a relation is the same if it is loaded twice', function() {
        expect(project2.type).toBeInstanceOf(ProjectType);
        expect(project2.type.id).toBe(5);
        expect(project2.type === project3.type).toBeTruthy();
    });

    it('will update the data of an already existing entity', function() {
        expect(project.name).toBe('Project name');
        expect(project.type.id).toBe(8);
        om.create('project', { id: 10, name: 'New project name', createdAt: '2011-05-06T12:00:00Z', type: 5 });
        expect(project.name).toBe('New project name');
        expect(project.type.id).toBe(5);
        expect(project.type.name).toBe('Type 5');
    });

    it('goes $dirty when a property value changes', function() {
        expect(project.$dirty).toBe(false);
        project.name = "test";
        expect(project.$dirty).toBe(true);
    });

    it('has a $raw property with original values', function() {
        project.name = "test";
        expect(project.$raw['name']).toBe('Project name');
    });

    it('has a $values property that allows raw data access', function() {
        project.name = "test";
        expect(project.$values['name']).toBe('test');
    });

    it('will convert the project into an object with the many2one relations as an integer', function () {
        expect(om.toArray(project)).toEqual({
            name: 'Project name',
            description: null,
            type: 8,
            products: []
        });
    });

    it('will inject both sides of a one2many relation', function() {
        var projectWithProducts = om.create('project', {
            'id': 1,
            'name': 'test with products',
            'products': [
                {
                    id: 1,
                    name: 'product 1'
                }, {
                    id: 2,
                    name: 'product 2'
                }
            ]
        })

        expect(projectWithProducts.products[0].project).toBe(projectWithProducts);
    });

    it('will inject both sides of a one2many relation when the to-many is a proxy', function() {
        var projectWithProducts = om.create('project', {
            'id': 1,
            'name': 'test with products',
            'products': [ 1, 2 ]
        });

        expect(projectWithProducts.products[0].project).toBe(projectWithProducts);
    });

    it('will throw an error on accessing non-initialized properties', function() {
        var project = om.create('project', {
            id: 18,
            products: []
        });

        expect(function() {
            project.name;
        }).toThrow(Error("The property 'name' was not initialized"));

        expect(function() {
            project.name = 'test';
        }).toThrow(Error("The property 'name' was not initialized"));
    });

    it('allows for the proxy factory to be overridden', function() {
        var MockProxyFactory = jasmine.createSpyObj(ProxyFactory, [ 'createProxy' ]);
        var om = new ObjectManager(MockProxyFactory);

        om.register(Project);

        om.getReference('project', 10);
        expect(MockProxyFactory.createProxy).toHaveBeenCalledWith(Project, 10);
    });
});
