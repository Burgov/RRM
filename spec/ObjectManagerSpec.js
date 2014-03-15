"use strict";

describe('instantiate new object', function() {
    var om;
    var project;
    var project2;
    var project3;

    beforeEach(function() {
        om = new ObjectManager();
        om.loadSchema(Project, ProjectSchema);
        om.loadSchema(ProjectType, ProjectTypeSchema);
        project = om.create(Project, { id: 10, name: 'Project name', created_at: '2011-05-06T12:00:00Z', type: 8 });
        project2 = om.create(Project, { id: 11, name: 'Project 11', created_at: '2011-05-06T12:00:00Z', type: { id: 5, name: 'Type 5' } });
        project3 = om.create(Project, { id: 12, name: 'Project 12', created_at: '2011-05-06T12:00:00Z', type: { id: 5, name: 'Type 5' } });
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
        om.create(ProjectType, { id: 8, name: "Hello" });
        expect(project.type.name).toBe('Hello');
    });

    it('will throw an error on trying to fetch an unloaded entity', function() {
        expect(function() {
            om.get(Project, 100);
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
        om.create(Project, { id: 10, name: 'New project name', created_at: '2011-05-06T12:00:00Z', type: 5 });
        expect(project.name).toBe('New project name');
        expect(project.type.id).toBe(5);
        expect(project.type.name).toBe('Type 5');
    });

})