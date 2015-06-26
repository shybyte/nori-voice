module nori.utils {
  var [map, split, findIndex, eq] = [R.map, R.split, R.findIndex, R.eq];

  export function set<T>(object:T, f:(clonedObject:T) => void):T {
    var clone = R.evolve({}, object);
    f(clone);
    Object.freeze(clone);
    return clone;
  }
}