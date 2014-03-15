"use strict";

describe('int property', function() {
    var testObject;
    var property;

    beforeEach(function() {
        testObject = {};
        property = new RRM.Property.Int("value");
        Object.defineProperty(testObject, 'value', property);
    });

    it('will store the value', function() {
        expect(property.transform(5)).toBe(5);
    });

    it('will convert a string to an integer', function() {
        expect(property.transform("5")).toBe(5);
    });

    it('will give back the value', function() {
        expect(property.reverseTransform(5)).toBe(5);
    })
});

describe('string property', function() {
    var testObject;
    var property;

    beforeEach(function() {
        testObject = {};
        property = new RRM.Property.String("value");
        Object.defineProperty(testObject, 'value', property);
    });

    it('will store the value', function() {
        expect(property.transform("test")).toBe("test");
    });

    it('will convert a integer to an string', function() {
        expect(property.transform(5)).toBe("5");
    });

    it('will give back the value', function() {
        expect(property.reverseTransform("test")).toBe("test");
    })
});

describe('date property', function() {
    var testObject;
    var property;

    beforeEach(function() {
        testObject = {};
        property = new RRM.Property.Date("value");
        Object.defineProperty(testObject, 'value', property);
    });

    it('will convert the value to a Date object', function() {
        expect(property.transform("2014-01-01T12:00:00+00:00")).toEqual(new Date(2014, 0, 1, 13, 0, 0));
    });
});

describe('Boolean property', function() {
    var testObject;
    var property;

    beforeEach(function() {
        testObject = {};
        property = new RRM.Property.Boolean("value");
        Object.defineProperty(testObject, 'value', property);
    });

    it('will convert the value to a boolean', function() {
        expect(property.transform("something")).toBe(true);
    });
});

describe('Array property', function() {
    var testObject;
    var property;

    beforeEach(function() {
        testObject = {};
        property = new RRM.Property.Array("value");
        Object.defineProperty(testObject, 'value', property);
    });

    it('will store an array', function() {
        var array = [];
        expect(property.transform(array)).toBe(array);
    });

    it('will convert an object to an array', function() {
        var object = { prop: 1, prop2: "2" };
        expect(property.transform(object)).toEqual([1, "2"]);
    });
});

describe('Object property', function() {
    var testObject;
    var property;

    beforeEach(function() {
        testObject = {};
        property = new RRM.Property.Array("value");
        Object.defineProperty(testObject, 'value', property);
    });

    it('will store an object', function() {
        expect(property.transform({})).toEqual({});
    });
});

describe('one to one relation', function() {
    var testObject;
    var property;
    var om;
    var mockType;

    beforeEach(function() {
        mockType = {};

        om = jasmine.createSpyObj(ObjectManager, [ 'create', 'getReference', 'toArray' ]);
        om.create.andCallFake(function() {
            return mockType;
        });
        om.getReference.andCallFake(function() {
            return mockType;
        });

        testObject = {};
        property = new RRM.Relation.OneToOne("relation", { entityClass: ProjectType });
        property.om = om;
        Object.defineProperty(testObject, 'relation', property);
    });

    it('actively load the value if it\'s an object', function() {
        expect(property.transform({ id: 5, name: 'test' }, om)).toBe(mockType);
        expect(om.create).toHaveBeenCalledWith(ProjectType, { id: 5, name: 'test' });
    });

    it('converts back into an array', function() {
        var type = new ProjectType();
        property.reverseTransform(type, om);
        expect(om.toArray).toHaveBeenCalledWith(type);
    })

});

describe('many to one relation', function() {
    var testObject;
    var property;
    var om;
    var mockType;

    beforeEach(function() {
        mockType = {};

        om = jasmine.createSpyObj(ObjectManager, [ 'create', 'getReference' ]);
        om.create.andCallFake(function() {
            return mockType;
        });
        om.getReference.andCallFake(function() {
            return mockType;
        });

        testObject = {};
        property = new RRM.Relation.ManyToOne("relation", { entityClass: ProjectType });
        Object.defineProperty(testObject, 'relation', property);
    });

    it('actively load the value if it\'s an object', function() {
        expect(property.transform({ id: 5, name: 'test' }, om)).toBe(mockType);
        expect(om.create).toHaveBeenCalledWith(ProjectType, { id: 5, name: 'test' });
    });

    it('fetches a reference if it\'s an integer', function() {
        expect(property.transform(5, om)).toBe(mockType);
        expect(om.getReference).toHaveBeenCalledWith(ProjectType, 5);
    });

    it('converts back into an ID', function() {
        var type = new ProjectType();
        type.id = 5;
        expect(property.reverseTransform(type, om)).toEqual(5);
    })

});

describe('many to many relation', function() {
    var testObject;
    var property;
    var om;
    var mockType;

    beforeEach(function() {
        mockType = {};

        om = jasmine.createSpyObj(ObjectManager, [ 'create', 'getReference' ]);
        om.create.andCallFake(function() {
            return mockType;
        });
        om.getReference.andCallFake(function() {
            return mockType;
        });

        testObject = {};
        property = new RRM.Relation.ManyToMany("relation", { entityClass: ProjectType });
        Object.defineProperty(testObject, 'relation', property);
    });

    it('actively load the values if it\'s a list of objects', function() {
        var data = [ { id: 5, name: 'test' }, { id: 6, name: 'test 2'} ];
        var result = property.transform(data, om);
        expect(result.length).toBe(2);
        expect(result[0]).toBe(mockType);
        expect(result[1]).toBe(mockType);
        expect(om.create).toHaveBeenCalledWith(ProjectType, { id: 5, name: 'test' });
        expect(om.create).toHaveBeenCalledWith(ProjectType, { id: 6, name: 'test 2' });
    });

    it('fetches references if it\'s a list of integers', function() {
        var data = [ 5, 6 ];
        var result = property.transform(data, om);
        expect(result.length).toBe(2);
        expect(result[0]).toBe(mockType);
        expect(result[1]).toBe(mockType);
        expect(om.getReference).toHaveBeenCalledWith(ProjectType, 5);
        expect(om.getReference).toHaveBeenCalledWith(ProjectType, 6);
    });

    it('converts back into an ID', function() {
        var data = [ new ProjectType, new ProjectType ];
        data[0].id = 5;
        data[1].id = 6;
        expect(property.reverseTransform(data, om)).toEqual([ 5, 6 ]);
    })

});

describe('one to many relation', function() {
    var testObject;
    var property;
    var om;
    var mockType;

    beforeEach(function() {
        mockType = {};

        om = jasmine.createSpyObj(ObjectManager, [ 'create', 'getReference', 'toArray' ]);
        om.create.andCallFake(function() {
            return mockType;
        });
        om.getReference.andCallFake(function() {
            return mockType;
        });

        testObject = {};
        property = new RRM.Relation.OneToMany("relation", { entityClass: ProjectType });
        Object.defineProperty(testObject, 'relation', property);
    });

    it('actively load the values if it\'s a list of objects', function() {
        var data = [ { id: 5, name: 'test' }, { id: 6, name: 'test 2'} ];
        var result = property.transform(data, om);
        expect(result.length).toBe(2);
        expect(result[0]).toBe(mockType);
        expect(result[1]).toBe(mockType);
        expect(om.create).toHaveBeenCalledWith(ProjectType, { id: 5, name: 'test' });
        expect(om.create).toHaveBeenCalledWith(ProjectType, { id: 6, name: 'test 2' });
    });

    it('fetches references if it\'s a list of integers', function() {
        var data = [ 5, 6 ];
        var result = property.transform(data, om);
        expect(result.length).toBe(2);
        expect(result[0]).toBe(mockType);
        expect(result[1]).toBe(mockType);
        expect(om.getReference).toHaveBeenCalledWith(ProjectType, 5);
        expect(om.getReference).toHaveBeenCalledWith(ProjectType, 6);
    });

    it('converts back into an ID', function() {
        var data = [ new ProjectType, new ProjectType ];
        property.reverseTransform(data, om);

        expect(om.toArray).toHaveBeenCalledWith(data[0]);
        expect(om.toArray).toHaveBeenCalledWith(data[1]);
    })

});
