// |reftest| shell-option(--enable-float16array)
// Copyright (C) 2016 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.
/*---
esid: sec-%typedarray%.prototype.lastindexof
description: Requires a [[TypedArrayName]] internal slot.
info: |
  22.2.3.16 %TypedArray%.prototype.lastIndexOf ( searchElement [ , fromIndex ] )

  This function is not generic. ValidateTypedArray is applied to the this value
  prior to evaluating the algorithm. If its result is an abrupt completion that
  exception is thrown instead of evaluating the algorithm.

  22.2.3.5.1 Runtime Semantics: ValidateTypedArray ( O )

  1. If Type(O) is not Object, throw a TypeError exception.
  2. If O does not have a [[TypedArrayName]] internal slot, throw a TypeError
  exception.
  ...
includes: [testTypedArray.js]
features: [TypedArray]
---*/

var TypedArrayPrototype = TypedArray.prototype;

assert.sameValue(typeof TypedArrayPrototype.lastIndexOf, 'function');

assert.throws(TypeError, function() {
  TypedArrayPrototype.lastIndexOf();
});

reportCompare(0, 0);
