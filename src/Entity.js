var Entity = function() {}
Object.defineProperty(Entity.prototype, '$values', {
    value: {}
});
Object.defineProperty(Entity.prototype, '$dirty', {
    value: false,
    writable: true
});