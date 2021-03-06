var ProjectSchema = function() {
    this.id = new RRM.Property.Int('id', { writable: false, persistable: false });
    this.name = new RRM.Property.String('name');
    this.description = new RRM.Property.String('description');
    this.createdAt = new RRM.Property.Date('createdAt', { writable: false, persistable: false });
    this.type = new RRM.Relation.ManyToOne('type', { entityClass: 'project-type' });
    this.products = new RRM.Relation.OneToMany('product', { entityClass: 'product', backReference: 'project' });
};

var Project = function() {
    this.postCreateCalled = false;
    this.postUpdateCalled = false;
};
Project.prototype.$postCreate = function() {
    this.postCreateCalled = true;
};
Project.prototype.$postUpdate = function() {
    this.postUpdateCalled = true;
};

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
