/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	if (!THREE.BufferGeometryUtils) {
	  __webpack_require__(1);
	}

	AFRAME.utils.setBufferGeometryColor = function () {
	    
	  const colorHelper = new THREE.Color();

	  return function (geometry, color, start, end) {

	    // ES5 compatible default parameters
	    if (start === undefined) start = 0;
	    if (end === undefined) end = Infinity;

	    var i;
	    const colors = geometry.getAttribute('color')
	    const itemSize = colors.itemSize;
	    const array = colors.array

	    colorHelper.set(color);
	    const verticesEnd = Math.min(end, colors.count) * itemSize
	    for (i = start * itemSize; i <= verticesEnd; i += itemSize) {
	      array[i] = colorHelper.r;
	      array[i + 1] = colorHelper.g;
	      array[i + 2] = colorHelper.b;
	    }
	    colors.needsUpdate = true;
	  }

	}()

	AFRAME.registerComponent('geometry-merger', {
	  schema: {
	    preserveOriginal: {default: false}
	  },

	  init: function () {
	    var geometries = [];
	    this.vertexIndex = {};
	    var self = this;
	    var vertexCount = 0;

	    this.el.object3D.updateMatrixWorld()
	    this.el.object3D.traverse(function (mesh) {
	      if (mesh.type !== 'Mesh' || mesh.el === self.el) { return; }
	      var geometry = mesh.geometry.clone();
	      var currentMesh = mesh;
	      while (currentMesh !== self.el.object3D) {
	        geometry.applyMatrix4(currentMesh.parent.matrix);
	        currentMesh = currentMesh.parent;
	      }
	      geometries.push(geometry);

	      meshPositions = mesh.geometry.getAttribute('position');

	      self.vertexIndex[mesh.parent.uuid] = [
	        vertexCount,
	        vertexCount + meshPositions.count - 1
	      ];

	      vertexCount += meshPositions.count;

	      // Remove mesh if not preserving.
	      if (!self.data.preserveOriginal) { mesh.parent.remove(mesh); }
	    });

	    this.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
	    this.mesh = new THREE.Mesh(this.geometry);
	    this.el.setObject3D('mesh', this.mesh);

	    // dereference original geometries (so they can be freed when no longer needed)
	    geometries.length = 0;
	  },

	  getColor: function (uuid, color) {

	    const colors = this.geometry.getAttribute('color')
	    color.fromBufferAttribute(colors, this.vertexIndex[uuid][0]);

	    return color;

	  },

	  setColor: function (uuid, color) {

	    const vertexData = this.vertexIndex[uuid];
	    AFRAME.utils.setBufferGeometryColor(this.geometry, color, vertexData[0], vertexData[1]);

	  }
	});


/***/ }),
/* 1 */
/***/ (function(module, exports) {

	/**
	 * @author mrdoob / http://mrdoob.com/
	 */

	THREE.BufferGeometryUtils = {

		computeTangents: function ( geometry ) {

			var index = geometry.index;
			var attributes = geometry.attributes;

			// based on http://www.terathon.com/code/tangent.html
			// (per vertex tangents)

			if ( index === null ||
				 attributes.position === undefined ||
				 attributes.normal === undefined ||
				 attributes.uv === undefined ) {

				console.warn( 'THREE.BufferGeometry: Missing required attributes (index, position, normal or uv) in BufferGeometry.computeTangents()' );
				return;

			}

			var indices = index.array;
			var positions = attributes.position.array;
			var normals = attributes.normal.array;
			var uvs = attributes.uv.array;

			var nVertices = positions.length / 3;

			if ( attributes.tangent === undefined ) {

				geometry.addAttribute( 'tangent', new THREE.BufferAttribute( new Float32Array( 4 * nVertices ), 4 ) );

			}

			var tangents = attributes.tangent.array;

			var tan1 = [], tan2 = [];

			for ( var i = 0; i < nVertices; i ++ ) {

				tan1[ i ] = new THREE.Vector3();
				tan2[ i ] = new THREE.Vector3();

			}

			var vA = new THREE.Vector3(),
				vB = new THREE.Vector3(),
				vC = new THREE.Vector3(),

				uvA = new THREE.Vector2(),
				uvB = new THREE.Vector2(),
				uvC = new THREE.Vector2(),

				sdir = new THREE.Vector3(),
				tdir = new THREE.Vector3();

			function handleTriangle( a, b, c ) {

				vA.fromArray( positions, a * 3 );
				vB.fromArray( positions, b * 3 );
				vC.fromArray( positions, c * 3 );

				uvA.fromArray( uvs, a * 2 );
				uvB.fromArray( uvs, b * 2 );
				uvC.fromArray( uvs, c * 2 );

				var x1 = vB.x - vA.x;
				var x2 = vC.x - vA.x;

				var y1 = vB.y - vA.y;
				var y2 = vC.y - vA.y;

				var z1 = vB.z - vA.z;
				var z2 = vC.z - vA.z;

				var s1 = uvB.x - uvA.x;
				var s2 = uvC.x - uvA.x;

				var t1 = uvB.y - uvA.y;
				var t2 = uvC.y - uvA.y;

				var r = 1.0 / ( s1 * t2 - s2 * t1 );

				sdir.set(
					( t2 * x1 - t1 * x2 ) * r,
					( t2 * y1 - t1 * y2 ) * r,
					( t2 * z1 - t1 * z2 ) * r
				);

				tdir.set(
					( s1 * x2 - s2 * x1 ) * r,
					( s1 * y2 - s2 * y1 ) * r,
					( s1 * z2 - s2 * z1 ) * r
				);

				tan1[ a ].add( sdir );
				tan1[ b ].add( sdir );
				tan1[ c ].add( sdir );

				tan2[ a ].add( tdir );
				tan2[ b ].add( tdir );
				tan2[ c ].add( tdir );

			}

			var groups = geometry.groups;

			if ( groups.length === 0 ) {

				groups = [ {
					start: 0,
					count: indices.length
				} ];

			}

			for ( var i = 0, il = groups.length; i < il; ++ i ) {

				var group = groups[ i ];

				var start = group.start;
				var count = group.count;

				for ( var j = start, jl = start + count; j < jl; j += 3 ) {

					handleTriangle(
						indices[ j + 0 ],
						indices[ j + 1 ],
						indices[ j + 2 ]
					);

				}

			}

			var tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
			var n = new THREE.Vector3(), n2 = new THREE.Vector3();
			var w, t, test;

			function handleVertex( v ) {

				n.fromArray( normals, v * 3 );
				n2.copy( n );

				t = tan1[ v ];

				// Gram-Schmidt orthogonalize

				tmp.copy( t );
				tmp.sub( n.multiplyScalar( n.dot( t ) ) ).normalize();

				// Calculate handedness

				tmp2.crossVectors( n2, t );
				test = tmp2.dot( tan2[ v ] );
				w = ( test < 0.0 ) ? - 1.0 : 1.0;

				tangents[ v * 4 ] = tmp.x;
				tangents[ v * 4 + 1 ] = tmp.y;
				tangents[ v * 4 + 2 ] = tmp.z;
				tangents[ v * 4 + 3 ] = w;

			}

			for ( var i = 0, il = groups.length; i < il; ++ i ) {

				var group = groups[ i ];

				var start = group.start;
				var count = group.count;

				for ( var j = start, jl = start + count; j < jl; j += 3 ) {

					handleVertex( indices[ j + 0 ] );
					handleVertex( indices[ j + 1 ] );
					handleVertex( indices[ j + 2 ] );

				}

			}

		},

		/**
		 * @param  {Array<THREE.BufferGeometry>} geometries
		 * @return {THREE.BufferGeometry}
		 */
		mergeBufferGeometries: function ( geometries, useGroups ) {

			var isIndexed = geometries[ 0 ].index !== null;

			var attributesUsed = new Set( Object.keys( geometries[ 0 ].attributes ) );
			var morphAttributesUsed = new Set( Object.keys( geometries[ 0 ].morphAttributes ) );

			var attributes = {};
			var morphAttributes = {};

			var mergedGeometry = new THREE.BufferGeometry();

			var offset = 0;

			for ( var i = 0; i < geometries.length; ++ i ) {

				var geometry = geometries[ i ];

				// ensure that all geometries are indexed, or none

				if ( isIndexed !== ( geometry.index !== null ) ) return null;

				// gather attributes, exit early if they're different

				for ( var name in geometry.attributes ) {

					if ( ! attributesUsed.has( name ) ) return null;

					if ( attributes[ name ] === undefined ) attributes[ name ] = [];

					attributes[ name ].push( geometry.attributes[ name ] );

				}

				// gather morph attributes, exit early if they're different

				for ( var name in geometry.morphAttributes ) {

					if ( ! morphAttributesUsed.has( name ) ) return null;

					if ( morphAttributes[ name ] === undefined ) morphAttributes[ name ] = [];

					morphAttributes[ name ].push( geometry.morphAttributes[ name ] );

				}

				// gather .userData

	      if (mergedGeometry.userData) {

	        mergedGeometry.userData.mergedUserData = mergedGeometry.userData.mergedUserData || [];
	        mergedGeometry.userData.mergedUserData.push( geometry.userData );

	      }

				if ( useGroups ) {

					var count;

					if ( isIndexed ) {

						count = geometry.index.count;

					} else if ( geometry.attributes.position !== undefined ) {

						count = geometry.attributes.position.count;

					} else {

						return null;

					}

					mergedGeometry.addGroup( offset, count, i );

					offset += count;

				}

			}

			// merge indices

			if ( isIndexed ) {

				var indexOffset = 0;
				var mergedIndex = [];

				for ( var i = 0; i < geometries.length; ++ i ) {

					var index = geometries[ i ].index;

					for ( var j = 0; j < index.count; ++ j ) {

						mergedIndex.push( index.getX( j ) + indexOffset );

					}

					indexOffset += geometries[ i ].attributes.position.count;

				}

				mergedGeometry.setIndex( mergedIndex );

			}

			// merge attributes

			for ( var name in attributes ) {

				var mergedAttribute = this.mergeBufferAttributes( attributes[ name ] );

				if ( ! mergedAttribute ) return null;

				mergedGeometry.addAttribute( name, mergedAttribute );

			}

			// merge morph attributes

			for ( var name in morphAttributes ) {

				var numMorphTargets = morphAttributes[ name ][ 0 ].length;

				if ( numMorphTargets === 0 ) break;

				mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
				mergedGeometry.morphAttributes[ name ] = [];

				for ( var i = 0; i < numMorphTargets; ++ i ) {

					var morphAttributesToMerge = [];

					for ( var j = 0; j < morphAttributes[ name ].length; ++ j ) {

						morphAttributesToMerge.push( morphAttributes[ name ][ j ][ i ] );

					}

					var mergedMorphAttribute = this.mergeBufferAttributes( morphAttributesToMerge );

					if ( ! mergedMorphAttribute ) return null;

					mergedGeometry.morphAttributes[ name ].push( mergedMorphAttribute );

				}

			}

			return mergedGeometry;

		},

		/**
		 * @param {Array<THREE.BufferAttribute>} attributes
		 * @return {THREE.BufferAttribute}
		 */
		mergeBufferAttributes: function ( attributes ) {

			var TypedArray;
			var itemSize;
			var normalized;
			var arrayLength = 0;

			for ( var i = 0; i < attributes.length; ++ i ) {

				var attribute = attributes[ i ];

				if ( attribute.isInterleavedBufferAttribute ) return null;

				if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;
				if ( TypedArray !== attribute.array.constructor ) return null;

				if ( itemSize === undefined ) itemSize = attribute.itemSize;
				if ( itemSize !== attribute.itemSize ) return null;

				if ( normalized === undefined ) normalized = attribute.normalized;
				if ( normalized !== attribute.normalized ) return null;

				arrayLength += attribute.array.length;

			}

			var array = new TypedArray( arrayLength );
			var offset = 0;

			for ( var i = 0; i < attributes.length; ++ i ) {

				array.set( attributes[ i ].array, offset );

				offset += attributes[ i ].array.length;

			}

			return new THREE.BufferAttribute( array, itemSize, normalized );

		}

	};


/***/ })
/******/ ]);