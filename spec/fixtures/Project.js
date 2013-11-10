var ProjectSchema = function() {
    this.id = new RRM.Property.Int('id', { writable: false, persistable: false });
    this.name = new RRM.Property.String('name');
    this.description = new RRM.Property.String('description');

    this.age = new RRM.Property.Int('age', { writable: false, persistable: false, transform: function(json) {
        var date = new Date(json.created_at);

        var age = (new Date()).getFullYear() - date.getFullYear();
        date.setFullYear((new Date()).getFullYear());
        if (date > new Date()) {
            age--;
        }

        return age;
    }});

    this.type = new RRM.Relation.ManyToOne('type', {
        entityClass: ProjectType
    });
};

var Project = function() {
    Entity.call(this);
}
Object.defineProperty(Project, '$name', {
    value: 'project'
});