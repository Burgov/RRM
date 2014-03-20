var ProjectSchema = function() {
    this.id = new RRM.Property.Int('id', { writable: false, persistable: false });
    this.name = new RRM.Property.String('name');
    this.description = new RRM.Property.String('description');
    this.createdAt = new RRM.Property.Date('createdAt', { writable: false, persistable: false });
    this.type = new RRM.Relation.ManyToOne('type', { entityClass: 'project-type' });
};

var Project = function() {
}

Object.defineProperty(Project.prototype, 'age', {
    get: function() {
        var date = new Date(this.createdAt);

        var age = (new Date()).getFullYear() - date.getFullYear();
        date.setFullYear((new Date()).getFullYear());
        if (date > new Date()) {
            age--;
        }

        return age;
    },
    enumerable: true
});

ObjectManager.prepareEntity('project', Project, ProjectSchema);
