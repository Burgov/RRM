RRM
===

[![Build Status](https://travis-ci.org/SamsonIT/RRM.png)](https://travis-ci.org/SamsonIT/RRM)

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
For every entity you're going to use in your project, you need to define it's schema. Then you need to combine the class
and the schema. The ObjectManager class provides a helper method for that. Here's an example of two schema's with
relations to each other:

```javascript
var ProjectSchema = function() {
    this.id = new RRM.Property.Int('id', { writable: false, persistable: false });
    this.start = new RRM.Property.Date('start', { writable: false, persistable: false });
    this.name = new RRM.Property.String('name');
    this.products = new RRM.Relation.OneToMany('products', { entityClass: Products, backReference: 'project' });
}
var Project = function() {
}
ObjectManager.prepareEntity('project', Project, ProjectSchema);
```

```javascript
var ProductSchema = function() {
    this.id = new RRM.Property.Int('id', { writable: false, persistable: false });
    this.name = new RRM.Property.String('name');
}
var Product = function() {
}
ObjectManager.prepareEntity('product', Product, ProductSchema);
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

| Option             | Default | Function                                                      |
| ------------------ | ------- | ------------------------------------------------------------- |
| `readable`         | `true`  | The value can be read                                         |
| `writable`         | `true`  | The value can be updated                                      |
| `loadable`         | `true`  | The value should be loaded from the data passed to `create()` |
| `persistable`      | `true`  | The value should be returned when calling `toArray()`         |

#### Defining your own property type

Defining your own property type is done by extending one of the existing property types. Let's take the `Int` property
as an example:

```javascript
// Int
RRM.Property.Int = function() {
    RRM.Property.Base.apply(this, arguments);
};
RRM.Property.Int.prototype = Object.create(RRM.Property.Base.prototype);
RRM.Property.Int.prototype.constructor = RRM.Property.Int;
```

Don't pay too much attention to these first 5 lines. Just copy them as is and rename them as you wish. If you want to
know more about what is happening here, read [Introduction to Object-Oriented JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript)

Now you have a basic property defined, but it doesn't do much interesting yet. It will just pass around the value you
put into it and fetch from it as-is. If you want to add some magic, define the `transform` and/or `reverseTransform` properties:

```javascript
Object.defineProperty(RRM.Property.Int.prototype, 'transform', {
    value: function(value) {
        return parseInt(RRM.Property.Base.prototype.transform.call(this, value), 10);
    }
});
```

(while it is not really necessary to call the base transform method now, it's good practice to do it still to be ready
for a BC change in that part.)

Now our `Int` property will make sure any value passed into it is cast into an integer when the entity data is set. The
`reverseTransform` property functions mainly the same.

You can always call the `transform` or `reverseTransform` method of another property definition by calling for example:

```javascript
Object.defineProperty(RRM.Property.Int.prototype, 'transform', {
    value: function(value) {
        var stringValue = RRM.Property.String.prototype.transform.call(this, value);
        return parseInt(string, 10);
    }
});
```

Keep in mind: `transform` is called when setting raw data to the entity (both when loading initially and when setting the
property later on). `reverseTransform` is called for example when you use the `ObjectManager.toArray` method to convert
the Entity back into a simple object.

### Relations

These are pretty self explanatory, so here's a simple list of supported relations:

`RRM.Relation.OneToMany`, `RRM.Relation.ManyToOne`, `RRM.Relation.OneToOne`, `RRM.Relation.ManyToMany`

These all support the same options as the simple properties.

The only relation to have a special option is `RRM.Relation.OneToMany`. It supports a `backReference` which you can use
to tell RRM to populate that specific property of the other side of the relation with the reference itself.

Basically it makes the following example possible, given the mapping and data examples from the top of this documentation:

```javascript
var project = om.create(Project, data);
console.log(project === project.products[0].project); // true
```

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
console.log(project.products[3].name) // throws an error because it was not in the productData array and is therefor
  // still an unloaded Proxy object

var product = om.get(Product, 1);

console.log(product === project.products[0]); // true
```

Building and testing
====================
In order to test the source code, first prepare the dev files using gulp:

```
gulp dev
```

Then, simply fire up SpecRunner.html (a new file should have appeared in the project root directory, _not_ the one in
the spec directory) in your browser. To test from the command line using phantomjs:

```
phantomjs spec/initialize/run-jasmine.js SpecRunner.html
```

In order to build the compiled and minified js files, you'll have to use gulp and some of its plugins:

```
npm install -g gulp
npm install gulp-concat gulp-rename gulp-uglify
```

Then:

```
gulp
```
