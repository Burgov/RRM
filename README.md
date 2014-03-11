RRM
===

This library will help you manage relations between entities in JavaScript.

To use, simply include rrm.js in your project and follow these steps:

Instantiate the ObjectManager
-----------------------------
The very first thing you need to do is create a new ObjectManager instance:

```javascript
var om = new ObjectManager();
```

Define your entities
--------------------
For every entity you're going to use in your project, you need to define it's schema. Then you need to add this schema
to the ObjectManager. Here's an example of two schema's with relations to eachother:

```javascript
var ProjectSchema = function() {
    this.id = new RRM.Property.Int('id', { writable: false, persistable: false });
    this.start = new RRM.Property.Date('start', { writable: false, persistable: false });
    this.name = new RRM.Property.String('name');
    this.products = new RRM.Relation.OneToMany('products', { entityClass: Products });
}
var Project = function() {
    Entity.call(this);
}
Object.defineProperty(Project, '$name', {
    value: 'project'
});
```

```javascript
var ProductSchema = function() {
    var self = this;

    this.id = new RRM.Property.Int('id', { writable: false, persistable: false });
    this.name = new RRM.Property.String('name');
}
var Product = function() {
    Entity.call(this);

}
Object.defineProperty(Product, '$name', {
    value: 'product'
});
```

And to add the schema's to the ObjectManager:

```javascript
om.loadSchema(Project, ProjectSchema);
om.loadSchema(Product, ProductSchema);
```

Load the data
-------------
You're now ready to use the RRM. In order to load a Project into the RRM, you need to call:

```javascript
var data = {
  id: 3,
  name: 'My project',
  start: '2014-01-01T10:00:00+00:00'
  products: [
    {
      id: 1,
      name: 'Product 1'
    },
    {
      id: 2,
      name: 'Product 2'
    }
  ]
}

var project = om.create(Project, data);
```

Usage details
=============

Defining properties
-------------------

As you can see above, we're defining various properties on the Project and Product entities. There are quite some
predefined property definitions which all have their own funcionality. Also, some properties have additional options
defined. These will be explained below the property list.

### Properties

| Property               | Function                                                                        |
| ---------------------- | ------------------------------------------------------------------------------- |
| `RRM.Property.Int`     | Will make sure the value passed to it is cast to an integer                     |
| `RRM.Property.String`  | Will make sure the value passed to it is cast to a string                       |
| `RRM.Property.Boolean` | Will make sure the value passed to it is cast to a Boolean                      |
| `RRM.Property.Array`   | Supports the loading of simple array data without the need to define a relation |
| `RRM.Property.Object`  | Same as array, but for simple objects                                           |
| `RRM.Property.Date`    | Will cast the value into a Date object using the Date constructor               |

#### Options

| Option             | Default | Function                                                                                          |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------- |
| `readable`         | `true`  | The value can be read                                                                             |
| `writeable`        | `true`  | The value can be updated                                                                          |
| `loadable`         | `true`  | The value should be loaded from the data passed to `create()`                                     |
| `persistable`      | `true`  | The value should be returned when calling `toArray()`                                             |
| `transform`        | ...     | Override this function to change the data as it is loaded from the data and stored in the entity  |
| `reverseTransform` | ...     | Override this function to change the data as it is loaded from the entity and stored in the array |

### Relations

These are pretty self explanatory, so here's a simple list of supported relations:

`RRM.Relation.OneToMany`, `RRM.Relation.ManyToOne`, `RRM.Relation.OneToOne`, `RRM.Relation.ManyToMany`

These all support the same options as the simple properties.

Storing data into the ObjectManager
===================================
As shown above you can store data into the ObjectManager using the `create()` method. If the entity already exists in
the ObjectManager, it will update that instance with the new data:

```javascript
var product = om.create(Project, { id: 7, name: 'test' });
console.log(project.name); // "test"

om.create(Project, { id: 7, name: 'other test' });
console.log(project.name); // "other test"
```

Loading your data from the ObjectManager
========================================
You can fetch your data from the ObjectManager using either the `get()` method or the `getReference()` method. The first
one will fail if the object is not loaded yet, the second will create a Proxy object for you (see below).

```javascript
var project = om.get(Project, 1); // Project entity
var project2 = om.get(Project, 2); // throws an error

var project = om.getReference(Project, 1); // The same Project entity
var project2 = om.getReference(Project, 2); // A Proxy object for Project with ID 2
```

Using the `getAll()` method you can fetch all the loaded entities of a specific class;

```javascript
var projects = om.getAll(Project);
```

Working with proxies
====================
In the example above we are loading the whole schema (Project and its Products) at once, but this might not always be
necessary or possible due to performance issues. Imagine a Project with 1000 Products, which all have to be downloaded
through an API. Instead, you can just load a list of ID's. These will then be converted to Proxy objects:

```javascript
var data = {
  id: 3,
  name: 'My project',
  start: '2014-01-01T10:00:00+00:00'
  products: [ 1, 2, 3, 4, 5, 6 ]
}

var project = om.create(Project, data);
```

Now, when you try to access a property of one of the Products, you will get an error. However, you do have access to the
IDS.

```javascript
console.log(project.products[0].id) // 1
console.log(project.products[0].name) // throws an error
```

This allows you to lazy load the data of any product. For example, you have an API call which will fetch a range of
Products for you (let's say the first 3), when you `create()` these entities in the ObjectManager, the ObjectManager
will first try to match the Proxies and your new data by ID, and if it finds a Proxy, it will update the Proxy with
the relevant data and return this instead (otherwise it will just create a new Product object). That way, you can be
sure that whenever you try to access the Product with ID 3, you will always get exactly the same object:

```javascript
// with the example from above

var productData = [ { id: 1, name: 'Product 1', }, { id: 2, name: 'Product 2', }, { id: 1, name: 'Product 3', } ];
for (var i = 0; j < productData.length; i < j; i++) {
    om.create(Product, productData[i]);
}

console.log(project.products[0].id) // 1
console.log(project.products[0].name) // "Product 1"
console.log(project.products[3].id) // 4
console.log(project.products[3].name) // throws an error

var product = om.get(Product, 1);

console.log(product === project.products[0]); // true
```

