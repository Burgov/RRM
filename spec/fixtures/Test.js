var TestSchema = function() {
    this.testId = new RRM.Property.Int({ writable: false, persistable: false });
};
Object.defineProperty(TestSchema, 'id', {
    value: 'testId'
});

var Test = function() {
};

ObjectManager.prepareEntity('test', Test, TestSchema);
