"use strict";

describe('instantiate new object', function() {
    var om;
    var project;

    beforeEach(function() {
        om = new ObjectManager();
        project = om.create(Project, { id: 10, name: 'Project name', created_at: '2011-05-06T12:00:00Z', type: 8 });
    });

    it('will map the right value to the right properties', function() {
        expect(project).toBeInstanceOf(Project);
        expect(project.id).toBe(10);
        expect(project.name).toBe('Project name');
    });

    it('will disallow write access to properties without setter', function() {
        expect(function() {
            project.id = 5;
        }).toThrow(TypeError("Cannot set property id of [object Object] which has only a getter"));
        expect(project.id).toBe(10);
    });

    it('will apply transform methods to properties', function() {
        expect(project.age).toBe(2);
    });

    it('will load a proxy object if the data of a many2one is unknown', function() {
        expect(project.type).toBeInstanceOf(Proxy);
        expect(project.type.id).toBe(8);
        expect(project.type.name).toBe('Hello');
    });

})