var ProjectTypeSchema = function() {
    this.id = new RRM.Property.Int('id', { writable: false, persistable: false });
    this.name = new RRM.Property.String('name');
};

var ProjectType = function() {
    Entity.call(this);
}
Object.defineProperty(ProjectType, '$name', {
    value: 'project_type'
});