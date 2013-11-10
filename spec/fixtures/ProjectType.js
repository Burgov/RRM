var ProjectTypeSchema = function() {
    this.id = new RRM.Property.Int('id', { writable: false, persistable: false });
    this.name = new RRM.Property.String('name');
};

var ProjectType = function() {}
ProjectType.prototype = Entity;
ProjectType.prototype.$schema = new ProjectTypeSchema;