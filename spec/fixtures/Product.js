var ProductSchema = function() {
    this.id = new RRM.Property.Int('id', { writable: false, persistable: false });
    this.name = new RRM.Property.String('name');
    this.project = new RRM.Relation.ManyToOne('project', { entityClass: 'project' });
};

var Product = function() {
};

ObjectManager.prepareEntity('product', Product, ProductSchema);
