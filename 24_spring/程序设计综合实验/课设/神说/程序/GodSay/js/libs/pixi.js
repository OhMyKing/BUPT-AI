
var PIXI = (function (exports) {
	'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function commonjsRequire () {
		throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
	}

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	function getCjsExportFromNamespace (n) {
		return n && n['default'] || n;
	}

	var promise = createCommonjsModule(function (module, exports) {
	(function(global){

	
	
	

	var NativePromise = global['Promise'];
	var nativePromiseSupported =
	  NativePromise &&
	  
	  
	  'resolve' in NativePromise &&
	  'reject' in NativePromise &&
	  'all' in NativePromise &&
	  'race' in NativePromise &&
	  
	  
	  (function(){
	    var resolve;
	    new NativePromise(function(r){ resolve = r; });
	    return typeof resolve === 'function';
	  })();


	
	
	

	if ('object' !== 'undefined' && exports)
	{
	  
	  exports.Promise = nativePromiseSupported ? NativePromise : Promise;
	  exports.Polyfill = Promise;
	}
	else
	{
	  
	  if (typeof undefined == 'function' && undefined.amd)
	  {
	    undefined(function(){
	      return nativePromiseSupported ? NativePromise : Promise;
	    });
	  }
	  else
	  {
	    
	    if (!nativePromiseSupported)
	      { global['Promise'] = Promise; }
	  }
	}


	
	
	

	var PENDING = 'pending';
	var SEALED = 'sealed';
	var FULFILLED = 'fulfilled';
	var REJECTED = 'rejected';
	var NOOP = function(){};

	function isArray(value) {
	  return Object.prototype.toString.call(value) === '[object Array]';
	}

	
	var asyncSetTimer = typeof setImmediate !== 'undefined' ? setImmediate : setTimeout;
	var asyncQueue = [];
	var asyncTimer;

	function asyncFlush(){
	  
	  for (var i = 0; i < asyncQueue.length; i++)
	    { asyncQueue[i][0](asyncQueue[i][1]); }

	  
	  asyncQueue = [];
	  asyncTimer = false;
	}

	function asyncCall(callback, arg){
	  asyncQueue.push([callback, arg]);

	  if (!asyncTimer)
	  {
	    asyncTimer = true;
	    asyncSetTimer(asyncFlush, 0);
	  }
	}


	function invokeResolver(resolver, promise) {
	  function resolvePromise(value) {
	    resolve(promise, value);
	  }

	  function rejectPromise(reason) {
	    reject(promise, reason);
	  }

	  try {
	    resolver(resolvePromise, rejectPromise);
	  } catch(e) {
	    rejectPromise(e);
	  }
	}

	function invokeCallback(subscriber){
	  var owner = subscriber.owner;
	  var settled = owner.state_;
	  var value = owner.data_;  
	  var callback = subscriber[settled];
	  var promise = subscriber.then;

	  if (typeof callback === 'function')
	  {
	    settled = FULFILLED;
	    try {
	      value = callback(value);
	    } catch(e) {
	      reject(promise, e);
	    }
	  }

	  if (!handleThenable(promise, value))
	  {
	    if (settled === FULFILLED)
	      { resolve(promise, value); }

	    if (settled === REJECTED)
	      { reject(promise, value); }
	  }
	}

	function handleThenable(promise, value) {
	  var resolved;

	  try {
	    if (promise === value)
	      { throw new TypeError('A promises callback cannot return that same promise.'); }

	    if (value && (typeof value === 'function' || typeof value === 'object'))
	    {
	      var then = value.then;  

	      if (typeof then === 'function')
	      {
	        then.call(value, function(val){
	          if (!resolved)
	          {
	            resolved = true;

	            if (value !== val)
	              { resolve(promise, val); }
	            else
	              { fulfill(promise, val); }
	          }
	        }, function(reason){
	          if (!resolved)
	          {
	            resolved = true;

	            reject(promise, reason);
	          }
	        });

	        return true;
	      }
	    }
	  } catch (e) {
	    if (!resolved)
	      { reject(promise, e); }

	    return true;
	  }

	  return false;
	}

	function resolve(promise, value){
	  if (promise === value || !handleThenable(promise, value))
	    { fulfill(promise, value); }
	}

	function fulfill(promise, value){
	  if (promise.state_ === PENDING)
	  {
	    promise.state_ = SEALED;
	    promise.data_ = value;

	    asyncCall(publishFulfillment, promise);
	  }
	}

	function reject(promise, reason){
	  if (promise.state_ === PENDING)
	  {
	    promise.state_ = SEALED;
	    promise.data_ = reason;

	    asyncCall(publishRejection, promise);
	  }
	}

	function publish(promise) {
	  var callbacks = promise.then_;
	  promise.then_ = undefined;

	  for (var i = 0; i < callbacks.length; i++) {
	    invokeCallback(callbacks[i]);
	  }
	}

	function publishFulfillment(promise){
	  promise.state_ = FULFILLED;
	  publish(promise);
	}

	function publishRejection(promise){
	  promise.state_ = REJECTED;
	  publish(promise);
	}

	
	function Promise(resolver){
	  if (typeof resolver !== 'function')
	    { throw new TypeError('Promise constructor takes a function argument'); }

	  if (this instanceof Promise === false)
	    { throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.'); }

	  this.then_ = [];

	  invokeResolver(resolver, this);
	}

	Promise.prototype = {
	  constructor: Promise,

	  state_: PENDING,
	  then_: null,
	  data_: undefined,

	  then: function(onFulfillment, onRejection){
	    var subscriber = {
	      owner: this,
	      then: new this.constructor(NOOP),
	      fulfilled: onFulfillment,
	      rejected: onRejection
	    };

	    if (this.state_ === FULFILLED || this.state_ === REJECTED)
	    {
	      
	      asyncCall(invokeCallback, subscriber);
	    }
	    else
	    {
	      
	      this.then_.push(subscriber);
	    }

	    return subscriber.then;
	  },

	  'catch': function(onRejection) {
	    return this.then(null, onRejection);
	  }
	};

	Promise.all = function(promises){
	  var Class = this;

	  if (!isArray(promises))
	    { throw new TypeError('You must pass an array to Promise.all().'); }

	  return new Class(function(resolve, reject){
	    var results = [];
	    var remaining = 0;

	    function resolver(index){
	      remaining++;
	      return function(value){
	        results[index] = value;
	        if (!--remaining)
	          { resolve(results); }
	      };
	    }

	    for (var i = 0, promise; i < promises.length; i++)
	    {
	      promise = promises[i];

	      if (promise && typeof promise.then === 'function')
	        { promise.then(resolver(i), reject); }
	      else
	        { results[i] = promise; }
	    }

	    if (!remaining)
	      { resolve(results); }
	  });
	};

	Promise.race = function(promises){
	  var Class = this;

	  if (!isArray(promises))
	    { throw new TypeError('You must pass an array to Promise.race().'); }

	  return new Class(function(resolve, reject) {
	    for (var i = 0, promise; i < promises.length; i++)
	    {
	      promise = promises[i];

	      if (promise && typeof promise.then === 'function')
	        { promise.then(resolve, reject); }
	      else
	        { resolve(promise); }
	    }
	  });
	};

	Promise.resolve = function(value){
	  var Class = this;

	  if (value && typeof value === 'object' && value.constructor === Class)
	    { return value; }

	  return new Class(function(resolve){
	    resolve(value);
	  });
	};

	Promise.reject = function(reason){
	  var Class = this;

	  return new Class(function(resolve, reject){
	    reject(reason);
	  });
	};

	})(typeof window != 'undefined' ? window : typeof commonjsGlobal != 'undefined' ? commonjsGlobal : typeof self != 'undefined' ? self : commonjsGlobal);
	});
	var promise_1 = promise.Promise;
	var promise_2 = promise.Polyfill;

	

	'use strict';
	
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function shouldUseNative() {
		try {
			if (!Object.assign) {
				return false;
			}

			

			
			var test1 = new String('abc');  
			test1[5] = 'de';
			if (Object.getOwnPropertyNames(test1)[0] === '5') {
				return false;
			}

			
			var test2 = {};
			for (var i = 0; i < 10; i++) {
				test2['_' + String.fromCharCode(i)] = i;
			}
			var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
				return test2[n];
			});
			if (order2.join('') !== '0123456789') {
				return false;
			}

			
			var test3 = {};
			'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join('') !==
					'abcdefghijklmnopqrst') {
				return false;
			}

			return true;
		} catch (err) {
			
			return false;
		}
	}

	var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
		var arguments$1 = arguments;

		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments$1[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (getOwnPropertySymbols) {
				symbols = getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};

	

	
	if (!window.Promise) {
	    window.Promise = promise_2;
	}

	
	if (!Object.assign) {
	    Object.assign = objectAssign;
	}

	
	
	
	
	
	
	
	
	
	var ONE_FRAME_TIME = 16;
	
	if (!(Date.now && Date.prototype.getTime)) {
	    Date.now = function now() {
	        return new Date().getTime();
	    };
	}
	
	if (!(window.performance && window.performance.now)) {
	    var startTime_1 = Date.now();
	    if (!window.performance) {
	        window.performance = {};
	    }
	    window.performance.now = function () { return Date.now() - startTime_1; };
	}
	
	var lastTime = Date.now();
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
	    var p = vendors[x];
	    window.requestAnimationFrame = window[p + "RequestAnimationFrame"];
	    window.cancelAnimationFrame = window[p + "CancelAnimationFrame"]
	        || window[p + "CancelRequestAnimationFrame"];
	}
	if (!window.requestAnimationFrame) {
	    window.requestAnimationFrame = function (callback) {
	        if (typeof callback !== 'function') {
	            throw new TypeError(callback + "is not a function");
	        }
	        var currentTime = Date.now();
	        var delay = ONE_FRAME_TIME + lastTime - currentTime;
	        if (delay < 0) {
	            delay = 0;
	        }
	        lastTime = currentTime;
	        return window.setTimeout(function () {
	            lastTime = Date.now();
	            callback(performance.now());
	        }, delay);
	    };
	}
	if (!window.cancelAnimationFrame) {
	    window.cancelAnimationFrame = function (id) { return clearTimeout(id); };
	}

	
	
	if (!Math.sign) {
	    Math.sign = function mathSign(x) {
	        x = Number(x);
	        if (x === 0 || isNaN(x)) {
	            return x;
	        }
	        return x > 0 ? 1 : -1;
	    };
	}

	
	
	if (!Number.isInteger) {
	    Number.isInteger = function numberIsInteger(value) {
	        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
	    };
	}

	if (!window.ArrayBuffer) {
	    window.ArrayBuffer = Array;
	}
	if (!window.Float32Array) {
	    window.Float32Array = Array;
	}
	if (!window.Uint32Array) {
	    window.Uint32Array = Array;
	}
	if (!window.Uint16Array) {
	    window.Uint16Array = Array;
	}
	if (!window.Uint8Array) {
	    window.Uint8Array = Array;
	}
	if (!window.Int32Array) {
	    window.Int32Array = Array;
	}

	var appleIphone = /iPhone/i;
	var appleIpod = /iPod/i;
	var appleTablet = /iPad/i;
	var appleUniversal = /\biOS-universal(?:.+)Mac\b/i;
	var androidPhone = /\bAndroid(?:.+)Mobile\b/i;
	var androidTablet = /Android/i;
	var amazonPhone = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i;
	var amazonTablet = /Silk/i;
	var windowsPhone = /Windows Phone/i;
	var windowsTablet = /\bWindows(?:.+)ARM\b/i;
	var otherBlackBerry = /BlackBerry/i;
	var otherBlackBerry10 = /BB10/i;
	var otherOpera = /Opera Mini/i;
	var otherChrome = /\b(CriOS|Chrome)(?:.+)Mobile/i;
	var otherFirefox = /Mobile(?:.+)Firefox\b/i;
	var isAppleTabletOnIos13 = function (navigator) {
	    return (typeof navigator !== 'undefined' &&
	        navigator.platform === 'MacIntel' &&
	        typeof navigator.maxTouchPoints === 'number' &&
	        navigator.maxTouchPoints > 1 &&
	        typeof MSStream === 'undefined');
	};
	function createMatch(userAgent) {
	    return function (regex) { return regex.test(userAgent); };
	}
	function isMobile(param) {
	    var nav = {
	        userAgent: '',
	        platform: '',
	        maxTouchPoints: 0
	    };
	    if (!param && typeof navigator !== 'undefined') {
	        nav = {
	            userAgent: navigator.userAgent,
	            platform: navigator.platform,
	            maxTouchPoints: navigator.maxTouchPoints || 0
	        };
	    }
	    else if (typeof param === 'string') {
	        nav.userAgent = param;
	    }
	    else if (param && param.userAgent) {
	        nav = {
	            userAgent: param.userAgent,
	            platform: param.platform,
	            maxTouchPoints: param.maxTouchPoints || 0
	        };
	    }
	    var userAgent = nav.userAgent;
	    var tmp = userAgent.split('[FBAN');
	    if (typeof tmp[1] !== 'undefined') {
	        userAgent = tmp[0];
	    }
	    tmp = userAgent.split('Twitter');
	    if (typeof tmp[1] !== 'undefined') {
	        userAgent = tmp[0];
	    }
	    var match = createMatch(userAgent);
	    var result = {
	        apple: {
	            phone: match(appleIphone) && !match(windowsPhone),
	            ipod: match(appleIpod),
	            tablet: !match(appleIphone) &&
	                (match(appleTablet) || isAppleTabletOnIos13(nav)) &&
	                !match(windowsPhone),
	            universal: match(appleUniversal),
	            device: (match(appleIphone) ||
	                match(appleIpod) ||
	                match(appleTablet) ||
	                match(appleUniversal) ||
	                isAppleTabletOnIos13(nav)) &&
	                !match(windowsPhone)
	        },
	        amazon: {
	            phone: match(amazonPhone),
	            tablet: !match(amazonPhone) && match(amazonTablet),
	            device: match(amazonPhone) || match(amazonTablet)
	        },
	        android: {
	            phone: (!match(windowsPhone) && match(amazonPhone)) ||
	                (!match(windowsPhone) && match(androidPhone)),
	            tablet: !match(windowsPhone) &&
	                !match(amazonPhone) &&
	                !match(androidPhone) &&
	                (match(amazonTablet) || match(androidTablet)),
	            device: (!match(windowsPhone) &&
	                (match(amazonPhone) ||
	                    match(amazonTablet) ||
	                    match(androidPhone) ||
	                    match(androidTablet))) ||
	                match(/\bokhttp\b/i)
	        },
	        windows: {
	            phone: match(windowsPhone),
	            tablet: match(windowsTablet),
	            device: match(windowsPhone) || match(windowsTablet)
	        },
	        other: {
	            blackberry: match(otherBlackBerry),
	            blackberry10: match(otherBlackBerry10),
	            opera: match(otherOpera),
	            firefox: match(otherFirefox),
	            chrome: match(otherChrome),
	            device: match(otherBlackBerry) ||
	                match(otherBlackBerry10) ||
	                match(otherOpera) ||
	                match(otherFirefox) ||
	                match(otherChrome)
	        },
	        any: false,
	        phone: false,
	        tablet: false
	    };
	    result.any =
	        result.apple.device ||
	            result.android.device ||
	            result.windows.device ||
	            result.other.device;
	    result.phone =
	        result.apple.phone || result.android.phone || result.windows.phone;
	    result.tablet =
	        result.apple.tablet || result.android.tablet || result.windows.tablet;
	    return result;
	}

	

	
	var isMobile$1 = isMobile(window.navigator);

	
	function maxRecommendedTextures(max) {
	    var allowMax = true;
	    if (isMobile$1.tablet || isMobile$1.phone) {
	        if (isMobile$1.apple.device) {
	            var match = (navigator.userAgent).match(/OS (\d+)_(\d+)?/);
	            if (match) {
	                var majorVersion = parseInt(match[1], 10);
	                
	                if (majorVersion < 11) {
	                    allowMax = false;
	                }
	            }
	        }
	        if (isMobile$1.android.device) {
	            var match = (navigator.userAgent).match(/Android\s([0-9.]*)/);
	            if (match) {
	                var majorVersion = parseInt(match[1], 10);
	                
	                if (majorVersion < 7) {
	                    allowMax = false;
	                }
	            }
	        }
	    }
	    return allowMax ? max : 4;
	}

	
	function canUploadSameBuffer() {
	    return !isMobile$1.apple.device;
	}

	
	var settings = {
	    
	    MIPMAP_TEXTURES: 1,
	    
	    ANISOTROPIC_LEVEL: 0,
	    
	    RESOLUTION: 1,
	    
	    FILTER_RESOLUTION: 1,
	    
	    SPRITE_MAX_TEXTURES: maxRecommendedTextures(32),
	    
	    
	    
	    SPRITE_BATCH_SIZE: 4096,
	    
	    RENDER_OPTIONS: {
	        view: null,
	        antialias: false,
	        autoDensity: false,
	        transparent: false,
	        backgroundColor: 0x000000,
	        clearBeforeRender: true,
	        preserveDrawingBuffer: false,
	        width: 800,
	        height: 600,
	        legacy: false,
	    },
	    
	    GC_MODE: 0,
	    
	    GC_MAX_IDLE: 60 * 60,
	    
	    GC_MAX_CHECK_COUNT: 60 * 10,
	    
	    WRAP_MODE: 33071,
	    
	    SCALE_MODE: 1,
	    
	    PRECISION_VERTEX: 'highp',
	    
	    PRECISION_FRAGMENT: isMobile$1.apple.device ? 'highp' : 'mediump',
	    
	    CAN_UPLOAD_SAME_BUFFER: canUploadSameBuffer(),
	    
	    CREATE_IMAGE_BITMAP: false,
	    
	    ROUND_PIXELS: false,
	};

	var eventemitter3 = createCommonjsModule(function (module) {
	'use strict';

	var has = Object.prototype.hasOwnProperty
	  , prefix = '~';

	
	function Events() {}

	
	
	
	
	
	
	
	if (Object.create) {
	  Events.prototype = Object.create(null);

	  
	  
	  
	  
	  if (!new Events().__proto__) { prefix = false; }
	}

	
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}

	
	function addListener(emitter, event, fn, context, once) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('The listener must be a function');
	  }

	  var listener = new EE(fn, context || emitter, once)
	    , evt = prefix ? prefix + event : event;

	  if (!emitter._events[evt]) { emitter._events[evt] = listener, emitter._eventsCount++; }
	  else if (!emitter._events[evt].fn) { emitter._events[evt].push(listener); }
	  else { emitter._events[evt] = [emitter._events[evt], listener]; }

	  return emitter;
	}

	
	function clearEvent(emitter, evt) {
	  if (--emitter._eventsCount === 0) { emitter._events = new Events(); }
	  else { delete emitter._events[evt]; }
	}

	
	function EventEmitter() {
	  this._events = new Events();
	  this._eventsCount = 0;
	}

	
	EventEmitter.prototype.eventNames = function eventNames() {
	  var names = []
	    , events
	    , name;

	  if (this._eventsCount === 0) { return names; }

	  for (name in (events = this._events)) {
	    if (has.call(events, name)) { names.push(prefix ? name.slice(1) : name); }
	  }

	  if (Object.getOwnPropertySymbols) {
	    return names.concat(Object.getOwnPropertySymbols(events));
	  }

	  return names;
	};

	
	EventEmitter.prototype.listeners = function listeners(event) {
	  var evt = prefix ? prefix + event : event
	    , handlers = this._events[evt];

	  if (!handlers) { return []; }
	  if (handlers.fn) { return [handlers.fn]; }

	  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
	    ee[i] = handlers[i].fn;
	  }

	  return ee;
	};

	
	EventEmitter.prototype.listenerCount = function listenerCount(event) {
	  var evt = prefix ? prefix + event : event
	    , listeners = this._events[evt];

	  if (!listeners) { return 0; }
	  if (listeners.fn) { return 1; }
	  return listeners.length;
	};

	
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  var arguments$1 = arguments;

	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) { return false; }

	  var listeners = this._events[evt]
	    , len = arguments.length
	    , args
	    , i;

	  if (listeners.fn) {
	    if (listeners.once) { this.removeListener(event, listeners.fn, undefined, true); }

	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }

	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments$1[i];
	    }

	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;

	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) { this.removeListener(event, listeners[i].fn, undefined, true); }

	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
	        default:
	          if (!args) { for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments$1[j];
	          } }

	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }

	  return true;
	};

	
	EventEmitter.prototype.on = function on(event, fn, context) {
	  return addListener(this, event, fn, context, false);
	};

	
	EventEmitter.prototype.once = function once(event, fn, context) {
	  return addListener(this, event, fn, context, true);
	};

	
	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) { return this; }
	  if (!fn) {
	    clearEvent(this, evt);
	    return this;
	  }

	  var listeners = this._events[evt];

	  if (listeners.fn) {
	    if (
	      listeners.fn === fn &&
	      (!once || listeners.once) &&
	      (!context || listeners.context === context)
	    ) {
	      clearEvent(this, evt);
	    }
	  } else {
	    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
	      if (
	        listeners[i].fn !== fn ||
	        (once && !listeners[i].once) ||
	        (context && listeners[i].context !== context)
	      ) {
	        events.push(listeners[i]);
	      }
	    }

	    
	    
	    
	    if (events.length) { this._events[evt] = events.length === 1 ? events[0] : events; }
	    else { clearEvent(this, evt); }
	  }

	  return this;
	};

	
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  var evt;

	  if (event) {
	    evt = prefix ? prefix + event : event;
	    if (this._events[evt]) { clearEvent(this, evt); }
	  } else {
	    this._events = new Events();
	    this._eventsCount = 0;
	  }

	  return this;
	};

	
	
	
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	
	
	
	EventEmitter.prefixed = prefix;

	
	
	
	EventEmitter.EventEmitter = EventEmitter;

	
	
	
	if ('undefined' !== 'object') {
	  module.exports = EventEmitter;
	}
	});

	'use strict';

	var earcut_1 = earcut;
	var default_1 = earcut;

	function earcut(data, holeIndices, dim) {

	    dim = dim || 2;

	    var hasHoles = holeIndices && holeIndices.length,
	        outerLen = hasHoles ? holeIndices[0] * dim : data.length,
	        outerNode = linkedList(data, 0, outerLen, dim, true),
	        triangles = [];

	    if (!outerNode || outerNode.next === outerNode.prev) { return triangles; }

	    var minX, minY, maxX, maxY, x, y, invSize;

	    if (hasHoles) { outerNode = eliminateHoles(data, holeIndices, outerNode, dim); }

	    
	    if (data.length > 80 * dim) {
	        minX = maxX = data[0];
	        minY = maxY = data[1];

	        for (var i = dim; i < outerLen; i += dim) {
	            x = data[i];
	            y = data[i + 1];
	            if (x < minX) { minX = x; }
	            if (y < minY) { minY = y; }
	            if (x > maxX) { maxX = x; }
	            if (y > maxY) { maxY = y; }
	        }

	        
	        invSize = Math.max(maxX - minX, maxY - minY);
	        invSize = invSize !== 0 ? 1 / invSize : 0;
	    }

	    earcutLinked(outerNode, triangles, dim, minX, minY, invSize);

	    return triangles;
	}

	
	function linkedList(data, start, end, dim, clockwise) {
	    var i, last;

	    if (clockwise === (signedArea(data, start, end, dim) > 0)) {
	        for (i = start; i < end; i += dim) { last = insertNode(i, data[i], data[i + 1], last); }
	    } else {
	        for (i = end - dim; i >= start; i -= dim) { last = insertNode(i, data[i], data[i + 1], last); }
	    }

	    if (last && equals(last, last.next)) {
	        removeNode(last);
	        last = last.next;
	    }

	    return last;
	}

	
	function filterPoints(start, end) {
	    if (!start) { return start; }
	    if (!end) { end = start; }

	    var p = start,
	        again;
	    do {
	        again = false;

	        if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
	            removeNode(p);
	            p = end = p.prev;
	            if (p === p.next) { break; }
	            again = true;

	        } else {
	            p = p.next;
	        }
	    } while (again || p !== end);

	    return end;
	}

	
	function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
	    if (!ear) { return; }

	    
	    if (!pass && invSize) { indexCurve(ear, minX, minY, invSize); }

	    var stop = ear,
	        prev, next;

	    
	    while (ear.prev !== ear.next) {
	        prev = ear.prev;
	        next = ear.next;

	        if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
	            
	            triangles.push(prev.i / dim);
	            triangles.push(ear.i / dim);
	            triangles.push(next.i / dim);

	            removeNode(ear);

	            
	            ear = next.next;
	            stop = next.next;

	            continue;
	        }

	        ear = next;

	        
	        if (ear === stop) {
	            
	            if (!pass) {
	                earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);

	            
	            } else if (pass === 1) {
	                ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
	                earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);

	            
	            } else if (pass === 2) {
	                splitEarcut(ear, triangles, dim, minX, minY, invSize);
	            }

	            break;
	        }
	    }
	}

	
	function isEar(ear) {
	    var a = ear.prev,
	        b = ear,
	        c = ear.next;

	    if (area(a, b, c) >= 0) { return false; } 

	    
	    var p = ear.next.next;

	    while (p !== ear.prev) {
	        if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
	            area(p.prev, p, p.next) >= 0) { return false; }
	        p = p.next;
	    }

	    return true;
	}

	function isEarHashed(ear, minX, minY, invSize) {
	    var a = ear.prev,
	        b = ear,
	        c = ear.next;

	    if (area(a, b, c) >= 0) { return false; } 

	    
	    var minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x),
	        minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y),
	        maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x),
	        maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);

	    
	    var minZ = zOrder(minTX, minTY, minX, minY, invSize),
	        maxZ = zOrder(maxTX, maxTY, minX, minY, invSize);

	    var p = ear.prevZ,
	        n = ear.nextZ;

	    
	    while (p && p.z >= minZ && n && n.z <= maxZ) {
	        if (p !== ear.prev && p !== ear.next &&
	            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
	            area(p.prev, p, p.next) >= 0) { return false; }
	        p = p.prevZ;

	        if (n !== ear.prev && n !== ear.next &&
	            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
	            area(n.prev, n, n.next) >= 0) { return false; }
	        n = n.nextZ;
	    }

	    
	    while (p && p.z >= minZ) {
	        if (p !== ear.prev && p !== ear.next &&
	            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
	            area(p.prev, p, p.next) >= 0) { return false; }
	        p = p.prevZ;
	    }

	    
	    while (n && n.z <= maxZ) {
	        if (n !== ear.prev && n !== ear.next &&
	            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
	            area(n.prev, n, n.next) >= 0) { return false; }
	        n = n.nextZ;
	    }

	    return true;
	}

	
	function cureLocalIntersections(start, triangles, dim) {
	    var p = start;
	    do {
	        var a = p.prev,
	            b = p.next.next;

	        if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {

	            triangles.push(a.i / dim);
	            triangles.push(p.i / dim);
	            triangles.push(b.i / dim);

	            
	            removeNode(p);
	            removeNode(p.next);

	            p = start = b;
	        }
	        p = p.next;
	    } while (p !== start);

	    return filterPoints(p);
	}

	
	function splitEarcut(start, triangles, dim, minX, minY, invSize) {
	    
	    var a = start;
	    do {
	        var b = a.next.next;
	        while (b !== a.prev) {
	            if (a.i !== b.i && isValidDiagonal(a, b)) {
	                
	                var c = splitPolygon(a, b);

	                
	                a = filterPoints(a, a.next);
	                c = filterPoints(c, c.next);

	                
	                earcutLinked(a, triangles, dim, minX, minY, invSize);
	                earcutLinked(c, triangles, dim, minX, minY, invSize);
	                return;
	            }
	            b = b.next;
	        }
	        a = a.next;
	    } while (a !== start);
	}

	
	function eliminateHoles(data, holeIndices, outerNode, dim) {
	    var queue = [],
	        i, len, start, end, list;

	    for (i = 0, len = holeIndices.length; i < len; i++) {
	        start = holeIndices[i] * dim;
	        end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
	        list = linkedList(data, start, end, dim, false);
	        if (list === list.next) { list.steiner = true; }
	        queue.push(getLeftmost(list));
	    }

	    queue.sort(compareX);

	    
	    for (i = 0; i < queue.length; i++) {
	        outerNode = eliminateHole(queue[i], outerNode);
	        outerNode = filterPoints(outerNode, outerNode.next);
	    }

	    return outerNode;
	}

	function compareX(a, b) {
	    return a.x - b.x;
	}

	
	function eliminateHole(hole, outerNode) {
	    var bridge = findHoleBridge(hole, outerNode);
	    if (!bridge) {
	        return outerNode;
	    }

	    var bridgeReverse = splitPolygon(bridge, hole);

	    
	    var filteredBridge = filterPoints(bridge, bridge.next);
	    filterPoints(bridgeReverse, bridgeReverse.next);

	    
	    return outerNode === bridge ? filteredBridge : outerNode;
	}

	
	function findHoleBridge(hole, outerNode) {
	    var p = outerNode,
	        hx = hole.x,
	        hy = hole.y,
	        qx = -Infinity,
	        m;

	    
	    
	    do {
	        if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
	            var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
	            if (x <= hx && x > qx) {
	                qx = x;
	                if (x === hx) {
	                    if (hy === p.y) { return p; }
	                    if (hy === p.next.y) { return p.next; }
	                }
	                m = p.x < p.next.x ? p : p.next;
	            }
	        }
	        p = p.next;
	    } while (p !== outerNode);

	    if (!m) { return null; }

	    if (hx === qx) { return m; } 

	    
	    
	    

	    var stop = m,
	        mx = m.x,
	        my = m.y,
	        tanMin = Infinity,
	        tan;

	    p = m;

	    do {
	        if (hx >= p.x && p.x >= mx && hx !== p.x &&
	                pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {

	            tan = Math.abs(hy - p.y) / (hx - p.x); 

	            if (locallyInside(p, hole) &&
	                (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))) {
	                m = p;
	                tanMin = tan;
	            }
	        }

	        p = p.next;
	    } while (p !== stop);

	    return m;
	}

	
	function sectorContainsSector(m, p) {
	    return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
	}

	
	function indexCurve(start, minX, minY, invSize) {
	    var p = start;
	    do {
	        if (p.z === null) { p.z = zOrder(p.x, p.y, minX, minY, invSize); }
	        p.prevZ = p.prev;
	        p.nextZ = p.next;
	        p = p.next;
	    } while (p !== start);

	    p.prevZ.nextZ = null;
	    p.prevZ = null;

	    sortLinked(p);
	}

	
	
	function sortLinked(list) {
	    var i, p, q, e, tail, numMerges, pSize, qSize,
	        inSize = 1;

	    do {
	        p = list;
	        list = null;
	        tail = null;
	        numMerges = 0;

	        while (p) {
	            numMerges++;
	            q = p;
	            pSize = 0;
	            for (i = 0; i < inSize; i++) {
	                pSize++;
	                q = q.nextZ;
	                if (!q) { break; }
	            }
	            qSize = inSize;

	            while (pSize > 0 || (qSize > 0 && q)) {

	                if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
	                    e = p;
	                    p = p.nextZ;
	                    pSize--;
	                } else {
	                    e = q;
	                    q = q.nextZ;
	                    qSize--;
	                }

	                if (tail) { tail.nextZ = e; }
	                else { list = e; }

	                e.prevZ = tail;
	                tail = e;
	            }

	            p = q;
	        }

	        tail.nextZ = null;
	        inSize *= 2;

	    } while (numMerges > 1);

	    return list;
	}

	
	function zOrder(x, y, minX, minY, invSize) {
	    
	    x = 32767 * (x - minX) * invSize;
	    y = 32767 * (y - minY) * invSize;

	    x = (x | (x << 8)) & 0x00FF00FF;
	    x = (x | (x << 4)) & 0x0F0F0F0F;
	    x = (x | (x << 2)) & 0x33333333;
	    x = (x | (x << 1)) & 0x55555555;

	    y = (y | (y << 8)) & 0x00FF00FF;
	    y = (y | (y << 4)) & 0x0F0F0F0F;
	    y = (y | (y << 2)) & 0x33333333;
	    y = (y | (y << 1)) & 0x55555555;

	    return x | (y << 1);
	}

	
	function getLeftmost(start) {
	    var p = start,
	        leftmost = start;
	    do {
	        if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) { leftmost = p; }
	        p = p.next;
	    } while (p !== start);

	    return leftmost;
	}

	
	function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
	    return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
	           (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
	           (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
	}

	
	function isValidDiagonal(a, b) {
	    return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) && 
	           (locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) && 
	            (area(a.prev, a, b.prev) || area(a, b.prev, b)) || 
	            equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0); 
	}

	
	function area(p, q, r) {
	    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
	}

	
	function equals(p1, p2) {
	    return p1.x === p2.x && p1.y === p2.y;
	}

	
	function intersects(p1, q1, p2, q2) {
	    var o1 = sign(area(p1, q1, p2));
	    var o2 = sign(area(p1, q1, q2));
	    var o3 = sign(area(p2, q2, p1));
	    var o4 = sign(area(p2, q2, q1));

	    if (o1 !== o2 && o3 !== o4) { return true; } 

	    if (o1 === 0 && onSegment(p1, p2, q1)) { return true; } 
	    if (o2 === 0 && onSegment(p1, q2, q1)) { return true; } 
	    if (o3 === 0 && onSegment(p2, p1, q2)) { return true; } 
	    if (o4 === 0 && onSegment(p2, q1, q2)) { return true; } 

	    return false;
	}

	
	function onSegment(p, q, r) {
	    return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
	}

	function sign(num) {
	    return num > 0 ? 1 : num < 0 ? -1 : 0;
	}

	
	function intersectsPolygon(a, b) {
	    var p = a;
	    do {
	        if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
	                intersects(p, p.next, a, b)) { return true; }
	        p = p.next;
	    } while (p !== a);

	    return false;
	}

	
	function locallyInside(a, b) {
	    return area(a.prev, a, a.next) < 0 ?
	        area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
	        area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
	}

	
	function middleInside(a, b) {
	    var p = a,
	        inside = false,
	        px = (a.x + b.x) / 2,
	        py = (a.y + b.y) / 2;
	    do {
	        if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
	                (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
	            { inside = !inside; }
	        p = p.next;
	    } while (p !== a);

	    return inside;
	}

	
	
	function splitPolygon(a, b) {
	    var a2 = new Node(a.i, a.x, a.y),
	        b2 = new Node(b.i, b.x, b.y),
	        an = a.next,
	        bp = b.prev;

	    a.next = b;
	    b.prev = a;

	    a2.next = an;
	    an.prev = a2;

	    b2.next = a2;
	    a2.prev = b2;

	    bp.next = b2;
	    b2.prev = bp;

	    return b2;
	}

	
	function insertNode(i, x, y, last) {
	    var p = new Node(i, x, y);

	    if (!last) {
	        p.prev = p;
	        p.next = p;

	    } else {
	        p.next = last.next;
	        p.prev = last;
	        last.next.prev = p;
	        last.next = p;
	    }
	    return p;
	}

	function removeNode(p) {
	    p.next.prev = p.prev;
	    p.prev.next = p.next;

	    if (p.prevZ) { p.prevZ.nextZ = p.nextZ; }
	    if (p.nextZ) { p.nextZ.prevZ = p.prevZ; }
	}

	function Node(i, x, y) {
	    
	    this.i = i;

	    
	    this.x = x;
	    this.y = y;

	    
	    this.prev = null;
	    this.next = null;

	    
	    this.z = null;

	    
	    this.prevZ = null;
	    this.nextZ = null;

	    
	    this.steiner = false;
	}

	
	
	earcut.deviation = function (data, holeIndices, dim, triangles) {
	    var hasHoles = holeIndices && holeIndices.length;
	    var outerLen = hasHoles ? holeIndices[0] * dim : data.length;

	    var polygonArea = Math.abs(signedArea(data, 0, outerLen, dim));
	    if (hasHoles) {
	        for (var i = 0, len = holeIndices.length; i < len; i++) {
	            var start = holeIndices[i] * dim;
	            var end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
	            polygonArea -= Math.abs(signedArea(data, start, end, dim));
	        }
	    }

	    var trianglesArea = 0;
	    for (i = 0; i < triangles.length; i += 3) {
	        var a = triangles[i] * dim;
	        var b = triangles[i + 1] * dim;
	        var c = triangles[i + 2] * dim;
	        trianglesArea += Math.abs(
	            (data[a] - data[c]) * (data[b + 1] - data[a + 1]) -
	            (data[a] - data[b]) * (data[c + 1] - data[a + 1]));
	    }

	    return polygonArea === 0 && trianglesArea === 0 ? 0 :
	        Math.abs((trianglesArea - polygonArea) / polygonArea);
	};

	function signedArea(data, start, end, dim) {
	    var sum = 0;
	    for (var i = start, j = end - dim; i < end; i += dim) {
	        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
	        j = i;
	    }
	    return sum;
	}

	
	earcut.flatten = function (data) {
	    var dim = data[0][0].length,
	        result = {vertices: [], holes: [], dimensions: dim},
	        holeIndex = 0;

	    for (var i = 0; i < data.length; i++) {
	        for (var j = 0; j < data[i].length; j++) {
	            for (var d = 0; d < dim; d++) { result.vertices.push(data[i][j][d]); }
	        }
	        if (i > 0) {
	            holeIndex += data[i - 1].length;
	            result.holes.push(holeIndex);
	        }
	    }
	    return result;
	};
	earcut_1.default = default_1;

	var punycode = createCommonjsModule(function (module, exports) {
	
	;(function(root) {

		
		var freeExports = 'object' == 'object' && exports &&
			!exports.nodeType && exports;
		var freeModule = 'object' == 'object' && module &&
			!module.nodeType && module;
		var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;
		if (
			freeGlobal.global === freeGlobal ||
			freeGlobal.window === freeGlobal ||
			freeGlobal.self === freeGlobal
		) {
			root = freeGlobal;
		}

		
		var punycode,

		
		maxInt = 2147483647, 

		
		base = 36,
		tMin = 1,
		tMax = 26,
		skew = 38,
		damp = 700,
		initialBias = 72,
		initialN = 128, 
		delimiter = '-', 

		
		regexPunycode = /^xn--/,
		regexNonASCII = /[^\x20-\x7E]/, 
		regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, 

		
		errors = {
			'overflow': 'Overflow: input needs wider integers to process',
			'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
			'invalid-input': 'Invalid input'
		},

		
		baseMinusTMin = base - tMin,
		floor = Math.floor,
		stringFromCharCode = String.fromCharCode,

		
		key;

		

		
		function error(type) {
			throw RangeError(errors[type]);
		}

		
		function map(array, fn) {
			var length = array.length;
			var result = [];
			while (length--) {
				result[length] = fn(array[length]);
			}
			return result;
		}

		
		function mapDomain(string, fn) {
			var parts = string.split('@');
			var result = '';
			if (parts.length > 1) {
				
				
				result = parts[0] + '@';
				string = parts[1];
			}
			
			string = string.replace(regexSeparators, '\x2E');
			var labels = string.split('.');
			var encoded = map(labels, fn).join('.');
			return result + encoded;
		}

		
		function ucs2decode(string) {
			var output = [],
			    counter = 0,
			    length = string.length,
			    value,
			    extra;
			while (counter < length) {
				value = string.charCodeAt(counter++);
				if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
					
					extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) { 
						output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
					} else {
						
						
						output.push(value);
						counter--;
					}
				} else {
					output.push(value);
				}
			}
			return output;
		}

		
		function ucs2encode(array) {
			return map(array, function(value) {
				var output = '';
				if (value > 0xFFFF) {
					value -= 0x10000;
					output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
					value = 0xDC00 | value & 0x3FF;
				}
				output += stringFromCharCode(value);
				return output;
			}).join('');
		}

		
		function basicToDigit(codePoint) {
			if (codePoint - 48 < 10) {
				return codePoint - 22;
			}
			if (codePoint - 65 < 26) {
				return codePoint - 65;
			}
			if (codePoint - 97 < 26) {
				return codePoint - 97;
			}
			return base;
		}

		
		function digitToBasic(digit, flag) {
			
			
			return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
		}

		
		function adapt(delta, numPoints, firstTime) {
			var k = 0;
			delta = firstTime ? floor(delta / damp) : delta >> 1;
			delta += floor(delta / numPoints);
			for (; delta > baseMinusTMin * tMax >> 1; k += base) {
				delta = floor(delta / baseMinusTMin);
			}
			return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
		}

		
		function decode(input) {
			
			var output = [],
			    inputLength = input.length,
			    out,
			    i = 0,
			    n = initialN,
			    bias = initialBias,
			    basic,
			    j,
			    index,
			    oldi,
			    w,
			    k,
			    digit,
			    t,
			    
			    baseMinusT;

			
			
			

			basic = input.lastIndexOf(delimiter);
			if (basic < 0) {
				basic = 0;
			}

			for (j = 0; j < basic; ++j) {
				
				if (input.charCodeAt(j) >= 0x80) {
					error('not-basic');
				}
				output.push(input.charCodeAt(j));
			}

			
			

			for (index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {

				
				
				
				
				
				for (oldi = i, w = 1, k = base; ; k += base) {

					if (index >= inputLength) {
						error('invalid-input');
					}

					digit = basicToDigit(input.charCodeAt(index++));

					if (digit >= base || digit > floor((maxInt - i) / w)) {
						error('overflow');
					}

					i += digit * w;
					t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

					if (digit < t) {
						break;
					}

					baseMinusT = base - t;
					if (w > floor(maxInt / baseMinusT)) {
						error('overflow');
					}

					w *= baseMinusT;

				}

				out = output.length + 1;
				bias = adapt(i - oldi, out, oldi == 0);

				
				
				if (floor(i / out) > maxInt - n) {
					error('overflow');
				}

				n += floor(i / out);
				i %= out;

				
				output.splice(i++, 0, n);

			}

			return ucs2encode(output);
		}

		
		function encode(input) {
			var n,
			    delta,
			    handledCPCount,
			    basicLength,
			    bias,
			    j,
			    m,
			    q,
			    k,
			    t,
			    currentValue,
			    output = [],
			    
			    inputLength,
			    
			    handledCPCountPlusOne,
			    baseMinusT,
			    qMinusT;

			
			input = ucs2decode(input);

			
			inputLength = input.length;

			
			n = initialN;
			delta = 0;
			bias = initialBias;

			
			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue < 0x80) {
					output.push(stringFromCharCode(currentValue));
				}
			}

			handledCPCount = basicLength = output.length;

			
			

			
			if (basicLength) {
				output.push(delimiter);
			}

			
			while (handledCPCount < inputLength) {

				
				
				for (m = maxInt, j = 0; j < inputLength; ++j) {
					currentValue = input[j];
					if (currentValue >= n && currentValue < m) {
						m = currentValue;
					}
				}

				
				
				handledCPCountPlusOne = handledCPCount + 1;
				if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
					error('overflow');
				}

				delta += (m - n) * handledCPCountPlusOne;
				n = m;

				for (j = 0; j < inputLength; ++j) {
					currentValue = input[j];

					if (currentValue < n && ++delta > maxInt) {
						error('overflow');
					}

					if (currentValue == n) {
						
						for (q = delta, k = base; ; k += base) {
							t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
							if (q < t) {
								break;
							}
							qMinusT = q - t;
							baseMinusT = base - t;
							output.push(
								stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
							);
							q = floor(qMinusT / baseMinusT);
						}

						output.push(stringFromCharCode(digitToBasic(q, 0)));
						bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
						delta = 0;
						++handledCPCount;
					}
				}

				++delta;
				++n;

			}
			return output.join('');
		}

		
		function toUnicode(input) {
			return mapDomain(input, function(string) {
				return regexPunycode.test(string)
					? decode(string.slice(4).toLowerCase())
					: string;
			});
		}

		
		function toASCII(input) {
			return mapDomain(input, function(string) {
				return regexNonASCII.test(string)
					? 'xn--' + encode(string)
					: string;
			});
		}

		

		
		punycode = {
			
			'version': '1.3.2',
			
			'ucs2': {
				'decode': ucs2decode,
				'encode': ucs2encode
			},
			'decode': decode,
			'encode': encode,
			'toASCII': toASCII,
			'toUnicode': toUnicode
		};

		
		
		
		if (
			typeof undefined == 'function' &&
			typeof undefined.amd == 'object' &&
			undefined.amd
		) {
			undefined('punycode', function() {
				return punycode;
			});
		} else if (freeExports && freeModule) {
			if (module.exports == freeExports) { 
				freeModule.exports = punycode;
			} else { 
				for (key in punycode) {
					punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
				}
			}
		} else { 
			root.punycode = punycode;
		}

	}(commonjsGlobal));
	});

	'use strict';

	var util = {
	  isString: function(arg) {
	    return typeof(arg) === 'string';
	  },
	  isObject: function(arg) {
	    return typeof(arg) === 'object' && arg !== null;
	  },
	  isNull: function(arg) {
	    return arg === null;
	  },
	  isNullOrUndefined: function(arg) {
	    return arg == null;
	  }
	};
	var util_1 = util.isString;
	var util_2 = util.isObject;
	var util_3 = util.isNull;
	var util_4 = util.isNullOrUndefined;

	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	

	'use strict';

	
	
	
	function hasOwnProperty$1(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	var decode = function(qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};

	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }

	  var regexp = /\+/g;
	  qs = qs.split(sep);

	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }

	  var len = qs.length;
	  
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }

	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr, vstr, k, v;

	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }

	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);

	    if (!hasOwnProperty$1(obj, k)) {
	      obj[k] = v;
	    } else if (Array.isArray(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }

	  return obj;
	};

	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	

	'use strict';

	var stringifyPrimitive = function(v) {
	  switch (typeof v) {
	    case 'string':
	      return v;

	    case 'boolean':
	      return v ? 'true' : 'false';

	    case 'number':
	      return isFinite(v) ? v : '';

	    default:
	      return '';
	  }
	};

	var encode = function(obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }

	  if (typeof obj === 'object') {
	    return Object.keys(obj).map(function(k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (Array.isArray(obj[k])) {
	        return obj[k].map(function(v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);

	  }

	  if (!name) { return ''; }
	  return encodeURIComponent(stringifyPrimitive(name)) + eq +
	         encodeURIComponent(stringifyPrimitive(obj));
	};

	var querystring = createCommonjsModule(function (module, exports) {
	'use strict';

	exports.decode = exports.parse = decode;
	exports.encode = exports.stringify = encode;
	});
	var querystring_1 = querystring.decode;
	var querystring_2 = querystring.parse;
	var querystring_3 = querystring.encode;
	var querystring_4 = querystring.stringify;

	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	

	'use strict';




	var parse = urlParse;
	var resolve = urlResolve;
	var resolveObject = urlResolveObject;
	var format = urlFormat;

	var Url_1 = Url;

	function Url() {
	  this.protocol = null;
	  this.slashes = null;
	  this.auth = null;
	  this.host = null;
	  this.port = null;
	  this.hostname = null;
	  this.hash = null;
	  this.search = null;
	  this.query = null;
	  this.pathname = null;
	  this.path = null;
	  this.href = null;
	}

	

	
	
	var protocolPattern = /^([a-z0-9.+-]+:)/i,
	    portPattern = /:[0-9]*$/,

	    
	    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

	    
	    
	    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

	    
	    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

	    
	    autoEscape = ['\''].concat(unwise),
	    
	    
	    
	    
	    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
	    hostEndingChars = ['/', '?', '#'],
	    hostnameMaxLen = 255,
	    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
	    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
	    
	    unsafeProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    
	    hostlessProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    
	    slashedProtocol = {
	      'http': true,
	      'https': true,
	      'ftp': true,
	      'gopher': true,
	      'file': true,
	      'http:': true,
	      'https:': true,
	      'ftp:': true,
	      'gopher:': true,
	      'file:': true
	    };

	function urlParse(url, parseQueryString, slashesDenoteHost) {
	  if (url && util.isObject(url) && url instanceof Url) { return url; }

	  var u = new Url;
	  u.parse(url, parseQueryString, slashesDenoteHost);
	  return u;
	}

	Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
	  if (!util.isString(url)) {
	    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
	  }

	  
	  
	  
	  var queryIndex = url.indexOf('?'),
	      splitter =
	          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
	      uSplit = url.split(splitter),
	      slashRegex = /\\/g;
	  uSplit[0] = uSplit[0].replace(slashRegex, '/');
	  url = uSplit.join(splitter);

	  var rest = url;

	  
	  
	  rest = rest.trim();

	  if (!slashesDenoteHost && url.split('#').length === 1) {
	    
	    var simplePath = simplePathPattern.exec(rest);
	    if (simplePath) {
	      this.path = rest;
	      this.href = rest;
	      this.pathname = simplePath[1];
	      if (simplePath[2]) {
	        this.search = simplePath[2];
	        if (parseQueryString) {
	          this.query = querystring.parse(this.search.substr(1));
	        } else {
	          this.query = this.search.substr(1);
	        }
	      } else if (parseQueryString) {
	        this.search = '';
	        this.query = {};
	      }
	      return this;
	    }
	  }

	  var proto = protocolPattern.exec(rest);
	  if (proto) {
	    proto = proto[0];
	    var lowerProto = proto.toLowerCase();
	    this.protocol = lowerProto;
	    rest = rest.substr(proto.length);
	  }

	  
	  
	  
	  
	  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
	    var slashes = rest.substr(0, 2) === '
	    if (slashes && !(proto && hostlessProtocol[proto])) {
	      rest = rest.substr(2);
	      this.slashes = true;
	    }
	  }

	  if (!hostlessProtocol[proto] &&
	      (slashes || (proto && !slashedProtocol[proto]))) {

	    
	    
	    
	    
	    
	    
	    
	    
	    
	    
	    

	    
	    

	    
	    var hostEnd = -1;
	    for (var i = 0; i < hostEndingChars.length; i++) {
	      var hec = rest.indexOf(hostEndingChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        { hostEnd = hec; }
	    }

	    
	    
	    var auth, atSign;
	    if (hostEnd === -1) {
	      
	      atSign = rest.lastIndexOf('@');
	    } else {
	      
	      
	      atSign = rest.lastIndexOf('@', hostEnd);
	    }

	    
	    
	    if (atSign !== -1) {
	      auth = rest.slice(0, atSign);
	      rest = rest.slice(atSign + 1);
	      this.auth = decodeURIComponent(auth);
	    }

	    
	    hostEnd = -1;
	    for (var i = 0; i < nonHostChars.length; i++) {
	      var hec = rest.indexOf(nonHostChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        { hostEnd = hec; }
	    }
	    
	    if (hostEnd === -1)
	      { hostEnd = rest.length; }

	    this.host = rest.slice(0, hostEnd);
	    rest = rest.slice(hostEnd);

	    
	    this.parseHost();

	    
	    
	    this.hostname = this.hostname || '';

	    
	    
	    var ipv6Hostname = this.hostname[0] === '[' &&
	        this.hostname[this.hostname.length - 1] === ']';

	    
	    if (!ipv6Hostname) {
	      var hostparts = this.hostname.split(/\./);
	      for (var i = 0, l = hostparts.length; i < l; i++) {
	        var part = hostparts[i];
	        if (!part) { continue; }
	        if (!part.match(hostnamePartPattern)) {
	          var newpart = '';
	          for (var j = 0, k = part.length; j < k; j++) {
	            if (part.charCodeAt(j) > 127) {
	              
	              
	              
	              newpart += 'x';
	            } else {
	              newpart += part[j];
	            }
	          }
	          
	          if (!newpart.match(hostnamePartPattern)) {
	            var validParts = hostparts.slice(0, i);
	            var notHost = hostparts.slice(i + 1);
	            var bit = part.match(hostnamePartStart);
	            if (bit) {
	              validParts.push(bit[1]);
	              notHost.unshift(bit[2]);
	            }
	            if (notHost.length) {
	              rest = '/' + notHost.join('.') + rest;
	            }
	            this.hostname = validParts.join('.');
	            break;
	          }
	        }
	      }
	    }

	    if (this.hostname.length > hostnameMaxLen) {
	      this.hostname = '';
	    } else {
	      
	      this.hostname = this.hostname.toLowerCase();
	    }

	    if (!ipv6Hostname) {
	      
	      
	      
	      
	      this.hostname = punycode.toASCII(this.hostname);
	    }

	    var p = this.port ? ':' + this.port : '';
	    var h = this.hostname || '';
	    this.host = h + p;
	    this.href += this.host;

	    
	    
	    if (ipv6Hostname) {
	      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
	      if (rest[0] !== '/') {
	        rest = '/' + rest;
	      }
	    }
	  }

	  
	  
	  if (!unsafeProtocol[lowerProto]) {

	    
	    
	    
	    for (var i = 0, l = autoEscape.length; i < l; i++) {
	      var ae = autoEscape[i];
	      if (rest.indexOf(ae) === -1)
	        { continue; }
	      var esc = encodeURIComponent(ae);
	      if (esc === ae) {
	        esc = escape(ae);
	      }
	      rest = rest.split(ae).join(esc);
	    }
	  }


	  
	  var hash = rest.indexOf('#');
	  if (hash !== -1) {
	    
	    this.hash = rest.substr(hash);
	    rest = rest.slice(0, hash);
	  }
	  var qm = rest.indexOf('?');
	  if (qm !== -1) {
	    this.search = rest.substr(qm);
	    this.query = rest.substr(qm + 1);
	    if (parseQueryString) {
	      this.query = querystring.parse(this.query);
	    }
	    rest = rest.slice(0, qm);
	  } else if (parseQueryString) {
	    
	    this.search = '';
	    this.query = {};
	  }
	  if (rest) { this.pathname = rest; }
	  if (slashedProtocol[lowerProto] &&
	      this.hostname && !this.pathname) {
	    this.pathname = '/';
	  }

	  
	  if (this.pathname || this.search) {
	    var p = this.pathname || '';
	    var s = this.search || '';
	    this.path = p + s;
	  }

	  
	  this.href = this.format();
	  return this;
	};

	
	function urlFormat(obj) {
	  
	  
	  
	  
	  if (util.isString(obj)) { obj = urlParse(obj); }
	  if (!(obj instanceof Url)) { return Url.prototype.format.call(obj); }
	  return obj.format();
	}

	Url.prototype.format = function() {
	  var auth = this.auth || '';
	  if (auth) {
	    auth = encodeURIComponent(auth);
	    auth = auth.replace(/%3A/i, ':');
	    auth += '@';
	  }

	  var protocol = this.protocol || '',
	      pathname = this.pathname || '',
	      hash = this.hash || '',
	      host = false,
	      query = '';

	  if (this.host) {
	    host = auth + this.host;
	  } else if (this.hostname) {
	    host = auth + (this.hostname.indexOf(':') === -1 ?
	        this.hostname :
	        '[' + this.hostname + ']');
	    if (this.port) {
	      host += ':' + this.port;
	    }
	  }

	  if (this.query &&
	      util.isObject(this.query) &&
	      Object.keys(this.query).length) {
	    query = querystring.stringify(this.query);
	  }

	  var search = this.search || (query && ('?' + query)) || '';

	  if (protocol && protocol.substr(-1) !== ':') { protocol += ':'; }

	  
	  
	  if (this.slashes ||
	      (!protocol || slashedProtocol[protocol]) && host !== false) {
	    host = '
	    if (pathname && pathname.charAt(0) !== '/') { pathname = '/' + pathname; }
	  } else if (!host) {
	    host = '';
	  }

	  if (hash && hash.charAt(0) !== '#') { hash = '#' + hash; }
	  if (search && search.charAt(0) !== '?') { search = '?' + search; }

	  pathname = pathname.replace(/[?#]/g, function(match) {
	    return encodeURIComponent(match);
	  });
	  search = search.replace('#', '%23');

	  return protocol + host + pathname + search + hash;
	};

	function urlResolve(source, relative) {
	  return urlParse(source, false, true).resolve(relative);
	}

	Url.prototype.resolve = function(relative) {
	  return this.resolveObject(urlParse(relative, false, true)).format();
	};

	function urlResolveObject(source, relative) {
	  if (!source) { return relative; }
	  return urlParse(source, false, true).resolveObject(relative);
	}

	Url.prototype.resolveObject = function(relative) {
	  if (util.isString(relative)) {
	    var rel = new Url();
	    rel.parse(relative, false, true);
	    relative = rel;
	  }

	  var result = new Url();
	  var tkeys = Object.keys(this);
	  for (var tk = 0; tk < tkeys.length; tk++) {
	    var tkey = tkeys[tk];
	    result[tkey] = this[tkey];
	  }

	  
	  
	  result.hash = relative.hash;

	  
	  if (relative.href === '') {
	    result.href = result.format();
	    return result;
	  }

	  
	  if (relative.slashes && !relative.protocol) {
	    
	    var rkeys = Object.keys(relative);
	    for (var rk = 0; rk < rkeys.length; rk++) {
	      var rkey = rkeys[rk];
	      if (rkey !== 'protocol')
	        { result[rkey] = relative[rkey]; }
	    }

	    
	    if (slashedProtocol[result.protocol] &&
	        result.hostname && !result.pathname) {
	      result.path = result.pathname = '/';
	    }

	    result.href = result.format();
	    return result;
	  }

	  if (relative.protocol && relative.protocol !== result.protocol) {
	    
	    
	    
	    
	    
	    
	    
	    
	    if (!slashedProtocol[relative.protocol]) {
	      var keys = Object.keys(relative);
	      for (var v = 0; v < keys.length; v++) {
	        var k = keys[v];
	        result[k] = relative[k];
	      }
	      result.href = result.format();
	      return result;
	    }

	    result.protocol = relative.protocol;
	    if (!relative.host && !hostlessProtocol[relative.protocol]) {
	      var relPath = (relative.pathname || '').split('/');
	      while (relPath.length && !(relative.host = relPath.shift())){ ; }
	      if (!relative.host) { relative.host = ''; }
	      if (!relative.hostname) { relative.hostname = ''; }
	      if (relPath[0] !== '') { relPath.unshift(''); }
	      if (relPath.length < 2) { relPath.unshift(''); }
	      result.pathname = relPath.join('/');
	    } else {
	      result.pathname = relative.pathname;
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    result.host = relative.host || '';
	    result.auth = relative.auth;
	    result.hostname = relative.hostname || relative.host;
	    result.port = relative.port;
	    
	    if (result.pathname || result.search) {
	      var p = result.pathname || '';
	      var s = result.search || '';
	      result.path = p + s;
	    }
	    result.slashes = result.slashes || relative.slashes;
	    result.href = result.format();
	    return result;
	  }

	  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
	      isRelAbs = (
	          relative.host ||
	          relative.pathname && relative.pathname.charAt(0) === '/'
	      ),
	      mustEndAbs = (isRelAbs || isSourceAbs ||
	                    (result.host && relative.pathname)),
	      removeAllDots = mustEndAbs,
	      srcPath = result.pathname && result.pathname.split('/') || [],
	      relPath = relative.pathname && relative.pathname.split('/') || [],
	      psychotic = result.protocol && !slashedProtocol[result.protocol];

	  
	  
	  
	  
	  
	  if (psychotic) {
	    result.hostname = '';
	    result.port = null;
	    if (result.host) {
	      if (srcPath[0] === '') { srcPath[0] = result.host; }
	      else { srcPath.unshift(result.host); }
	    }
	    result.host = '';
	    if (relative.protocol) {
	      relative.hostname = null;
	      relative.port = null;
	      if (relative.host) {
	        if (relPath[0] === '') { relPath[0] = relative.host; }
	        else { relPath.unshift(relative.host); }
	      }
	      relative.host = null;
	    }
	    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
	  }

	  if (isRelAbs) {
	    
	    result.host = (relative.host || relative.host === '') ?
	                  relative.host : result.host;
	    result.hostname = (relative.hostname || relative.hostname === '') ?
	                      relative.hostname : result.hostname;
	    result.search = relative.search;
	    result.query = relative.query;
	    srcPath = relPath;
	    
	  } else if (relPath.length) {
	    
	    
	    if (!srcPath) { srcPath = []; }
	    srcPath.pop();
	    srcPath = srcPath.concat(relPath);
	    result.search = relative.search;
	    result.query = relative.query;
	  } else if (!util.isNullOrUndefined(relative.search)) {
	    
	    
	    
	    if (psychotic) {
	      result.hostname = result.host = srcPath.shift();
	      
	      
	      
	      var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                       result.host.split('@') : false;
	      if (authInHost) {
	        result.auth = authInHost.shift();
	        result.host = result.hostname = authInHost.shift();
	      }
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    
	    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
	      result.path = (result.pathname ? result.pathname : '') +
	                    (result.search ? result.search : '');
	    }
	    result.href = result.format();
	    return result;
	  }

	  if (!srcPath.length) {
	    
	    
	    result.pathname = null;
	    
	    if (result.search) {
	      result.path = '/' + result.search;
	    } else {
	      result.path = null;
	    }
	    result.href = result.format();
	    return result;
	  }

	  
	  
	  
	  var last = srcPath.slice(-1)[0];
	  var hasTrailingSlash = (
	      (result.host || relative.host || srcPath.length > 1) &&
	      (last === '.' || last === '..') || last === '');

	  
	  
	  var up = 0;
	  for (var i = srcPath.length; i >= 0; i--) {
	    last = srcPath[i];
	    if (last === '.') {
	      srcPath.splice(i, 1);
	    } else if (last === '..') {
	      srcPath.splice(i, 1);
	      up++;
	    } else if (up) {
	      srcPath.splice(i, 1);
	      up--;
	    }
	  }

	  
	  if (!mustEndAbs && !removeAllDots) {
	    for (; up--; up) {
	      srcPath.unshift('..');
	    }
	  }

	  if (mustEndAbs && srcPath[0] !== '' &&
	      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
	    srcPath.unshift('');
	  }

	  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
	    srcPath.push('');
	  }

	  var isAbsolute = srcPath[0] === '' ||
	      (srcPath[0] && srcPath[0].charAt(0) === '/');

	  
	  if (psychotic) {
	    result.hostname = result.host = isAbsolute ? '' :
	                                    srcPath.length ? srcPath.shift() : '';
	    
	    
	    
	    var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                     result.host.split('@') : false;
	    if (authInHost) {
	      result.auth = authInHost.shift();
	      result.host = result.hostname = authInHost.shift();
	    }
	  }

	  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

	  if (mustEndAbs && !isAbsolute) {
	    srcPath.unshift('');
	  }

	  if (!srcPath.length) {
	    result.pathname = null;
	    result.path = null;
	  } else {
	    result.pathname = srcPath.join('/');
	  }

	  
	  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
	    result.path = (result.pathname ? result.pathname : '') +
	                  (result.search ? result.search : '');
	  }
	  result.auth = relative.auth || result.auth;
	  result.slashes = result.slashes || relative.slashes;
	  result.href = result.format();
	  return result;
	};

	Url.prototype.parseHost = function() {
	  var host = this.host;
	  var port = portPattern.exec(host);
	  if (port) {
	    port = port[0];
	    if (port !== ':') {
	      this.port = port.substr(1);
	    }
	    host = host.substr(0, host.length - port.length);
	  }
	  if (host) { this.hostname = host; }
	};

	var url = {
		parse: parse,
		resolve: resolve,
		resolveObject: resolveObject,
		format: format,
		Url: Url_1
	};

	
	

	(function (ENV) {
	    ENV[ENV["WEBGL_LEGACY"] = 0] = "WEBGL_LEGACY";
	    ENV[ENV["WEBGL"] = 1] = "WEBGL";
	    ENV[ENV["WEBGL2"] = 2] = "WEBGL2";
	})(exports.ENV || (exports.ENV = {}));
	

	(function (RENDERER_TYPE) {
	    RENDERER_TYPE[RENDERER_TYPE["UNKNOWN"] = 0] = "UNKNOWN";
	    RENDERER_TYPE[RENDERER_TYPE["WEBGL"] = 1] = "WEBGL";
	    RENDERER_TYPE[RENDERER_TYPE["CANVAS"] = 2] = "CANVAS";
	})(exports.RENDERER_TYPE || (exports.RENDERER_TYPE = {}));
	

	(function (BUFFER_BITS) {
	    BUFFER_BITS[BUFFER_BITS["COLOR"] = 16384] = "COLOR";
	    BUFFER_BITS[BUFFER_BITS["DEPTH"] = 256] = "DEPTH";
	    BUFFER_BITS[BUFFER_BITS["STENCIL"] = 1024] = "STENCIL";
	})(exports.BUFFER_BITS || (exports.BUFFER_BITS = {}));
	

	(function (BLEND_MODES) {
	    BLEND_MODES[BLEND_MODES["NORMAL"] = 0] = "NORMAL";
	    BLEND_MODES[BLEND_MODES["ADD"] = 1] = "ADD";
	    BLEND_MODES[BLEND_MODES["MULTIPLY"] = 2] = "MULTIPLY";
	    BLEND_MODES[BLEND_MODES["SCREEN"] = 3] = "SCREEN";
	    BLEND_MODES[BLEND_MODES["OVERLAY"] = 4] = "OVERLAY";
	    BLEND_MODES[BLEND_MODES["DARKEN"] = 5] = "DARKEN";
	    BLEND_MODES[BLEND_MODES["LIGHTEN"] = 6] = "LIGHTEN";
	    BLEND_MODES[BLEND_MODES["COLOR_DODGE"] = 7] = "COLOR_DODGE";
	    BLEND_MODES[BLEND_MODES["COLOR_BURN"] = 8] = "COLOR_BURN";
	    BLEND_MODES[BLEND_MODES["HARD_LIGHT"] = 9] = "HARD_LIGHT";
	    BLEND_MODES[BLEND_MODES["SOFT_LIGHT"] = 10] = "SOFT_LIGHT";
	    BLEND_MODES[BLEND_MODES["DIFFERENCE"] = 11] = "DIFFERENCE";
	    BLEND_MODES[BLEND_MODES["EXCLUSION"] = 12] = "EXCLUSION";
	    BLEND_MODES[BLEND_MODES["HUE"] = 13] = "HUE";
	    BLEND_MODES[BLEND_MODES["SATURATION"] = 14] = "SATURATION";
	    BLEND_MODES[BLEND_MODES["COLOR"] = 15] = "COLOR";
	    BLEND_MODES[BLEND_MODES["LUMINOSITY"] = 16] = "LUMINOSITY";
	    BLEND_MODES[BLEND_MODES["NORMAL_NPM"] = 17] = "NORMAL_NPM";
	    BLEND_MODES[BLEND_MODES["ADD_NPM"] = 18] = "ADD_NPM";
	    BLEND_MODES[BLEND_MODES["SCREEN_NPM"] = 19] = "SCREEN_NPM";
	    BLEND_MODES[BLEND_MODES["NONE"] = 20] = "NONE";
	    BLEND_MODES[BLEND_MODES["SRC_OVER"] = 0] = "SRC_OVER";
	    BLEND_MODES[BLEND_MODES["SRC_IN"] = 21] = "SRC_IN";
	    BLEND_MODES[BLEND_MODES["SRC_OUT"] = 22] = "SRC_OUT";
	    BLEND_MODES[BLEND_MODES["SRC_ATOP"] = 23] = "SRC_ATOP";
	    BLEND_MODES[BLEND_MODES["DST_OVER"] = 24] = "DST_OVER";
	    BLEND_MODES[BLEND_MODES["DST_IN"] = 25] = "DST_IN";
	    BLEND_MODES[BLEND_MODES["DST_OUT"] = 26] = "DST_OUT";
	    BLEND_MODES[BLEND_MODES["DST_ATOP"] = 27] = "DST_ATOP";
	    BLEND_MODES[BLEND_MODES["ERASE"] = 26] = "ERASE";
	    BLEND_MODES[BLEND_MODES["SUBTRACT"] = 28] = "SUBTRACT";
	    BLEND_MODES[BLEND_MODES["XOR"] = 29] = "XOR";
	})(exports.BLEND_MODES || (exports.BLEND_MODES = {}));
	

	(function (DRAW_MODES) {
	    DRAW_MODES[DRAW_MODES["POINTS"] = 0] = "POINTS";
	    DRAW_MODES[DRAW_MODES["LINES"] = 1] = "LINES";
	    DRAW_MODES[DRAW_MODES["LINE_LOOP"] = 2] = "LINE_LOOP";
	    DRAW_MODES[DRAW_MODES["LINE_STRIP"] = 3] = "LINE_STRIP";
	    DRAW_MODES[DRAW_MODES["TRIANGLES"] = 4] = "TRIANGLES";
	    DRAW_MODES[DRAW_MODES["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
	    DRAW_MODES[DRAW_MODES["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
	})(exports.DRAW_MODES || (exports.DRAW_MODES = {}));
	

	(function (FORMATS) {
	    FORMATS[FORMATS["RGBA"] = 6408] = "RGBA";
	    FORMATS[FORMATS["RGB"] = 6407] = "RGB";
	    FORMATS[FORMATS["ALPHA"] = 6406] = "ALPHA";
	    FORMATS[FORMATS["LUMINANCE"] = 6409] = "LUMINANCE";
	    FORMATS[FORMATS["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
	    FORMATS[FORMATS["DEPTH_COMPONENT"] = 6402] = "DEPTH_COMPONENT";
	    FORMATS[FORMATS["DEPTH_STENCIL"] = 34041] = "DEPTH_STENCIL";
	})(exports.FORMATS || (exports.FORMATS = {}));
	

	(function (TARGETS) {
	    TARGETS[TARGETS["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP"] = 34067] = "TEXTURE_CUBE_MAP";
	    TARGETS[TARGETS["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_X"] = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_X"] = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Y"] = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Z"] = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z";
	})(exports.TARGETS || (exports.TARGETS = {}));
	

	(function (TYPES) {
	    TYPES[TYPES["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
	    TYPES[TYPES["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
	    TYPES[TYPES["UNSIGNED_SHORT_5_6_5"] = 33635] = "UNSIGNED_SHORT_5_6_5";
	    TYPES[TYPES["UNSIGNED_SHORT_4_4_4_4"] = 32819] = "UNSIGNED_SHORT_4_4_4_4";
	    TYPES[TYPES["UNSIGNED_SHORT_5_5_5_1"] = 32820] = "UNSIGNED_SHORT_5_5_5_1";
	    TYPES[TYPES["FLOAT"] = 5126] = "FLOAT";
	    TYPES[TYPES["HALF_FLOAT"] = 36193] = "HALF_FLOAT";
	})(exports.TYPES || (exports.TYPES = {}));
	

	(function (SCALE_MODES) {
	    SCALE_MODES[SCALE_MODES["NEAREST"] = 0] = "NEAREST";
	    SCALE_MODES[SCALE_MODES["LINEAR"] = 1] = "LINEAR";
	})(exports.SCALE_MODES || (exports.SCALE_MODES = {}));
	

	(function (WRAP_MODES) {
	    WRAP_MODES[WRAP_MODES["CLAMP"] = 33071] = "CLAMP";
	    WRAP_MODES[WRAP_MODES["REPEAT"] = 10497] = "REPEAT";
	    WRAP_MODES[WRAP_MODES["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
	})(exports.WRAP_MODES || (exports.WRAP_MODES = {}));
	

	(function (MIPMAP_MODES) {
	    MIPMAP_MODES[MIPMAP_MODES["OFF"] = 0] = "OFF";
	    MIPMAP_MODES[MIPMAP_MODES["POW2"] = 1] = "POW2";
	    MIPMAP_MODES[MIPMAP_MODES["ON"] = 2] = "ON";
	})(exports.MIPMAP_MODES || (exports.MIPMAP_MODES = {}));
	

	(function (ALPHA_MODES) {
	    ALPHA_MODES[ALPHA_MODES["NPM"] = 0] = "NPM";
	    ALPHA_MODES[ALPHA_MODES["UNPACK"] = 1] = "UNPACK";
	    ALPHA_MODES[ALPHA_MODES["PMA"] = 2] = "PMA";
	    ALPHA_MODES[ALPHA_MODES["NO_PREMULTIPLIED_ALPHA"] = 0] = "NO_PREMULTIPLIED_ALPHA";
	    ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ON_UPLOAD"] = 1] = "PREMULTIPLY_ON_UPLOAD";
	    ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ALPHA"] = 2] = "PREMULTIPLY_ALPHA";
	})(exports.ALPHA_MODES || (exports.ALPHA_MODES = {}));
	

	(function (CLEAR_MODES) {
	    CLEAR_MODES[CLEAR_MODES["NO"] = 0] = "NO";
	    CLEAR_MODES[CLEAR_MODES["YES"] = 1] = "YES";
	    CLEAR_MODES[CLEAR_MODES["AUTO"] = 2] = "AUTO";
	    CLEAR_MODES[CLEAR_MODES["BLEND"] = 0] = "BLEND";
	    CLEAR_MODES[CLEAR_MODES["CLEAR"] = 1] = "CLEAR";
	    CLEAR_MODES[CLEAR_MODES["BLIT"] = 2] = "BLIT";
	})(exports.CLEAR_MODES || (exports.CLEAR_MODES = {}));
	

	(function (GC_MODES) {
	    GC_MODES[GC_MODES["AUTO"] = 0] = "AUTO";
	    GC_MODES[GC_MODES["MANUAL"] = 1] = "MANUAL";
	})(exports.GC_MODES || (exports.GC_MODES = {}));
	

	(function (PRECISION) {
	    PRECISION["LOW"] = "lowp";
	    PRECISION["MEDIUM"] = "mediump";
	    PRECISION["HIGH"] = "highp";
	})(exports.PRECISION || (exports.PRECISION = {}));
	

	(function (MASK_TYPES) {
	    MASK_TYPES[MASK_TYPES["NONE"] = 0] = "NONE";
	    MASK_TYPES[MASK_TYPES["SCISSOR"] = 1] = "SCISSOR";
	    MASK_TYPES[MASK_TYPES["STENCIL"] = 2] = "STENCIL";
	    MASK_TYPES[MASK_TYPES["SPRITE"] = 3] = "SPRITE";
	})(exports.MASK_TYPES || (exports.MASK_TYPES = {}));
	

	(function (MSAA_QUALITY) {
	    MSAA_QUALITY[MSAA_QUALITY["NONE"] = 0] = "NONE";
	    MSAA_QUALITY[MSAA_QUALITY["LOW"] = 2] = "LOW";
	    MSAA_QUALITY[MSAA_QUALITY["MEDIUM"] = 4] = "MEDIUM";
	    MSAA_QUALITY[MSAA_QUALITY["HIGH"] = 8] = "HIGH";
	})(exports.MSAA_QUALITY || (exports.MSAA_QUALITY = {}));

	

	
	settings.RETINA_PREFIX = /@([0-9\.]+)x/;
	
	settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = true;

	var saidHello = false;
	var VERSION = '5.3.12';
	
	function skipHello() {
	    saidHello = true;
	}
	
	function sayHello(type) {
	    var _a;
	    if (saidHello) {
	        return;
	    }
	    if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
	        var args = [
	            "\n %c %c %c PixiJS " + VERSION + " - \u2730 " + type + " \u2730  %c  %c  http:
	            'background: #ff66a5; padding:5px 0;',
	            'background: #ff66a5; padding:5px 0;',
	            'color: #ff66a5; background: #030307; padding:5px 0;',
	            'background: #ff66a5; padding:5px 0;',
	            'background: #ffc3dc; padding:5px 0;',
	            'background: #ff66a5; padding:5px 0;',
	            'color: #ff2424; background: #fff; padding:5px 0;',
	            'color: #ff2424; background: #fff; padding:5px 0;',
	            'color: #ff2424; background: #fff; padding:5px 0;' ];
	        (_a = window.console).log.apply(_a, args);
	    }
	    else if (window.console) {
	        window.console.log("PixiJS " + VERSION + " - " + type + " - http:
	    }
	    saidHello = true;
	}

	var supported;
	
	function isWebGLSupported() {
	    if (typeof supported === 'undefined') {
	        supported = (function supported() {
	            var contextOptions = {
	                stencil: true,
	                failIfMajorPerformanceCaveat: settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT,
	            };
	            try {
	                if (!window.WebGLRenderingContext) {
	                    return false;
	                }
	                var canvas = document.createElement('canvas');
	                var gl = (canvas.getContext('webgl', contextOptions)
	                    || canvas.getContext('experimental-webgl', contextOptions));
	                var success = !!(gl && gl.getContextAttributes().stencil);
	                if (gl) {
	                    var loseContext = gl.getExtension('WEBGL_lose_context');
	                    if (loseContext) {
	                        loseContext.loseContext();
	                    }
	                }
	                gl = null;
	                return success;
	            }
	            catch (e) {
	                return false;
	            }
	        })();
	    }
	    return supported;
	}

	
	function hex2rgb(hex, out) {
	    if (out === void 0) { out = []; }
	    out[0] = ((hex >> 16) & 0xFF) / 255;
	    out[1] = ((hex >> 8) & 0xFF) / 255;
	    out[2] = (hex & 0xFF) / 255;
	    return out;
	}
	
	function hex2string(hex) {
	    var hexString = hex.toString(16);
	    hexString = '000000'.substr(0, 6 - hexString.length) + hexString;
	    return "#" + hexString;
	}
	
	function string2hex(string) {
	    if (typeof string === 'string' && string[0] === '#') {
	        string = string.substr(1);
	    }
	    return parseInt(string, 16);
	}
	
	function rgb2hex(rgb) {
	    return (((rgb[0] * 255) << 16) + ((rgb[1] * 255) << 8) + (rgb[2] * 255 | 0));
	}

	
	function mapPremultipliedBlendModes() {
	    var pm = [];
	    var npm = [];
	    for (var i = 0; i < 32; i++) {
	        pm[i] = i;
	        npm[i] = i;
	    }
	    pm[exports.BLEND_MODES.NORMAL_NPM] = exports.BLEND_MODES.NORMAL;
	    pm[exports.BLEND_MODES.ADD_NPM] = exports.BLEND_MODES.ADD;
	    pm[exports.BLEND_MODES.SCREEN_NPM] = exports.BLEND_MODES.SCREEN;
	    npm[exports.BLEND_MODES.NORMAL] = exports.BLEND_MODES.NORMAL_NPM;
	    npm[exports.BLEND_MODES.ADD] = exports.BLEND_MODES.ADD_NPM;
	    npm[exports.BLEND_MODES.SCREEN] = exports.BLEND_MODES.SCREEN_NPM;
	    var array = [];
	    array.push(npm);
	    array.push(pm);
	    return array;
	}
	
	var premultiplyBlendMode = mapPremultipliedBlendModes();
	
	function correctBlendMode(blendMode, premultiplied) {
	    return premultiplyBlendMode[premultiplied ? 1 : 0][blendMode];
	}
	
	function premultiplyRgba(rgb, alpha, out, premultiply) {
	    out = out || new Float32Array(4);
	    if (premultiply || premultiply === undefined) {
	        out[0] = rgb[0] * alpha;
	        out[1] = rgb[1] * alpha;
	        out[2] = rgb[2] * alpha;
	    }
	    else {
	        out[0] = rgb[0];
	        out[1] = rgb[1];
	        out[2] = rgb[2];
	    }
	    out[3] = alpha;
	    return out;
	}
	
	function premultiplyTint(tint, alpha) {
	    if (alpha === 1.0) {
	        return (alpha * 255 << 24) + tint;
	    }
	    if (alpha === 0.0) {
	        return 0;
	    }
	    var R = ((tint >> 16) & 0xFF);
	    var G = ((tint >> 8) & 0xFF);
	    var B = (tint & 0xFF);
	    R = ((R * alpha) + 0.5) | 0;
	    G = ((G * alpha) + 0.5) | 0;
	    B = ((B * alpha) + 0.5) | 0;
	    return (alpha * 255 << 24) + (R << 16) + (G << 8) + B;
	}
	
	function premultiplyTintToRgba(tint, alpha, out, premultiply) {
	    out = out || new Float32Array(4);
	    out[0] = ((tint >> 16) & 0xFF) / 255.0;
	    out[1] = ((tint >> 8) & 0xFF) / 255.0;
	    out[2] = (tint & 0xFF) / 255.0;
	    if (premultiply || premultiply === undefined) {
	        out[0] *= alpha;
	        out[1] *= alpha;
	        out[2] *= alpha;
	    }
	    out[3] = alpha;
	    return out;
	}

	
	function createIndicesForQuads(size, outBuffer) {
	    if (outBuffer === void 0) { outBuffer = null; }
	    
	    var totalIndices = size * 6;
	    outBuffer = outBuffer || new Uint16Array(totalIndices);
	    if (outBuffer.length !== totalIndices) {
	        throw new Error("Out buffer length is incorrect, got " + outBuffer.length + " and expected " + totalIndices);
	    }
	    
	    for (var i = 0, j = 0; i < totalIndices; i += 6, j += 4) {
	        outBuffer[i + 0] = j + 0;
	        outBuffer[i + 1] = j + 1;
	        outBuffer[i + 2] = j + 2;
	        outBuffer[i + 3] = j + 0;
	        outBuffer[i + 4] = j + 2;
	        outBuffer[i + 5] = j + 3;
	    }
	    return outBuffer;
	}

	function getBufferType(array) {
	    if (array.BYTES_PER_ELEMENT === 4) {
	        if (array instanceof Float32Array) {
	            return 'Float32Array';
	        }
	        else if (array instanceof Uint32Array) {
	            return 'Uint32Array';
	        }
	        return 'Int32Array';
	    }
	    else if (array.BYTES_PER_ELEMENT === 2) {
	        if (array instanceof Uint16Array) {
	            return 'Uint16Array';
	        }
	    }
	    else if (array.BYTES_PER_ELEMENT === 1) {
	        if (array instanceof Uint8Array) {
	            return 'Uint8Array';
	        }
	    }
	    
	    return null;
	}

	
	var map = { Float32Array: Float32Array, Uint32Array: Uint32Array, Int32Array: Int32Array, Uint8Array: Uint8Array };
	function interleaveTypedArrays(arrays, sizes) {
	    var outSize = 0;
	    var stride = 0;
	    var views = {};
	    for (var i = 0; i < arrays.length; i++) {
	        stride += sizes[i];
	        outSize += arrays[i].length;
	    }
	    var buffer = new ArrayBuffer(outSize * 4);
	    var out = null;
	    var littleOffset = 0;
	    for (var i = 0; i < arrays.length; i++) {
	        var size = sizes[i];
	        var array = arrays[i];
	        
	        var type = getBufferType(array);
	        if (!views[type]) {
	            views[type] = new map[type](buffer);
	        }
	        out = views[type];
	        for (var j = 0; j < array.length; j++) {
	            var indexStart = ((j / size | 0) * stride) + littleOffset;
	            var index = j % size;
	            out[indexStart + index] = array[j];
	        }
	        littleOffset += size;
	    }
	    return new Float32Array(buffer);
	}

	
	
	function nextPow2(v) {
	    v += v === 0 ? 1 : 0;
	    --v;
	    v |= v >>> 1;
	    v |= v >>> 2;
	    v |= v >>> 4;
	    v |= v >>> 8;
	    v |= v >>> 16;
	    return v + 1;
	}
	
	function isPow2(v) {
	    return !(v & (v - 1)) && (!!v);
	}
	
	function log2(v) {
	    var r = (v > 0xFFFF ? 1 : 0) << 4;
	    v >>>= r;
	    var shift = (v > 0xFF ? 1 : 0) << 3;
	    v >>>= shift;
	    r |= shift;
	    shift = (v > 0xF ? 1 : 0) << 2;
	    v >>>= shift;
	    r |= shift;
	    shift = (v > 0x3 ? 1 : 0) << 1;
	    v >>>= shift;
	    r |= shift;
	    return r | (v >> 1);
	}

	
	function removeItems(arr, startIdx, removeCount) {
	    var length = arr.length;
	    var i;
	    if (startIdx >= length || removeCount === 0) {
	        return;
	    }
	    removeCount = (startIdx + removeCount > length ? length - startIdx : removeCount);
	    var len = length - removeCount;
	    for (i = startIdx; i < len; ++i) {
	        arr[i] = arr[i + removeCount];
	    }
	    arr.length = len;
	}

	
	function sign$1(n) {
	    if (n === 0)
	        { return 0; }
	    return n < 0 ? -1 : 1;
	}

	var nextUid = 0;
	
	function uid() {
	    return ++nextUid;
	}

	
	var warnings = {};
	
	function deprecation(version, message, ignoreDepth) {
	    if (ignoreDepth === void 0) { ignoreDepth = 3; }
	    
	    if (warnings[message]) {
	        return;
	    }
	    
	    var stack = new Error().stack;
	    
	    if (typeof stack === 'undefined') {
	        console.warn('PixiJS Deprecation Warning: ', message + "\nDeprecated since v" + version);
	    }
	    else {
	        
	        stack = stack.split('\n').splice(ignoreDepth).join('\n');
	        if (console.groupCollapsed) {
	            console.groupCollapsed('%cPixiJS Deprecation Warning: %c%s', 'color:#614108;background:#fffbe6', 'font-weight:normal;color:#614108;background:#fffbe6', message + "\nDeprecated since v" + version);
	            console.warn(stack);
	            console.groupEnd();
	        }
	        else {
	            console.warn('PixiJS Deprecation Warning: ', message + "\nDeprecated since v" + version);
	            console.warn(stack);
	        }
	    }
	    
	    warnings[message] = true;
	}

	
	var ProgramCache = {};
	
	var TextureCache = Object.create(null);
	
	var BaseTextureCache = Object.create(null);
	
	function destroyTextureCache() {
	    var key;
	    for (key in TextureCache) {
	        TextureCache[key].destroy();
	    }
	    for (key in BaseTextureCache) {
	        BaseTextureCache[key].destroy();
	    }
	}
	
	function clearTextureCache() {
	    var key;
	    for (key in TextureCache) {
	        delete TextureCache[key];
	    }
	    for (key in BaseTextureCache) {
	        delete BaseTextureCache[key];
	    }
	}

	
	var CanvasRenderTarget =  (function () {
	    
	    function CanvasRenderTarget(width, height, resolution) {
	        
	        this.canvas = document.createElement('canvas');
	        
	        this.context = this.canvas.getContext('2d');
	        this.resolution = resolution || settings.RESOLUTION;
	        this.resize(width, height);
	    }
	    
	    CanvasRenderTarget.prototype.clear = function () {
	        this.context.setTransform(1, 0, 0, 1, 0, 0);
	        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	    };
	    
	    CanvasRenderTarget.prototype.resize = function (width, height) {
	        this.canvas.width = width * this.resolution;
	        this.canvas.height = height * this.resolution;
	    };
	    
	    CanvasRenderTarget.prototype.destroy = function () {
	        this.context = null;
	        this.canvas = null;
	    };
	    Object.defineProperty(CanvasRenderTarget.prototype, "width", {
	        
	        get: function () {
	            return this.canvas.width;
	        },
	        set: function (val) {
	            this.canvas.width = val;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(CanvasRenderTarget.prototype, "height", {
	        
	        get: function () {
	            return this.canvas.height;
	        },
	        set: function (val) {
	            this.canvas.height = val;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return CanvasRenderTarget;
	}());

	
	function trimCanvas(canvas) {
	    
	    var width = canvas.width;
	    var height = canvas.height;
	    var context = canvas.getContext('2d');
	    var imageData = context.getImageData(0, 0, width, height);
	    var pixels = imageData.data;
	    var len = pixels.length;
	    var bound = {
	        top: null,
	        left: null,
	        right: null,
	        bottom: null,
	    };
	    var data = null;
	    var i;
	    var x;
	    var y;
	    for (i = 0; i < len; i += 4) {
	        if (pixels[i + 3] !== 0) {
	            x = (i / 4) % width;
	            y = ~~((i / 4) / width);
	            if (bound.top === null) {
	                bound.top = y;
	            }
	            if (bound.left === null) {
	                bound.left = x;
	            }
	            else if (x < bound.left) {
	                bound.left = x;
	            }
	            if (bound.right === null) {
	                bound.right = x + 1;
	            }
	            else if (bound.right < x) {
	                bound.right = x + 1;
	            }
	            if (bound.bottom === null) {
	                bound.bottom = y;
	            }
	            else if (bound.bottom < y) {
	                bound.bottom = y;
	            }
	        }
	    }
	    if (bound.top !== null) {
	        width = bound.right - bound.left;
	        height = bound.bottom - bound.top + 1;
	        data = context.getImageData(bound.left, bound.top, width, height);
	    }
	    return {
	        height: height,
	        width: width,
	        data: data,
	    };
	}

	
	var DATA_URI = /^\s*data:(?:([\w-]+)\/([\w+.-]+))?(?:;charset=([\w-]+))?(?:;(base64))?,(.*)/i;

	
	
	
	
	
	
	
	function decomposeDataUri(dataUri) {
	    var dataUriMatch = DATA_URI.exec(dataUri);
	    if (dataUriMatch) {
	        return {
	            mediaType: dataUriMatch[1] ? dataUriMatch[1].toLowerCase() : undefined,
	            subType: dataUriMatch[2] ? dataUriMatch[2].toLowerCase() : undefined,
	            charset: dataUriMatch[3] ? dataUriMatch[3].toLowerCase() : undefined,
	            encoding: dataUriMatch[4] ? dataUriMatch[4].toLowerCase() : undefined,
	            data: dataUriMatch[5],
	        };
	    }
	    return undefined;
	}

	var tempAnchor;
	
	function determineCrossOrigin(url, loc) {
	    if (loc === void 0) { loc = window.location; }
	    
	    if (url.indexOf('data:') === 0) {
	        return '';
	    }
	    
	    loc = loc || window.location;
	    if (!tempAnchor) {
	        tempAnchor = document.createElement('a');
	    }
	    
	    
	    
	    tempAnchor.href = url;
	    var parsedUrl = parse(tempAnchor.href);
	    var samePort = (!parsedUrl.port && loc.port === '') || (parsedUrl.port === loc.port);
	    
	    if (parsedUrl.hostname !== loc.hostname || !samePort || parsedUrl.protocol !== loc.protocol) {
	        return 'anonymous';
	    }
	    return '';
	}

	
	function getResolutionOfUrl(url, defaultValue) {
	    var resolution = settings.RETINA_PREFIX.exec(url);
	    if (resolution) {
	        return parseFloat(resolution[1]);
	    }
	    return defaultValue !== undefined ? defaultValue : 1;
	}

	var utils_es = ({
		BaseTextureCache: BaseTextureCache,
		CanvasRenderTarget: CanvasRenderTarget,
		DATA_URI: DATA_URI,
		ProgramCache: ProgramCache,
		TextureCache: TextureCache,
		clearTextureCache: clearTextureCache,
		correctBlendMode: correctBlendMode,
		createIndicesForQuads: createIndicesForQuads,
		decomposeDataUri: decomposeDataUri,
		deprecation: deprecation,
		destroyTextureCache: destroyTextureCache,
		determineCrossOrigin: determineCrossOrigin,
		getBufferType: getBufferType,
		getResolutionOfUrl: getResolutionOfUrl,
		hex2rgb: hex2rgb,
		hex2string: hex2string,
		interleaveTypedArrays: interleaveTypedArrays,
		isPow2: isPow2,
		isWebGLSupported: isWebGLSupported,
		log2: log2,
		nextPow2: nextPow2,
		premultiplyBlendMode: premultiplyBlendMode,
		premultiplyRgba: premultiplyRgba,
		premultiplyTint: premultiplyTint,
		premultiplyTintToRgba: premultiplyTintToRgba,
		removeItems: removeItems,
		rgb2hex: rgb2hex,
		sayHello: sayHello,
		sign: sign$1,
		skipHello: skipHello,
		string2hex: string2hex,
		trimCanvas: trimCanvas,
		uid: uid,
		isMobile: isMobile$1,
		EventEmitter: eventemitter3,
		earcut: earcut_1,
		url: url
	});

	
	
	var PI_2 = Math.PI * 2;
	
	var RAD_TO_DEG = 180 / Math.PI;
	
	var DEG_TO_RAD = Math.PI / 180;

	(function (SHAPES) {
	    SHAPES[SHAPES["POLY"] = 0] = "POLY";
	    SHAPES[SHAPES["RECT"] = 1] = "RECT";
	    SHAPES[SHAPES["CIRC"] = 2] = "CIRC";
	    SHAPES[SHAPES["ELIP"] = 3] = "ELIP";
	    SHAPES[SHAPES["RREC"] = 4] = "RREC";
	})(exports.SHAPES || (exports.SHAPES = {}));
	

	
	
	var Rectangle =  (function () {
	    
	    function Rectangle(x, y, width, height) {
	        if (x === void 0) { x = 0; }
	        if (y === void 0) { y = 0; }
	        if (width === void 0) { width = 0; }
	        if (height === void 0) { height = 0; }
	        
	        this.x = Number(x);
	        
	        this.y = Number(y);
	        
	        this.width = Number(width);
	        
	        this.height = Number(height);
	        
	        this.type = exports.SHAPES.RECT;
	    }
	    Object.defineProperty(Rectangle.prototype, "left", {
	        
	        get: function () {
	            return this.x;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Rectangle.prototype, "right", {
	        
	        get: function () {
	            return this.x + this.width;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Rectangle.prototype, "top", {
	        
	        get: function () {
	            return this.y;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Rectangle.prototype, "bottom", {
	        
	        get: function () {
	            return this.y + this.height;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Rectangle, "EMPTY", {
	        
	        get: function () {
	            return new Rectangle(0, 0, 0, 0);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    Rectangle.prototype.clone = function () {
	        return new Rectangle(this.x, this.y, this.width, this.height);
	    };
	    
	    Rectangle.prototype.copyFrom = function (rectangle) {
	        this.x = rectangle.x;
	        this.y = rectangle.y;
	        this.width = rectangle.width;
	        this.height = rectangle.height;
	        return this;
	    };
	    
	    Rectangle.prototype.copyTo = function (rectangle) {
	        rectangle.x = this.x;
	        rectangle.y = this.y;
	        rectangle.width = this.width;
	        rectangle.height = this.height;
	        return rectangle;
	    };
	    
	    Rectangle.prototype.contains = function (x, y) {
	        if (this.width <= 0 || this.height <= 0) {
	            return false;
	        }
	        if (x >= this.x && x < this.x + this.width) {
	            if (y >= this.y && y < this.y + this.height) {
	                return true;
	            }
	        }
	        return false;
	    };
	    
	    Rectangle.prototype.pad = function (paddingX, paddingY) {
	        if (paddingX === void 0) { paddingX = 0; }
	        if (paddingY === void 0) { paddingY = paddingX; }
	        this.x -= paddingX;
	        this.y -= paddingY;
	        this.width += paddingX * 2;
	        this.height += paddingY * 2;
	        return this;
	    };
	    
	    Rectangle.prototype.fit = function (rectangle) {
	        var x1 = Math.max(this.x, rectangle.x);
	        var x2 = Math.min(this.x + this.width, rectangle.x + rectangle.width);
	        var y1 = Math.max(this.y, rectangle.y);
	        var y2 = Math.min(this.y + this.height, rectangle.y + rectangle.height);
	        this.x = x1;
	        this.width = Math.max(x2 - x1, 0);
	        this.y = y1;
	        this.height = Math.max(y2 - y1, 0);
	        return this;
	    };
	    
	    Rectangle.prototype.ceil = function (resolution, eps) {
	        if (resolution === void 0) { resolution = 1; }
	        if (eps === void 0) { eps = 0.001; }
	        var x2 = Math.ceil((this.x + this.width - eps) * resolution) / resolution;
	        var y2 = Math.ceil((this.y + this.height - eps) * resolution) / resolution;
	        this.x = Math.floor((this.x + eps) * resolution) / resolution;
	        this.y = Math.floor((this.y + eps) * resolution) / resolution;
	        this.width = x2 - this.x;
	        this.height = y2 - this.y;
	        return this;
	    };
	    
	    Rectangle.prototype.enlarge = function (rectangle) {
	        var x1 = Math.min(this.x, rectangle.x);
	        var x2 = Math.max(this.x + this.width, rectangle.x + rectangle.width);
	        var y1 = Math.min(this.y, rectangle.y);
	        var y2 = Math.max(this.y + this.height, rectangle.y + rectangle.height);
	        this.x = x1;
	        this.width = x2 - x1;
	        this.y = y1;
	        this.height = y2 - y1;
	        return this;
	    };
	    return Rectangle;
	}());

	
	var Circle =  (function () {
	    
	    function Circle(x, y, radius) {
	        if (x === void 0) { x = 0; }
	        if (y === void 0) { y = 0; }
	        if (radius === void 0) { radius = 0; }
	        
	        this.x = x;
	        
	        this.y = y;
	        
	        this.radius = radius;
	        
	        this.type = exports.SHAPES.CIRC;
	    }
	    
	    Circle.prototype.clone = function () {
	        return new Circle(this.x, this.y, this.radius);
	    };
	    
	    Circle.prototype.contains = function (x, y) {
	        if (this.radius <= 0) {
	            return false;
	        }
	        var r2 = this.radius * this.radius;
	        var dx = (this.x - x);
	        var dy = (this.y - y);
	        dx *= dx;
	        dy *= dy;
	        return (dx + dy <= r2);
	    };
	    
	    Circle.prototype.getBounds = function () {
	        return new Rectangle(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
	    };
	    return Circle;
	}());

	
	var Ellipse =  (function () {
	    
	    function Ellipse(x, y, halfWidth, halfHeight) {
	        if (x === void 0) { x = 0; }
	        if (y === void 0) { y = 0; }
	        if (halfWidth === void 0) { halfWidth = 0; }
	        if (halfHeight === void 0) { halfHeight = 0; }
	        
	        this.x = x;
	        
	        this.y = y;
	        
	        this.width = halfWidth;
	        
	        this.height = halfHeight;
	        
	        this.type = exports.SHAPES.ELIP;
	    }
	    
	    Ellipse.prototype.clone = function () {
	        return new Ellipse(this.x, this.y, this.width, this.height);
	    };
	    
	    Ellipse.prototype.contains = function (x, y) {
	        if (this.width <= 0 || this.height <= 0) {
	            return false;
	        }
	        
	        var normx = ((x - this.x) / this.width);
	        var normy = ((y - this.y) / this.height);
	        normx *= normx;
	        normy *= normy;
	        return (normx + normy <= 1);
	    };
	    
	    Ellipse.prototype.getBounds = function () {
	        return new Rectangle(this.x - this.width, this.y - this.height, this.width, this.height);
	    };
	    return Ellipse;
	}());

	
	var Polygon =  (function () {
	    
	    function Polygon() {
	        var arguments$1 = arguments;

	        var points = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            points[_i] = arguments$1[_i];
	        }
	        var flat = Array.isArray(points[0]) ? points[0] : points;
	        
	        if (typeof flat[0] !== 'number') {
	            var p = [];
	            for (var i = 0, il = flat.length; i < il; i++) {
	                p.push(flat[i].x, flat[i].y);
	            }
	            flat = p;
	        }
	        
	        this.points = flat;
	        
	        this.type = exports.SHAPES.POLY;
	        
	        this.closeStroke = true;
	    }
	    
	    Polygon.prototype.clone = function () {
	        var points = this.points.slice();
	        var polygon = new Polygon(points);
	        polygon.closeStroke = this.closeStroke;
	        return polygon;
	    };
	    
	    Polygon.prototype.contains = function (x, y) {
	        var inside = false;
	        
	        
	        var length = this.points.length / 2;
	        for (var i = 0, j = length - 1; i < length; j = i++) {
	            var xi = this.points[i * 2];
	            var yi = this.points[(i * 2) + 1];
	            var xj = this.points[j * 2];
	            var yj = this.points[(j * 2) + 1];
	            var intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * ((y - yi) / (yj - yi))) + xi);
	            if (intersect) {
	                inside = !inside;
	            }
	        }
	        return inside;
	    };
	    return Polygon;
	}());

	
	var RoundedRectangle =  (function () {
	    
	    function RoundedRectangle(x, y, width, height, radius) {
	        if (x === void 0) { x = 0; }
	        if (y === void 0) { y = 0; }
	        if (width === void 0) { width = 0; }
	        if (height === void 0) { height = 0; }
	        if (radius === void 0) { radius = 20; }
	        
	        this.x = x;
	        
	        this.y = y;
	        
	        this.width = width;
	        
	        this.height = height;
	        
	        this.radius = radius;
	        
	        this.type = exports.SHAPES.RREC;
	    }
	    
	    RoundedRectangle.prototype.clone = function () {
	        return new RoundedRectangle(this.x, this.y, this.width, this.height, this.radius);
	    };
	    
	    RoundedRectangle.prototype.contains = function (x, y) {
	        if (this.width <= 0 || this.height <= 0) {
	            return false;
	        }
	        if (x >= this.x && x <= this.x + this.width) {
	            if (y >= this.y && y <= this.y + this.height) {
	                if ((y >= this.y + this.radius && y <= this.y + this.height - this.radius)
	                    || (x >= this.x + this.radius && x <= this.x + this.width - this.radius)) {
	                    return true;
	                }
	                var dx = x - (this.x + this.radius);
	                var dy = y - (this.y + this.radius);
	                var radius2 = this.radius * this.radius;
	                if ((dx * dx) + (dy * dy) <= radius2) {
	                    return true;
	                }
	                dx = x - (this.x + this.width - this.radius);
	                if ((dx * dx) + (dy * dy) <= radius2) {
	                    return true;
	                }
	                dy = y - (this.y + this.height - this.radius);
	                if ((dx * dx) + (dy * dy) <= radius2) {
	                    return true;
	                }
	                dx = x - (this.x + this.radius);
	                if ((dx * dx) + (dy * dy) <= radius2) {
	                    return true;
	                }
	            }
	        }
	        return false;
	    };
	    return RoundedRectangle;
	}());

	
	
	

	
	
	
	
	

	
	var Point =  (function () {
	    
	    function Point(x, y) {
	        if (x === void 0) { x = 0; }
	        if (y === void 0) { y = 0; }
	        
	        this.x = x;
	        
	        this.y = y;
	    }
	    
	    Point.prototype.clone = function () {
	        return new Point(this.x, this.y);
	    };
	    
	    Point.prototype.copyFrom = function (p) {
	        this.set(p.x, p.y);
	        return this;
	    };
	    
	    Point.prototype.copyTo = function (p) {
	        p.set(this.x, this.y);
	        return p;
	    };
	    
	    Point.prototype.equals = function (p) {
	        return (p.x === this.x) && (p.y === this.y);
	    };
	    
	    Point.prototype.set = function (x, y) {
	        if (x === void 0) { x = 0; }
	        if (y === void 0) { y = x; }
	        this.x = x;
	        this.y = y;
	        return this;
	    };
	    return Point;
	}());

	
	var ObservablePoint =  (function () {
	    
	    function ObservablePoint(cb, scope, x, y) {
	        if (x === void 0) { x = 0; }
	        if (y === void 0) { y = 0; }
	        this._x = x;
	        this._y = y;
	        this.cb = cb;
	        this.scope = scope;
	    }
	    
	    ObservablePoint.prototype.clone = function (cb, scope) {
	        if (cb === void 0) { cb = this.cb; }
	        if (scope === void 0) { scope = this.scope; }
	        return new ObservablePoint(cb, scope, this._x, this._y);
	    };
	    
	    ObservablePoint.prototype.set = function (x, y) {
	        if (x === void 0) { x = 0; }
	        if (y === void 0) { y = x; }
	        if (this._x !== x || this._y !== y) {
	            this._x = x;
	            this._y = y;
	            this.cb.call(this.scope);
	        }
	        return this;
	    };
	    
	    ObservablePoint.prototype.copyFrom = function (p) {
	        if (this._x !== p.x || this._y !== p.y) {
	            this._x = p.x;
	            this._y = p.y;
	            this.cb.call(this.scope);
	        }
	        return this;
	    };
	    
	    ObservablePoint.prototype.copyTo = function (p) {
	        p.set(this._x, this._y);
	        return p;
	    };
	    
	    ObservablePoint.prototype.equals = function (p) {
	        return (p.x === this._x) && (p.y === this._y);
	    };
	    Object.defineProperty(ObservablePoint.prototype, "x", {
	        
	        get: function () {
	            return this._x;
	        },
	        set: function (value) {
	            if (this._x !== value) {
	                this._x = value;
	                this.cb.call(this.scope);
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(ObservablePoint.prototype, "y", {
	        
	        get: function () {
	            return this._y;
	        },
	        set: function (value) {
	            if (this._y !== value) {
	                this._y = value;
	                this.cb.call(this.scope);
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return ObservablePoint;
	}());

	
	var Matrix =  (function () {
	    
	    function Matrix(a, b, c, d, tx, ty) {
	        if (a === void 0) { a = 1; }
	        if (b === void 0) { b = 0; }
	        if (c === void 0) { c = 0; }
	        if (d === void 0) { d = 1; }
	        if (tx === void 0) { tx = 0; }
	        if (ty === void 0) { ty = 0; }
	        this.array = null;
	        
	        this.a = a;
	        
	        this.b = b;
	        
	        this.c = c;
	        
	        this.d = d;
	        
	        this.tx = tx;
	        
	        this.ty = ty;
	    }
	    
	    Matrix.prototype.fromArray = function (array) {
	        this.a = array[0];
	        this.b = array[1];
	        this.c = array[3];
	        this.d = array[4];
	        this.tx = array[2];
	        this.ty = array[5];
	    };
	    
	    Matrix.prototype.set = function (a, b, c, d, tx, ty) {
	        this.a = a;
	        this.b = b;
	        this.c = c;
	        this.d = d;
	        this.tx = tx;
	        this.ty = ty;
	        return this;
	    };
	    
	    Matrix.prototype.toArray = function (transpose, out) {
	        if (!this.array) {
	            this.array = new Float32Array(9);
	        }
	        var array = out || this.array;
	        if (transpose) {
	            array[0] = this.a;
	            array[1] = this.b;
	            array[2] = 0;
	            array[3] = this.c;
	            array[4] = this.d;
	            array[5] = 0;
	            array[6] = this.tx;
	            array[7] = this.ty;
	            array[8] = 1;
	        }
	        else {
	            array[0] = this.a;
	            array[1] = this.c;
	            array[2] = this.tx;
	            array[3] = this.b;
	            array[4] = this.d;
	            array[5] = this.ty;
	            array[6] = 0;
	            array[7] = 0;
	            array[8] = 1;
	        }
	        return array;
	    };
	    
	    Matrix.prototype.apply = function (pos, newPos) {
	        newPos = (newPos || new Point());
	        var x = pos.x;
	        var y = pos.y;
	        newPos.x = (this.a * x) + (this.c * y) + this.tx;
	        newPos.y = (this.b * x) + (this.d * y) + this.ty;
	        return newPos;
	    };
	    
	    Matrix.prototype.applyInverse = function (pos, newPos) {
	        newPos = (newPos || new Point());
	        var id = 1 / ((this.a * this.d) + (this.c * -this.b));
	        var x = pos.x;
	        var y = pos.y;
	        newPos.x = (this.d * id * x) + (-this.c * id * y) + (((this.ty * this.c) - (this.tx * this.d)) * id);
	        newPos.y = (this.a * id * y) + (-this.b * id * x) + (((-this.ty * this.a) + (this.tx * this.b)) * id);
	        return newPos;
	    };
	    
	    Matrix.prototype.translate = function (x, y) {
	        this.tx += x;
	        this.ty += y;
	        return this;
	    };
	    
	    Matrix.prototype.scale = function (x, y) {
	        this.a *= x;
	        this.d *= y;
	        this.c *= x;
	        this.b *= y;
	        this.tx *= x;
	        this.ty *= y;
	        return this;
	    };
	    
	    Matrix.prototype.rotate = function (angle) {
	        var cos = Math.cos(angle);
	        var sin = Math.sin(angle);
	        var a1 = this.a;
	        var c1 = this.c;
	        var tx1 = this.tx;
	        this.a = (a1 * cos) - (this.b * sin);
	        this.b = (a1 * sin) + (this.b * cos);
	        this.c = (c1 * cos) - (this.d * sin);
	        this.d = (c1 * sin) + (this.d * cos);
	        this.tx = (tx1 * cos) - (this.ty * sin);
	        this.ty = (tx1 * sin) + (this.ty * cos);
	        return this;
	    };
	    
	    Matrix.prototype.append = function (matrix) {
	        var a1 = this.a;
	        var b1 = this.b;
	        var c1 = this.c;
	        var d1 = this.d;
	        this.a = (matrix.a * a1) + (matrix.b * c1);
	        this.b = (matrix.a * b1) + (matrix.b * d1);
	        this.c = (matrix.c * a1) + (matrix.d * c1);
	        this.d = (matrix.c * b1) + (matrix.d * d1);
	        this.tx = (matrix.tx * a1) + (matrix.ty * c1) + this.tx;
	        this.ty = (matrix.tx * b1) + (matrix.ty * d1) + this.ty;
	        return this;
	    };
	    
	    Matrix.prototype.setTransform = function (x, y, pivotX, pivotY, scaleX, scaleY, rotation, skewX, skewY) {
	        this.a = Math.cos(rotation + skewY) * scaleX;
	        this.b = Math.sin(rotation + skewY) * scaleX;
	        this.c = -Math.sin(rotation - skewX) * scaleY;
	        this.d = Math.cos(rotation - skewX) * scaleY;
	        this.tx = x - ((pivotX * this.a) + (pivotY * this.c));
	        this.ty = y - ((pivotX * this.b) + (pivotY * this.d));
	        return this;
	    };
	    
	    Matrix.prototype.prepend = function (matrix) {
	        var tx1 = this.tx;
	        if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1) {
	            var a1 = this.a;
	            var c1 = this.c;
	            this.a = (a1 * matrix.a) + (this.b * matrix.c);
	            this.b = (a1 * matrix.b) + (this.b * matrix.d);
	            this.c = (c1 * matrix.a) + (this.d * matrix.c);
	            this.d = (c1 * matrix.b) + (this.d * matrix.d);
	        }
	        this.tx = (tx1 * matrix.a) + (this.ty * matrix.c) + matrix.tx;
	        this.ty = (tx1 * matrix.b) + (this.ty * matrix.d) + matrix.ty;
	        return this;
	    };
	    
	    Matrix.prototype.decompose = function (transform) {
	        
	        var a = this.a;
	        var b = this.b;
	        var c = this.c;
	        var d = this.d;
	        var skewX = -Math.atan2(-c, d);
	        var skewY = Math.atan2(b, a);
	        var delta = Math.abs(skewX + skewY);
	        if (delta < 0.00001 || Math.abs(PI_2 - delta) < 0.00001) {
	            transform.rotation = skewY;
	            transform.skew.x = transform.skew.y = 0;
	        }
	        else {
	            transform.rotation = 0;
	            transform.skew.x = skewX;
	            transform.skew.y = skewY;
	        }
	        
	        transform.scale.x = Math.sqrt((a * a) + (b * b));
	        transform.scale.y = Math.sqrt((c * c) + (d * d));
	        
	        transform.position.x = this.tx;
	        transform.position.y = this.ty;
	        return transform;
	    };
	    
	    Matrix.prototype.invert = function () {
	        var a1 = this.a;
	        var b1 = this.b;
	        var c1 = this.c;
	        var d1 = this.d;
	        var tx1 = this.tx;
	        var n = (a1 * d1) - (b1 * c1);
	        this.a = d1 / n;
	        this.b = -b1 / n;
	        this.c = -c1 / n;
	        this.d = a1 / n;
	        this.tx = ((c1 * this.ty) - (d1 * tx1)) / n;
	        this.ty = -((a1 * this.ty) - (b1 * tx1)) / n;
	        return this;
	    };
	    
	    Matrix.prototype.identity = function () {
	        this.a = 1;
	        this.b = 0;
	        this.c = 0;
	        this.d = 1;
	        this.tx = 0;
	        this.ty = 0;
	        return this;
	    };
	    
	    Matrix.prototype.clone = function () {
	        var matrix = new Matrix();
	        matrix.a = this.a;
	        matrix.b = this.b;
	        matrix.c = this.c;
	        matrix.d = this.d;
	        matrix.tx = this.tx;
	        matrix.ty = this.ty;
	        return matrix;
	    };
	    
	    Matrix.prototype.copyTo = function (matrix) {
	        matrix.a = this.a;
	        matrix.b = this.b;
	        matrix.c = this.c;
	        matrix.d = this.d;
	        matrix.tx = this.tx;
	        matrix.ty = this.ty;
	        return matrix;
	    };
	    
	    Matrix.prototype.copyFrom = function (matrix) {
	        this.a = matrix.a;
	        this.b = matrix.b;
	        this.c = matrix.c;
	        this.d = matrix.d;
	        this.tx = matrix.tx;
	        this.ty = matrix.ty;
	        return this;
	    };
	    Object.defineProperty(Matrix, "IDENTITY", {
	        
	        get: function () {
	            return new Matrix();
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Matrix, "TEMP_MATRIX", {
	        
	        get: function () {
	            return new Matrix();
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return Matrix;
	}());

	
	
	var ux = [1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1, 0, 1];
	var uy = [0, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1];
	var vx = [0, -1, -1, -1, 0, 1, 1, 1, 0, 1, 1, 1, 0, -1, -1, -1];
	var vy = [1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, 1, 1, 1, 0, -1];
	
	var rotationCayley = [];
	
	var rotationMatrices = [];
	
	var signum = Math.sign;
	
	function init() {
	    for (var i = 0; i < 16; i++) {
	        var row = [];
	        rotationCayley.push(row);
	        for (var j = 0; j < 16; j++) {
	            
	            var _ux = signum((ux[i] * ux[j]) + (vx[i] * uy[j]));
	            var _uy = signum((uy[i] * ux[j]) + (vy[i] * uy[j]));
	            var _vx = signum((ux[i] * vx[j]) + (vx[i] * vy[j]));
	            var _vy = signum((uy[i] * vx[j]) + (vy[i] * vy[j]));
	            
	            for (var k = 0; k < 16; k++) {
	                if (ux[k] === _ux && uy[k] === _uy
	                    && vx[k] === _vx && vy[k] === _vy) {
	                    row.push(k);
	                    break;
	                }
	            }
	        }
	    }
	    for (var i = 0; i < 16; i++) {
	        var mat = new Matrix();
	        mat.set(ux[i], uy[i], vx[i], vy[i], 0, 0);
	        rotationMatrices.push(mat);
	    }
	}
	init();
	
	
	var groupD8 = {
	    
	    E: 0,
	    
	    SE: 1,
	    
	    S: 2,
	    
	    SW: 3,
	    
	    W: 4,
	    
	    NW: 5,
	    
	    N: 6,
	    
	    NE: 7,
	    
	    MIRROR_VERTICAL: 8,
	    
	    MAIN_DIAGONAL: 10,
	    
	    MIRROR_HORIZONTAL: 12,
	    
	    REVERSE_DIAGONAL: 14,
	    
	    uX: function (ind) { return ux[ind]; },
	    
	    uY: function (ind) { return uy[ind]; },
	    
	    vX: function (ind) { return vx[ind]; },
	    
	    vY: function (ind) { return vy[ind]; },
	    
	    inv: function (rotation) {
	        if (rotation & 8) 
	         {
	            return rotation & 15; 
	        }
	        return (-rotation) & 7; 
	    },
	    
	    add: function (rotationSecond, rotationFirst) { return (rotationCayley[rotationSecond][rotationFirst]); },
	    
	    sub: function (rotationSecond, rotationFirst) { return (rotationCayley[rotationSecond][groupD8.inv(rotationFirst)]); },
	    
	    rotate180: function (rotation) { return rotation ^ 4; },
	    
	    isVertical: function (rotation) { return (rotation & 3) === 2; },
	    
	    byDirection: function (dx, dy) {
	        if (Math.abs(dx) * 2 <= Math.abs(dy)) {
	            if (dy >= 0) {
	                return groupD8.S;
	            }
	            return groupD8.N;
	        }
	        else if (Math.abs(dy) * 2 <= Math.abs(dx)) {
	            if (dx > 0) {
	                return groupD8.E;
	            }
	            return groupD8.W;
	        }
	        else if (dy > 0) {
	            if (dx > 0) {
	                return groupD8.SE;
	            }
	            return groupD8.SW;
	        }
	        else if (dx > 0) {
	            return groupD8.NE;
	        }
	        return groupD8.NW;
	    },
	    
	    matrixAppendRotationInv: function (matrix, rotation, tx, ty) {
	        if (tx === void 0) { tx = 0; }
	        if (ty === void 0) { ty = 0; }
	        
	        var mat = rotationMatrices[groupD8.inv(rotation)];
	        mat.tx = tx;
	        mat.ty = ty;
	        matrix.append(mat);
	    },
	};

	
	var Transform =  (function () {
	    function Transform() {
	        
	        this.worldTransform = new Matrix();
	        
	        this.localTransform = new Matrix();
	        
	        this.position = new ObservablePoint(this.onChange, this, 0, 0);
	        
	        this.scale = new ObservablePoint(this.onChange, this, 1, 1);
	        
	        this.pivot = new ObservablePoint(this.onChange, this, 0, 0);
	        
	        this.skew = new ObservablePoint(this.updateSkew, this, 0, 0);
	        
	        this._rotation = 0;
	        
	        this._cx = 1;
	        
	        this._sx = 0;
	        
	        this._cy = 0;
	        
	        this._sy = 1;
	        
	        this._localID = 0;
	        
	        this._currentLocalID = 0;
	        
	        this._worldID = 0;
	        
	        this._parentID = 0;
	    }
	    
	    Transform.prototype.onChange = function () {
	        this._localID++;
	    };
	    
	    Transform.prototype.updateSkew = function () {
	        this._cx = Math.cos(this._rotation + this.skew.y);
	        this._sx = Math.sin(this._rotation + this.skew.y);
	        this._cy = -Math.sin(this._rotation - this.skew.x); 
	        this._sy = Math.cos(this._rotation - this.skew.x); 
	        this._localID++;
	    };
	    
	    Transform.prototype.updateLocalTransform = function () {
	        var lt = this.localTransform;
	        if (this._localID !== this._currentLocalID) {
	            
	            lt.a = this._cx * this.scale.x;
	            lt.b = this._sx * this.scale.x;
	            lt.c = this._cy * this.scale.y;
	            lt.d = this._sy * this.scale.y;
	            lt.tx = this.position.x - ((this.pivot.x * lt.a) + (this.pivot.y * lt.c));
	            lt.ty = this.position.y - ((this.pivot.x * lt.b) + (this.pivot.y * lt.d));
	            this._currentLocalID = this._localID;
	            
	            this._parentID = -1;
	        }
	    };
	    
	    Transform.prototype.updateTransform = function (parentTransform) {
	        var lt = this.localTransform;
	        if (this._localID !== this._currentLocalID) {
	            
	            lt.a = this._cx * this.scale.x;
	            lt.b = this._sx * this.scale.x;
	            lt.c = this._cy * this.scale.y;
	            lt.d = this._sy * this.scale.y;
	            lt.tx = this.position.x - ((this.pivot.x * lt.a) + (this.pivot.y * lt.c));
	            lt.ty = this.position.y - ((this.pivot.x * lt.b) + (this.pivot.y * lt.d));
	            this._currentLocalID = this._localID;
	            
	            this._parentID = -1;
	        }
	        if (this._parentID !== parentTransform._worldID) {
	            
	            var pt = parentTransform.worldTransform;
	            var wt = this.worldTransform;
	            wt.a = (lt.a * pt.a) + (lt.b * pt.c);
	            wt.b = (lt.a * pt.b) + (lt.b * pt.d);
	            wt.c = (lt.c * pt.a) + (lt.d * pt.c);
	            wt.d = (lt.c * pt.b) + (lt.d * pt.d);
	            wt.tx = (lt.tx * pt.a) + (lt.ty * pt.c) + pt.tx;
	            wt.ty = (lt.tx * pt.b) + (lt.ty * pt.d) + pt.ty;
	            this._parentID = parentTransform._worldID;
	            
	            this._worldID++;
	        }
	    };
	    
	    Transform.prototype.setFromMatrix = function (matrix) {
	        matrix.decompose(this);
	        this._localID++;
	    };
	    Object.defineProperty(Transform.prototype, "rotation", {
	        
	        get: function () {
	            return this._rotation;
	        },
	        set: function (value) {
	            if (this._rotation !== value) {
	                this._rotation = value;
	                this.updateSkew();
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    Transform.IDENTITY = new Transform();
	    return Transform;
	}());

	

	
	settings.SORTABLE_CHILDREN = false;

	
	var Bounds =  (function () {
	    function Bounds() {
	        
	        this.minX = Infinity;
	        
	        this.minY = Infinity;
	        
	        this.maxX = -Infinity;
	        
	        this.maxY = -Infinity;
	        this.rect = null;
	        
	        this.updateID = -1;
	    }
	    
	    Bounds.prototype.isEmpty = function () {
	        return this.minX > this.maxX || this.minY > this.maxY;
	    };
	    
	    Bounds.prototype.clear = function () {
	        this.minX = Infinity;
	        this.minY = Infinity;
	        this.maxX = -Infinity;
	        this.maxY = -Infinity;
	    };
	    
	    Bounds.prototype.getRectangle = function (rect) {
	        if (this.minX > this.maxX || this.minY > this.maxY) {
	            return Rectangle.EMPTY;
	        }
	        rect = rect || new Rectangle(0, 0, 1, 1);
	        rect.x = this.minX;
	        rect.y = this.minY;
	        rect.width = this.maxX - this.minX;
	        rect.height = this.maxY - this.minY;
	        return rect;
	    };
	    
	    Bounds.prototype.addPoint = function (point) {
	        this.minX = Math.min(this.minX, point.x);
	        this.maxX = Math.max(this.maxX, point.x);
	        this.minY = Math.min(this.minY, point.y);
	        this.maxY = Math.max(this.maxY, point.y);
	    };
	    
	    Bounds.prototype.addQuad = function (vertices) {
	        var minX = this.minX;
	        var minY = this.minY;
	        var maxX = this.maxX;
	        var maxY = this.maxY;
	        var x = vertices[0];
	        var y = vertices[1];
	        minX = x < minX ? x : minX;
	        minY = y < minY ? y : minY;
	        maxX = x > maxX ? x : maxX;
	        maxY = y > maxY ? y : maxY;
	        x = vertices[2];
	        y = vertices[3];
	        minX = x < minX ? x : minX;
	        minY = y < minY ? y : minY;
	        maxX = x > maxX ? x : maxX;
	        maxY = y > maxY ? y : maxY;
	        x = vertices[4];
	        y = vertices[5];
	        minX = x < minX ? x : minX;
	        minY = y < minY ? y : minY;
	        maxX = x > maxX ? x : maxX;
	        maxY = y > maxY ? y : maxY;
	        x = vertices[6];
	        y = vertices[7];
	        minX = x < minX ? x : minX;
	        minY = y < minY ? y : minY;
	        maxX = x > maxX ? x : maxX;
	        maxY = y > maxY ? y : maxY;
	        this.minX = minX;
	        this.minY = minY;
	        this.maxX = maxX;
	        this.maxY = maxY;
	    };
	    
	    Bounds.prototype.addFrame = function (transform, x0, y0, x1, y1) {
	        this.addFrameMatrix(transform.worldTransform, x0, y0, x1, y1);
	    };
	    
	    Bounds.prototype.addFrameMatrix = function (matrix, x0, y0, x1, y1) {
	        var a = matrix.a;
	        var b = matrix.b;
	        var c = matrix.c;
	        var d = matrix.d;
	        var tx = matrix.tx;
	        var ty = matrix.ty;
	        var minX = this.minX;
	        var minY = this.minY;
	        var maxX = this.maxX;
	        var maxY = this.maxY;
	        var x = (a * x0) + (c * y0) + tx;
	        var y = (b * x0) + (d * y0) + ty;
	        minX = x < minX ? x : minX;
	        minY = y < minY ? y : minY;
	        maxX = x > maxX ? x : maxX;
	        maxY = y > maxY ? y : maxY;
	        x = (a * x1) + (c * y0) + tx;
	        y = (b * x1) + (d * y0) + ty;
	        minX = x < minX ? x : minX;
	        minY = y < minY ? y : minY;
	        maxX = x > maxX ? x : maxX;
	        maxY = y > maxY ? y : maxY;
	        x = (a * x0) + (c * y1) + tx;
	        y = (b * x0) + (d * y1) + ty;
	        minX = x < minX ? x : minX;
	        minY = y < minY ? y : minY;
	        maxX = x > maxX ? x : maxX;
	        maxY = y > maxY ? y : maxY;
	        x = (a * x1) + (c * y1) + tx;
	        y = (b * x1) + (d * y1) + ty;
	        minX = x < minX ? x : minX;
	        minY = y < minY ? y : minY;
	        maxX = x > maxX ? x : maxX;
	        maxY = y > maxY ? y : maxY;
	        this.minX = minX;
	        this.minY = minY;
	        this.maxX = maxX;
	        this.maxY = maxY;
	    };
	    
	    Bounds.prototype.addVertexData = function (vertexData, beginOffset, endOffset) {
	        var minX = this.minX;
	        var minY = this.minY;
	        var maxX = this.maxX;
	        var maxY = this.maxY;
	        for (var i = beginOffset; i < endOffset; i += 2) {
	            var x = vertexData[i];
	            var y = vertexData[i + 1];
	            minX = x < minX ? x : minX;
	            minY = y < minY ? y : minY;
	            maxX = x > maxX ? x : maxX;
	            maxY = y > maxY ? y : maxY;
	        }
	        this.minX = minX;
	        this.minY = minY;
	        this.maxX = maxX;
	        this.maxY = maxY;
	    };
	    
	    Bounds.prototype.addVertices = function (transform, vertices, beginOffset, endOffset) {
	        this.addVerticesMatrix(transform.worldTransform, vertices, beginOffset, endOffset);
	    };
	    
	    Bounds.prototype.addVerticesMatrix = function (matrix, vertices, beginOffset, endOffset, padX, padY) {
	        if (padX === void 0) { padX = 0; }
	        if (padY === void 0) { padY = padX; }
	        var a = matrix.a;
	        var b = matrix.b;
	        var c = matrix.c;
	        var d = matrix.d;
	        var tx = matrix.tx;
	        var ty = matrix.ty;
	        var minX = this.minX;
	        var minY = this.minY;
	        var maxX = this.maxX;
	        var maxY = this.maxY;
	        for (var i = beginOffset; i < endOffset; i += 2) {
	            var rawX = vertices[i];
	            var rawY = vertices[i + 1];
	            var x = (a * rawX) + (c * rawY) + tx;
	            var y = (d * rawY) + (b * rawX) + ty;
	            minX = Math.min(minX, x - padX);
	            maxX = Math.max(maxX, x + padX);
	            minY = Math.min(minY, y - padY);
	            maxY = Math.max(maxY, y + padY);
	        }
	        this.minX = minX;
	        this.minY = minY;
	        this.maxX = maxX;
	        this.maxY = maxY;
	    };
	    
	    Bounds.prototype.addBounds = function (bounds) {
	        var minX = this.minX;
	        var minY = this.minY;
	        var maxX = this.maxX;
	        var maxY = this.maxY;
	        this.minX = bounds.minX < minX ? bounds.minX : minX;
	        this.minY = bounds.minY < minY ? bounds.minY : minY;
	        this.maxX = bounds.maxX > maxX ? bounds.maxX : maxX;
	        this.maxY = bounds.maxY > maxY ? bounds.maxY : maxY;
	    };
	    
	    Bounds.prototype.addBoundsMask = function (bounds, mask) {
	        var _minX = bounds.minX > mask.minX ? bounds.minX : mask.minX;
	        var _minY = bounds.minY > mask.minY ? bounds.minY : mask.minY;
	        var _maxX = bounds.maxX < mask.maxX ? bounds.maxX : mask.maxX;
	        var _maxY = bounds.maxY < mask.maxY ? bounds.maxY : mask.maxY;
	        if (_minX <= _maxX && _minY <= _maxY) {
	            var minX = this.minX;
	            var minY = this.minY;
	            var maxX = this.maxX;
	            var maxY = this.maxY;
	            this.minX = _minX < minX ? _minX : minX;
	            this.minY = _minY < minY ? _minY : minY;
	            this.maxX = _maxX > maxX ? _maxX : maxX;
	            this.maxY = _maxY > maxY ? _maxY : maxY;
	        }
	    };
	    
	    Bounds.prototype.addBoundsMatrix = function (bounds, matrix) {
	        this.addFrameMatrix(matrix, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
	    };
	    
	    Bounds.prototype.addBoundsArea = function (bounds, area) {
	        var _minX = bounds.minX > area.x ? bounds.minX : area.x;
	        var _minY = bounds.minY > area.y ? bounds.minY : area.y;
	        var _maxX = bounds.maxX < area.x + area.width ? bounds.maxX : (area.x + area.width);
	        var _maxY = bounds.maxY < area.y + area.height ? bounds.maxY : (area.y + area.height);
	        if (_minX <= _maxX && _minY <= _maxY) {
	            var minX = this.minX;
	            var minY = this.minY;
	            var maxX = this.maxX;
	            var maxY = this.maxY;
	            this.minX = _minX < minX ? _minX : minX;
	            this.minY = _minY < minY ? _minY : minY;
	            this.maxX = _maxX > maxX ? _maxX : maxX;
	            this.maxY = _maxY > maxY ? _maxY : maxY;
	        }
	    };
	    
	    Bounds.prototype.pad = function (paddingX, paddingY) {
	        if (paddingX === void 0) { paddingX = 0; }
	        if (paddingY === void 0) { paddingY = paddingX; }
	        if (!this.isEmpty()) {
	            this.minX -= paddingX;
	            this.maxX += paddingX;
	            this.minY -= paddingY;
	            this.maxY += paddingY;
	        }
	    };
	    
	    Bounds.prototype.addFramePad = function (x0, y0, x1, y1, padX, padY) {
	        x0 -= padX;
	        y0 -= padY;
	        x1 += padX;
	        y1 += padY;
	        this.minX = this.minX < x0 ? this.minX : x0;
	        this.maxX = this.maxX > x1 ? this.maxX : x1;
	        this.minY = this.minY < y0 ? this.minY : y0;
	        this.maxY = this.maxY > y1 ? this.maxY : y1;
	    };
	    return Bounds;
	}());

	
	

	var extendStatics = function(d, b) {
	    extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics(d, b);
	};

	function __extends(d, b) {
	    extendStatics(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	
	var DisplayObject =  (function (_super) {
	    __extends(DisplayObject, _super);
	    function DisplayObject() {
	        var _this = _super.call(this) || this;
	        _this.tempDisplayObjectParent = null;
	        
	        
	        _this.transform = new Transform();
	        
	        _this.alpha = 1;
	        
	        _this.visible = true;
	        
	        _this.renderable = true;
	        
	        _this.parent = null;
	        
	        _this.worldAlpha = 1;
	        
	        _this._lastSortedIndex = 0;
	        
	        _this._zIndex = 0;
	        
	        _this.filterArea = null;
	        
	        _this.filters = null;
	        
	        _this._enabledFilters = null;
	        
	        _this._bounds = new Bounds();
	        
	        _this._localBounds = null;
	        
	        _this._boundsID = 0;
	        
	        _this._boundsRect = null;
	        
	        _this._localBoundsRect = null;
	        
	        _this._mask = null;
	        
	        
	        
	        _this._destroyed = false;
	        
	        _this.isSprite = false;
	        
	        _this.isMask = false;
	        return _this;
	    }
	    
	    DisplayObject.mixin = function (source) {
	        
	        
	        
	        var keys = Object.keys(source);
	        
	        for (var i = 0; i < keys.length; ++i) {
	            var propertyName = keys[i];
	            
	            Object.defineProperty(DisplayObject.prototype, propertyName, Object.getOwnPropertyDescriptor(source, propertyName));
	        }
	    };
	    
	    DisplayObject.prototype._recursivePostUpdateTransform = function () {
	        if (this.parent) {
	            this.parent._recursivePostUpdateTransform();
	            this.transform.updateTransform(this.parent.transform);
	        }
	        else {
	            this.transform.updateTransform(this._tempDisplayObjectParent.transform);
	        }
	    };
	    
	    DisplayObject.prototype.updateTransform = function () {
	        this._boundsID++;
	        this.transform.updateTransform(this.parent.transform);
	        
	        this.worldAlpha = this.alpha * this.parent.worldAlpha;
	    };
	    
	    DisplayObject.prototype.getBounds = function (skipUpdate, rect) {
	        if (!skipUpdate) {
	            if (!this.parent) {
	                this.parent = this._tempDisplayObjectParent;
	                this.updateTransform();
	                this.parent = null;
	            }
	            else {
	                this._recursivePostUpdateTransform();
	                this.updateTransform();
	            }
	        }
	        if (this._bounds.updateID !== this._boundsID) {
	            this.calculateBounds();
	            this._bounds.updateID = this._boundsID;
	        }
	        if (!rect) {
	            if (!this._boundsRect) {
	                this._boundsRect = new Rectangle();
	            }
	            rect = this._boundsRect;
	        }
	        return this._bounds.getRectangle(rect);
	    };
	    
	    DisplayObject.prototype.getLocalBounds = function (rect) {
	        if (!rect) {
	            if (!this._localBoundsRect) {
	                this._localBoundsRect = new Rectangle();
	            }
	            rect = this._localBoundsRect;
	        }
	        if (!this._localBounds) {
	            this._localBounds = new Bounds();
	        }
	        var transformRef = this.transform;
	        var parentRef = this.parent;
	        this.parent = null;
	        this.transform = this._tempDisplayObjectParent.transform;
	        var worldBounds = this._bounds;
	        var worldBoundsID = this._boundsID;
	        this._bounds = this._localBounds;
	        var bounds = this.getBounds(false, rect);
	        this.parent = parentRef;
	        this.transform = transformRef;
	        this._bounds = worldBounds;
	        this._bounds.updateID += this._boundsID - worldBoundsID; 
	        return bounds;
	    };
	    
	    DisplayObject.prototype.toGlobal = function (position, point, skipUpdate) {
	        if (skipUpdate === void 0) { skipUpdate = false; }
	        if (!skipUpdate) {
	            this._recursivePostUpdateTransform();
	            
	            
	            
	            if (!this.parent) {
	                this.parent = this._tempDisplayObjectParent;
	                this.displayObjectUpdateTransform();
	                this.parent = null;
	            }
	            else {
	                this.displayObjectUpdateTransform();
	            }
	        }
	        
	        return this.worldTransform.apply(position, point);
	    };
	    
	    DisplayObject.prototype.toLocal = function (position, from, point, skipUpdate) {
	        if (from) {
	            position = from.toGlobal(position, point, skipUpdate);
	        }
	        if (!skipUpdate) {
	            this._recursivePostUpdateTransform();
	            
	            
	            
	            if (!this.parent) {
	                this.parent = this._tempDisplayObjectParent;
	                this.displayObjectUpdateTransform();
	                this.parent = null;
	            }
	            else {
	                this.displayObjectUpdateTransform();
	            }
	        }
	        
	        return this.worldTransform.applyInverse(position, point);
	    };
	    
	    DisplayObject.prototype.setParent = function (container) {
	        if (!container || !container.addChild) {
	            throw new Error('setParent: Argument must be a Container');
	        }
	        container.addChild(this);
	        return container;
	    };
	    
	    DisplayObject.prototype.setTransform = function (x, y, scaleX, scaleY, rotation, skewX, skewY, pivotX, pivotY) {
	        if (x === void 0) { x = 0; }
	        if (y === void 0) { y = 0; }
	        if (scaleX === void 0) { scaleX = 1; }
	        if (scaleY === void 0) { scaleY = 1; }
	        if (rotation === void 0) { rotation = 0; }
	        if (skewX === void 0) { skewX = 0; }
	        if (skewY === void 0) { skewY = 0; }
	        if (pivotX === void 0) { pivotX = 0; }
	        if (pivotY === void 0) { pivotY = 0; }
	        this.position.x = x;
	        this.position.y = y;
	        this.scale.x = !scaleX ? 1 : scaleX;
	        this.scale.y = !scaleY ? 1 : scaleY;
	        this.rotation = rotation;
	        this.skew.x = skewX;
	        this.skew.y = skewY;
	        this.pivot.x = pivotX;
	        this.pivot.y = pivotY;
	        return this;
	    };
	    
	    DisplayObject.prototype.destroy = function (_options) {
	        if (this.parent) {
	            this.parent.removeChild(this);
	        }
	        this.removeAllListeners();
	        this.transform = null;
	        this.parent = null;
	        this._bounds = null;
	        this._mask = null;
	        this.filters = null;
	        this.filterArea = null;
	        this.hitArea = null;
	        this.interactive = false;
	        this.interactiveChildren = false;
	        this._destroyed = true;
	    };
	    Object.defineProperty(DisplayObject.prototype, "_tempDisplayObjectParent", {
	        
	        get: function () {
	            if (this.tempDisplayObjectParent === null) {
	                
	                this.tempDisplayObjectParent = new TemporaryDisplayObject();
	            }
	            return this.tempDisplayObjectParent;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    DisplayObject.prototype.enableTempParent = function () {
	        var myParent = this.parent;
	        this.parent = this._tempDisplayObjectParent;
	        return myParent;
	    };
	    
	    DisplayObject.prototype.disableTempParent = function (cacheParent) {
	        this.parent = cacheParent;
	    };
	    Object.defineProperty(DisplayObject.prototype, "x", {
	        
	        get: function () {
	            return this.position.x;
	        },
	        set: function (value) {
	            this.transform.position.x = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(DisplayObject.prototype, "y", {
	        
	        get: function () {
	            return this.position.y;
	        },
	        set: function (value) {
	            this.transform.position.y = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(DisplayObject.prototype, "worldTransform", {
	        
	        get: function () {
	            return this.transform.worldTransform;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(DisplayObject.prototype, "localTransform", {
	        
	        get: function () {
	            return this.transform.localTransform;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(DisplayObject.prototype, "position", {
	        
	        get: function () {
	            return this.transform.position;
	        },
	        set: function (value) {
	            this.transform.position.copyFrom(value);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(DisplayObject.prototype, "scale", {
	        
	        get: function () {
	            return this.transform.scale;
	        },
	        set: function (value) {
	            this.transform.scale.copyFrom(value);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(DisplayObject.prototype, "pivot", {
	        
	        get: function () {
	            return this.transform.pivot;
	        },
	        set: function (value) {
	            this.transform.pivot.copyFrom(value);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(DisplayObject.prototype, "skew", {
	        
	        get: function () {
	            return this.transform.skew;
	        },
	        set: function (value) {
	            this.transform.skew.copyFrom(value);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(DisplayObject.prototype, "rotation", {
	        
	        get: function () {
	            return this.transform.rotation;
	        },
	        set: function (value) {
	            this.transform.rotation = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(DisplayObject.prototype, "angle", {
	        
	        get: function () {
	            return this.transform.rotation * RAD_TO_DEG;
	        },
	        set: function (value) {
	            this.transform.rotation = value * DEG_TO_RAD;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(DisplayObject.prototype, "zIndex", {
	        
	        get: function () {
	            return this._zIndex;
	        },
	        set: function (value) {
	            this._zIndex = value;
	            if (this.parent) {
	                this.parent.sortDirty = true;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(DisplayObject.prototype, "worldVisible", {
	        
	        get: function () {
	            var item = this;
	            do {
	                if (!item.visible) {
	                    return false;
	                }
	                item = item.parent;
	            } while (item);
	            return true;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(DisplayObject.prototype, "mask", {
	        
	        get: function () {
	            return this._mask;
	        },
	        set: function (value) {
	            if (this._mask) {
	                var maskObject = (this._mask.maskObject || this._mask);
	                maskObject.renderable = true;
	                maskObject.isMask = false;
	            }
	            this._mask = value;
	            if (this._mask) {
	                var maskObject = (this._mask.maskObject || this._mask);
	                maskObject.renderable = false;
	                maskObject.isMask = true;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return DisplayObject;
	}(eventemitter3));
	var TemporaryDisplayObject =  (function (_super) {
	    __extends(TemporaryDisplayObject, _super);
	    function TemporaryDisplayObject() {
	        var _this = _super !== null && _super.apply(this, arguments) || this;
	        _this.sortDirty = null;
	        return _this;
	    }
	    return TemporaryDisplayObject;
	}(DisplayObject));
	
	DisplayObject.prototype.displayObjectUpdateTransform = DisplayObject.prototype.updateTransform;

	function sortChildren(a, b) {
	    if (a.zIndex === b.zIndex) {
	        return a._lastSortedIndex - b._lastSortedIndex;
	    }
	    return a.zIndex - b.zIndex;
	}
	
	var Container =  (function (_super) {
	    __extends(Container, _super);
	    function Container() {
	        var _this = _super.call(this) || this;
	        
	        _this.children = [];
	        
	        _this.sortableChildren = settings.SORTABLE_CHILDREN;
	        
	        _this.sortDirty = false;
	        return _this;
	        
	        
	    }
	    
	    Container.prototype.onChildrenChange = function (_length) {
	        
	    };
	    
	    Container.prototype.addChild = function () {
	        var arguments$1 = arguments;

	        var children = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            children[_i] = arguments$1[_i];
	        }
	        
	        if (children.length > 1) {
	            
	            for (var i = 0; i < children.length; i++) {
	                
	                this.addChild(children[i]);
	            }
	        }
	        else {
	            var child = children[0];
	            
	            if (child.parent) {
	                child.parent.removeChild(child);
	            }
	            child.parent = this;
	            this.sortDirty = true;
	            
	            child.transform._parentID = -1;
	            this.children.push(child);
	            
	            this._boundsID++;
	            
	            this.onChildrenChange(this.children.length - 1);
	            this.emit('childAdded', child, this, this.children.length - 1);
	            child.emit('added', this);
	        }
	        return children[0];
	    };
	    
	    Container.prototype.addChildAt = function (child, index) {
	        if (index < 0 || index > this.children.length) {
	            throw new Error(child + "addChildAt: The index " + index + " supplied is out of bounds " + this.children.length);
	        }
	        if (child.parent) {
	            child.parent.removeChild(child);
	        }
	        child.parent = this;
	        this.sortDirty = true;
	        
	        child.transform._parentID = -1;
	        this.children.splice(index, 0, child);
	        
	        this._boundsID++;
	        
	        this.onChildrenChange(index);
	        child.emit('added', this);
	        this.emit('childAdded', child, this, index);
	        return child;
	    };
	    
	    Container.prototype.swapChildren = function (child, child2) {
	        if (child === child2) {
	            return;
	        }
	        var index1 = this.getChildIndex(child);
	        var index2 = this.getChildIndex(child2);
	        this.children[index1] = child2;
	        this.children[index2] = child;
	        this.onChildrenChange(index1 < index2 ? index1 : index2);
	    };
	    
	    Container.prototype.getChildIndex = function (child) {
	        var index = this.children.indexOf(child);
	        if (index === -1) {
	            throw new Error('The supplied DisplayObject must be a child of the caller');
	        }
	        return index;
	    };
	    
	    Container.prototype.setChildIndex = function (child, index) {
	        if (index < 0 || index >= this.children.length) {
	            throw new Error("The index " + index + " supplied is out of bounds " + this.children.length);
	        }
	        var currentIndex = this.getChildIndex(child);
	        removeItems(this.children, currentIndex, 1); 
	        this.children.splice(index, 0, child); 
	        this.onChildrenChange(index);
	    };
	    
	    Container.prototype.getChildAt = function (index) {
	        if (index < 0 || index >= this.children.length) {
	            throw new Error("getChildAt: Index (" + index + ") does not exist.");
	        }
	        return this.children[index];
	    };
	    
	    Container.prototype.removeChild = function () {
	        var arguments$1 = arguments;

	        var children = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            children[_i] = arguments$1[_i];
	        }
	        
	        if (children.length > 1) {
	            
	            for (var i = 0; i < children.length; i++) {
	                this.removeChild(children[i]);
	            }
	        }
	        else {
	            var child = children[0];
	            var index = this.children.indexOf(child);
	            if (index === -1)
	                { return null; }
	            child.parent = null;
	            
	            child.transform._parentID = -1;
	            removeItems(this.children, index, 1);
	            
	            this._boundsID++;
	            
	            this.onChildrenChange(index);
	            child.emit('removed', this);
	            this.emit('childRemoved', child, this, index);
	        }
	        return children[0];
	    };
	    
	    Container.prototype.removeChildAt = function (index) {
	        var child = this.getChildAt(index);
	        
	        child.parent = null;
	        child.transform._parentID = -1;
	        removeItems(this.children, index, 1);
	        
	        this._boundsID++;
	        
	        this.onChildrenChange(index);
	        child.emit('removed', this);
	        this.emit('childRemoved', child, this, index);
	        return child;
	    };
	    
	    Container.prototype.removeChildren = function (beginIndex, endIndex) {
	        if (beginIndex === void 0) { beginIndex = 0; }
	        if (endIndex === void 0) { endIndex = this.children.length; }
	        var begin = beginIndex;
	        var end = endIndex;
	        var range = end - begin;
	        var removed;
	        if (range > 0 && range <= end) {
	            removed = this.children.splice(begin, range);
	            for (var i = 0; i < removed.length; ++i) {
	                removed[i].parent = null;
	                if (removed[i].transform) {
	                    removed[i].transform._parentID = -1;
	                }
	            }
	            this._boundsID++;
	            this.onChildrenChange(beginIndex);
	            for (var i = 0; i < removed.length; ++i) {
	                removed[i].emit('removed', this);
	                this.emit('childRemoved', removed[i], this, i);
	            }
	            return removed;
	        }
	        else if (range === 0 && this.children.length === 0) {
	            return [];
	        }
	        throw new RangeError('removeChildren: numeric values are outside the acceptable range.');
	    };
	    
	    Container.prototype.sortChildren = function () {
	        var sortRequired = false;
	        for (var i = 0, j = this.children.length; i < j; ++i) {
	            var child = this.children[i];
	            child._lastSortedIndex = i;
	            if (!sortRequired && child.zIndex !== 0) {
	                sortRequired = true;
	            }
	        }
	        if (sortRequired && this.children.length > 1) {
	            this.children.sort(sortChildren);
	        }
	        this.sortDirty = false;
	    };
	    
	    Container.prototype.updateTransform = function () {
	        if (this.sortableChildren && this.sortDirty) {
	            this.sortChildren();
	        }
	        this._boundsID++;
	        this.transform.updateTransform(this.parent.transform);
	        
	        this.worldAlpha = this.alpha * this.parent.worldAlpha;
	        for (var i = 0, j = this.children.length; i < j; ++i) {
	            var child = this.children[i];
	            if (child.visible) {
	                child.updateTransform();
	            }
	        }
	    };
	    
	    Container.prototype.calculateBounds = function () {
	        this._bounds.clear();
	        this._calculateBounds();
	        for (var i = 0; i < this.children.length; i++) {
	            var child = this.children[i];
	            if (!child.visible || !child.renderable) {
	                continue;
	            }
	            child.calculateBounds();
	            
	            if (child._mask) {
	                var maskObject = (child._mask.maskObject || child._mask);
	                maskObject.calculateBounds();
	                this._bounds.addBoundsMask(child._bounds, maskObject._bounds);
	            }
	            else if (child.filterArea) {
	                this._bounds.addBoundsArea(child._bounds, child.filterArea);
	            }
	            else {
	                this._bounds.addBounds(child._bounds);
	            }
	        }
	        this._bounds.updateID = this._boundsID;
	    };
	    
	    Container.prototype.getLocalBounds = function (rect, skipChildrenUpdate) {
	        if (skipChildrenUpdate === void 0) { skipChildrenUpdate = false; }
	        var result = _super.prototype.getLocalBounds.call(this, rect);
	        if (!skipChildrenUpdate) {
	            for (var i = 0, j = this.children.length; i < j; ++i) {
	                var child = this.children[i];
	                if (child.visible) {
	                    child.updateTransform();
	                }
	            }
	        }
	        return result;
	    };
	    
	    Container.prototype._calculateBounds = function () {
	        
	    };
	    
	    Container.prototype.render = function (renderer) {
	        
	        if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
	            return;
	        }
	        
	        if (this._mask || (this.filters && this.filters.length)) {
	            this.renderAdvanced(renderer);
	        }
	        else {
	            this._render(renderer);
	            
	            for (var i = 0, j = this.children.length; i < j; ++i) {
	                this.children[i].render(renderer);
	            }
	        }
	    };
	    
	    Container.prototype.renderAdvanced = function (renderer) {
	        renderer.batch.flush();
	        var filters = this.filters;
	        var mask = this._mask;
	        
	        if (filters) {
	            if (!this._enabledFilters) {
	                this._enabledFilters = [];
	            }
	            this._enabledFilters.length = 0;
	            for (var i = 0; i < filters.length; i++) {
	                if (filters[i].enabled) {
	                    this._enabledFilters.push(filters[i]);
	                }
	            }
	            if (this._enabledFilters.length) {
	                renderer.filter.push(this, this._enabledFilters);
	            }
	        }
	        if (mask) {
	            renderer.mask.push(this, this._mask);
	        }
	        
	        this._render(renderer);
	        
	        for (var i = 0, j = this.children.length; i < j; i++) {
	            this.children[i].render(renderer);
	        }
	        renderer.batch.flush();
	        if (mask) {
	            renderer.mask.pop(this);
	        }
	        if (filters && this._enabledFilters && this._enabledFilters.length) {
	            renderer.filter.pop();
	        }
	    };
	    
	    Container.prototype._render = function (_renderer) {
	        
	    };
	    
	    Container.prototype.destroy = function (options) {
	        _super.prototype.destroy.call(this);
	        this.sortDirty = false;
	        var destroyChildren = typeof options === 'boolean' ? options : options && options.children;
	        var oldChildren = this.removeChildren(0, this.children.length);
	        if (destroyChildren) {
	            for (var i = 0; i < oldChildren.length; ++i) {
	                oldChildren[i].destroy(options);
	            }
	        }
	    };
	    Object.defineProperty(Container.prototype, "width", {
	        
	        get: function () {
	            return this.scale.x * this.getLocalBounds().width;
	        },
	        set: function (value) {
	            var width = this.getLocalBounds().width;
	            if (width !== 0) {
	                this.scale.x = value / width;
	            }
	            else {
	                this.scale.x = 1;
	            }
	            this._width = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Container.prototype, "height", {
	        
	        get: function () {
	            return this.scale.y * this.getLocalBounds().height;
	        },
	        set: function (value) {
	            var height = this.getLocalBounds().height;
	            if (height !== 0) {
	                this.scale.y = value / height;
	            }
	            else {
	                this.scale.y = 1;
	            }
	            this._height = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return Container;
	}(DisplayObject));
	
	Container.prototype.containerUpdateTransform = Container.prototype.updateTransform;

	

	
	var accessibleTarget = {
	    
	    accessible: false,
	    
	    accessibleTitle: null,
	    
	    accessibleHint: null,
	    
	    tabIndex: 0,
	    
	    _accessibleActive: false,
	    
	    _accessibleDiv: null,
	    
	    accessibleType: 'button',
	    
	    accessiblePointerEvents: 'auto',
	    
	    accessibleChildren: true,
	    renderId: -1,
	};

	
	DisplayObject.mixin(accessibleTarget);
	var KEY_CODE_TAB = 9;
	var DIV_TOUCH_SIZE = 100;
	var DIV_TOUCH_POS_X = 0;
	var DIV_TOUCH_POS_Y = 0;
	var DIV_TOUCH_ZINDEX = 2;
	var DIV_HOOK_SIZE = 1;
	var DIV_HOOK_POS_X = -1000;
	var DIV_HOOK_POS_Y = -1000;
	var DIV_HOOK_ZINDEX = 2;
	
	var AccessibilityManager =  (function () {
	    
	    function AccessibilityManager(renderer) {
	        
	        this._hookDiv = null;
	        if (isMobile$1.tablet || isMobile$1.phone) {
	            this.createTouchHook();
	        }
	        
	        var div = document.createElement('div');
	        div.style.width = DIV_TOUCH_SIZE + "px";
	        div.style.height = DIV_TOUCH_SIZE + "px";
	        div.style.position = 'absolute';
	        div.style.top = DIV_TOUCH_POS_X + "px";
	        div.style.left = DIV_TOUCH_POS_Y + "px";
	        div.style.zIndex = DIV_TOUCH_ZINDEX.toString();
	        
	        this.div = div;
	        
	        this.pool = [];
	        
	        this.renderId = 0;
	        
	        this.debug = false;
	        
	        this.renderer = renderer;
	        
	        this.children = [];
	        
	        this._onKeyDown = this._onKeyDown.bind(this);
	        
	        this._onMouseMove = this._onMouseMove.bind(this);
	        this._isActive = false;
	        this._isMobileAccessibility = false;
	        
	        this.androidUpdateCount = 0;
	        
	        this.androidUpdateFrequency = 500; 
	        
	        window.addEventListener('keydown', this._onKeyDown, false);
	    }
	    Object.defineProperty(AccessibilityManager.prototype, "isActive", {
	        
	        get: function () {
	            return this._isActive;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(AccessibilityManager.prototype, "isMobileAccessibility", {
	        
	        get: function () {
	            return this._isMobileAccessibility;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    AccessibilityManager.prototype.createTouchHook = function () {
	        var _this = this;
	        var hookDiv = document.createElement('button');
	        hookDiv.style.width = DIV_HOOK_SIZE + "px";
	        hookDiv.style.height = DIV_HOOK_SIZE + "px";
	        hookDiv.style.position = 'absolute';
	        hookDiv.style.top = DIV_HOOK_POS_X + "px";
	        hookDiv.style.left = DIV_HOOK_POS_Y + "px";
	        hookDiv.style.zIndex = DIV_HOOK_ZINDEX.toString();
	        hookDiv.style.backgroundColor = '#FF0000';
	        hookDiv.title = 'select to enable accessability for this content';
	        hookDiv.addEventListener('focus', function () {
	            _this._isMobileAccessibility = true;
	            _this.activate();
	            _this.destroyTouchHook();
	        });
	        document.body.appendChild(hookDiv);
	        this._hookDiv = hookDiv;
	    };
	    
	    AccessibilityManager.prototype.destroyTouchHook = function () {
	        if (!this._hookDiv) {
	            return;
	        }
	        document.body.removeChild(this._hookDiv);
	        this._hookDiv = null;
	    };
	    
	    AccessibilityManager.prototype.activate = function () {
	        if (this._isActive) {
	            return;
	        }
	        this._isActive = true;
	        window.document.addEventListener('mousemove', this._onMouseMove, true);
	        window.removeEventListener('keydown', this._onKeyDown, false);
	        
	        this.renderer.on('postrender', this.update, this);
	        if (this.renderer.view.parentNode) {
	            this.renderer.view.parentNode.appendChild(this.div);
	        }
	    };
	    
	    AccessibilityManager.prototype.deactivate = function () {
	        if (!this._isActive || this._isMobileAccessibility) {
	            return;
	        }
	        this._isActive = false;
	        window.document.removeEventListener('mousemove', this._onMouseMove, true);
	        window.addEventListener('keydown', this._onKeyDown, false);
	        
	        this.renderer.off('postrender', this.update);
	        if (this.div.parentNode) {
	            this.div.parentNode.removeChild(this.div);
	        }
	    };
	    
	    AccessibilityManager.prototype.updateAccessibleObjects = function (displayObject) {
	        if (!displayObject.visible || !displayObject.accessibleChildren) {
	            return;
	        }
	        if (displayObject.accessible && displayObject.interactive) {
	            if (!displayObject._accessibleActive) {
	                this.addChild(displayObject);
	            }
	            displayObject.renderId = this.renderId;
	        }
	        var children = displayObject.children;
	        for (var i = 0; i < children.length; i++) {
	            this.updateAccessibleObjects(children[i]);
	        }
	    };
	    
	    AccessibilityManager.prototype.update = function () {
	        
	        var now = performance.now();
	        if (isMobile$1.android.device && now < this.androidUpdateCount) {
	            return;
	        }
	        this.androidUpdateCount = now + this.androidUpdateFrequency;
	        if (!this.renderer.renderingToScreen) {
	            return;
	        }
	        
	        if (this.renderer._lastObjectRendered) {
	            this.updateAccessibleObjects(this.renderer._lastObjectRendered);
	        }
	        
	        var rect = this.renderer.view.getBoundingClientRect();
	        var resolution = this.renderer.resolution;
	        var sx = (rect.width / this.renderer.width) * resolution;
	        var sy = (rect.height / this.renderer.height) * resolution;
	        var div = this.div;
	        div.style.left = rect.left + "px";
	        div.style.top = rect.top + "px";
	        div.style.width = this.renderer.width + "px";
	        div.style.height = this.renderer.height + "px";
	        for (var i = 0; i < this.children.length; i++) {
	            var child = this.children[i];
	            if (child.renderId !== this.renderId) {
	                child._accessibleActive = false;
	                removeItems(this.children, i, 1);
	                this.div.removeChild(child._accessibleDiv);
	                this.pool.push(child._accessibleDiv);
	                child._accessibleDiv = null;
	                i--;
	            }
	            else {
	                
	                div = child._accessibleDiv;
	                var hitArea = child.hitArea;
	                var wt = child.worldTransform;
	                if (child.hitArea) {
	                    div.style.left = (wt.tx + (hitArea.x * wt.a)) * sx + "px";
	                    div.style.top = (wt.ty + (hitArea.y * wt.d)) * sy + "px";
	                    div.style.width = hitArea.width * wt.a * sx + "px";
	                    div.style.height = hitArea.height * wt.d * sy + "px";
	                }
	                else {
	                    hitArea = child.getBounds();
	                    this.capHitArea(hitArea);
	                    div.style.left = hitArea.x * sx + "px";
	                    div.style.top = hitArea.y * sy + "px";
	                    div.style.width = hitArea.width * sx + "px";
	                    div.style.height = hitArea.height * sy + "px";
	                    
	                    if (div.title !== child.accessibleTitle && child.accessibleTitle !== null) {
	                        div.title = child.accessibleTitle;
	                    }
	                    if (div.getAttribute('aria-label') !== child.accessibleHint
	                        && child.accessibleHint !== null) {
	                        div.setAttribute('aria-label', child.accessibleHint);
	                    }
	                }
	                
	                if (child.accessibleTitle !== div.title || child.tabIndex !== div.tabIndex) {
	                    div.title = child.accessibleTitle;
	                    div.tabIndex = child.tabIndex;
	                    if (this.debug)
	                        { this.updateDebugHTML(div); }
	                }
	            }
	        }
	        
	        this.renderId++;
	    };
	    
	    AccessibilityManager.prototype.updateDebugHTML = function (div) {
	        div.innerHTML = "type: " + div.type + "</br> title : " + div.title + "</br> tabIndex: " + div.tabIndex;
	    };
	    
	    AccessibilityManager.prototype.capHitArea = function (hitArea) {
	        if (hitArea.x < 0) {
	            hitArea.width += hitArea.x;
	            hitArea.x = 0;
	        }
	        if (hitArea.y < 0) {
	            hitArea.height += hitArea.y;
	            hitArea.y = 0;
	        }
	        
	        if (hitArea.x + hitArea.width > this.renderer.width) {
	            hitArea.width = this.renderer.width - hitArea.x;
	        }
	        if (hitArea.y + hitArea.height > this.renderer.height) {
	            hitArea.height = this.renderer.height - hitArea.y;
	        }
	    };
	    
	    AccessibilityManager.prototype.addChild = function (displayObject) {
	        
	        var div = this.pool.pop();
	        if (!div) {
	            div = document.createElement('button');
	            div.style.width = DIV_TOUCH_SIZE + "px";
	            div.style.height = DIV_TOUCH_SIZE + "px";
	            div.style.backgroundColor = this.debug ? 'rgba(255,255,255,0.5)' : 'transparent';
	            div.style.position = 'absolute';
	            div.style.zIndex = DIV_TOUCH_ZINDEX.toString();
	            div.style.borderStyle = 'none';
	            
	            if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
	                
	                div.setAttribute('aria-live', 'off');
	            }
	            else {
	                div.setAttribute('aria-live', 'polite');
	            }
	            if (navigator.userAgent.match(/rv:.*Gecko\
	                
	                div.setAttribute('aria-relevant', 'additions');
	            }
	            else {
	                
	                div.setAttribute('aria-relevant', 'text');
	            }
	            div.addEventListener('click', this._onClick.bind(this));
	            div.addEventListener('focus', this._onFocus.bind(this));
	            div.addEventListener('focusout', this._onFocusOut.bind(this));
	        }
	        
	        div.style.pointerEvents = displayObject.accessiblePointerEvents;
	        
	        div.type = displayObject.accessibleType;
	        if (displayObject.accessibleTitle && displayObject.accessibleTitle !== null) {
	            div.title = displayObject.accessibleTitle;
	        }
	        else if (!displayObject.accessibleHint
	            || displayObject.accessibleHint === null) {
	            div.title = "displayObject " + displayObject.tabIndex;
	        }
	        if (displayObject.accessibleHint
	            && displayObject.accessibleHint !== null) {
	            div.setAttribute('aria-label', displayObject.accessibleHint);
	        }
	        if (this.debug)
	            { this.updateDebugHTML(div); }
	        displayObject._accessibleActive = true;
	        displayObject._accessibleDiv = div;
	        div.displayObject = displayObject;
	        this.children.push(displayObject);
	        this.div.appendChild(displayObject._accessibleDiv);
	        displayObject._accessibleDiv.tabIndex = displayObject.tabIndex;
	    };
	    
	    AccessibilityManager.prototype._onClick = function (e) {
	        
	        var interactionManager = this.renderer.plugins.interaction;
	        interactionManager.dispatchEvent(e.target.displayObject, 'click', interactionManager.eventData);
	        interactionManager.dispatchEvent(e.target.displayObject, 'pointertap', interactionManager.eventData);
	        interactionManager.dispatchEvent(e.target.displayObject, 'tap', interactionManager.eventData);
	    };
	    
	    AccessibilityManager.prototype._onFocus = function (e) {
	        if (!e.target.getAttribute('aria-live')) {
	            e.target.setAttribute('aria-live', 'assertive');
	        }
	        
	        var interactionManager = this.renderer.plugins.interaction;
	        interactionManager.dispatchEvent(e.target.displayObject, 'mouseover', interactionManager.eventData);
	    };
	    
	    AccessibilityManager.prototype._onFocusOut = function (e) {
	        if (!e.target.getAttribute('aria-live')) {
	            e.target.setAttribute('aria-live', 'polite');
	        }
	        
	        var interactionManager = this.renderer.plugins.interaction;
	        interactionManager.dispatchEvent(e.target.displayObject, 'mouseout', interactionManager.eventData);
	    };
	    
	    AccessibilityManager.prototype._onKeyDown = function (e) {
	        if (e.keyCode !== KEY_CODE_TAB) {
	            return;
	        }
	        this.activate();
	    };
	    
	    AccessibilityManager.prototype._onMouseMove = function (e) {
	        if (e.movementX === 0 && e.movementY === 0) {
	            return;
	        }
	        this.deactivate();
	    };
	    
	    AccessibilityManager.prototype.destroy = function () {
	        this.destroyTouchHook();
	        this.div = null;
	        window.document.removeEventListener('mousemove', this._onMouseMove, true);
	        window.removeEventListener('keydown', this._onKeyDown);
	        this.pool = null;
	        this.children = null;
	        this.renderer = null;
	    };
	    return AccessibilityManager;
	}());

	

	
	settings.TARGET_FPMS = 0.06;

	

	(function (UPDATE_PRIORITY) {
	    UPDATE_PRIORITY[UPDATE_PRIORITY["INTERACTION"] = 50] = "INTERACTION";
	    UPDATE_PRIORITY[UPDATE_PRIORITY["HIGH"] = 25] = "HIGH";
	    UPDATE_PRIORITY[UPDATE_PRIORITY["NORMAL"] = 0] = "NORMAL";
	    UPDATE_PRIORITY[UPDATE_PRIORITY["LOW"] = -25] = "LOW";
	    UPDATE_PRIORITY[UPDATE_PRIORITY["UTILITY"] = -50] = "UTILITY";
	})(exports.UPDATE_PRIORITY || (exports.UPDATE_PRIORITY = {}));

	
	var TickerListener =  (function () {
	    
	    function TickerListener(fn, context, priority, once) {
	        if (context === void 0) { context = null; }
	        if (priority === void 0) { priority = 0; }
	        if (once === void 0) { once = false; }
	        
	        this.fn = fn;
	        
	        this.context = context;
	        
	        this.priority = priority;
	        
	        this.once = once;
	        
	        this.next = null;
	        
	        this.previous = null;
	        
	        this._destroyed = false;
	    }
	    
	    TickerListener.prototype.match = function (fn, context) {
	        if (context === void 0) { context = null; }
	        return this.fn === fn && this.context === context;
	    };
	    
	    TickerListener.prototype.emit = function (deltaTime) {
	        if (this.fn) {
	            if (this.context) {
	                this.fn.call(this.context, deltaTime);
	            }
	            else {
	                this.fn(deltaTime);
	            }
	        }
	        var redirect = this.next;
	        if (this.once) {
	            this.destroy(true);
	        }
	        
	        
	        if (this._destroyed) {
	            this.next = null;
	        }
	        return redirect;
	    };
	    
	    TickerListener.prototype.connect = function (previous) {
	        this.previous = previous;
	        if (previous.next) {
	            previous.next.previous = this;
	        }
	        this.next = previous.next;
	        previous.next = this;
	    };
	    
	    TickerListener.prototype.destroy = function (hard) {
	        if (hard === void 0) { hard = false; }
	        this._destroyed = true;
	        this.fn = null;
	        this.context = null;
	        
	        if (this.previous) {
	            this.previous.next = this.next;
	        }
	        if (this.next) {
	            this.next.previous = this.previous;
	        }
	        
	        var redirect = this.next;
	        
	        this.next = hard ? null : redirect;
	        this.previous = null;
	        return redirect;
	    };
	    return TickerListener;
	}());

	
	var Ticker =  (function () {
	    function Ticker() {
	        var _this = this;
	        
	        this._head = new TickerListener(null, null, Infinity);
	        
	        this._requestId = null;
	        
	        this._maxElapsedMS = 100;
	        
	        this._minElapsedMS = 0;
	        
	        this.autoStart = false;
	        
	        this.deltaTime = 1;
	        
	        this.deltaMS = 1 / settings.TARGET_FPMS;
	        
	        this.elapsedMS = 1 / settings.TARGET_FPMS;
	        
	        this.lastTime = -1;
	        
	        this.speed = 1;
	        
	        this.started = false;
	        
	        this._protected = false;
	        
	        this._lastFrame = -1;
	        
	        this._tick = function (time) {
	            _this._requestId = null;
	            if (_this.started) {
	                
	                _this.update(time);
	                
	                if (_this.started && _this._requestId === null && _this._head.next) {
	                    _this._requestId = requestAnimationFrame(_this._tick);
	                }
	            }
	        };
	    }
	    
	    Ticker.prototype._requestIfNeeded = function () {
	        if (this._requestId === null && this._head.next) {
	            
	            this.lastTime = performance.now();
	            this._lastFrame = this.lastTime;
	            this._requestId = requestAnimationFrame(this._tick);
	        }
	    };
	    
	    Ticker.prototype._cancelIfNeeded = function () {
	        if (this._requestId !== null) {
	            cancelAnimationFrame(this._requestId);
	            this._requestId = null;
	        }
	    };
	    
	    Ticker.prototype._startIfPossible = function () {
	        if (this.started) {
	            this._requestIfNeeded();
	        }
	        else if (this.autoStart) {
	            this.start();
	        }
	    };
	    
	    Ticker.prototype.add = function (fn, context, priority) {
	        if (priority === void 0) { priority = exports.UPDATE_PRIORITY.NORMAL; }
	        return this._addListener(new TickerListener(fn, context, priority));
	    };
	    
	    Ticker.prototype.addOnce = function (fn, context, priority) {
	        if (priority === void 0) { priority = exports.UPDATE_PRIORITY.NORMAL; }
	        return this._addListener(new TickerListener(fn, context, priority, true));
	    };
	    
	    Ticker.prototype._addListener = function (listener) {
	        
	        var current = this._head.next;
	        var previous = this._head;
	        
	        if (!current) {
	            listener.connect(previous);
	        }
	        else {
	            
	            while (current) {
	                if (listener.priority > current.priority) {
	                    listener.connect(previous);
	                    break;
	                }
	                previous = current;
	                current = current.next;
	            }
	            
	            if (!listener.previous) {
	                listener.connect(previous);
	            }
	        }
	        this._startIfPossible();
	        return this;
	    };
	    
	    Ticker.prototype.remove = function (fn, context) {
	        var listener = this._head.next;
	        while (listener) {
	            
	            
	            
	            if (listener.match(fn, context)) {
	                listener = listener.destroy();
	            }
	            else {
	                listener = listener.next;
	            }
	        }
	        if (!this._head.next) {
	            this._cancelIfNeeded();
	        }
	        return this;
	    };
	    Object.defineProperty(Ticker.prototype, "count", {
	        
	        get: function () {
	            if (!this._head) {
	                return 0;
	            }
	            var count = 0;
	            var current = this._head;
	            while ((current = current.next)) {
	                count++;
	            }
	            return count;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    Ticker.prototype.start = function () {
	        if (!this.started) {
	            this.started = true;
	            this._requestIfNeeded();
	        }
	    };
	    
	    Ticker.prototype.stop = function () {
	        if (this.started) {
	            this.started = false;
	            this._cancelIfNeeded();
	        }
	    };
	    
	    Ticker.prototype.destroy = function () {
	        if (!this._protected) {
	            this.stop();
	            var listener = this._head.next;
	            while (listener) {
	                listener = listener.destroy(true);
	            }
	            this._head.destroy();
	            this._head = null;
	        }
	    };
	    
	    Ticker.prototype.update = function (currentTime) {
	        if (currentTime === void 0) { currentTime = performance.now(); }
	        var elapsedMS;
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        if (currentTime > this.lastTime) {
	            
	            elapsedMS = this.elapsedMS = currentTime - this.lastTime;
	            
	            if (elapsedMS > this._maxElapsedMS) {
	                elapsedMS = this._maxElapsedMS;
	            }
	            elapsedMS *= this.speed;
	            
	            
	            
	            if (this._minElapsedMS) {
	                var delta = currentTime - this._lastFrame | 0;
	                if (delta < this._minElapsedMS) {
	                    return;
	                }
	                this._lastFrame = currentTime - (delta % this._minElapsedMS);
	            }
	            this.deltaMS = elapsedMS;
	            this.deltaTime = this.deltaMS * settings.TARGET_FPMS;
	            
	            
	            var head = this._head;
	            
	            var listener = head.next;
	            while (listener) {
	                listener = listener.emit(this.deltaTime);
	            }
	            if (!head.next) {
	                this._cancelIfNeeded();
	            }
	        }
	        else {
	            this.deltaTime = this.deltaMS = this.elapsedMS = 0;
	        }
	        this.lastTime = currentTime;
	    };
	    Object.defineProperty(Ticker.prototype, "FPS", {
	        
	        get: function () {
	            return 1000 / this.elapsedMS;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Ticker.prototype, "minFPS", {
	        
	        get: function () {
	            return 1000 / this._maxElapsedMS;
	        },
	        set: function (fps) {
	            
	            var minFPS = Math.min(this.maxFPS, fps);
	            
	            var minFPMS = Math.min(Math.max(0, minFPS) / 1000, settings.TARGET_FPMS);
	            this._maxElapsedMS = 1 / minFPMS;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Ticker.prototype, "maxFPS", {
	        
	        get: function () {
	            if (this._minElapsedMS) {
	                return Math.round(1000 / this._minElapsedMS);
	            }
	            return 0;
	        },
	        set: function (fps) {
	            if (fps === 0) {
	                this._minElapsedMS = 0;
	            }
	            else {
	                
	                var maxFPS = Math.max(this.minFPS, fps);
	                this._minElapsedMS = 1 / (maxFPS / 1000);
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Ticker, "shared", {
	        
	        get: function () {
	            if (!Ticker._shared) {
	                var shared = Ticker._shared = new Ticker();
	                shared.autoStart = true;
	                shared._protected = true;
	            }
	            return Ticker._shared;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Ticker, "system", {
	        
	        get: function () {
	            if (!Ticker._system) {
	                var system = Ticker._system = new Ticker();
	                system.autoStart = true;
	                system._protected = true;
	            }
	            return Ticker._system;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return Ticker;
	}());

	
	var TickerPlugin =  (function () {
	    function TickerPlugin() {
	    }
	    
	    TickerPlugin.init = function (options) {
	        var _this = this;
	        
	        options = Object.assign({
	            autoStart: true,
	            sharedTicker: false,
	        }, options);
	        
	        Object.defineProperty(this, 'ticker', {
	            set: function (ticker) {
	                if (this._ticker) {
	                    this._ticker.remove(this.render, this);
	                }
	                this._ticker = ticker;
	                if (ticker) {
	                    ticker.add(this.render, this, exports.UPDATE_PRIORITY.LOW);
	                }
	            },
	            get: function () {
	                return this._ticker;
	            },
	        });
	        
	        this.stop = function () {
	            _this._ticker.stop();
	        };
	        
	        this.start = function () {
	            _this._ticker.start();
	        };
	        
	        this._ticker = null;
	        
	        this.ticker = options.sharedTicker ? Ticker.shared : new Ticker();
	        
	        if (options.autoStart) {
	            this.start();
	        }
	    };
	    
	    TickerPlugin.destroy = function () {
	        if (this._ticker) {
	            var oldTicker = this._ticker;
	            this.ticker = null;
	            oldTicker.destroy();
	        }
	    };
	    return TickerPlugin;
	}());

	

	
	var InteractionData =  (function () {
	    function InteractionData() {
	        this.pressure = 0;
	        this.rotationAngle = 0;
	        this.twist = 0;
	        this.tangentialPressure = 0;
	        
	        this.global = new Point();
	        
	        this.target = null;
	        
	        this.originalEvent = null;
	        
	        this.identifier = null;
	        
	        this.isPrimary = false;
	        
	        this.button = 0;
	        
	        this.buttons = 0;
	        
	        this.width = 0;
	        
	        this.height = 0;
	        
	        this.tiltX = 0;
	        
	        this.tiltY = 0;
	        
	        this.pointerType = null;
	        
	        this.pressure = 0;
	        
	        this.rotationAngle = 0;
	        
	        this.twist = 0;
	        
	        this.tangentialPressure = 0;
	    }
	    Object.defineProperty(InteractionData.prototype, "pointerId", {
	        
	        get: function () {
	            return this.identifier;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    InteractionData.prototype.getLocalPosition = function (displayObject, point, globalPos) {
	        return displayObject.worldTransform.applyInverse(globalPos || this.global, point);
	    };
	    
	    InteractionData.prototype.copyEvent = function (event) {
	        
	        
	        
	        if ('isPrimary' in event && event.isPrimary) {
	            this.isPrimary = true;
	        }
	        this.button = 'button' in event && event.button;
	        
	        
	        var buttons = 'buttons' in event && event.buttons;
	        this.buttons = Number.isInteger(buttons) ? buttons : 'which' in event && event.which;
	        this.width = 'width' in event && event.width;
	        this.height = 'height' in event && event.height;
	        this.tiltX = 'tiltX' in event && event.tiltX;
	        this.tiltY = 'tiltY' in event && event.tiltY;
	        this.pointerType = 'pointerType' in event && event.pointerType;
	        this.pressure = 'pressure' in event && event.pressure;
	        this.rotationAngle = 'rotationAngle' in event && event.rotationAngle;
	        this.twist = ('twist' in event && event.twist) || 0;
	        this.tangentialPressure = ('tangentialPressure' in event && event.tangentialPressure) || 0;
	    };
	    
	    InteractionData.prototype.reset = function () {
	        
	        
	        this.isPrimary = false;
	    };
	    return InteractionData;
	}());

	
	

	var extendStatics$1 = function(d, b) {
	    extendStatics$1 = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$1(d, b);
	};

	function __extends$1(d, b) {
	    extendStatics$1(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	
	var InteractionEvent =  (function () {
	    function InteractionEvent() {
	        
	        this.stopped = false;
	        
	        this.stopsPropagatingAt = null;
	        
	        this.stopPropagationHint = false;
	        
	        this.target = null;
	        
	        this.currentTarget = null;
	        
	        this.type = null;
	        
	        this.data = null;
	    }
	    
	    InteractionEvent.prototype.stopPropagation = function () {
	        this.stopped = true;
	        this.stopPropagationHint = true;
	        this.stopsPropagatingAt = this.currentTarget;
	    };
	    
	    InteractionEvent.prototype.reset = function () {
	        this.stopped = false;
	        this.stopsPropagatingAt = null;
	        this.stopPropagationHint = false;
	        this.currentTarget = null;
	        this.target = null;
	    };
	    return InteractionEvent;
	}());

	
	var InteractionTrackingData =  (function () {
	    
	    function InteractionTrackingData(pointerId) {
	        this._pointerId = pointerId;
	        this._flags = InteractionTrackingData.FLAGS.NONE;
	    }
	    
	    InteractionTrackingData.prototype._doSet = function (flag, yn) {
	        if (yn) {
	            this._flags = this._flags | flag;
	        }
	        else {
	            this._flags = this._flags & (~flag);
	        }
	    };
	    Object.defineProperty(InteractionTrackingData.prototype, "pointerId", {
	        
	        get: function () {
	            return this._pointerId;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(InteractionTrackingData.prototype, "flags", {
	        
	        get: function () {
	            return this._flags;
	        },
	        set: function (flags) {
	            this._flags = flags;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(InteractionTrackingData.prototype, "none", {
	        
	        get: function () {
	            return this._flags === InteractionTrackingData.FLAGS.NONE;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(InteractionTrackingData.prototype, "over", {
	        
	        get: function () {
	            return (this._flags & InteractionTrackingData.FLAGS.OVER) !== 0;
	        },
	        set: function (yn) {
	            this._doSet(InteractionTrackingData.FLAGS.OVER, yn);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(InteractionTrackingData.prototype, "rightDown", {
	        
	        get: function () {
	            return (this._flags & InteractionTrackingData.FLAGS.RIGHT_DOWN) !== 0;
	        },
	        set: function (yn) {
	            this._doSet(InteractionTrackingData.FLAGS.RIGHT_DOWN, yn);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(InteractionTrackingData.prototype, "leftDown", {
	        
	        get: function () {
	            return (this._flags & InteractionTrackingData.FLAGS.LEFT_DOWN) !== 0;
	        },
	        set: function (yn) {
	            this._doSet(InteractionTrackingData.FLAGS.LEFT_DOWN, yn);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    InteractionTrackingData.FLAGS = Object.freeze({
	        NONE: 0,
	        OVER: 1 << 0,
	        LEFT_DOWN: 1 << 1,
	        RIGHT_DOWN: 1 << 2,
	    });
	    return InteractionTrackingData;
	}());

	
	var TreeSearch =  (function () {
	    function TreeSearch() {
	        this._tempPoint = new Point();
	    }
	    
	    TreeSearch.prototype.recursiveFindHit = function (interactionEvent, displayObject, func, hitTest, interactive) {
	        if (!displayObject || !displayObject.visible) {
	            return false;
	        }
	        var point = interactionEvent.data.global;
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        interactive = displayObject.interactive || interactive;
	        var hit = false;
	        var interactiveParent = interactive;
	        
	        var hitTestChildren = true;
	        
	        
	        if (displayObject.hitArea) {
	            if (hitTest) {
	                displayObject.worldTransform.applyInverse(point, this._tempPoint);
	                if (!displayObject.hitArea.contains(this._tempPoint.x, this._tempPoint.y)) {
	                    hitTest = false;
	                    hitTestChildren = false;
	                }
	                else {
	                    hit = true;
	                }
	            }
	            interactiveParent = false;
	        }
	        
	        
	        
	        else if (displayObject._mask) {
	            if (hitTest) {
	                if (!(displayObject._mask.containsPoint && displayObject._mask.containsPoint(point))) {
	                    hitTest = false;
	                }
	            }
	        }
	        
	        
	        
	        if (hitTestChildren && displayObject.interactiveChildren && displayObject.children) {
	            var children = displayObject.children;
	            for (var i = children.length - 1; i >= 0; i--) {
	                var child = children[i];
	                
	                var childHit = this.recursiveFindHit(interactionEvent, child, func, hitTest, interactiveParent);
	                if (childHit) {
	                    
	                    
	                    if (!child.parent) {
	                        continue;
	                    }
	                    
	                    
	                    interactiveParent = false;
	                    
	                    
	                    
	                    
	                    if (childHit) {
	                        if (interactionEvent.target) {
	                            hitTest = false;
	                        }
	                        hit = true;
	                    }
	                }
	            }
	        }
	        
	        if (interactive) {
	            
	            
	            
	            
	            if (hitTest && !interactionEvent.target) {
	                
	                if (!displayObject.hitArea && displayObject.containsPoint) {
	                    if (displayObject.containsPoint(point)) {
	                        hit = true;
	                    }
	                }
	            }
	            if (displayObject.interactive) {
	                if (hit && !interactionEvent.target) {
	                    interactionEvent.target = displayObject;
	                }
	                if (func) {
	                    func(interactionEvent, displayObject, !!hit);
	                }
	            }
	        }
	        return hit;
	    };
	    
	    TreeSearch.prototype.findHit = function (interactionEvent, displayObject, func, hitTest) {
	        this.recursiveFindHit(interactionEvent, displayObject, func, hitTest, false);
	    };
	    return TreeSearch;
	}());

	
	
	
	var interactiveTarget = {
	    
	    interactive: false,
	    
	    interactiveChildren: true,
	    
	    hitArea: null,
	    
	    get buttonMode() {
	        return this.cursor === 'pointer';
	    },
	    set buttonMode(value) {
	        if (value) {
	            this.cursor = 'pointer';
	        }
	        else if (this.cursor === 'pointer') {
	            this.cursor = null;
	        }
	    },
	    
	    cursor: null,
	    
	    get trackedPointers() {
	        if (this._trackedPointers === undefined)
	            { this._trackedPointers = {}; }
	        return this._trackedPointers;
	    },
	    
	    _trackedPointers: undefined,
	};

	
	
	DisplayObject.mixin(interactiveTarget);
	var MOUSE_POINTER_ID = 1;
	
	var hitTestEvent = {
	    target: null,
	    data: {
	        global: null,
	    },
	};
	
	var InteractionManager =  (function (_super) {
	    __extends$1(InteractionManager, _super);
	    
	    function InteractionManager(renderer, options) {
	        var _this = _super.call(this) || this;
	        options = options || {};
	        
	        _this.renderer = renderer;
	        
	        _this.autoPreventDefault = options.autoPreventDefault !== undefined ? options.autoPreventDefault : true;
	        
	        _this.interactionFrequency = options.interactionFrequency || 10;
	        
	        _this.mouse = new InteractionData();
	        _this.mouse.identifier = MOUSE_POINTER_ID;
	        
	        
	        _this.mouse.global.set(-999999);
	        
	        _this.activeInteractionData = {};
	        _this.activeInteractionData[MOUSE_POINTER_ID] = _this.mouse;
	        
	        _this.interactionDataPool = [];
	        
	        _this.eventData = new InteractionEvent();
	        
	        _this.interactionDOMElement = null;
	        
	        _this.moveWhenInside = false;
	        
	        _this.eventsAdded = false;
	        
	        _this.tickerAdded = false;
	        
	        _this.mouseOverRenderer = false;
	        
	        _this.supportsTouchEvents = 'ontouchstart' in window;
	        
	        _this.supportsPointerEvents = !!window.PointerEvent;
	        
	        
	        _this.onPointerUp = _this.onPointerUp.bind(_this);
	        _this.processPointerUp = _this.processPointerUp.bind(_this);
	        
	        _this.onPointerCancel = _this.onPointerCancel.bind(_this);
	        _this.processPointerCancel = _this.processPointerCancel.bind(_this);
	        
	        _this.onPointerDown = _this.onPointerDown.bind(_this);
	        _this.processPointerDown = _this.processPointerDown.bind(_this);
	        
	        _this.onPointerMove = _this.onPointerMove.bind(_this);
	        _this.processPointerMove = _this.processPointerMove.bind(_this);
	        
	        _this.onPointerOut = _this.onPointerOut.bind(_this);
	        _this.processPointerOverOut = _this.processPointerOverOut.bind(_this);
	        
	        _this.onPointerOver = _this.onPointerOver.bind(_this);
	        
	        _this.cursorStyles = {
	            default: 'inherit',
	            pointer: 'pointer',
	        };
	        
	        _this.currentCursorMode = null;
	        
	        _this.cursor = null;
	        
	        _this.resolution = 1;
	        
	        _this.delayedEvents = [];
	        
	        _this.search = new TreeSearch();
	        
	        _this._tempDisplayObject = new TemporaryDisplayObject();
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        _this._useSystemTicker = options.useSystemTicker !== undefined ? options.useSystemTicker : true;
	        _this.setTargetElement(_this.renderer.view, _this.renderer.resolution);
	        return _this;
	    }
	    Object.defineProperty(InteractionManager.prototype, "useSystemTicker", {
	        
	        get: function () {
	            return this._useSystemTicker;
	        },
	        set: function (useSystemTicker) {
	            this._useSystemTicker = useSystemTicker;
	            if (useSystemTicker) {
	                this.addTickerListener();
	            }
	            else {
	                this.removeTickerListener();
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(InteractionManager.prototype, "lastObjectRendered", {
	        
	        get: function () {
	            return this.renderer._lastObjectRendered || this._tempDisplayObject;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    InteractionManager.prototype.hitTest = function (globalPoint, root) {
	        
	        hitTestEvent.target = null;
	        
	        hitTestEvent.data.global = globalPoint;
	        
	        if (!root) {
	            root = this.lastObjectRendered;
	        }
	        
	        this.processInteractive(hitTestEvent, root, null, true);
	        
	        return hitTestEvent.target;
	    };
	    
	    InteractionManager.prototype.setTargetElement = function (element, resolution) {
	        if (resolution === void 0) { resolution = 1; }
	        this.removeTickerListener();
	        this.removeEvents();
	        this.interactionDOMElement = element;
	        this.resolution = resolution;
	        this.addEvents();
	        this.addTickerListener();
	    };
	    
	    InteractionManager.prototype.addTickerListener = function () {
	        if (this.tickerAdded || !this.interactionDOMElement || !this._useSystemTicker) {
	            return;
	        }
	        Ticker.system.add(this.tickerUpdate, this, exports.UPDATE_PRIORITY.INTERACTION);
	        this.tickerAdded = true;
	    };
	    
	    InteractionManager.prototype.removeTickerListener = function () {
	        if (!this.tickerAdded) {
	            return;
	        }
	        Ticker.system.remove(this.tickerUpdate, this);
	        this.tickerAdded = false;
	    };
	    
	    InteractionManager.prototype.addEvents = function () {
	        if (this.eventsAdded || !this.interactionDOMElement) {
	            return;
	        }
	        var style = this.interactionDOMElement.style;
	        if (window.navigator.msPointerEnabled) {
	            style.msContentZooming = 'none';
	            style.msTouchAction = 'none';
	        }
	        else if (this.supportsPointerEvents) {
	            style.touchAction = 'none';
	        }
	        
	        if (this.supportsPointerEvents) {
	            window.document.addEventListener('pointermove', this.onPointerMove, true);
	            this.interactionDOMElement.addEventListener('pointerdown', this.onPointerDown, true);
	            
	            
	            
	            this.interactionDOMElement.addEventListener('pointerleave', this.onPointerOut, true);
	            this.interactionDOMElement.addEventListener('pointerover', this.onPointerOver, true);
	            window.addEventListener('pointercancel', this.onPointerCancel, true);
	            window.addEventListener('pointerup', this.onPointerUp, true);
	        }
	        else {
	            window.document.addEventListener('mousemove', this.onPointerMove, true);
	            this.interactionDOMElement.addEventListener('mousedown', this.onPointerDown, true);
	            this.interactionDOMElement.addEventListener('mouseout', this.onPointerOut, true);
	            this.interactionDOMElement.addEventListener('mouseover', this.onPointerOver, true);
	            window.addEventListener('mouseup', this.onPointerUp, true);
	        }
	        
	        
	        
	        if (this.supportsTouchEvents) {
	            this.interactionDOMElement.addEventListener('touchstart', this.onPointerDown, true);
	            this.interactionDOMElement.addEventListener('touchcancel', this.onPointerCancel, true);
	            this.interactionDOMElement.addEventListener('touchend', this.onPointerUp, true);
	            this.interactionDOMElement.addEventListener('touchmove', this.onPointerMove, true);
	        }
	        this.eventsAdded = true;
	    };
	    
	    InteractionManager.prototype.removeEvents = function () {
	        if (!this.eventsAdded || !this.interactionDOMElement) {
	            return;
	        }
	        var style = this.interactionDOMElement.style;
	        if (window.navigator.msPointerEnabled) {
	            style.msContentZooming = '';
	            style.msTouchAction = '';
	        }
	        else if (this.supportsPointerEvents) {
	            style.touchAction = '';
	        }
	        if (this.supportsPointerEvents) {
	            window.document.removeEventListener('pointermove', this.onPointerMove, true);
	            this.interactionDOMElement.removeEventListener('pointerdown', this.onPointerDown, true);
	            this.interactionDOMElement.removeEventListener('pointerleave', this.onPointerOut, true);
	            this.interactionDOMElement.removeEventListener('pointerover', this.onPointerOver, true);
	            window.removeEventListener('pointercancel', this.onPointerCancel, true);
	            window.removeEventListener('pointerup', this.onPointerUp, true);
	        }
	        else {
	            window.document.removeEventListener('mousemove', this.onPointerMove, true);
	            this.interactionDOMElement.removeEventListener('mousedown', this.onPointerDown, true);
	            this.interactionDOMElement.removeEventListener('mouseout', this.onPointerOut, true);
	            this.interactionDOMElement.removeEventListener('mouseover', this.onPointerOver, true);
	            window.removeEventListener('mouseup', this.onPointerUp, true);
	        }
	        if (this.supportsTouchEvents) {
	            this.interactionDOMElement.removeEventListener('touchstart', this.onPointerDown, true);
	            this.interactionDOMElement.removeEventListener('touchcancel', this.onPointerCancel, true);
	            this.interactionDOMElement.removeEventListener('touchend', this.onPointerUp, true);
	            this.interactionDOMElement.removeEventListener('touchmove', this.onPointerMove, true);
	        }
	        this.interactionDOMElement = null;
	        this.eventsAdded = false;
	    };
	    
	    InteractionManager.prototype.tickerUpdate = function (deltaTime) {
	        this._deltaTime += deltaTime;
	        if (this._deltaTime < this.interactionFrequency) {
	            return;
	        }
	        this._deltaTime = 0;
	        this.update();
	    };
	    
	    InteractionManager.prototype.update = function () {
	        if (!this.interactionDOMElement) {
	            return;
	        }
	        
	        if (this._didMove) {
	            this._didMove = false;
	            return;
	        }
	        this.cursor = null;
	        
	        
	        
	        for (var k in this.activeInteractionData) {
	            
	            if (this.activeInteractionData.hasOwnProperty(k)) {
	                var interactionData = this.activeInteractionData[k];
	                if (interactionData.originalEvent && interactionData.pointerType !== 'touch') {
	                    var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, interactionData.originalEvent, interactionData);
	                    this.processInteractive(interactionEvent, this.lastObjectRendered, this.processPointerOverOut, true);
	                }
	            }
	        }
	        this.setCursorMode(this.cursor);
	    };
	    
	    InteractionManager.prototype.setCursorMode = function (mode) {
	        mode = mode || 'default';
	        
	        if (this.currentCursorMode === mode) {
	            return;
	        }
	        this.currentCursorMode = mode;
	        var style = this.cursorStyles[mode];
	        
	        if (style) {
	            switch (typeof style) {
	                case 'string':
	                    
	                    this.interactionDOMElement.style.cursor = style;
	                    break;
	                case 'function':
	                    
	                    style(mode);
	                    break;
	                case 'object':
	                    
	                    
	                    Object.assign(this.interactionDOMElement.style, style);
	                    break;
	            }
	        }
	        else if (typeof mode === 'string' && !Object.prototype.hasOwnProperty.call(this.cursorStyles, mode)) {
	            
	            
	            this.interactionDOMElement.style.cursor = mode;
	        }
	    };
	    
	    InteractionManager.prototype.dispatchEvent = function (displayObject, eventString, eventData) {
	        
	        
	        if (!eventData.stopPropagationHint || displayObject === eventData.stopsPropagatingAt) {
	            eventData.currentTarget = displayObject;
	            eventData.type = eventString;
	            displayObject.emit(eventString, eventData);
	            if (displayObject[eventString]) {
	                displayObject[eventString](eventData);
	            }
	        }
	    };
	    
	    InteractionManager.prototype.delayDispatchEvent = function (displayObject, eventString, eventData) {
	        this.delayedEvents.push({ displayObject: displayObject, eventString: eventString, eventData: eventData });
	    };
	    
	    InteractionManager.prototype.mapPositionToPoint = function (point, x, y) {
	        var rect;
	        
	        if (!this.interactionDOMElement.parentElement) {
	            rect = { x: 0, y: 0, width: 0, height: 0 };
	        }
	        else {
	            rect = this.interactionDOMElement.getBoundingClientRect();
	        }
	        var resolutionMultiplier = 1.0 / this.resolution;
	        point.x = ((x - rect.left) * (this.interactionDOMElement.width / rect.width)) * resolutionMultiplier;
	        point.y = ((y - rect.top) * (this.interactionDOMElement.height / rect.height)) * resolutionMultiplier;
	    };
	    
	    InteractionManager.prototype.processInteractive = function (interactionEvent, displayObject, func, hitTest) {
	        var hit = this.search.findHit(interactionEvent, displayObject, func, hitTest);
	        var delayedEvents = this.delayedEvents;
	        if (!delayedEvents.length) {
	            return hit;
	        }
	        
	        interactionEvent.stopPropagationHint = false;
	        var delayedLen = delayedEvents.length;
	        this.delayedEvents = [];
	        for (var i = 0; i < delayedLen; i++) {
	            var _a = delayedEvents[i], displayObject_1 = _a.displayObject, eventString = _a.eventString, eventData = _a.eventData;
	            
	            
	            if (eventData.stopsPropagatingAt === displayObject_1) {
	                eventData.stopPropagationHint = true;
	            }
	            this.dispatchEvent(displayObject_1, eventString, eventData);
	        }
	        return hit;
	    };
	    
	    InteractionManager.prototype.onPointerDown = function (originalEvent) {
	        
	        if (this.supportsTouchEvents && originalEvent.pointerType === 'touch')
	            { return; }
	        var events = this.normalizeToPointerData(originalEvent);
	        
	        
	        if (this.autoPreventDefault && events[0].isNormalized) {
	            var cancelable = originalEvent.cancelable || !('cancelable' in originalEvent);
	            if (cancelable) {
	                originalEvent.preventDefault();
	            }
	        }
	        var eventLen = events.length;
	        for (var i = 0; i < eventLen; i++) {
	            var event = events[i];
	            var interactionData = this.getInteractionDataForPointerId(event);
	            var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
	            interactionEvent.data.originalEvent = originalEvent;
	            this.processInteractive(interactionEvent, this.lastObjectRendered, this.processPointerDown, true);
	            this.emit('pointerdown', interactionEvent);
	            if (event.pointerType === 'touch') {
	                this.emit('touchstart', interactionEvent);
	            }
	            
	            else if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
	                var isRightButton = event.button === 2;
	                this.emit(isRightButton ? 'rightdown' : 'mousedown', this.eventData);
	            }
	        }
	    };
	    
	    InteractionManager.prototype.processPointerDown = function (interactionEvent, displayObject, hit) {
	        var data = interactionEvent.data;
	        var id = interactionEvent.data.identifier;
	        if (hit) {
	            if (!displayObject.trackedPointers[id]) {
	                displayObject.trackedPointers[id] = new InteractionTrackingData(id);
	            }
	            this.dispatchEvent(displayObject, 'pointerdown', interactionEvent);
	            if (data.pointerType === 'touch') {
	                this.dispatchEvent(displayObject, 'touchstart', interactionEvent);
	            }
	            else if (data.pointerType === 'mouse' || data.pointerType === 'pen') {
	                var isRightButton = data.button === 2;
	                if (isRightButton) {
	                    displayObject.trackedPointers[id].rightDown = true;
	                }
	                else {
	                    displayObject.trackedPointers[id].leftDown = true;
	                }
	                this.dispatchEvent(displayObject, isRightButton ? 'rightdown' : 'mousedown', interactionEvent);
	            }
	        }
	    };
	    
	    InteractionManager.prototype.onPointerComplete = function (originalEvent, cancelled, func) {
	        var events = this.normalizeToPointerData(originalEvent);
	        var eventLen = events.length;
	        
	        
	        var eventAppend = originalEvent.target !== this.interactionDOMElement ? 'outside' : '';
	        for (var i = 0; i < eventLen; i++) {
	            var event = events[i];
	            var interactionData = this.getInteractionDataForPointerId(event);
	            var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
	            interactionEvent.data.originalEvent = originalEvent;
	            
	            this.processInteractive(interactionEvent, this.lastObjectRendered, func, cancelled || !eventAppend);
	            this.emit(cancelled ? 'pointercancel' : "pointerup" + eventAppend, interactionEvent);
	            if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
	                var isRightButton = event.button === 2;
	                this.emit(isRightButton ? "rightup" + eventAppend : "mouseup" + eventAppend, interactionEvent);
	            }
	            else if (event.pointerType === 'touch') {
	                this.emit(cancelled ? 'touchcancel' : "touchend" + eventAppend, interactionEvent);
	                this.releaseInteractionDataForPointerId(event.pointerId);
	            }
	        }
	    };
	    
	    InteractionManager.prototype.onPointerCancel = function (event) {
	        
	        if (this.supportsTouchEvents && event.pointerType === 'touch')
	            { return; }
	        this.onPointerComplete(event, true, this.processPointerCancel);
	    };
	    
	    InteractionManager.prototype.processPointerCancel = function (interactionEvent, displayObject) {
	        var data = interactionEvent.data;
	        var id = interactionEvent.data.identifier;
	        if (displayObject.trackedPointers[id] !== undefined) {
	            delete displayObject.trackedPointers[id];
	            this.dispatchEvent(displayObject, 'pointercancel', interactionEvent);
	            if (data.pointerType === 'touch') {
	                this.dispatchEvent(displayObject, 'touchcancel', interactionEvent);
	            }
	        }
	    };
	    
	    InteractionManager.prototype.onPointerUp = function (event) {
	        
	        if (this.supportsTouchEvents && event.pointerType === 'touch')
	            { return; }
	        this.onPointerComplete(event, false, this.processPointerUp);
	    };
	    
	    InteractionManager.prototype.processPointerUp = function (interactionEvent, displayObject, hit) {
	        var data = interactionEvent.data;
	        var id = interactionEvent.data.identifier;
	        var trackingData = displayObject.trackedPointers[id];
	        var isTouch = data.pointerType === 'touch';
	        var isMouse = (data.pointerType === 'mouse' || data.pointerType === 'pen');
	        
	        
	        var isMouseTap = false;
	        
	        if (isMouse) {
	            var isRightButton = data.button === 2;
	            var flags = InteractionTrackingData.FLAGS;
	            var test = isRightButton ? flags.RIGHT_DOWN : flags.LEFT_DOWN;
	            var isDown = trackingData !== undefined && (trackingData.flags & test);
	            if (hit) {
	                this.dispatchEvent(displayObject, isRightButton ? 'rightup' : 'mouseup', interactionEvent);
	                if (isDown) {
	                    this.dispatchEvent(displayObject, isRightButton ? 'rightclick' : 'click', interactionEvent);
	                    
	                    isMouseTap = true;
	                }
	            }
	            else if (isDown) {
	                this.dispatchEvent(displayObject, isRightButton ? 'rightupoutside' : 'mouseupoutside', interactionEvent);
	            }
	            
	            if (trackingData) {
	                if (isRightButton) {
	                    trackingData.rightDown = false;
	                }
	                else {
	                    trackingData.leftDown = false;
	                }
	            }
	        }
	        
	        if (hit) {
	            this.dispatchEvent(displayObject, 'pointerup', interactionEvent);
	            if (isTouch)
	                { this.dispatchEvent(displayObject, 'touchend', interactionEvent); }
	            if (trackingData) {
	                
	                if (!isMouse || isMouseTap) {
	                    this.dispatchEvent(displayObject, 'pointertap', interactionEvent);
	                }
	                if (isTouch) {
	                    this.dispatchEvent(displayObject, 'tap', interactionEvent);
	                    
	                    
	                    trackingData.over = false;
	                }
	            }
	        }
	        else if (trackingData) {
	            this.dispatchEvent(displayObject, 'pointerupoutside', interactionEvent);
	            if (isTouch)
	                { this.dispatchEvent(displayObject, 'touchendoutside', interactionEvent); }
	        }
	        
	        if (trackingData && trackingData.none) {
	            delete displayObject.trackedPointers[id];
	        }
	    };
	    
	    InteractionManager.prototype.onPointerMove = function (originalEvent) {
	        
	        if (this.supportsTouchEvents && originalEvent.pointerType === 'touch')
	            { return; }
	        var events = this.normalizeToPointerData(originalEvent);
	        if (events[0].pointerType === 'mouse' || events[0].pointerType === 'pen') {
	            this._didMove = true;
	            this.cursor = null;
	        }
	        var eventLen = events.length;
	        for (var i = 0; i < eventLen; i++) {
	            var event = events[i];
	            var interactionData = this.getInteractionDataForPointerId(event);
	            var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
	            interactionEvent.data.originalEvent = originalEvent;
	            this.processInteractive(interactionEvent, this.lastObjectRendered, this.processPointerMove, true);
	            this.emit('pointermove', interactionEvent);
	            if (event.pointerType === 'touch')
	                { this.emit('touchmove', interactionEvent); }
	            if (event.pointerType === 'mouse' || event.pointerType === 'pen')
	                { this.emit('mousemove', interactionEvent); }
	        }
	        if (events[0].pointerType === 'mouse') {
	            this.setCursorMode(this.cursor);
	            
	        }
	    };
	    
	    InteractionManager.prototype.processPointerMove = function (interactionEvent, displayObject, hit) {
	        var data = interactionEvent.data;
	        var isTouch = data.pointerType === 'touch';
	        var isMouse = (data.pointerType === 'mouse' || data.pointerType === 'pen');
	        if (isMouse) {
	            this.processPointerOverOut(interactionEvent, displayObject, hit);
	        }
	        if (!this.moveWhenInside || hit) {
	            this.dispatchEvent(displayObject, 'pointermove', interactionEvent);
	            if (isTouch)
	                { this.dispatchEvent(displayObject, 'touchmove', interactionEvent); }
	            if (isMouse)
	                { this.dispatchEvent(displayObject, 'mousemove', interactionEvent); }
	        }
	    };
	    
	    InteractionManager.prototype.onPointerOut = function (originalEvent) {
	        
	        if (this.supportsTouchEvents && originalEvent.pointerType === 'touch')
	            { return; }
	        var events = this.normalizeToPointerData(originalEvent);
	        
	        var event = events[0];
	        if (event.pointerType === 'mouse') {
	            this.mouseOverRenderer = false;
	            this.setCursorMode(null);
	        }
	        var interactionData = this.getInteractionDataForPointerId(event);
	        var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
	        interactionEvent.data.originalEvent = event;
	        this.processInteractive(interactionEvent, this.lastObjectRendered, this.processPointerOverOut, false);
	        this.emit('pointerout', interactionEvent);
	        if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
	            this.emit('mouseout', interactionEvent);
	        }
	        else {
	            
	            
	            this.releaseInteractionDataForPointerId(interactionData.identifier);
	        }
	    };
	    
	    InteractionManager.prototype.processPointerOverOut = function (interactionEvent, displayObject, hit) {
	        var data = interactionEvent.data;
	        var id = interactionEvent.data.identifier;
	        var isMouse = (data.pointerType === 'mouse' || data.pointerType === 'pen');
	        var trackingData = displayObject.trackedPointers[id];
	        
	        if (hit && !trackingData) {
	            trackingData = displayObject.trackedPointers[id] = new InteractionTrackingData(id);
	        }
	        if (trackingData === undefined)
	            { return; }
	        if (hit && this.mouseOverRenderer) {
	            if (!trackingData.over) {
	                trackingData.over = true;
	                this.delayDispatchEvent(displayObject, 'pointerover', interactionEvent);
	                if (isMouse) {
	                    this.delayDispatchEvent(displayObject, 'mouseover', interactionEvent);
	                }
	            }
	            
	            
	            if (isMouse && this.cursor === null) {
	                this.cursor = displayObject.cursor;
	            }
	        }
	        else if (trackingData.over) {
	            trackingData.over = false;
	            this.dispatchEvent(displayObject, 'pointerout', this.eventData);
	            if (isMouse) {
	                this.dispatchEvent(displayObject, 'mouseout', interactionEvent);
	            }
	            
	            if (trackingData.none) {
	                delete displayObject.trackedPointers[id];
	            }
	        }
	    };
	    
	    InteractionManager.prototype.onPointerOver = function (originalEvent) {
	        var events = this.normalizeToPointerData(originalEvent);
	        
	        var event = events[0];
	        var interactionData = this.getInteractionDataForPointerId(event);
	        var interactionEvent = this.configureInteractionEventForDOMEvent(this.eventData, event, interactionData);
	        interactionEvent.data.originalEvent = event;
	        if (event.pointerType === 'mouse') {
	            this.mouseOverRenderer = true;
	        }
	        this.emit('pointerover', interactionEvent);
	        if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
	            this.emit('mouseover', interactionEvent);
	        }
	    };
	    
	    InteractionManager.prototype.getInteractionDataForPointerId = function (event) {
	        var pointerId = event.pointerId;
	        var interactionData;
	        if (pointerId === MOUSE_POINTER_ID || event.pointerType === 'mouse') {
	            interactionData = this.mouse;
	        }
	        else if (this.activeInteractionData[pointerId]) {
	            interactionData = this.activeInteractionData[pointerId];
	        }
	        else {
	            interactionData = this.interactionDataPool.pop() || new InteractionData();
	            interactionData.identifier = pointerId;
	            this.activeInteractionData[pointerId] = interactionData;
	        }
	        
	        
	        interactionData.copyEvent(event);
	        return interactionData;
	    };
	    
	    InteractionManager.prototype.releaseInteractionDataForPointerId = function (pointerId) {
	        var interactionData = this.activeInteractionData[pointerId];
	        if (interactionData) {
	            delete this.activeInteractionData[pointerId];
	            interactionData.reset();
	            this.interactionDataPool.push(interactionData);
	        }
	    };
	    
	    InteractionManager.prototype.configureInteractionEventForDOMEvent = function (interactionEvent, pointerEvent, interactionData) {
	        interactionEvent.data = interactionData;
	        this.mapPositionToPoint(interactionData.global, pointerEvent.clientX, pointerEvent.clientY);
	        
	        if (pointerEvent.pointerType === 'touch') {
	            pointerEvent.globalX = interactionData.global.x;
	            pointerEvent.globalY = interactionData.global.y;
	        }
	        interactionData.originalEvent = pointerEvent;
	        interactionEvent.reset();
	        return interactionEvent;
	    };
	    
	    InteractionManager.prototype.normalizeToPointerData = function (event) {
	        var normalizedEvents = [];
	        if (this.supportsTouchEvents && event instanceof TouchEvent) {
	            for (var i = 0, li = event.changedTouches.length; i < li; i++) {
	                var touch = event.changedTouches[i];
	                if (typeof touch.button === 'undefined')
	                    { touch.button = event.touches.length ? 1 : 0; }
	                if (typeof touch.buttons === 'undefined')
	                    { touch.buttons = event.touches.length ? 1 : 0; }
	                if (typeof touch.isPrimary === 'undefined') {
	                    touch.isPrimary = event.touches.length === 1 && event.type === 'touchstart';
	                }
	                if (typeof touch.width === 'undefined')
	                    { touch.width = touch.radiusX || 1; }
	                if (typeof touch.height === 'undefined')
	                    { touch.height = touch.radiusY || 1; }
	                if (typeof touch.tiltX === 'undefined')
	                    { touch.tiltX = 0; }
	                if (typeof touch.tiltY === 'undefined')
	                    { touch.tiltY = 0; }
	                if (typeof touch.pointerType === 'undefined')
	                    { touch.pointerType = 'touch'; }
	                if (typeof touch.pointerId === 'undefined')
	                    { touch.pointerId = touch.identifier || 0; }
	                if (typeof touch.pressure === 'undefined')
	                    { touch.pressure = touch.force || 0.5; }
	                if (typeof touch.twist === 'undefined')
	                    { touch.twist = 0; }
	                if (typeof touch.tangentialPressure === 'undefined')
	                    { touch.tangentialPressure = 0; }
	                
	                
	                
	                
	                if (typeof touch.layerX === 'undefined')
	                    { touch.layerX = touch.offsetX = touch.clientX; }
	                if (typeof touch.layerY === 'undefined')
	                    { touch.layerY = touch.offsetY = touch.clientY; }
	                
	                touch.isNormalized = true;
	                normalizedEvents.push(touch);
	            }
	        }
	        
	        else if (event instanceof MouseEvent && (!this.supportsPointerEvents || !(event instanceof window.PointerEvent))) {
	            var tempEvent = event;
	            if (typeof tempEvent.isPrimary === 'undefined')
	                { tempEvent.isPrimary = true; }
	            if (typeof tempEvent.width === 'undefined')
	                { tempEvent.width = 1; }
	            if (typeof tempEvent.height === 'undefined')
	                { tempEvent.height = 1; }
	            if (typeof tempEvent.tiltX === 'undefined')
	                { tempEvent.tiltX = 0; }
	            if (typeof tempEvent.tiltY === 'undefined')
	                { tempEvent.tiltY = 0; }
	            if (typeof tempEvent.pointerType === 'undefined')
	                { tempEvent.pointerType = 'mouse'; }
	            if (typeof tempEvent.pointerId === 'undefined')
	                { tempEvent.pointerId = MOUSE_POINTER_ID; }
	            if (typeof tempEvent.pressure === 'undefined')
	                { tempEvent.pressure = 0.5; }
	            if (typeof tempEvent.twist === 'undefined')
	                { tempEvent.twist = 0; }
	            if (typeof tempEvent.tangentialPressure === 'undefined')
	                { tempEvent.tangentialPressure = 0; }
	            
	            tempEvent.isNormalized = true;
	            normalizedEvents.push(tempEvent);
	        }
	        else {
	            normalizedEvents.push(event);
	        }
	        return normalizedEvents;
	    };
	    
	    InteractionManager.prototype.destroy = function () {
	        this.removeEvents();
	        this.removeTickerListener();
	        this.removeAllListeners();
	        this.renderer = null;
	        this.mouse = null;
	        this.eventData = null;
	        this.interactionDOMElement = null;
	        this.onPointerDown = null;
	        this.processPointerDown = null;
	        this.onPointerUp = null;
	        this.processPointerUp = null;
	        this.onPointerCancel = null;
	        this.processPointerCancel = null;
	        this.onPointerMove = null;
	        this.processPointerMove = null;
	        this.onPointerOut = null;
	        this.processPointerOverOut = null;
	        this.onPointerOver = null;
	        this.search = null;
	    };
	    return InteractionManager;
	}(eventemitter3));

	
	
	var Runner =  (function () {
	    
	    function Runner(name) {
	        this.items = [];
	        this._name = name;
	        this._aliasCount = 0;
	    }
	    
	    Runner.prototype.emit = function (a0, a1, a2, a3, a4, a5, a6, a7) {
	        if (arguments.length > 8) {
	            throw new Error('max arguments reached');
	        }
	        var _a = this, name = _a.name, items = _a.items;
	        this._aliasCount++;
	        for (var i = 0, len = items.length; i < len; i++) {
	            items[i][name](a0, a1, a2, a3, a4, a5, a6, a7);
	        }
	        if (items === this.items) {
	            this._aliasCount--;
	        }
	        return this;
	    };
	    Runner.prototype.ensureNonAliasedItems = function () {
	        if (this._aliasCount > 0 && this.items.length > 1) {
	            this._aliasCount = 0;
	            this.items = this.items.slice(0);
	        }
	    };
	    
	    Runner.prototype.add = function (item) {
	        if (item[this._name]) {
	            this.ensureNonAliasedItems();
	            this.remove(item);
	            this.items.push(item);
	        }
	        return this;
	    };
	    
	    Runner.prototype.remove = function (item) {
	        var index = this.items.indexOf(item);
	        if (index !== -1) {
	            this.ensureNonAliasedItems();
	            this.items.splice(index, 1);
	        }
	        return this;
	    };
	    
	    Runner.prototype.contains = function (item) {
	        return this.items.indexOf(item) !== -1;
	    };
	    
	    Runner.prototype.removeAll = function () {
	        this.ensureNonAliasedItems();
	        this.items.length = 0;
	        return this;
	    };
	    
	    Runner.prototype.destroy = function () {
	        this.removeAll();
	        this.items = null;
	        this._name = null;
	    };
	    Object.defineProperty(Runner.prototype, "empty", {
	        
	        get: function () {
	            return this.items.length === 0;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Runner.prototype, "name", {
	        
	        get: function () {
	            return this._name;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return Runner;
	}());
	Object.defineProperties(Runner.prototype, {
	    
	    dispatch: { value: Runner.prototype.emit },
	    
	    run: { value: Runner.prototype.emit },
	});

	

	
	settings.PREFER_ENV = isMobile$1.any ? exports.ENV.WEBGL : exports.ENV.WEBGL2;
	
	settings.STRICT_TEXTURE_CACHE = false;

	
	var INSTALLED = [];
	
	function autoDetectResource(source, options) {
	    if (!source) {
	        return null;
	    }
	    var extension = '';
	    if (typeof source === 'string') {
	        
	        var result = (/\.(\w{3,4})(?:$|\?|#)/i).exec(source);
	        if (result) {
	            extension = result[1].toLowerCase();
	        }
	    }
	    for (var i = INSTALLED.length - 1; i >= 0; --i) {
	        var ResourcePlugin = INSTALLED[i];
	        if (ResourcePlugin.test && ResourcePlugin.test(source, extension)) {
	            return new ResourcePlugin(source, options);
	        }
	    }
	    throw new Error('Unrecognized source type to auto-detect Resource');
	}

	
	

	var extendStatics$2 = function(d, b) {
	    extendStatics$2 = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$2(d, b);
	};

	function __extends$2(d, b) {
	    extendStatics$2(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	
	var Resource =  (function () {
	    
	    function Resource(width, height) {
	        if (width === void 0) { width = 0; }
	        if (height === void 0) { height = 0; }
	        
	        this._width = width;
	        
	        this._height = height;
	        
	        this.destroyed = false;
	        
	        this.internal = false;
	        
	        this.onResize = new Runner('setRealSize');
	        
	        this.onUpdate = new Runner('update');
	        
	        this.onError = new Runner('onError');
	    }
	    
	    Resource.prototype.bind = function (baseTexture) {
	        this.onResize.add(baseTexture);
	        this.onUpdate.add(baseTexture);
	        this.onError.add(baseTexture);
	        
	        
	        if (this._width || this._height) {
	            this.onResize.emit(this._width, this._height);
	        }
	    };
	    
	    Resource.prototype.unbind = function (baseTexture) {
	        this.onResize.remove(baseTexture);
	        this.onUpdate.remove(baseTexture);
	        this.onError.remove(baseTexture);
	    };
	    
	    Resource.prototype.resize = function (width, height) {
	        if (width !== this._width || height !== this._height) {
	            this._width = width;
	            this._height = height;
	            this.onResize.emit(width, height);
	        }
	    };
	    Object.defineProperty(Resource.prototype, "valid", {
	        
	        get: function () {
	            return !!this._width && !!this._height;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    Resource.prototype.update = function () {
	        if (!this.destroyed) {
	            this.onUpdate.emit();
	        }
	    };
	    
	    Resource.prototype.load = function () {
	        return Promise.resolve(this);
	    };
	    Object.defineProperty(Resource.prototype, "width", {
	        
	        get: function () {
	            return this._width;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Resource.prototype, "height", {
	        
	        get: function () {
	            return this._height;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    Resource.prototype.style = function (_renderer, _baseTexture, _glTexture) {
	        return false;
	    };
	    
	    Resource.prototype.dispose = function () {
	        
	    };
	    
	    Resource.prototype.destroy = function () {
	        if (!this.destroyed) {
	            this.destroyed = true;
	            this.dispose();
	            this.onError.removeAll();
	            this.onError = null;
	            this.onResize.removeAll();
	            this.onResize = null;
	            this.onUpdate.removeAll();
	            this.onUpdate = null;
	        }
	    };
	    
	    Resource.test = function (_source, _extension) {
	        return false;
	    };
	    return Resource;
	}());

	
	
	var BufferResource =  (function (_super) {
	    __extends$2(BufferResource, _super);
	    
	    function BufferResource(source, options) {
	        var _this = this;
	        var _a = options || {}, width = _a.width, height = _a.height;
	        if (!width || !height) {
	            throw new Error('BufferResource width or height invalid');
	        }
	        _this = _super.call(this, width, height) || this;
	        
	        _this.data = source;
	        return _this;
	    }
	    
	    BufferResource.prototype.upload = function (renderer, baseTexture, glTexture) {
	        var gl = renderer.gl;
	        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === exports.ALPHA_MODES.UNPACK);
	        if (glTexture.width === baseTexture.width && glTexture.height === baseTexture.height) {
	            gl.texSubImage2D(baseTexture.target, 0, 0, 0, baseTexture.width, baseTexture.height, baseTexture.format, baseTexture.type, this.data);
	        }
	        else {
	            glTexture.width = baseTexture.width;
	            glTexture.height = baseTexture.height;
	            gl.texImage2D(baseTexture.target, 0, glTexture.internalFormat, baseTexture.width, baseTexture.height, 0, baseTexture.format, glTexture.type, this.data);
	        }
	        return true;
	    };
	    
	    BufferResource.prototype.dispose = function () {
	        this.data = null;
	    };
	    
	    BufferResource.test = function (source) {
	        return source instanceof Float32Array
	            || source instanceof Uint8Array
	            || source instanceof Uint32Array;
	    };
	    return BufferResource;
	}(Resource));

	var defaultBufferOptions = {
	    scaleMode: exports.SCALE_MODES.NEAREST,
	    format: exports.FORMATS.RGBA,
	    alphaMode: exports.ALPHA_MODES.NPM,
	};
	
	var BaseTexture =  (function (_super) {
	    __extends$2(BaseTexture, _super);
	    function BaseTexture(resource, options) {
	        if (resource === void 0) { resource = null; }
	        if (options === void 0) { options = null; }
	        var _this = _super.call(this) || this;
	        options = options || {};
	        var alphaMode = options.alphaMode, mipmap = options.mipmap, anisotropicLevel = options.anisotropicLevel, scaleMode = options.scaleMode, width = options.width, height = options.height, wrapMode = options.wrapMode, format = options.format, type = options.type, target = options.target, resolution = options.resolution, resourceOptions = options.resourceOptions;
	        
	        if (resource && !(resource instanceof Resource)) {
	            resource = autoDetectResource(resource, resourceOptions);
	            resource.internal = true;
	        }
	        
	        _this.width = width || 0;
	        
	        _this.height = height || 0;
	        
	        _this.resolution = resolution || settings.RESOLUTION;
	        
	        _this.mipmap = mipmap !== undefined ? mipmap : settings.MIPMAP_TEXTURES;
	        
	        _this.anisotropicLevel = anisotropicLevel !== undefined ? anisotropicLevel : settings.ANISOTROPIC_LEVEL;
	        
	        _this.wrapMode = wrapMode || settings.WRAP_MODE;
	        
	        _this.scaleMode = scaleMode !== undefined ? scaleMode : settings.SCALE_MODE;
	        
	        _this.format = format || exports.FORMATS.RGBA;
	        
	        _this.type = type || exports.TYPES.UNSIGNED_BYTE;
	        
	        _this.target = target || exports.TARGETS.TEXTURE_2D;
	        
	        _this.alphaMode = alphaMode !== undefined ? alphaMode : exports.ALPHA_MODES.UNPACK;
	        if (options.premultiplyAlpha !== undefined) {
	            
	            _this.premultiplyAlpha = options.premultiplyAlpha;
	        }
	        
	        _this.uid = uid();
	        
	        _this.touched = 0;
	        
	        _this.isPowerOfTwo = false;
	        _this._refreshPOT();
	        
	        _this._glTextures = {};
	        
	        _this.dirtyId = 0;
	        
	        _this.dirtyStyleId = 0;
	        
	        _this.cacheId = null;
	        
	        _this.valid = width > 0 && height > 0;
	        
	        _this.textureCacheIds = [];
	        
	        _this.destroyed = false;
	        
	        _this.resource = null;
	        
	        _this._batchEnabled = 0;
	        
	        _this._batchLocation = 0;
	        
	        _this.parentTextureArray = null;
	        
	        
	        
	        
	        
	        
	        _this.setResource(resource);
	        return _this;
	    }
	    Object.defineProperty(BaseTexture.prototype, "realWidth", {
	        
	        get: function () {
	            return Math.ceil((this.width * this.resolution) - 1e-4);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BaseTexture.prototype, "realHeight", {
	        
	        get: function () {
	            return Math.ceil((this.height * this.resolution) - 1e-4);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    BaseTexture.prototype.setStyle = function (scaleMode, mipmap) {
	        var dirty;
	        if (scaleMode !== undefined && scaleMode !== this.scaleMode) {
	            this.scaleMode = scaleMode;
	            dirty = true;
	        }
	        if (mipmap !== undefined && mipmap !== this.mipmap) {
	            this.mipmap = mipmap;
	            dirty = true;
	        }
	        if (dirty) {
	            this.dirtyStyleId++;
	        }
	        return this;
	    };
	    
	    BaseTexture.prototype.setSize = function (width, height, resolution) {
	        this.resolution = resolution || this.resolution;
	        this.width = width;
	        this.height = height;
	        this._refreshPOT();
	        this.update();
	        return this;
	    };
	    
	    BaseTexture.prototype.setRealSize = function (realWidth, realHeight, resolution) {
	        this.resolution = resolution || this.resolution;
	        this.width = realWidth / this.resolution;
	        this.height = realHeight / this.resolution;
	        this._refreshPOT();
	        this.update();
	        return this;
	    };
	    
	    BaseTexture.prototype._refreshPOT = function () {
	        this.isPowerOfTwo = isPow2(this.realWidth) && isPow2(this.realHeight);
	    };
	    
	    BaseTexture.prototype.setResolution = function (resolution) {
	        var oldResolution = this.resolution;
	        if (oldResolution === resolution) {
	            return this;
	        }
	        this.resolution = resolution;
	        if (this.valid) {
	            this.width = this.width * oldResolution / resolution;
	            this.height = this.height * oldResolution / resolution;
	            this.emit('update', this);
	        }
	        this._refreshPOT();
	        return this;
	    };
	    
	    BaseTexture.prototype.setResource = function (resource) {
	        if (this.resource === resource) {
	            return this;
	        }
	        if (this.resource) {
	            throw new Error('Resource can be set only once');
	        }
	        resource.bind(this);
	        this.resource = resource;
	        return this;
	    };
	    
	    BaseTexture.prototype.update = function () {
	        if (!this.valid) {
	            if (this.width > 0 && this.height > 0) {
	                this.valid = true;
	                this.emit('loaded', this);
	                this.emit('update', this);
	            }
	        }
	        else {
	            this.dirtyId++;
	            this.dirtyStyleId++;
	            this.emit('update', this);
	        }
	    };
	    
	    BaseTexture.prototype.onError = function (event) {
	        this.emit('error', this, event);
	    };
	    
	    BaseTexture.prototype.destroy = function () {
	        
	        if (this.resource) {
	            this.resource.unbind(this);
	            
	            if (this.resource.internal) {
	                this.resource.destroy();
	            }
	            this.resource = null;
	        }
	        if (this.cacheId) {
	            delete BaseTextureCache[this.cacheId];
	            delete TextureCache[this.cacheId];
	            this.cacheId = null;
	        }
	        
	        this.dispose();
	        BaseTexture.removeFromCache(this);
	        this.textureCacheIds = null;
	        this.destroyed = true;
	    };
	    
	    BaseTexture.prototype.dispose = function () {
	        this.emit('dispose', this);
	    };
	    
	    BaseTexture.prototype.castToBaseTexture = function () {
	        return this;
	    };
	    
	    BaseTexture.from = function (source, options, strict) {
	        if (strict === void 0) { strict = settings.STRICT_TEXTURE_CACHE; }
	        var isFrame = typeof source === 'string';
	        var cacheId = null;
	        if (isFrame) {
	            cacheId = source;
	        }
	        else {
	            if (!source._pixiId) {
	                source._pixiId = "pixiid_" + uid();
	            }
	            cacheId = source._pixiId;
	        }
	        var baseTexture = BaseTextureCache[cacheId];
	        
	        if (isFrame && strict && !baseTexture) {
	            throw new Error("The cacheId \"" + cacheId + "\" does not exist in BaseTextureCache.");
	        }
	        if (!baseTexture) {
	            baseTexture = new BaseTexture(source, options);
	            baseTexture.cacheId = cacheId;
	            BaseTexture.addToCache(baseTexture, cacheId);
	        }
	        return baseTexture;
	    };
	    
	    BaseTexture.fromBuffer = function (buffer, width, height, options) {
	        buffer = buffer || new Float32Array(width * height * 4);
	        var resource = new BufferResource(buffer, { width: width, height: height });
	        var type = buffer instanceof Float32Array ? exports.TYPES.FLOAT : exports.TYPES.UNSIGNED_BYTE;
	        return new BaseTexture(resource, Object.assign(defaultBufferOptions, options || { width: width, height: height, type: type }));
	    };
	    
	    BaseTexture.addToCache = function (baseTexture, id) {
	        if (id) {
	            if (baseTexture.textureCacheIds.indexOf(id) === -1) {
	                baseTexture.textureCacheIds.push(id);
	            }
	            if (BaseTextureCache[id]) {
	                
	                console.warn("BaseTexture added to the cache with an id [" + id + "] that already had an entry");
	            }
	            BaseTextureCache[id] = baseTexture;
	        }
	    };
	    
	    BaseTexture.removeFromCache = function (baseTexture) {
	        if (typeof baseTexture === 'string') {
	            var baseTextureFromCache = BaseTextureCache[baseTexture];
	            if (baseTextureFromCache) {
	                var index = baseTextureFromCache.textureCacheIds.indexOf(baseTexture);
	                if (index > -1) {
	                    baseTextureFromCache.textureCacheIds.splice(index, 1);
	                }
	                delete BaseTextureCache[baseTexture];
	                return baseTextureFromCache;
	            }
	        }
	        else if (baseTexture && baseTexture.textureCacheIds) {
	            for (var i = 0; i < baseTexture.textureCacheIds.length; ++i) {
	                delete BaseTextureCache[baseTexture.textureCacheIds[i]];
	            }
	            baseTexture.textureCacheIds.length = 0;
	            return baseTexture;
	        }
	        return null;
	    };
	    
	    BaseTexture._globalBatch = 0;
	    return BaseTexture;
	}(eventemitter3));

	
	var AbstractMultiResource =  (function (_super) {
	    __extends$2(AbstractMultiResource, _super);
	    function AbstractMultiResource(length, options) {
	        var _this = this;
	        var _a = options || {}, width = _a.width, height = _a.height;
	        _this = _super.call(this, width, height) || this;
	        
	        _this.items = [];
	        
	        _this.itemDirtyIds = [];
	        for (var i = 0; i < length; i++) {
	            var partTexture = new BaseTexture();
	            _this.items.push(partTexture);
	            
	            
	            
	            _this.itemDirtyIds.push(-2);
	        }
	        
	        _this.length = length;
	        
	        _this._load = null;
	        
	        _this.baseTexture = null;
	        return _this;
	    }
	    
	    AbstractMultiResource.prototype.initFromArray = function (resources, options) {
	        for (var i = 0; i < this.length; i++) {
	            if (!resources[i]) {
	                continue;
	            }
	            if (resources[i].castToBaseTexture) {
	                this.addBaseTextureAt(resources[i].castToBaseTexture(), i);
	            }
	            else if (resources[i] instanceof Resource) {
	                this.addResourceAt(resources[i], i);
	            }
	            else {
	                this.addResourceAt(autoDetectResource(resources[i], options), i);
	            }
	        }
	    };
	    
	    AbstractMultiResource.prototype.dispose = function () {
	        for (var i = 0, len = this.length; i < len; i++) {
	            this.items[i].destroy();
	        }
	        this.items = null;
	        this.itemDirtyIds = null;
	        this._load = null;
	    };
	    
	    AbstractMultiResource.prototype.addResourceAt = function (resource, index) {
	        if (!this.items[index]) {
	            throw new Error("Index " + index + " is out of bounds");
	        }
	        
	        if (resource.valid && !this.valid) {
	            this.resize(resource.width, resource.height);
	        }
	        this.items[index].setResource(resource);
	        return this;
	    };
	    
	    AbstractMultiResource.prototype.bind = function (baseTexture) {
	        if (this.baseTexture !== null) {
	            throw new Error('Only one base texture per TextureArray is allowed');
	        }
	        _super.prototype.bind.call(this, baseTexture);
	        for (var i = 0; i < this.length; i++) {
	            this.items[i].parentTextureArray = baseTexture;
	            this.items[i].on('update', baseTexture.update, baseTexture);
	        }
	    };
	    
	    AbstractMultiResource.prototype.unbind = function (baseTexture) {
	        _super.prototype.unbind.call(this, baseTexture);
	        for (var i = 0; i < this.length; i++) {
	            this.items[i].parentTextureArray = null;
	            this.items[i].off('update', baseTexture.update, baseTexture);
	        }
	    };
	    
	    AbstractMultiResource.prototype.load = function () {
	        var _this = this;
	        if (this._load) {
	            return this._load;
	        }
	        var resources = this.items.map(function (item) { return item.resource; }).filter(function (item) { return item; });
	        
	        var promises = resources.map(function (item) { return item.load(); });
	        this._load = Promise.all(promises)
	            .then(function () {
	            var _a = _this.items[0], realWidth = _a.realWidth, realHeight = _a.realHeight;
	            _this.resize(realWidth, realHeight);
	            return Promise.resolve(_this);
	        });
	        return this._load;
	    };
	    return AbstractMultiResource;
	}(Resource));

	
	var ArrayResource =  (function (_super) {
	    __extends$2(ArrayResource, _super);
	    function ArrayResource(source, options) {
	        var _this = this;
	        var _a = options || {}, width = _a.width, height = _a.height;
	        var urls;
	        var length;
	        if (Array.isArray(source)) {
	            urls = source;
	            length = source.length;
	        }
	        else {
	            length = source;
	        }
	        _this = _super.call(this, length, { width: width, height: height }) || this;
	        if (urls) {
	            _this.initFromArray(urls, options);
	        }
	        return _this;
	    }
	    
	    ArrayResource.prototype.addBaseTextureAt = function (baseTexture, index) {
	        if (baseTexture.resource) {
	            this.addResourceAt(baseTexture.resource, index);
	        }
	        else {
	            throw new Error('ArrayResource does not support RenderTexture');
	        }
	        return this;
	    };
	    
	    ArrayResource.prototype.bind = function (baseTexture) {
	        _super.prototype.bind.call(this, baseTexture);
	        baseTexture.target = exports.TARGETS.TEXTURE_2D_ARRAY;
	    };
	    
	    ArrayResource.prototype.upload = function (renderer, texture, glTexture) {
	        var _a = this, length = _a.length, itemDirtyIds = _a.itemDirtyIds, items = _a.items;
	        var gl = renderer.gl;
	        if (glTexture.dirtyId < 0) {
	            gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, texture.format, this._width, this._height, length, 0, texture.format, texture.type, null);
	        }
	        for (var i = 0; i < length; i++) {
	            var item = items[i];
	            if (itemDirtyIds[i] < item.dirtyId) {
	                itemDirtyIds[i] = item.dirtyId;
	                if (item.valid) {
	                    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 
	                    0, 
	                    i, 
	                    item.resource.width, item.resource.height, 1, texture.format, texture.type, item.resource.source);
	                }
	            }
	        }
	        return true;
	    };
	    return ArrayResource;
	}(AbstractMultiResource));

	
	var BaseImageResource =  (function (_super) {
	    __extends$2(BaseImageResource, _super);
	    
	    function BaseImageResource(source) {
	        var _this = this;
	        var sourceAny = source;
	        var width = sourceAny.naturalWidth || sourceAny.videoWidth || sourceAny.width;
	        var height = sourceAny.naturalHeight || sourceAny.videoHeight || sourceAny.height;
	        _this = _super.call(this, width, height) || this;
	        
	        _this.source = source;
	        
	        _this.noSubImage = false;
	        return _this;
	    }
	    
	    BaseImageResource.crossOrigin = function (element, url, crossorigin) {
	        if (crossorigin === undefined && url.indexOf('data:') !== 0) {
	            element.crossOrigin = determineCrossOrigin(url);
	        }
	        else if (crossorigin !== false) {
	            element.crossOrigin = typeof crossorigin === 'string' ? crossorigin : 'anonymous';
	        }
	    };
	    
	    BaseImageResource.prototype.upload = function (renderer, baseTexture, glTexture, source) {
	        var gl = renderer.gl;
	        var width = baseTexture.realWidth;
	        var height = baseTexture.realHeight;
	        source = source || this.source;
	        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === exports.ALPHA_MODES.UNPACK);
	        if (!this.noSubImage
	            && baseTexture.target === gl.TEXTURE_2D
	            && glTexture.width === width
	            && glTexture.height === height) {
	            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, baseTexture.format, baseTexture.type, source);
	        }
	        else {
	            glTexture.width = width;
	            glTexture.height = height;
	            gl.texImage2D(baseTexture.target, 0, baseTexture.format, baseTexture.format, baseTexture.type, source);
	        }
	        return true;
	    };
	    
	    BaseImageResource.prototype.update = function () {
	        if (this.destroyed) {
	            return;
	        }
	        var source = this.source;
	        var width = source.naturalWidth || source.videoWidth || source.width;
	        var height = source.naturalHeight || source.videoHeight || source.height;
	        this.resize(width, height);
	        _super.prototype.update.call(this);
	    };
	    
	    BaseImageResource.prototype.dispose = function () {
	        this.source = null;
	    };
	    return BaseImageResource;
	}(Resource));

	
	
	var CanvasResource =  (function (_super) {
	    __extends$2(CanvasResource, _super);
	    function CanvasResource() {
	        return _super !== null && _super.apply(this, arguments) || this;
	    }
	    
	    CanvasResource.test = function (source) {
	        var OffscreenCanvas = window.OffscreenCanvas;
	        
	        if (OffscreenCanvas && source instanceof OffscreenCanvas) {
	            return true;
	        }
	        return source instanceof HTMLCanvasElement;
	    };
	    return CanvasResource;
	}(BaseImageResource));

	
	var CubeResource =  (function (_super) {
	    __extends$2(CubeResource, _super);
	    function CubeResource(source, options) {
	        var _this = this;
	        var _a = options || {}, width = _a.width, height = _a.height, autoLoad = _a.autoLoad, linkBaseTexture = _a.linkBaseTexture;
	        if (source && source.length !== CubeResource.SIDES) {
	            throw new Error("Invalid length. Got " + source.length + ", expected 6");
	        }
	        _this = _super.call(this, 6, { width: width, height: height }) || this;
	        for (var i = 0; i < CubeResource.SIDES; i++) {
	            _this.items[i].target = exports.TARGETS.TEXTURE_CUBE_MAP_POSITIVE_X + i;
	        }
	        
	        _this.linkBaseTexture = linkBaseTexture !== false;
	        if (source) {
	            _this.initFromArray(source, options);
	        }
	        if (autoLoad !== false) {
	            _this.load();
	        }
	        return _this;
	    }
	    
	    CubeResource.prototype.bind = function (baseTexture) {
	        _super.prototype.bind.call(this, baseTexture);
	        baseTexture.target = exports.TARGETS.TEXTURE_CUBE_MAP;
	    };
	    CubeResource.prototype.addBaseTextureAt = function (baseTexture, index, linkBaseTexture) {
	        if (linkBaseTexture === undefined) {
	            linkBaseTexture = this.linkBaseTexture;
	        }
	        if (!this.items[index]) {
	            throw new Error("Index " + index + " is out of bounds");
	        }
	        if (!this.linkBaseTexture
	            || baseTexture.parentTextureArray
	            || Object.keys(baseTexture._glTextures).length > 0) {
	            
	            if (baseTexture.resource) {
	                this.addResourceAt(baseTexture.resource, index);
	            }
	            else {
	                throw new Error("CubeResource does not support copying of renderTexture.");
	            }
	        }
	        else {
	            
	            baseTexture.target = exports.TARGETS.TEXTURE_CUBE_MAP_POSITIVE_X + index;
	            baseTexture.parentTextureArray = this.baseTexture;
	            this.items[index] = baseTexture;
	        }
	        if (baseTexture.valid && !this.valid) {
	            this.resize(baseTexture.realWidth, baseTexture.realHeight);
	        }
	        this.items[index] = baseTexture;
	        return this;
	    };
	    
	    CubeResource.prototype.upload = function (renderer, _baseTexture, glTexture) {
	        var dirty = this.itemDirtyIds;
	        for (var i = 0; i < CubeResource.SIDES; i++) {
	            var side = this.items[i];
	            if (dirty[i] < side.dirtyId) {
	                if (side.valid && side.resource) {
	                    side.resource.upload(renderer, side, glTexture);
	                    dirty[i] = side.dirtyId;
	                }
	                else if (dirty[i] < -1) {
	                    
	                    
	                    renderer.gl.texImage2D(side.target, 0, glTexture.internalFormat, _baseTexture.realWidth, _baseTexture.realHeight, 0, _baseTexture.format, glTexture.type, null);
	                    dirty[i] = -1;
	                }
	            }
	        }
	        return true;
	    };
	    
	    CubeResource.test = function (source) {
	        return Array.isArray(source) && source.length === CubeResource.SIDES;
	    };
	    
	    CubeResource.SIDES = 6;
	    return CubeResource;
	}(AbstractMultiResource));

	
	var ImageResource =  (function (_super) {
	    __extends$2(ImageResource, _super);
	    
	    function ImageResource(source, options) {
	        var _this = this;
	        options = options || {};
	        if (!(source instanceof HTMLImageElement)) {
	            var imageElement = new Image();
	            BaseImageResource.crossOrigin(imageElement, source, options.crossorigin);
	            imageElement.src = source;
	            source = imageElement;
	        }
	        _this = _super.call(this, source) || this;
	        
	        
	        
	        
	        if (!source.complete && !!_this._width && !!_this._height) {
	            _this._width = 0;
	            _this._height = 0;
	        }
	        
	        _this.url = source.src;
	        
	        _this._process = null;
	        
	        _this.preserveBitmap = false;
	        
	        _this.createBitmap = (options.createBitmap !== undefined
	            ? options.createBitmap : settings.CREATE_IMAGE_BITMAP) && !!window.createImageBitmap;
	        
	        _this.alphaMode = typeof options.alphaMode === 'number' ? options.alphaMode : null;
	        if (options.premultiplyAlpha !== undefined) {
	            
	            _this.premultiplyAlpha = options.premultiplyAlpha;
	        }
	        
	        _this.bitmap = null;
	        
	        _this._load = null;
	        if (options.autoLoad !== false) {
	            _this.load();
	        }
	        return _this;
	    }
	    
	    ImageResource.prototype.load = function (createBitmap) {
	        var _this = this;
	        if (this._load) {
	            return this._load;
	        }
	        if (createBitmap !== undefined) {
	            this.createBitmap = createBitmap;
	        }
	        this._load = new Promise(function (resolve, reject) {
	            var source = _this.source;
	            _this.url = source.src;
	            var completed = function () {
	                if (_this.destroyed) {
	                    return;
	                }
	                source.onload = null;
	                source.onerror = null;
	                _this.resize(source.width, source.height);
	                _this._load = null;
	                if (_this.createBitmap) {
	                    resolve(_this.process());
	                }
	                else {
	                    resolve(_this);
	                }
	            };
	            if (source.complete && source.src) {
	                completed();
	            }
	            else {
	                source.onload = completed;
	                source.onerror = function (event) {
	                    
	                    reject(event);
	                    _this.onError.emit(event);
	                };
	            }
	        });
	        return this._load;
	    };
	    
	    ImageResource.prototype.process = function () {
	        var _this = this;
	        var source = this.source;
	        if (this._process !== null) {
	            return this._process;
	        }
	        if (this.bitmap !== null || !window.createImageBitmap) {
	            return Promise.resolve(this);
	        }
	        this._process = window.createImageBitmap(source, 0, 0, source.width, source.height, {
	            premultiplyAlpha: this.alphaMode === exports.ALPHA_MODES.UNPACK ? 'premultiply' : 'none',
	        })
	            .then(function (bitmap) {
	            if (_this.destroyed) {
	                return Promise.reject();
	            }
	            _this.bitmap = bitmap;
	            _this.update();
	            _this._process = null;
	            return Promise.resolve(_this);
	        });
	        return this._process;
	    };
	    
	    ImageResource.prototype.upload = function (renderer, baseTexture, glTexture) {
	        if (typeof this.alphaMode === 'number') {
	            
	            baseTexture.alphaMode = this.alphaMode;
	        }
	        if (!this.createBitmap) {
	            return _super.prototype.upload.call(this, renderer, baseTexture, glTexture);
	        }
	        if (!this.bitmap) {
	            
	            this.process();
	            if (!this.bitmap) {
	                return false;
	            }
	        }
	        _super.prototype.upload.call(this, renderer, baseTexture, glTexture, this.bitmap);
	        if (!this.preserveBitmap) {
	            
	            var flag = true;
	            var glTextures = baseTexture._glTextures;
	            for (var key in glTextures) {
	                var otherTex = glTextures[key];
	                if (otherTex !== glTexture && otherTex.dirtyId !== baseTexture.dirtyId) {
	                    flag = false;
	                    break;
	                }
	            }
	            if (flag) {
	                if (this.bitmap.close) {
	                    this.bitmap.close();
	                }
	                this.bitmap = null;
	            }
	        }
	        return true;
	    };
	    
	    ImageResource.prototype.dispose = function () {
	        this.source.onload = null;
	        this.source.onerror = null;
	        _super.prototype.dispose.call(this);
	        if (this.bitmap) {
	            this.bitmap.close();
	            this.bitmap = null;
	        }
	        this._process = null;
	        this._load = null;
	    };
	    
	    ImageResource.test = function (source) {
	        return typeof source === 'string' || source instanceof HTMLImageElement;
	    };
	    return ImageResource;
	}(BaseImageResource));

	
	var SVGResource =  (function (_super) {
	    __extends$2(SVGResource, _super);
	    function SVGResource(sourceBase64, options) {
	        var _this = this;
	        options = options || {};
	        _this = _super.call(this, document.createElement('canvas')) || this;
	        _this._width = 0;
	        _this._height = 0;
	        
	        _this.svg = sourceBase64;
	        
	        _this.scale = options.scale || 1;
	        
	        _this._overrideWidth = options.width;
	        
	        _this._overrideHeight = options.height;
	        
	        _this._resolve = null;
	        
	        _this._crossorigin = options.crossorigin;
	        
	        _this._load = null;
	        if (options.autoLoad !== false) {
	            _this.load();
	        }
	        return _this;
	    }
	    SVGResource.prototype.load = function () {
	        var _this = this;
	        if (this._load) {
	            return this._load;
	        }
	        this._load = new Promise(function (resolve) {
	            
	            _this._resolve = function () {
	                _this.resize(_this.source.width, _this.source.height);
	                resolve(_this);
	            };
	            
	            if ((/^\<svg/).test(_this.svg.trim())) {
	                if (!btoa) {
	                    throw new Error('Your browser doesn\'t support base64 conversions.');
	                }
	                _this.svg = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(_this.svg)));
	            }
	            _this._loadSvg();
	        });
	        return this._load;
	    };
	    
	    SVGResource.prototype._loadSvg = function () {
	        var _this = this;
	        var tempImage = new Image();
	        BaseImageResource.crossOrigin(tempImage, this.svg, this._crossorigin);
	        tempImage.src = this.svg;
	        tempImage.onerror = function (event) {
	            if (!_this._resolve) {
	                return;
	            }
	            tempImage.onerror = null;
	            _this.onError.emit(event);
	        };
	        tempImage.onload = function () {
	            if (!_this._resolve) {
	                return;
	            }
	            var svgWidth = tempImage.width;
	            var svgHeight = tempImage.height;
	            if (!svgWidth || !svgHeight) {
	                throw new Error('The SVG image must have width and height defined (in pixels), canvas API needs them.');
	            }
	            
	            var width = svgWidth * _this.scale;
	            var height = svgHeight * _this.scale;
	            if (_this._overrideWidth || _this._overrideHeight) {
	                width = _this._overrideWidth || _this._overrideHeight / svgHeight * svgWidth;
	                height = _this._overrideHeight || _this._overrideWidth / svgWidth * svgHeight;
	            }
	            width = Math.round(width);
	            height = Math.round(height);
	            
	            var canvas = _this.source;
	            canvas.width = width;
	            canvas.height = height;
	            canvas._pixiId = "canvas_" + uid();
	            
	            canvas
	                .getContext('2d')
	                .drawImage(tempImage, 0, 0, svgWidth, svgHeight, 0, 0, width, height);
	            _this._resolve();
	            _this._resolve = null;
	        };
	    };
	    
	    SVGResource.getSize = function (svgString) {
	        var sizeMatch = SVGResource.SVG_SIZE.exec(svgString);
	        var size = {};
	        if (sizeMatch) {
	            size[sizeMatch[1]] = Math.round(parseFloat(sizeMatch[3]));
	            size[sizeMatch[5]] = Math.round(parseFloat(sizeMatch[7]));
	        }
	        return size;
	    };
	    
	    SVGResource.prototype.dispose = function () {
	        _super.prototype.dispose.call(this);
	        this._resolve = null;
	        this._crossorigin = null;
	    };
	    
	    SVGResource.test = function (source, extension) {
	        
	        return extension === 'svg'
	            
	            || (typeof source === 'string' && (/^data:image\/svg\+xml(;(charset=utf8|utf8))?;base64/).test(source))
	            
	            || (typeof source === 'string' && source.indexOf('<svg') === 0);
	    };
	    
	    SVGResource.SVG_SIZE = /<svg[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*>/i; 
	    return SVGResource;
	}(BaseImageResource));

	
	var VideoResource =  (function (_super) {
	    __extends$2(VideoResource, _super);
	    function VideoResource(source, options) {
	        var _this = this;
	        options = options || {};
	        if (!(source instanceof HTMLVideoElement)) {
	            var videoElement = document.createElement('video');
	            
	            videoElement.setAttribute('preload', 'auto');
	            videoElement.setAttribute('webkit-playsinline', '');
	            videoElement.setAttribute('playsinline', '');
	            if (typeof source === 'string') {
	                source = [source];
	            }
	            var firstSrc = source[0].src || source[0];
	            BaseImageResource.crossOrigin(videoElement, firstSrc, options.crossorigin);
	            
	            for (var i = 0; i < source.length; ++i) {
	                var sourceElement = document.createElement('source');
	                var _a = source[i], src = _a.src, mime = _a.mime;
	                src = src || source[i];
	                var baseSrc = src.split('?').shift().toLowerCase();
	                var ext = baseSrc.substr(baseSrc.lastIndexOf('.') + 1);
	                mime = mime || VideoResource.MIME_TYPES[ext] || "video/" + ext;
	                sourceElement.src = src;
	                sourceElement.type = mime;
	                videoElement.appendChild(sourceElement);
	            }
	            
	            source = videoElement;
	        }
	        _this = _super.call(this, source) || this;
	        _this.noSubImage = true;
	        
	        _this._autoUpdate = true;
	        
	        _this._isConnectedToTicker = false;
	        _this._updateFPS = options.updateFPS || 0;
	        _this._msToNextUpdate = 0;
	        
	        _this.autoPlay = options.autoPlay !== false;
	        
	        _this._load = null;
	        
	        _this._resolve = null;
	        
	        _this._onCanPlay = _this._onCanPlay.bind(_this);
	        _this._onError = _this._onError.bind(_this);
	        if (options.autoLoad !== false) {
	            _this.load();
	        }
	        return _this;
	    }
	    
	    VideoResource.prototype.update = function (_deltaTime) {
	        if (_deltaTime === void 0) { _deltaTime = 0; }
	        if (!this.destroyed) {
	            
	            var elapsedMS = Ticker.shared.elapsedMS * this.source.playbackRate;
	            this._msToNextUpdate = Math.floor(this._msToNextUpdate - elapsedMS);
	            if (!this._updateFPS || this._msToNextUpdate <= 0) {
	                _super.prototype.update.call(this);
	                this._msToNextUpdate = this._updateFPS ? Math.floor(1000 / this._updateFPS) : 0;
	            }
	        }
	    };
	    
	    VideoResource.prototype.load = function () {
	        var _this = this;
	        if (this._load) {
	            return this._load;
	        }
	        var source = this.source;
	        if ((source.readyState === source.HAVE_ENOUGH_DATA || source.readyState === source.HAVE_FUTURE_DATA)
	            && source.width && source.height) {
	            source.complete = true;
	        }
	        source.addEventListener('play', this._onPlayStart.bind(this));
	        source.addEventListener('pause', this._onPlayStop.bind(this));
	        if (!this._isSourceReady()) {
	            source.addEventListener('canplay', this._onCanPlay);
	            source.addEventListener('canplaythrough', this._onCanPlay);
	            source.addEventListener('error', this._onError, true);
	        }
	        else {
	            this._onCanPlay();
	        }
	        this._load = new Promise(function (resolve) {
	            if (_this.valid) {
	                resolve(_this);
	            }
	            else {
	                _this._resolve = resolve;
	                source.load();
	            }
	        });
	        return this._load;
	    };
	    
	    VideoResource.prototype._onError = function (event) {
	        this.source.removeEventListener('error', this._onError, true);
	        this.onError.emit(event);
	    };
	    
	    VideoResource.prototype._isSourcePlaying = function () {
	        var source = this.source;
	        return (source.currentTime > 0 && source.paused === false && source.ended === false && source.readyState > 2);
	    };
	    
	    VideoResource.prototype._isSourceReady = function () {
	        var source = this.source;
	        return source.readyState === 3 || source.readyState === 4;
	    };
	    
	    VideoResource.prototype._onPlayStart = function () {
	        
	        if (!this.valid) {
	            this._onCanPlay();
	        }
	        if (this.autoUpdate && !this._isConnectedToTicker) {
	            Ticker.shared.add(this.update, this);
	            this._isConnectedToTicker = true;
	        }
	    };
	    
	    VideoResource.prototype._onPlayStop = function () {
	        if (this._isConnectedToTicker) {
	            Ticker.shared.remove(this.update, this);
	            this._isConnectedToTicker = false;
	        }
	    };
	    
	    VideoResource.prototype._onCanPlay = function () {
	        var source = this.source;
	        source.removeEventListener('canplay', this._onCanPlay);
	        source.removeEventListener('canplaythrough', this._onCanPlay);
	        var valid = this.valid;
	        this.resize(source.videoWidth, source.videoHeight);
	        
	        if (!valid && this._resolve) {
	            this._resolve(this);
	            this._resolve = null;
	        }
	        if (this._isSourcePlaying()) {
	            this._onPlayStart();
	        }
	        else if (this.autoPlay) {
	            source.play();
	        }
	    };
	    
	    VideoResource.prototype.dispose = function () {
	        if (this._isConnectedToTicker) {
	            Ticker.shared.remove(this.update, this);
	        }
	        var source = this.source;
	        if (source) {
	            source.removeEventListener('error', this._onError, true);
	            source.pause();
	            source.src = '';
	            source.load();
	        }
	        _super.prototype.dispose.call(this);
	    };
	    Object.defineProperty(VideoResource.prototype, "autoUpdate", {
	        
	        get: function () {
	            return this._autoUpdate;
	        },
	        set: function (value) {
	            if (value !== this._autoUpdate) {
	                this._autoUpdate = value;
	                if (!this._autoUpdate && this._isConnectedToTicker) {
	                    Ticker.shared.remove(this.update, this);
	                    this._isConnectedToTicker = false;
	                }
	                else if (this._autoUpdate && !this._isConnectedToTicker && this._isSourcePlaying()) {
	                    Ticker.shared.add(this.update, this);
	                    this._isConnectedToTicker = true;
	                }
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(VideoResource.prototype, "updateFPS", {
	        
	        get: function () {
	            return this._updateFPS;
	        },
	        set: function (value) {
	            if (value !== this._updateFPS) {
	                this._updateFPS = value;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    VideoResource.test = function (source, extension) {
	        return (source instanceof HTMLVideoElement)
	            || VideoResource.TYPES.indexOf(extension) > -1;
	    };
	    
	    VideoResource.TYPES = ['mp4', 'm4v', 'webm', 'ogg', 'ogv', 'h264', 'avi', 'mov'];
	    
	    VideoResource.MIME_TYPES = {
	        ogv: 'video/ogg',
	        mov: 'video/quicktime',
	        m4v: 'video/mp4',
	    };
	    return VideoResource;
	}(BaseImageResource));

	
	var ImageBitmapResource =  (function (_super) {
	    __extends$2(ImageBitmapResource, _super);
	    function ImageBitmapResource() {
	        return _super !== null && _super.apply(this, arguments) || this;
	    }
	    
	    ImageBitmapResource.test = function (source) {
	        return !!window.createImageBitmap && source instanceof ImageBitmap;
	    };
	    return ImageBitmapResource;
	}(BaseImageResource));

	INSTALLED.push(ImageResource, ImageBitmapResource, CanvasResource, VideoResource, SVGResource, BufferResource, CubeResource, ArrayResource);

	var index = ({
	    Resource: Resource,
	    BaseImageResource: BaseImageResource,
	    INSTALLED: INSTALLED,
	    autoDetectResource: autoDetectResource,
	    AbstractMultiResource: AbstractMultiResource,
	    ArrayResource: ArrayResource,
	    BufferResource: BufferResource,
	    CanvasResource: CanvasResource,
	    CubeResource: CubeResource,
	    ImageResource: ImageResource,
	    SVGResource: SVGResource,
	    VideoResource: VideoResource,
	    ImageBitmapResource: ImageBitmapResource
	});

	
	var System =  (function () {
	    
	    function System(renderer) {
	        
	        this.renderer = renderer;
	    }
	    
	    System.prototype.destroy = function () {
	        this.renderer = null;
	    };
	    return System;
	}());

	
	var DepthResource =  (function (_super) {
	    __extends$2(DepthResource, _super);
	    function DepthResource() {
	        return _super !== null && _super.apply(this, arguments) || this;
	    }
	    
	    DepthResource.prototype.upload = function (renderer, baseTexture, glTexture) {
	        var gl = renderer.gl;
	        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === exports.ALPHA_MODES.UNPACK);
	        if (glTexture.width === baseTexture.width && glTexture.height === baseTexture.height) {
	            gl.texSubImage2D(baseTexture.target, 0, 0, 0, baseTexture.width, baseTexture.height, baseTexture.format, baseTexture.type, this.data);
	        }
	        else {
	            glTexture.width = baseTexture.width;
	            glTexture.height = baseTexture.height;
	            gl.texImage2D(baseTexture.target, 0, 
	            
	            renderer.context.webGLVersion === 1 ? gl.DEPTH_COMPONENT : gl.DEPTH_COMPONENT16, baseTexture.width, baseTexture.height, 0, baseTexture.format, baseTexture.type, this.data);
	        }
	        return true;
	    };
	    return DepthResource;
	}(BufferResource));

	
	var Framebuffer =  (function () {
	    
	    function Framebuffer(width, height) {
	        
	        this.width = Math.ceil(width || 100);
	        
	        this.height = Math.ceil(height || 100);
	        this.stencil = false;
	        this.depth = false;
	        this.dirtyId = 0;
	        this.dirtyFormat = 0;
	        this.dirtySize = 0;
	        this.depthTexture = null;
	        this.colorTextures = [];
	        this.glFramebuffers = {};
	        this.disposeRunner = new Runner('disposeFramebuffer');
	        
	        this.multisample = exports.MSAA_QUALITY.NONE;
	    }
	    Object.defineProperty(Framebuffer.prototype, "colorTexture", {
	        
	        get: function () {
	            return this.colorTextures[0];
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    Framebuffer.prototype.addColorTexture = function (index, texture) {
	        if (index === void 0) { index = 0; }
	        
	        this.colorTextures[index] = texture || new BaseTexture(null, {
	            scaleMode: exports.SCALE_MODES.NEAREST,
	            resolution: 1,
	            mipmap: exports.MIPMAP_MODES.OFF,
	            width: this.width,
	            height: this.height,
	        });
	        this.dirtyId++;
	        this.dirtyFormat++;
	        return this;
	    };
	    
	    Framebuffer.prototype.addDepthTexture = function (texture) {
	        
	        this.depthTexture = texture || new BaseTexture(new DepthResource(null, { width: this.width, height: this.height }), {
	            scaleMode: exports.SCALE_MODES.NEAREST,
	            resolution: 1,
	            width: this.width,
	            height: this.height,
	            mipmap: exports.MIPMAP_MODES.OFF,
	            format: exports.FORMATS.DEPTH_COMPONENT,
	            type: exports.TYPES.UNSIGNED_SHORT,
	        });
	        this.dirtyId++;
	        this.dirtyFormat++;
	        return this;
	    };
	    
	    Framebuffer.prototype.enableDepth = function () {
	        this.depth = true;
	        this.dirtyId++;
	        this.dirtyFormat++;
	        return this;
	    };
	    
	    Framebuffer.prototype.enableStencil = function () {
	        this.stencil = true;
	        this.dirtyId++;
	        this.dirtyFormat++;
	        return this;
	    };
	    
	    Framebuffer.prototype.resize = function (width, height) {
	        width = Math.ceil(width);
	        height = Math.ceil(height);
	        if (width === this.width && height === this.height)
	            { return; }
	        this.width = width;
	        this.height = height;
	        this.dirtyId++;
	        this.dirtySize++;
	        for (var i = 0; i < this.colorTextures.length; i++) {
	            var texture = this.colorTextures[i];
	            var resolution = texture.resolution;
	            
	            texture.setSize(width / resolution, height / resolution);
	        }
	        if (this.depthTexture) {
	            var resolution = this.depthTexture.resolution;
	            this.depthTexture.setSize(width / resolution, height / resolution);
	        }
	    };
	    
	    Framebuffer.prototype.dispose = function () {
	        this.disposeRunner.emit(this, false);
	    };
	    
	    Framebuffer.prototype.destroyDepthTexture = function () {
	        if (this.depthTexture) {
	            this.depthTexture.destroy();
	            this.depthTexture = null;
	            ++this.dirtyId;
	            ++this.dirtyFormat;
	        }
	    };
	    return Framebuffer;
	}());

	
	var BaseRenderTexture =  (function (_super) {
	    __extends$2(BaseRenderTexture, _super);
	    
	    function BaseRenderTexture(options) {
	        var _this = this;
	        if (typeof options === 'number') {
	            
	            
	            var width_1 = arguments[0];
	            var height_1 = arguments[1];
	            var scaleMode = arguments[2];
	            var resolution = arguments[3];
	            options = { width: width_1, height: height_1, scaleMode: scaleMode, resolution: resolution };
	            
	        }
	        _this = _super.call(this, null, options) || this;
	        var _a = options || {}, width = _a.width, height = _a.height;
	        
	        _this.mipmap = 0;
	        _this.width = Math.ceil(width) || 100;
	        _this.height = Math.ceil(height) || 100;
	        _this.valid = true;
	        _this.clearColor = [0, 0, 0, 0];
	        _this.framebuffer = new Framebuffer(_this.width * _this.resolution, _this.height * _this.resolution)
	            .addColorTexture(0, _this);
	        
	        
	        _this.maskStack = [];
	        
	        _this.filterStack = [{}];
	        return _this;
	    }
	    
	    BaseRenderTexture.prototype.resize = function (width, height) {
	        width = Math.ceil(width);
	        height = Math.ceil(height);
	        this.framebuffer.resize(width * this.resolution, height * this.resolution);
	    };
	    
	    BaseRenderTexture.prototype.dispose = function () {
	        this.framebuffer.dispose();
	        _super.prototype.dispose.call(this);
	    };
	    
	    BaseRenderTexture.prototype.destroy = function () {
	        _super.prototype.destroy.call(this);
	        this.framebuffer.destroyDepthTexture();
	        this.framebuffer = null;
	    };
	    return BaseRenderTexture;
	}(BaseTexture));

	
	var TextureUvs =  (function () {
	    function TextureUvs() {
	        
	        this.x0 = 0;
	        
	        this.y0 = 0;
	        
	        this.x1 = 1;
	        
	        this.y1 = 0;
	        
	        this.x2 = 1;
	        
	        this.y2 = 1;
	        
	        this.x3 = 0;
	        
	        this.y3 = 1;
	        this.uvsFloat32 = new Float32Array(8);
	    }
	    
	    TextureUvs.prototype.set = function (frame, baseFrame, rotate) {
	        var tw = baseFrame.width;
	        var th = baseFrame.height;
	        if (rotate) {
	            
	            var w2 = frame.width / 2 / tw;
	            var h2 = frame.height / 2 / th;
	            
	            var cX = (frame.x / tw) + w2;
	            var cY = (frame.y / th) + h2;
	            rotate = groupD8.add(rotate, groupD8.NW); 
	            this.x0 = cX + (w2 * groupD8.uX(rotate));
	            this.y0 = cY + (h2 * groupD8.uY(rotate));
	            rotate = groupD8.add(rotate, 2); 
	            this.x1 = cX + (w2 * groupD8.uX(rotate));
	            this.y1 = cY + (h2 * groupD8.uY(rotate));
	            rotate = groupD8.add(rotate, 2);
	            this.x2 = cX + (w2 * groupD8.uX(rotate));
	            this.y2 = cY + (h2 * groupD8.uY(rotate));
	            rotate = groupD8.add(rotate, 2);
	            this.x3 = cX + (w2 * groupD8.uX(rotate));
	            this.y3 = cY + (h2 * groupD8.uY(rotate));
	        }
	        else {
	            this.x0 = frame.x / tw;
	            this.y0 = frame.y / th;
	            this.x1 = (frame.x + frame.width) / tw;
	            this.y1 = frame.y / th;
	            this.x2 = (frame.x + frame.width) / tw;
	            this.y2 = (frame.y + frame.height) / th;
	            this.x3 = frame.x / tw;
	            this.y3 = (frame.y + frame.height) / th;
	        }
	        this.uvsFloat32[0] = this.x0;
	        this.uvsFloat32[1] = this.y0;
	        this.uvsFloat32[2] = this.x1;
	        this.uvsFloat32[3] = this.y1;
	        this.uvsFloat32[4] = this.x2;
	        this.uvsFloat32[5] = this.y2;
	        this.uvsFloat32[6] = this.x3;
	        this.uvsFloat32[7] = this.y3;
	    };
	    return TextureUvs;
	}());

	var DEFAULT_UVS = new TextureUvs();
	
	var Texture =  (function (_super) {
	    __extends$2(Texture, _super);
	    
	    function Texture(baseTexture, frame, orig, trim, rotate, anchor) {
	        var _this = _super.call(this) || this;
	        
	        _this.noFrame = false;
	        if (!frame) {
	            _this.noFrame = true;
	            frame = new Rectangle(0, 0, 1, 1);
	        }
	        if (baseTexture instanceof Texture) {
	            baseTexture = baseTexture.baseTexture;
	        }
	        
	        _this.baseTexture = baseTexture;
	        
	        _this._frame = frame;
	        
	        _this.trim = trim;
	        
	        _this.valid = false;
	        
	        _this._uvs = DEFAULT_UVS;
	        
	        _this.uvMatrix = null;
	        
	        _this.orig = orig || frame; 
	        _this._rotate = Number(rotate || 0);
	        if (rotate === true) {
	            
	            _this._rotate = 2;
	        }
	        else if (_this._rotate % 2 !== 0) {
	            throw new Error('attempt to use diamond-shaped UVs. If you are sure, set rotation manually');
	        }
	        
	        _this.defaultAnchor = anchor ? new Point(anchor.x, anchor.y) : new Point(0, 0);
	        
	        _this._updateID = 0;
	        
	        _this.textureCacheIds = [];
	        if (!baseTexture.valid) {
	            baseTexture.once('loaded', _this.onBaseTextureUpdated, _this);
	        }
	        else if (_this.noFrame) {
	            
	            if (baseTexture.valid) {
	                _this.onBaseTextureUpdated(baseTexture);
	            }
	        }
	        else {
	            _this.frame = frame;
	        }
	        if (_this.noFrame) {
	            baseTexture.on('update', _this.onBaseTextureUpdated, _this);
	        }
	        return _this;
	    }
	    
	    Texture.prototype.update = function () {
	        if (this.baseTexture.resource) {
	            this.baseTexture.resource.update();
	        }
	    };
	    
	    Texture.prototype.onBaseTextureUpdated = function (baseTexture) {
	        if (this.noFrame) {
	            if (!this.baseTexture.valid) {
	                return;
	            }
	            this._frame.width = baseTexture.width;
	            this._frame.height = baseTexture.height;
	            this.valid = true;
	            this.updateUvs();
	        }
	        else {
	            
	            
	            this.frame = this._frame;
	        }
	        this.emit('update', this);
	    };
	    
	    Texture.prototype.destroy = function (destroyBase) {
	        if (this.baseTexture) {
	            if (destroyBase) {
	                var resource = this.baseTexture;
	                
	                
	                if (resource && resource.url && TextureCache[resource.url]) {
	                    Texture.removeFromCache(resource.url);
	                }
	                this.baseTexture.destroy();
	            }
	            this.baseTexture.off('loaded', this.onBaseTextureUpdated, this);
	            this.baseTexture.off('update', this.onBaseTextureUpdated, this);
	            this.baseTexture = null;
	        }
	        this._frame = null;
	        this._uvs = null;
	        this.trim = null;
	        this.orig = null;
	        this.valid = false;
	        Texture.removeFromCache(this);
	        this.textureCacheIds = null;
	    };
	    
	    Texture.prototype.clone = function () {
	        return new Texture(this.baseTexture, this.frame.clone(), this.orig.clone(), this.trim && this.trim.clone(), this.rotate, this.defaultAnchor);
	    };
	    
	    Texture.prototype.updateUvs = function () {
	        if (this._uvs === DEFAULT_UVS) {
	            this._uvs = new TextureUvs();
	        }
	        this._uvs.set(this._frame, this.baseTexture, this.rotate);
	        this._updateID++;
	    };
	    
	    Texture.from = function (source, options, strict) {
	        if (options === void 0) { options = {}; }
	        if (strict === void 0) { strict = settings.STRICT_TEXTURE_CACHE; }
	        var isFrame = typeof source === 'string';
	        var cacheId = null;
	        if (isFrame) {
	            cacheId = source;
	        }
	        else {
	            if (!source._pixiId) {
	                source._pixiId = "pixiid_" + uid();
	            }
	            cacheId = source._pixiId;
	        }
	        var texture = TextureCache[cacheId];
	        
	        if (isFrame && strict && !texture) {
	            throw new Error("The cacheId \"" + cacheId + "\" does not exist in TextureCache.");
	        }
	        if (!texture) {
	            if (!options.resolution) {
	                options.resolution = getResolutionOfUrl(source);
	            }
	            texture = new Texture(new BaseTexture(source, options));
	            texture.baseTexture.cacheId = cacheId;
	            BaseTexture.addToCache(texture.baseTexture, cacheId);
	            Texture.addToCache(texture, cacheId);
	        }
	        
	        return texture;
	    };
	    
	    Texture.fromURL = function (url, options) {
	        var resourceOptions = Object.assign({ autoLoad: false }, options === null || options === void 0 ? void 0 : options.resourceOptions);
	        var texture = Texture.from(url, Object.assign({ resourceOptions: resourceOptions }, options), false);
	        var resource = texture.baseTexture.resource;
	        
	        if (texture.baseTexture.valid) {
	            return Promise.resolve(texture);
	        }
	        
	        return resource.load().then(function () { return Promise.resolve(texture); });
	    };
	    
	    Texture.fromBuffer = function (buffer, width, height, options) {
	        return new Texture(BaseTexture.fromBuffer(buffer, width, height, options));
	    };
	    
	    Texture.fromLoader = function (source, imageUrl, name) {
	        var resource = new ImageResource(source);
	        resource.url = imageUrl;
	        var baseTexture = new BaseTexture(resource, {
	            scaleMode: settings.SCALE_MODE,
	            resolution: getResolutionOfUrl(imageUrl),
	        });
	        var texture = new Texture(baseTexture);
	        
	        if (!name) {
	            name = imageUrl;
	        }
	        
	        BaseTexture.addToCache(texture.baseTexture, name);
	        Texture.addToCache(texture, name);
	        
	        if (name !== imageUrl) {
	            BaseTexture.addToCache(texture.baseTexture, imageUrl);
	            Texture.addToCache(texture, imageUrl);
	        }
	        return texture;
	    };
	    
	    Texture.addToCache = function (texture, id) {
	        if (id) {
	            if (texture.textureCacheIds.indexOf(id) === -1) {
	                texture.textureCacheIds.push(id);
	            }
	            if (TextureCache[id]) {
	                
	                console.warn("Texture added to the cache with an id [" + id + "] that already had an entry");
	            }
	            TextureCache[id] = texture;
	        }
	    };
	    
	    Texture.removeFromCache = function (texture) {
	        if (typeof texture === 'string') {
	            var textureFromCache = TextureCache[texture];
	            if (textureFromCache) {
	                var index = textureFromCache.textureCacheIds.indexOf(texture);
	                if (index > -1) {
	                    textureFromCache.textureCacheIds.splice(index, 1);
	                }
	                delete TextureCache[texture];
	                return textureFromCache;
	            }
	        }
	        else if (texture && texture.textureCacheIds) {
	            for (var i = 0; i < texture.textureCacheIds.length; ++i) {
	                
	                if (TextureCache[texture.textureCacheIds[i]] === texture) {
	                    delete TextureCache[texture.textureCacheIds[i]];
	                }
	            }
	            texture.textureCacheIds.length = 0;
	            return texture;
	        }
	        return null;
	    };
	    Object.defineProperty(Texture.prototype, "resolution", {
	        
	        get: function () {
	            return this.baseTexture.resolution;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Texture.prototype, "frame", {
	        
	        get: function () {
	            return this._frame;
	        },
	        set: function (frame) {
	            this._frame = frame;
	            this.noFrame = false;
	            var x = frame.x, y = frame.y, width = frame.width, height = frame.height;
	            var xNotFit = x + width > this.baseTexture.width;
	            var yNotFit = y + height > this.baseTexture.height;
	            if (xNotFit || yNotFit) {
	                var relationship = xNotFit && yNotFit ? 'and' : 'or';
	                var errorX = "X: " + x + " + " + width + " = " + (x + width) + " > " + this.baseTexture.width;
	                var errorY = "Y: " + y + " + " + height + " = " + (y + height) + " > " + this.baseTexture.height;
	                throw new Error('Texture Error: frame does not fit inside the base Texture dimensions: '
	                    + (errorX + " " + relationship + " " + errorY));
	            }
	            this.valid = width && height && this.baseTexture.valid;
	            if (!this.trim && !this.rotate) {
	                this.orig = frame;
	            }
	            if (this.valid) {
	                this.updateUvs();
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Texture.prototype, "rotate", {
	        
	        get: function () {
	            return this._rotate;
	        },
	        set: function (rotate) {
	            this._rotate = rotate;
	            if (this.valid) {
	                this.updateUvs();
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Texture.prototype, "width", {
	        
	        get: function () {
	            return this.orig.width;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Texture.prototype, "height", {
	        
	        get: function () {
	            return this.orig.height;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    Texture.prototype.castToBaseTexture = function () {
	        return this.baseTexture;
	    };
	    return Texture;
	}(eventemitter3));
	function createWhiteTexture() {
	    var canvas = document.createElement('canvas');
	    canvas.width = 16;
	    canvas.height = 16;
	    var context = canvas.getContext('2d');
	    context.fillStyle = 'white';
	    context.fillRect(0, 0, 16, 16);
	    return new Texture(new BaseTexture(new CanvasResource(canvas)));
	}
	function removeAllHandlers(tex) {
	    tex.destroy = function _emptyDestroy() { };
	    tex.on = function _emptyOn() { };
	    tex.once = function _emptyOnce() { };
	    tex.emit = function _emptyEmit() { };
	}
	
	Texture.EMPTY = new Texture(new BaseTexture());
	removeAllHandlers(Texture.EMPTY);
	removeAllHandlers(Texture.EMPTY.baseTexture);
	
	Texture.WHITE = createWhiteTexture();
	removeAllHandlers(Texture.WHITE);
	removeAllHandlers(Texture.WHITE.baseTexture);

	
	var RenderTexture =  (function (_super) {
	    __extends$2(RenderTexture, _super);
	    
	    function RenderTexture(baseRenderTexture, frame) {
	        var _this = this;
	        
	        var _legacyRenderer = null;
	        if (!(baseRenderTexture instanceof BaseRenderTexture)) {
	            
	            var width = arguments[1];
	            var height = arguments[2];
	            var scaleMode = arguments[3];
	            var resolution = arguments[4];
	            
	            console.warn("Please use RenderTexture.create(" + width + ", " + height + ") instead of the ctor directly.");
	            _legacyRenderer = arguments[0];
	            
	            frame = null;
	            baseRenderTexture = new BaseRenderTexture({
	                width: width,
	                height: height,
	                scaleMode: scaleMode,
	                resolution: resolution,
	            });
	        }
	        
	        _this = _super.call(this, baseRenderTexture, frame) || this;
	        _this.legacyRenderer = _legacyRenderer;
	        
	        _this.valid = true;
	        
	        _this.filterFrame = null;
	        
	        _this.filterPoolKey = null;
	        _this.updateUvs();
	        return _this;
	    }
	    Object.defineProperty(RenderTexture.prototype, "framebuffer", {
	        
	        get: function () {
	            return this.baseTexture.framebuffer;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    RenderTexture.prototype.resize = function (width, height, resizeBaseTexture) {
	        if (resizeBaseTexture === void 0) { resizeBaseTexture = true; }
	        width = Math.ceil(width);
	        height = Math.ceil(height);
	        
	        this.valid = (width > 0 && height > 0);
	        this._frame.width = this.orig.width = width;
	        this._frame.height = this.orig.height = height;
	        if (resizeBaseTexture) {
	            this.baseTexture.resize(width, height);
	        }
	        this.updateUvs();
	    };
	    
	    RenderTexture.prototype.setResolution = function (resolution) {
	        var baseTexture = this.baseTexture;
	        if (baseTexture.resolution === resolution) {
	            return;
	        }
	        baseTexture.setResolution(resolution);
	        this.resize(baseTexture.width, baseTexture.height, false);
	    };
	    
	    RenderTexture.create = function (options) {
	        
	        if (typeof options === 'number') {
	            
	            options = {
	                width: options,
	                height: arguments[1],
	                scaleMode: arguments[2],
	                resolution: arguments[3],
	            };
	            
	        }
	        return new RenderTexture(new BaseRenderTexture(options));
	    };
	    return RenderTexture;
	}(Texture));

	
	var RenderTexturePool =  (function () {
	    
	    function RenderTexturePool(textureOptions) {
	        this.texturePool = {};
	        this.textureOptions = textureOptions || {};
	        
	        this.enableFullScreen = false;
	        this._pixelsWidth = 0;
	        this._pixelsHeight = 0;
	    }
	    
	    RenderTexturePool.prototype.createTexture = function (realWidth, realHeight) {
	        var baseRenderTexture = new BaseRenderTexture(Object.assign({
	            width: realWidth,
	            height: realHeight,
	            resolution: 1,
	        }, this.textureOptions));
	        return new RenderTexture(baseRenderTexture);
	    };
	    
	    RenderTexturePool.prototype.getOptimalTexture = function (minWidth, minHeight, resolution) {
	        if (resolution === void 0) { resolution = 1; }
	        var key = RenderTexturePool.SCREEN_KEY;
	        minWidth *= resolution;
	        minHeight *= resolution;
	        if (!this.enableFullScreen || minWidth !== this._pixelsWidth || minHeight !== this._pixelsHeight) {
	            minWidth = nextPow2(minWidth);
	            minHeight = nextPow2(minHeight);
	            key = ((minWidth & 0xFFFF) << 16) | (minHeight & 0xFFFF);
	        }
	        if (!this.texturePool[key]) {
	            this.texturePool[key] = [];
	        }
	        var renderTexture = this.texturePool[key].pop();
	        if (!renderTexture) {
	            renderTexture = this.createTexture(minWidth, minHeight);
	        }
	        renderTexture.filterPoolKey = key;
	        renderTexture.setResolution(resolution);
	        return renderTexture;
	    };
	    
	    RenderTexturePool.prototype.getFilterTexture = function (input, resolution) {
	        var filterTexture = this.getOptimalTexture(input.width, input.height, resolution || input.resolution);
	        filterTexture.filterFrame = input.filterFrame;
	        return filterTexture;
	    };
	    
	    RenderTexturePool.prototype.returnTexture = function (renderTexture) {
	        var key = renderTexture.filterPoolKey;
	        renderTexture.filterFrame = null;
	        this.texturePool[key].push(renderTexture);
	    };
	    
	    RenderTexturePool.prototype.returnFilterTexture = function (renderTexture) {
	        this.returnTexture(renderTexture);
	    };
	    
	    RenderTexturePool.prototype.clear = function (destroyTextures) {
	        destroyTextures = destroyTextures !== false;
	        if (destroyTextures) {
	            for (var i in this.texturePool) {
	                var textures = this.texturePool[i];
	                if (textures) {
	                    for (var j = 0; j < textures.length; j++) {
	                        textures[j].destroy(true);
	                    }
	                }
	            }
	        }
	        this.texturePool = {};
	    };
	    
	    RenderTexturePool.prototype.setScreenSize = function (size) {
	        if (size.width === this._pixelsWidth
	            && size.height === this._pixelsHeight) {
	            return;
	        }
	        var screenKey = RenderTexturePool.SCREEN_KEY;
	        var textures = this.texturePool[screenKey];
	        this.enableFullScreen = size.width > 0 && size.height > 0;
	        if (textures) {
	            for (var j = 0; j < textures.length; j++) {
	                textures[j].destroy(true);
	            }
	        }
	        this.texturePool[screenKey] = [];
	        this._pixelsWidth = size.width;
	        this._pixelsHeight = size.height;
	    };
	    
	    RenderTexturePool.SCREEN_KEY = 'screen';
	    return RenderTexturePool;
	}());

	
	
	var Attribute =  (function () {
	    
	    function Attribute(buffer, size, normalized, type, stride, start, instance) {
	        if (size === void 0) { size = 0; }
	        if (normalized === void 0) { normalized = false; }
	        if (type === void 0) { type = 5126; }
	        this.buffer = buffer;
	        this.size = size;
	        this.normalized = normalized;
	        this.type = type;
	        this.stride = stride;
	        this.start = start;
	        this.instance = instance;
	    }
	    
	    Attribute.prototype.destroy = function () {
	        this.buffer = null;
	    };
	    
	    Attribute.from = function (buffer, size, normalized, type, stride) {
	        return new Attribute(buffer, size, normalized, type, stride);
	    };
	    return Attribute;
	}());

	var UID = 0;
	
	var Buffer =  (function () {
	    
	    function Buffer(data, _static, index) {
	        if (_static === void 0) { _static = true; }
	        if (index === void 0) { index = false; }
	        
	        this.data = (data || new Float32Array(1));
	        
	        this._glBuffers = {};
	        this._updateID = 0;
	        this.index = index;
	        this.static = _static;
	        this.id = UID++;
	        this.disposeRunner = new Runner('disposeBuffer');
	    }
	    
	    
	    Buffer.prototype.update = function (data) {
	        this.data = data || this.data;
	        this._updateID++;
	    };
	    
	    Buffer.prototype.dispose = function () {
	        this.disposeRunner.emit(this, false);
	    };
	    
	    Buffer.prototype.destroy = function () {
	        this.dispose();
	        this.data = null;
	    };
	    
	    Buffer.from = function (data) {
	        if (data instanceof Array) {
	            data = new Float32Array(data);
	        }
	        return new Buffer(data);
	    };
	    return Buffer;
	}());

	function getBufferType$1(array) {
	    if (array.BYTES_PER_ELEMENT === 4) {
	        if (array instanceof Float32Array) {
	            return 'Float32Array';
	        }
	        else if (array instanceof Uint32Array) {
	            return 'Uint32Array';
	        }
	        return 'Int32Array';
	    }
	    else if (array.BYTES_PER_ELEMENT === 2) {
	        if (array instanceof Uint16Array) {
	            return 'Uint16Array';
	        }
	    }
	    else if (array.BYTES_PER_ELEMENT === 1) {
	        if (array instanceof Uint8Array) {
	            return 'Uint8Array';
	        }
	    }
	    
	    return null;
	}

	
	var map$1 = {
	    Float32Array: Float32Array,
	    Uint32Array: Uint32Array,
	    Int32Array: Int32Array,
	    Uint8Array: Uint8Array,
	};
	function interleaveTypedArrays$1(arrays, sizes) {
	    var outSize = 0;
	    var stride = 0;
	    var views = {};
	    for (var i = 0; i < arrays.length; i++) {
	        stride += sizes[i];
	        outSize += arrays[i].length;
	    }
	    var buffer = new ArrayBuffer(outSize * 4);
	    var out = null;
	    var littleOffset = 0;
	    for (var i = 0; i < arrays.length; i++) {
	        var size = sizes[i];
	        var array = arrays[i];
	        var type = getBufferType$1(array);
	        if (!views[type]) {
	            views[type] = new map$1[type](buffer);
	        }
	        out = views[type];
	        for (var j = 0; j < array.length; j++) {
	            var indexStart = ((j / size | 0) * stride) + littleOffset;
	            var index = j % size;
	            out[indexStart + index] = array[j];
	        }
	        littleOffset += size;
	    }
	    return new Float32Array(buffer);
	}

	var byteSizeMap = { 5126: 4, 5123: 2, 5121: 1 };
	var UID$1 = 0;
	
	var map$1$1 = {
	    Float32Array: Float32Array,
	    Uint32Array: Uint32Array,
	    Int32Array: Int32Array,
	    Uint8Array: Uint8Array,
	    Uint16Array: Uint16Array,
	};
	
	
	var Geometry =  (function () {
	    
	    function Geometry(buffers, attributes) {
	        if (buffers === void 0) { buffers = []; }
	        if (attributes === void 0) { attributes = {}; }
	        this.buffers = buffers;
	        this.indexBuffer = null;
	        this.attributes = attributes;
	        
	        this.glVertexArrayObjects = {};
	        this.id = UID$1++;
	        this.instanced = false;
	        
	        this.instanceCount = 1;
	        this.disposeRunner = new Runner('disposeGeometry');
	        
	        this.refCount = 0;
	    }
	    
	    Geometry.prototype.addAttribute = function (id, buffer, size, normalized, type, stride, start, instance) {
	        if (size === void 0) { size = 0; }
	        if (normalized === void 0) { normalized = false; }
	        if (instance === void 0) { instance = false; }
	        if (!buffer) {
	            throw new Error('You must pass a buffer when creating an attribute');
	        }
	        
	        if (!(buffer instanceof Buffer)) {
	            
	            if (buffer instanceof Array) {
	                buffer = new Float32Array(buffer);
	            }
	            buffer = new Buffer(buffer);
	        }
	        var ids = id.split('|');
	        if (ids.length > 1) {
	            for (var i = 0; i < ids.length; i++) {
	                this.addAttribute(ids[i], buffer, size, normalized, type);
	            }
	            return this;
	        }
	        var bufferIndex = this.buffers.indexOf(buffer);
	        if (bufferIndex === -1) {
	            this.buffers.push(buffer);
	            bufferIndex = this.buffers.length - 1;
	        }
	        this.attributes[id] = new Attribute(bufferIndex, size, normalized, type, stride, start, instance);
	        
	        this.instanced = this.instanced || instance;
	        return this;
	    };
	    
	    Geometry.prototype.getAttribute = function (id) {
	        return this.attributes[id];
	    };
	    
	    Geometry.prototype.getBuffer = function (id) {
	        return this.buffers[this.getAttribute(id).buffer];
	    };
	    
	    Geometry.prototype.addIndex = function (buffer) {
	        if (!(buffer instanceof Buffer)) {
	            
	            if (buffer instanceof Array) {
	                buffer = new Uint16Array(buffer);
	            }
	            buffer = new Buffer(buffer);
	        }
	        buffer.index = true;
	        this.indexBuffer = buffer;
	        if (this.buffers.indexOf(buffer) === -1) {
	            this.buffers.push(buffer);
	        }
	        return this;
	    };
	    
	    Geometry.prototype.getIndex = function () {
	        return this.indexBuffer;
	    };
	    
	    Geometry.prototype.interleave = function () {
	        
	        if (this.buffers.length === 1 || (this.buffers.length === 2 && this.indexBuffer))
	            { return this; }
	        
	        var arrays = [];
	        var sizes = [];
	        var interleavedBuffer = new Buffer();
	        var i;
	        for (i in this.attributes) {
	            var attribute = this.attributes[i];
	            var buffer = this.buffers[attribute.buffer];
	            arrays.push(buffer.data);
	            sizes.push((attribute.size * byteSizeMap[attribute.type]) / 4);
	            attribute.buffer = 0;
	        }
	        interleavedBuffer.data = interleaveTypedArrays$1(arrays, sizes);
	        for (i = 0; i < this.buffers.length; i++) {
	            if (this.buffers[i] !== this.indexBuffer) {
	                this.buffers[i].destroy();
	            }
	        }
	        this.buffers = [interleavedBuffer];
	        if (this.indexBuffer) {
	            this.buffers.push(this.indexBuffer);
	        }
	        return this;
	    };
	    Geometry.prototype.getSize = function () {
	        for (var i in this.attributes) {
	            var attribute = this.attributes[i];
	            var buffer = this.buffers[attribute.buffer];
	            return buffer.data.length / ((attribute.stride / 4) || attribute.size);
	        }
	        return 0;
	    };
	    
	    Geometry.prototype.dispose = function () {
	        this.disposeRunner.emit(this, false);
	    };
	    
	    Geometry.prototype.destroy = function () {
	        this.dispose();
	        this.buffers = null;
	        this.indexBuffer = null;
	        this.attributes = null;
	    };
	    
	    Geometry.prototype.clone = function () {
	        var geometry = new Geometry();
	        for (var i = 0; i < this.buffers.length; i++) {
	            geometry.buffers[i] = new Buffer(this.buffers[i].data.slice(0));
	        }
	        for (var i in this.attributes) {
	            var attrib = this.attributes[i];
	            geometry.attributes[i] = new Attribute(attrib.buffer, attrib.size, attrib.normalized, attrib.type, attrib.stride, attrib.start, attrib.instance);
	        }
	        if (this.indexBuffer) {
	            geometry.indexBuffer = geometry.buffers[this.buffers.indexOf(this.indexBuffer)];
	            geometry.indexBuffer.index = true;
	        }
	        return geometry;
	    };
	    
	    Geometry.merge = function (geometries) {
	        
	        
	        var geometryOut = new Geometry();
	        var arrays = [];
	        var sizes = [];
	        var offsets = [];
	        var geometry;
	        
	        for (var i = 0; i < geometries.length; i++) {
	            geometry = geometries[i];
	            for (var j = 0; j < geometry.buffers.length; j++) {
	                sizes[j] = sizes[j] || 0;
	                sizes[j] += geometry.buffers[j].data.length;
	                offsets[j] = 0;
	            }
	        }
	        
	        for (var i = 0; i < geometry.buffers.length; i++) {
	            
	            arrays[i] = new map$1$1[getBufferType$1(geometry.buffers[i].data)](sizes[i]);
	            geometryOut.buffers[i] = new Buffer(arrays[i]);
	        }
	        
	        for (var i = 0; i < geometries.length; i++) {
	            geometry = geometries[i];
	            for (var j = 0; j < geometry.buffers.length; j++) {
	                arrays[j].set(geometry.buffers[j].data, offsets[j]);
	                offsets[j] += geometry.buffers[j].data.length;
	            }
	        }
	        geometryOut.attributes = geometry.attributes;
	        if (geometry.indexBuffer) {
	            geometryOut.indexBuffer = geometryOut.buffers[geometry.buffers.indexOf(geometry.indexBuffer)];
	            geometryOut.indexBuffer.index = true;
	            var offset = 0;
	            var stride = 0;
	            var offset2 = 0;
	            var bufferIndexToCount = 0;
	            
	            for (var i = 0; i < geometry.buffers.length; i++) {
	                if (geometry.buffers[i] !== geometry.indexBuffer) {
	                    bufferIndexToCount = i;
	                    break;
	                }
	            }
	            
	            for (var i in geometry.attributes) {
	                var attribute = geometry.attributes[i];
	                if ((attribute.buffer | 0) === bufferIndexToCount) {
	                    stride += ((attribute.size * byteSizeMap[attribute.type]) / 4);
	                }
	            }
	            
	            for (var i = 0; i < geometries.length; i++) {
	                var indexBufferData = geometries[i].indexBuffer.data;
	                for (var j = 0; j < indexBufferData.length; j++) {
	                    geometryOut.indexBuffer.data[j + offset2] += offset;
	                }
	                offset += geometry.buffers[bufferIndexToCount].data.length / (stride);
	                offset2 += indexBufferData.length;
	            }
	        }
	        return geometryOut;
	    };
	    return Geometry;
	}());

	
	var Quad =  (function (_super) {
	    __extends$2(Quad, _super);
	    function Quad() {
	        var _this = _super.call(this) || this;
	        _this.addAttribute('aVertexPosition', new Float32Array([
	            0, 0,
	            1, 0,
	            1, 1,
	            0, 1 ]))
	            .addIndex([0, 1, 3, 2]);
	        return _this;
	    }
	    return Quad;
	}(Geometry));

	
	var QuadUv =  (function (_super) {
	    __extends$2(QuadUv, _super);
	    function QuadUv() {
	        var _this = _super.call(this) || this;
	        
	        _this.vertices = new Float32Array([
	            -1, -1,
	            1, -1,
	            1, 1,
	            -1, 1 ]);
	        
	        _this.uvs = new Float32Array([
	            0, 0,
	            1, 0,
	            1, 1,
	            0, 1 ]);
	        _this.vertexBuffer = new Buffer(_this.vertices);
	        _this.uvBuffer = new Buffer(_this.uvs);
	        _this.addAttribute('aVertexPosition', _this.vertexBuffer)
	            .addAttribute('aTextureCoord', _this.uvBuffer)
	            .addIndex([0, 1, 2, 0, 2, 3]);
	        return _this;
	    }
	    
	    QuadUv.prototype.map = function (targetTextureFrame, destinationFrame) {
	        var x = 0; 
	        var y = 0; 
	        this.uvs[0] = x;
	        this.uvs[1] = y;
	        this.uvs[2] = x + (destinationFrame.width / targetTextureFrame.width);
	        this.uvs[3] = y;
	        this.uvs[4] = x + (destinationFrame.width / targetTextureFrame.width);
	        this.uvs[5] = y + (destinationFrame.height / targetTextureFrame.height);
	        this.uvs[6] = x;
	        this.uvs[7] = y + (destinationFrame.height / targetTextureFrame.height);
	        x = destinationFrame.x;
	        y = destinationFrame.y;
	        this.vertices[0] = x;
	        this.vertices[1] = y;
	        this.vertices[2] = x + destinationFrame.width;
	        this.vertices[3] = y;
	        this.vertices[4] = x + destinationFrame.width;
	        this.vertices[5] = y + destinationFrame.height;
	        this.vertices[6] = x;
	        this.vertices[7] = y + destinationFrame.height;
	        this.invalidate();
	        return this;
	    };
	    
	    QuadUv.prototype.invalidate = function () {
	        this.vertexBuffer._updateID++;
	        this.uvBuffer._updateID++;
	        return this;
	    };
	    return QuadUv;
	}(Geometry));

	var UID$2 = 0;
	
	var UniformGroup =  (function () {
	    
	    function UniformGroup(uniforms, _static) {
	        
	        this.uniforms = uniforms;
	        
	        this.group = true;
	        
	        this.syncUniforms = {};
	        
	        this.dirtyId = 0;
	        
	        this.id = UID$2++;
	        
	        this.static = !!_static;
	    }
	    UniformGroup.prototype.update = function () {
	        this.dirtyId++;
	    };
	    UniformGroup.prototype.add = function (name, uniforms, _static) {
	        this.uniforms[name] = new UniformGroup(uniforms, _static);
	    };
	    UniformGroup.from = function (uniforms, _static) {
	        return new UniformGroup(uniforms, _static);
	    };
	    return UniformGroup;
	}());

	
	var FilterState =  (function () {
	    function FilterState() {
	        this.renderTexture = null;
	        
	        this.target = null;
	        
	        this.legacy = false;
	        
	        this.resolution = 1;
	        
	        
	        
	        this.sourceFrame = new Rectangle();
	        
	        this.destinationFrame = new Rectangle();
	        
	        this.filters = [];
	    }
	    
	    FilterState.prototype.clear = function () {
	        this.target = null;
	        this.filters = null;
	        this.renderTexture = null;
	    };
	    return FilterState;
	}());

	
	var FilterSystem =  (function (_super) {
	    __extends$2(FilterSystem, _super);
	    
	    function FilterSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        
	        _this.defaultFilterStack = [{}];
	        
	        _this.texturePool = new RenderTexturePool();
	        _this.texturePool.setScreenSize(renderer.view);
	        
	        _this.statePool = [];
	        
	        _this.quad = new Quad();
	        
	        _this.quadUv = new QuadUv();
	        
	        _this.tempRect = new Rectangle();
	        
	        _this.activeState = {};
	        
	        _this.globalUniforms = new UniformGroup({
	            outputFrame: _this.tempRect,
	            inputSize: new Float32Array(4),
	            inputPixel: new Float32Array(4),
	            inputClamp: new Float32Array(4),
	            resolution: 1,
	            
	            filterArea: new Float32Array(4),
	            filterClamp: new Float32Array(4),
	        }, true);
	        
	        _this.forceClear = false;
	        
	        _this.useMaxPadding = false;
	        return _this;
	    }
	    
	    FilterSystem.prototype.push = function (target, filters) {
	        var renderer = this.renderer;
	        var filterStack = this.defaultFilterStack;
	        var state = this.statePool.pop() || new FilterState();
	        var resolution = filters[0].resolution;
	        var padding = filters[0].padding;
	        var autoFit = filters[0].autoFit;
	        var legacy = filters[0].legacy;
	        for (var i = 1; i < filters.length; i++) {
	            var filter = filters[i];
	            
	            resolution = Math.min(resolution, filter.resolution);
	            
	            padding = this.useMaxPadding
	                
	                ? Math.max(padding, filter.padding)
	                
	                : padding + filter.padding;
	            
	            autoFit = autoFit && filter.autoFit;
	            legacy = legacy || filter.legacy;
	        }
	        if (filterStack.length === 1) {
	            this.defaultFilterStack[0].renderTexture = renderer.renderTexture.current;
	        }
	        filterStack.push(state);
	        state.resolution = resolution;
	        state.legacy = legacy;
	        state.target = target;
	        state.sourceFrame.copyFrom(target.filterArea || target.getBounds(true));
	        state.sourceFrame.pad(padding);
	        if (autoFit) {
	            state.sourceFrame.fit(this.renderer.renderTexture.sourceFrame);
	        }
	        
	        state.sourceFrame.ceil(resolution);
	        state.renderTexture = this.getOptimalFilterTexture(state.sourceFrame.width, state.sourceFrame.height, resolution);
	        state.filters = filters;
	        state.destinationFrame.width = state.renderTexture.width;
	        state.destinationFrame.height = state.renderTexture.height;
	        var destinationFrame = this.tempRect;
	        destinationFrame.width = state.sourceFrame.width;
	        destinationFrame.height = state.sourceFrame.height;
	        state.renderTexture.filterFrame = state.sourceFrame;
	        renderer.renderTexture.bind(state.renderTexture, state.sourceFrame, destinationFrame);
	        renderer.renderTexture.clear();
	    };
	    
	    FilterSystem.prototype.pop = function () {
	        var filterStack = this.defaultFilterStack;
	        var state = filterStack.pop();
	        var filters = state.filters;
	        this.activeState = state;
	        var globalUniforms = this.globalUniforms.uniforms;
	        globalUniforms.outputFrame = state.sourceFrame;
	        globalUniforms.resolution = state.resolution;
	        var inputSize = globalUniforms.inputSize;
	        var inputPixel = globalUniforms.inputPixel;
	        var inputClamp = globalUniforms.inputClamp;
	        inputSize[0] = state.destinationFrame.width;
	        inputSize[1] = state.destinationFrame.height;
	        inputSize[2] = 1.0 / inputSize[0];
	        inputSize[3] = 1.0 / inputSize[1];
	        inputPixel[0] = inputSize[0] * state.resolution;
	        inputPixel[1] = inputSize[1] * state.resolution;
	        inputPixel[2] = 1.0 / inputPixel[0];
	        inputPixel[3] = 1.0 / inputPixel[1];
	        inputClamp[0] = 0.5 * inputPixel[2];
	        inputClamp[1] = 0.5 * inputPixel[3];
	        inputClamp[2] = (state.sourceFrame.width * inputSize[2]) - (0.5 * inputPixel[2]);
	        inputClamp[3] = (state.sourceFrame.height * inputSize[3]) - (0.5 * inputPixel[3]);
	        
	        if (state.legacy) {
	            var filterArea = globalUniforms.filterArea;
	            filterArea[0] = state.destinationFrame.width;
	            filterArea[1] = state.destinationFrame.height;
	            filterArea[2] = state.sourceFrame.x;
	            filterArea[3] = state.sourceFrame.y;
	            globalUniforms.filterClamp = globalUniforms.inputClamp;
	        }
	        this.globalUniforms.update();
	        var lastState = filterStack[filterStack.length - 1];
	        if (state.renderTexture.framebuffer.multisample > 1) {
	            this.renderer.framebuffer.blit();
	        }
	        if (filters.length === 1) {
	            filters[0].apply(this, state.renderTexture, lastState.renderTexture, exports.CLEAR_MODES.BLEND, state);
	            this.returnFilterTexture(state.renderTexture);
	        }
	        else {
	            var flip = state.renderTexture;
	            var flop = this.getOptimalFilterTexture(flip.width, flip.height, state.resolution);
	            flop.filterFrame = flip.filterFrame;
	            var i = 0;
	            for (i = 0; i < filters.length - 1; ++i) {
	                filters[i].apply(this, flip, flop, exports.CLEAR_MODES.CLEAR, state);
	                var t = flip;
	                flip = flop;
	                flop = t;
	            }
	            filters[i].apply(this, flip, lastState.renderTexture, exports.CLEAR_MODES.BLEND, state);
	            this.returnFilterTexture(flip);
	            this.returnFilterTexture(flop);
	        }
	        state.clear();
	        this.statePool.push(state);
	    };
	    
	    FilterSystem.prototype.bindAndClear = function (filterTexture, clearMode) {
	        if (clearMode === void 0) { clearMode = exports.CLEAR_MODES.CLEAR; }
	        if (filterTexture && filterTexture.filterFrame) {
	            var destinationFrame = this.tempRect;
	            destinationFrame.width = filterTexture.filterFrame.width;
	            destinationFrame.height = filterTexture.filterFrame.height;
	            this.renderer.renderTexture.bind(filterTexture, filterTexture.filterFrame, destinationFrame);
	        }
	        else {
	            this.renderer.renderTexture.bind(filterTexture);
	        }
	        
	        if (typeof clearMode === 'boolean') {
	            clearMode = clearMode ? exports.CLEAR_MODES.CLEAR : exports.CLEAR_MODES.BLEND;
	            
	            deprecation('5.2.1', 'Use CLEAR_MODES when using clear applyFilter option');
	        }
	        if (clearMode === exports.CLEAR_MODES.CLEAR
	            || (clearMode === exports.CLEAR_MODES.BLIT && this.forceClear)) {
	            this.renderer.renderTexture.clear();
	        }
	    };
	    
	    FilterSystem.prototype.applyFilter = function (filter, input, output, clearMode) {
	        var renderer = this.renderer;
	        this.bindAndClear(output, clearMode);
	        
	        filter.uniforms.uSampler = input;
	        filter.uniforms.filterGlobals = this.globalUniforms;
	        
	        
	        
	        renderer.state.set(filter.state);
	        renderer.shader.bind(filter);
	        if (filter.legacy) {
	            this.quadUv.map(input._frame, input.filterFrame);
	            renderer.geometry.bind(this.quadUv);
	            renderer.geometry.draw(exports.DRAW_MODES.TRIANGLES);
	        }
	        else {
	            renderer.geometry.bind(this.quad);
	            renderer.geometry.draw(exports.DRAW_MODES.TRIANGLE_STRIP);
	        }
	    };
	    
	    FilterSystem.prototype.calculateSpriteMatrix = function (outputMatrix, sprite) {
	        var _a = this.activeState, sourceFrame = _a.sourceFrame, destinationFrame = _a.destinationFrame;
	        var orig = sprite._texture.orig;
	        var mappedMatrix = outputMatrix.set(destinationFrame.width, 0, 0, destinationFrame.height, sourceFrame.x, sourceFrame.y);
	        var worldTransform = sprite.worldTransform.copyTo(Matrix.TEMP_MATRIX);
	        worldTransform.invert();
	        mappedMatrix.prepend(worldTransform);
	        mappedMatrix.scale(1.0 / orig.width, 1.0 / orig.height);
	        mappedMatrix.translate(sprite.anchor.x, sprite.anchor.y);
	        return mappedMatrix;
	    };
	    
	    FilterSystem.prototype.destroy = function () {
	        
	        this.texturePool.clear(false);
	    };
	    
	    FilterSystem.prototype.getOptimalFilterTexture = function (minWidth, minHeight, resolution) {
	        if (resolution === void 0) { resolution = 1; }
	        return this.texturePool.getOptimalTexture(minWidth, minHeight, resolution);
	    };
	    
	    FilterSystem.prototype.getFilterTexture = function (input, resolution) {
	        if (typeof input === 'number') {
	            var swap = input;
	            input = resolution;
	            resolution = swap;
	        }
	        input = input || this.activeState.renderTexture;
	        var filterTexture = this.texturePool.getOptimalTexture(input.width, input.height, resolution || input.resolution);
	        filterTexture.filterFrame = input.filterFrame;
	        return filterTexture;
	    };
	    
	    FilterSystem.prototype.returnFilterTexture = function (renderTexture) {
	        this.texturePool.returnTexture(renderTexture);
	    };
	    
	    FilterSystem.prototype.emptyPool = function () {
	        this.texturePool.clear(true);
	    };
	    
	    FilterSystem.prototype.resize = function () {
	        this.texturePool.setScreenSize(this.renderer.view);
	    };
	    return FilterSystem;
	}(System));

	
	var ObjectRenderer =  (function () {
	    
	    function ObjectRenderer(renderer) {
	        
	        this.renderer = renderer;
	    }
	    
	    ObjectRenderer.prototype.flush = function () {
	        
	    };
	    
	    ObjectRenderer.prototype.destroy = function () {
	        this.renderer = null;
	    };
	    
	    ObjectRenderer.prototype.start = function () {
	        
	    };
	    
	    ObjectRenderer.prototype.stop = function () {
	        this.flush();
	    };
	    
	    ObjectRenderer.prototype.render = function (_object) {
	        
	    };
	    return ObjectRenderer;
	}());

	
	var BatchSystem =  (function (_super) {
	    __extends$2(BatchSystem, _super);
	    
	    function BatchSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        
	        _this.emptyRenderer = new ObjectRenderer(renderer);
	        
	        _this.currentRenderer = _this.emptyRenderer;
	        return _this;
	    }
	    
	    BatchSystem.prototype.setObjectRenderer = function (objectRenderer) {
	        if (this.currentRenderer === objectRenderer) {
	            return;
	        }
	        this.currentRenderer.stop();
	        this.currentRenderer = objectRenderer;
	        this.currentRenderer.start();
	    };
	    
	    BatchSystem.prototype.flush = function () {
	        this.setObjectRenderer(this.emptyRenderer);
	    };
	    
	    BatchSystem.prototype.reset = function () {
	        this.setObjectRenderer(this.emptyRenderer);
	    };
	    
	    BatchSystem.prototype.copyBoundTextures = function (arr, maxTextures) {
	        var boundTextures = this.renderer.texture.boundTextures;
	        for (var i = maxTextures - 1; i >= 0; --i) {
	            arr[i] = boundTextures[i] || null;
	            if (arr[i]) {
	                arr[i]._batchLocation = i;
	            }
	        }
	    };
	    
	    BatchSystem.prototype.boundArray = function (texArray, boundTextures, batchId, maxTextures) {
	        var elements = texArray.elements, ids = texArray.ids, count = texArray.count;
	        var j = 0;
	        for (var i = 0; i < count; i++) {
	            var tex = elements[i];
	            var loc = tex._batchLocation;
	            if (loc >= 0 && loc < maxTextures
	                && boundTextures[loc] === tex) {
	                ids[i] = loc;
	                continue;
	            }
	            while (j < maxTextures) {
	                var bound = boundTextures[j];
	                if (bound && bound._batchEnabled === batchId
	                    && bound._batchLocation === j) {
	                    j++;
	                    continue;
	                }
	                ids[i] = j;
	                tex._batchLocation = j;
	                boundTextures[j] = tex;
	                break;
	            }
	        }
	    };
	    return BatchSystem;
	}(System));

	var CONTEXT_UID_COUNTER = 0;
	
	var ContextSystem =  (function (_super) {
	    __extends$2(ContextSystem, _super);
	    
	    
	    function ContextSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        
	        _this.webGLVersion = 1;
	        
	        _this.extensions = {};
	        
	        _this.supports = {
	            uint32Indices: false,
	        };
	        
	        _this.handleContextLost = _this.handleContextLost.bind(_this);
	        _this.handleContextRestored = _this.handleContextRestored.bind(_this);
	        renderer.view.addEventListener('webglcontextlost', _this.handleContextLost, false);
	        renderer.view.addEventListener('webglcontextrestored', _this.handleContextRestored, false);
	        return _this;
	    }
	    Object.defineProperty(ContextSystem.prototype, "isLost", {
	        
	        get: function () {
	            return (!this.gl || this.gl.isContextLost());
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    ContextSystem.prototype.contextChange = function (gl) {
	        this.gl = gl;
	        this.renderer.gl = gl;
	        this.renderer.CONTEXT_UID = CONTEXT_UID_COUNTER++;
	        
	        if (gl.isContextLost() && gl.getExtension('WEBGL_lose_context')) {
	            gl.getExtension('WEBGL_lose_context').restoreContext();
	        }
	    };
	    
	    ContextSystem.prototype.initFromContext = function (gl) {
	        this.gl = gl;
	        this.validateContext(gl);
	        this.renderer.gl = gl;
	        this.renderer.CONTEXT_UID = CONTEXT_UID_COUNTER++;
	        this.renderer.runners.contextChange.emit(gl);
	    };
	    
	    ContextSystem.prototype.initFromOptions = function (options) {
	        var gl = this.createContext(this.renderer.view, options);
	        this.initFromContext(gl);
	    };
	    
	    ContextSystem.prototype.createContext = function (canvas, options) {
	        var gl;
	        if (settings.PREFER_ENV >= exports.ENV.WEBGL2) {
	            gl = canvas.getContext('webgl2', options);
	        }
	        if (gl) {
	            this.webGLVersion = 2;
	        }
	        else {
	            this.webGLVersion = 1;
	            gl = canvas.getContext('webgl', options)
	                || canvas.getContext('experimental-webgl', options);
	            if (!gl) {
	                
	                throw new Error('This browser does not support WebGL. Try using the canvas renderer');
	            }
	        }
	        this.gl = gl;
	        this.getExtensions();
	        return this.gl;
	    };
	    
	    ContextSystem.prototype.getExtensions = function () {
	        
	        var gl = this.gl;
	        if (this.webGLVersion === 1) {
	            Object.assign(this.extensions, {
	                drawBuffers: gl.getExtension('WEBGL_draw_buffers'),
	                depthTexture: gl.getExtension('WEBGL_depth_texture'),
	                loseContext: gl.getExtension('WEBGL_lose_context'),
	                vertexArrayObject: gl.getExtension('OES_vertex_array_object')
	                    || gl.getExtension('MOZ_OES_vertex_array_object')
	                    || gl.getExtension('WEBKIT_OES_vertex_array_object'),
	                anisotropicFiltering: gl.getExtension('EXT_texture_filter_anisotropic'),
	                uint32ElementIndex: gl.getExtension('OES_element_index_uint'),
	                
	                floatTexture: gl.getExtension('OES_texture_float'),
	                floatTextureLinear: gl.getExtension('OES_texture_float_linear'),
	                textureHalfFloat: gl.getExtension('OES_texture_half_float'),
	                textureHalfFloatLinear: gl.getExtension('OES_texture_half_float_linear'),
	            });
	        }
	        else if (this.webGLVersion === 2) {
	            Object.assign(this.extensions, {
	                anisotropicFiltering: gl.getExtension('EXT_texture_filter_anisotropic'),
	                
	                colorBufferFloat: gl.getExtension('EXT_color_buffer_float'),
	                floatTextureLinear: gl.getExtension('OES_texture_float_linear'),
	            });
	        }
	    };
	    
	    ContextSystem.prototype.handleContextLost = function (event) {
	        event.preventDefault();
	    };
	    
	    ContextSystem.prototype.handleContextRestored = function () {
	        this.renderer.runners.contextChange.emit(this.gl);
	    };
	    ContextSystem.prototype.destroy = function () {
	        var view = this.renderer.view;
	        
	        view.removeEventListener('webglcontextlost', this.handleContextLost);
	        view.removeEventListener('webglcontextrestored', this.handleContextRestored);
	        this.gl.useProgram(null);
	        if (this.extensions.loseContext) {
	            this.extensions.loseContext.loseContext();
	        }
	    };
	    
	    ContextSystem.prototype.postrender = function () {
	        if (this.renderer.renderingToScreen) {
	            this.gl.flush();
	        }
	    };
	    
	    ContextSystem.prototype.validateContext = function (gl) {
	        var attributes = gl.getContextAttributes();
	        var isWebGl2 = 'WebGL2RenderingContext' in window && gl instanceof window.WebGL2RenderingContext;
	        if (isWebGl2) {
	            this.webGLVersion = 2;
	        }
	        
	        if (!attributes.stencil) {
	            
	            console.warn('Provided WebGL context does not have a stencil buffer, masks may not render correctly');
	            
	        }
	        var hasuint32 = isWebGl2 || !!gl.getExtension('OES_element_index_uint');
	        this.supports.uint32Indices = hasuint32;
	        if (!hasuint32) {
	            
	            console.warn('Provided WebGL context does not support 32 index buffer, complex graphics may not render correctly');
	            
	        }
	    };
	    return ContextSystem;
	}(System));

	
	var GLFramebuffer =  (function () {
	    function GLFramebuffer(framebuffer) {
	        
	        this.framebuffer = framebuffer;
	        
	        this.stencil = null;
	        
	        this.dirtyId = 0;
	        
	        this.dirtyFormat = 0;
	        
	        this.dirtySize = 0;
	        
	        this.multisample = exports.MSAA_QUALITY.NONE;
	        
	        this.msaaBuffer = null;
	        
	        this.blitFramebuffer = null;
	    }
	    return GLFramebuffer;
	}());

	var tempRectangle = new Rectangle();
	
	var FramebufferSystem =  (function (_super) {
	    __extends$2(FramebufferSystem, _super);
	    
	    function FramebufferSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        
	        _this.managedFramebuffers = [];
	        
	        _this.unknownFramebuffer = new Framebuffer(10, 10);
	        _this.msaaSamples = null;
	        return _this;
	    }
	    
	    FramebufferSystem.prototype.contextChange = function () {
	        var gl = this.gl = this.renderer.gl;
	        this.CONTEXT_UID = this.renderer.CONTEXT_UID;
	        this.current = this.unknownFramebuffer;
	        this.viewport = new Rectangle();
	        this.hasMRT = true;
	        this.writeDepthTexture = true;
	        this.disposeAll(true);
	        
	        if (this.renderer.context.webGLVersion === 1) {
	            
	            var nativeDrawBuffersExtension_1 = this.renderer.context.extensions.drawBuffers;
	            var nativeDepthTextureExtension = this.renderer.context.extensions.depthTexture;
	            if (settings.PREFER_ENV === exports.ENV.WEBGL_LEGACY) {
	                nativeDrawBuffersExtension_1 = null;
	                nativeDepthTextureExtension = null;
	            }
	            if (nativeDrawBuffersExtension_1) {
	                gl.drawBuffers = function (activeTextures) {
	                    return nativeDrawBuffersExtension_1.drawBuffersWEBGL(activeTextures);
	                };
	            }
	            else {
	                this.hasMRT = false;
	                gl.drawBuffers = function () {
	                    
	                };
	            }
	            if (!nativeDepthTextureExtension) {
	                this.writeDepthTexture = false;
	            }
	        }
	        else {
	            
	            
	            this.msaaSamples = gl.getInternalformatParameter(gl.RENDERBUFFER, gl.RGBA8, gl.SAMPLES);
	        }
	    };
	    
	    FramebufferSystem.prototype.bind = function (framebuffer, frame) {
	        var gl = this.gl;
	        if (framebuffer) {
	            
	            var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID] || this.initFramebuffer(framebuffer);
	            if (this.current !== framebuffer) {
	                this.current = framebuffer;
	                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer);
	            }
	            
	            
	            if (fbo.dirtyId !== framebuffer.dirtyId) {
	                fbo.dirtyId = framebuffer.dirtyId;
	                if (fbo.dirtyFormat !== framebuffer.dirtyFormat) {
	                    fbo.dirtyFormat = framebuffer.dirtyFormat;
	                    this.updateFramebuffer(framebuffer);
	                }
	                else if (fbo.dirtySize !== framebuffer.dirtySize) {
	                    fbo.dirtySize = framebuffer.dirtySize;
	                    this.resizeFramebuffer(framebuffer);
	                }
	            }
	            for (var i = 0; i < framebuffer.colorTextures.length; i++) {
	                var tex = framebuffer.colorTextures[i];
	                this.renderer.texture.unbind(tex.parentTextureArray || tex);
	            }
	            if (framebuffer.depthTexture) {
	                this.renderer.texture.unbind(framebuffer.depthTexture);
	            }
	            if (frame) {
	                this.setViewport(frame.x, frame.y, frame.width, frame.height);
	            }
	            else {
	                this.setViewport(0, 0, framebuffer.width, framebuffer.height);
	            }
	        }
	        else {
	            if (this.current) {
	                this.current = null;
	                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	            }
	            if (frame) {
	                this.setViewport(frame.x, frame.y, frame.width, frame.height);
	            }
	            else {
	                this.setViewport(0, 0, this.renderer.width, this.renderer.height);
	            }
	        }
	    };
	    
	    FramebufferSystem.prototype.setViewport = function (x, y, width, height) {
	        var v = this.viewport;
	        if (v.width !== width || v.height !== height || v.x !== x || v.y !== y) {
	            v.x = x;
	            v.y = y;
	            v.width = width;
	            v.height = height;
	            this.gl.viewport(x, y, width, height);
	        }
	    };
	    Object.defineProperty(FramebufferSystem.prototype, "size", {
	        
	        get: function () {
	            if (this.current) {
	                
	                return { x: 0, y: 0, width: this.current.width, height: this.current.height };
	            }
	            return { x: 0, y: 0, width: this.renderer.width, height: this.renderer.height };
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    FramebufferSystem.prototype.clear = function (r, g, b, a, mask) {
	        if (mask === void 0) { mask = exports.BUFFER_BITS.COLOR | exports.BUFFER_BITS.DEPTH; }
	        var gl = this.gl;
	        
	        gl.clearColor(r, g, b, a);
	        gl.clear(mask);
	    };
	    
	    FramebufferSystem.prototype.initFramebuffer = function (framebuffer) {
	        var gl = this.gl;
	        var fbo = new GLFramebuffer(gl.createFramebuffer());
	        fbo.multisample = this.detectSamples(framebuffer.multisample);
	        framebuffer.glFramebuffers[this.CONTEXT_UID] = fbo;
	        this.managedFramebuffers.push(framebuffer);
	        framebuffer.disposeRunner.add(this);
	        return fbo;
	    };
	    
	    FramebufferSystem.prototype.resizeFramebuffer = function (framebuffer) {
	        var gl = this.gl;
	        var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
	        if (fbo.stencil) {
	            gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.stencil);
	            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, framebuffer.width, framebuffer.height);
	        }
	        var colorTextures = framebuffer.colorTextures;
	        for (var i = 0; i < colorTextures.length; i++) {
	            this.renderer.texture.bind(colorTextures[i], 0);
	        }
	        if (framebuffer.depthTexture) {
	            this.renderer.texture.bind(framebuffer.depthTexture, 0);
	        }
	    };
	    
	    FramebufferSystem.prototype.updateFramebuffer = function (framebuffer) {
	        var gl = this.gl;
	        var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
	        
	        var colorTextures = framebuffer.colorTextures;
	        var count = colorTextures.length;
	        if (!gl.drawBuffers) {
	            count = Math.min(count, 1);
	        }
	        if (fbo.multisample > 1) {
	            fbo.msaaBuffer = gl.createRenderbuffer();
	            gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.msaaBuffer);
	            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.multisample, gl.RGBA8, framebuffer.width, framebuffer.height);
	            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, fbo.msaaBuffer);
	        }
	        var activeTextures = [];
	        for (var i = 0; i < count; i++) {
	            if (i === 0 && fbo.multisample > 1) {
	                continue;
	            }
	            var texture = framebuffer.colorTextures[i];
	            var parentTexture = texture.parentTextureArray || texture;
	            this.renderer.texture.bind(parentTexture, 0);
	            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, texture.target, parentTexture._glTextures[this.CONTEXT_UID].texture, 0);
	            activeTextures.push(gl.COLOR_ATTACHMENT0 + i);
	        }
	        if (activeTextures.length > 1) {
	            gl.drawBuffers(activeTextures);
	        }
	        if (framebuffer.depthTexture) {
	            var writeDepthTexture = this.writeDepthTexture;
	            if (writeDepthTexture) {
	                var depthTexture = framebuffer.depthTexture;
	                this.renderer.texture.bind(depthTexture, 0);
	                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture._glTextures[this.CONTEXT_UID].texture, 0);
	            }
	        }
	        if (!fbo.stencil && (framebuffer.stencil || framebuffer.depth)) {
	            fbo.stencil = gl.createRenderbuffer();
	            gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.stencil);
	            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, framebuffer.width, framebuffer.height);
	            
	            if (!framebuffer.depthTexture) { 
	                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, fbo.stencil);
	            }
	        }
	    };
	    
	    FramebufferSystem.prototype.detectSamples = function (samples) {
	        var msaaSamples = this.msaaSamples;
	        var res = exports.MSAA_QUALITY.NONE;
	        if (samples <= 1 || msaaSamples === null) {
	            return res;
	        }
	        for (var i = 0; i < msaaSamples.length; i++) {
	            if (msaaSamples[i] <= samples) {
	                res = msaaSamples[i];
	                break;
	            }
	        }
	        if (res === 1) {
	            res = exports.MSAA_QUALITY.NONE;
	        }
	        return res;
	    };
	    
	    FramebufferSystem.prototype.blit = function (framebuffer, sourcePixels, destPixels) {
	        var _a = this, current = _a.current, renderer = _a.renderer, gl = _a.gl, CONTEXT_UID = _a.CONTEXT_UID;
	        if (renderer.context.webGLVersion !== 2) {
	            return;
	        }
	        if (!current) {
	            return;
	        }
	        var fbo = current.glFramebuffers[CONTEXT_UID];
	        if (!fbo) {
	            return;
	        }
	        if (!framebuffer) {
	            if (fbo.multisample <= 1) {
	                return;
	            }
	            if (!fbo.blitFramebuffer) {
	                fbo.blitFramebuffer = new Framebuffer(current.width, current.height);
	                fbo.blitFramebuffer.addColorTexture(0, current.colorTextures[0]);
	            }
	            framebuffer = fbo.blitFramebuffer;
	            framebuffer.width = current.width;
	            framebuffer.height = current.height;
	        }
	        if (!sourcePixels) {
	            sourcePixels = tempRectangle;
	            sourcePixels.width = current.width;
	            sourcePixels.height = current.height;
	        }
	        if (!destPixels) {
	            destPixels = sourcePixels;
	        }
	        var sameSize = sourcePixels.width === destPixels.width && sourcePixels.height === destPixels.height;
	        this.bind(framebuffer);
	        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo.framebuffer);
	        gl.blitFramebuffer(sourcePixels.x, sourcePixels.y, sourcePixels.width, sourcePixels.height, destPixels.x, destPixels.y, destPixels.width, destPixels.height, gl.COLOR_BUFFER_BIT, sameSize ? gl.NEAREST : gl.LINEAR);
	    };
	    
	    FramebufferSystem.prototype.disposeFramebuffer = function (framebuffer, contextLost) {
	        var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
	        var gl = this.gl;
	        if (!fbo) {
	            return;
	        }
	        delete framebuffer.glFramebuffers[this.CONTEXT_UID];
	        var index = this.managedFramebuffers.indexOf(framebuffer);
	        if (index >= 0) {
	            this.managedFramebuffers.splice(index, 1);
	        }
	        framebuffer.disposeRunner.remove(this);
	        if (!contextLost) {
	            gl.deleteFramebuffer(fbo.framebuffer);
	            if (fbo.stencil) {
	                gl.deleteRenderbuffer(fbo.stencil);
	            }
	        }
	    };
	    
	    FramebufferSystem.prototype.disposeAll = function (contextLost) {
	        var list = this.managedFramebuffers;
	        this.managedFramebuffers = [];
	        for (var i = 0; i < list.length; i++) {
	            this.disposeFramebuffer(list[i], contextLost);
	        }
	    };
	    
	    FramebufferSystem.prototype.forceStencil = function () {
	        var framebuffer = this.current;
	        if (!framebuffer) {
	            return;
	        }
	        var fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
	        if (!fbo || fbo.stencil) {
	            return;
	        }
	        framebuffer.enableStencil();
	        var w = framebuffer.width;
	        var h = framebuffer.height;
	        var gl = this.gl;
	        var stencil = gl.createRenderbuffer();
	        gl.bindRenderbuffer(gl.RENDERBUFFER, stencil);
	        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, w, h);
	        fbo.stencil = stencil;
	        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, stencil);
	    };
	    
	    FramebufferSystem.prototype.reset = function () {
	        this.current = this.unknownFramebuffer;
	        this.viewport = new Rectangle();
	    };
	    return FramebufferSystem;
	}(System));

	var GLBuffer =  (function () {
	    function GLBuffer(buffer) {
	        this.buffer = buffer || null;
	        this.updateID = -1;
	        this.byteLength = -1;
	        this.refCount = 0;
	    }
	    return GLBuffer;
	}());

	var byteSizeMap$1 = { 5126: 4, 5123: 2, 5121: 1 };
	
	var GeometrySystem =  (function (_super) {
	    __extends$2(GeometrySystem, _super);
	    
	    function GeometrySystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        _this._activeGeometry = null;
	        _this._activeVao = null;
	        
	        _this.hasVao = true;
	        
	        _this.hasInstance = true;
	        
	        _this.canUseUInt32ElementIndex = false;
	        
	        _this.managedGeometries = {};
	        
	        _this.managedBuffers = {};
	        return _this;
	    }
	    
	    GeometrySystem.prototype.contextChange = function () {
	        this.disposeAll(true);
	        var gl = this.gl = this.renderer.gl;
	        var context = this.renderer.context;
	        this.CONTEXT_UID = this.renderer.CONTEXT_UID;
	        
	        if (context.webGLVersion !== 2) {
	            
	            var nativeVaoExtension_1 = this.renderer.context.extensions.vertexArrayObject;
	            if (settings.PREFER_ENV === exports.ENV.WEBGL_LEGACY) {
	                nativeVaoExtension_1 = null;
	            }
	            if (nativeVaoExtension_1) {
	                gl.createVertexArray = function () {
	                    return nativeVaoExtension_1.createVertexArrayOES();
	                };
	                gl.bindVertexArray = function (vao) {
	                    return nativeVaoExtension_1.bindVertexArrayOES(vao);
	                };
	                gl.deleteVertexArray = function (vao) {
	                    return nativeVaoExtension_1.deleteVertexArrayOES(vao);
	                };
	            }
	            else {
	                this.hasVao = false;
	                gl.createVertexArray = function () {
	                    return null;
	                };
	                gl.bindVertexArray = function () {
	                    return null;
	                };
	                gl.deleteVertexArray = function () {
	                    return null;
	                };
	            }
	        }
	        if (context.webGLVersion !== 2) {
	            var instanceExt_1 = gl.getExtension('ANGLE_instanced_arrays');
	            if (instanceExt_1) {
	                gl.vertexAttribDivisor = function (a, b) {
	                    return instanceExt_1.vertexAttribDivisorANGLE(a, b);
	                };
	                gl.drawElementsInstanced = function (a, b, c, d, e) {
	                    return instanceExt_1.drawElementsInstancedANGLE(a, b, c, d, e);
	                };
	                gl.drawArraysInstanced = function (a, b, c, d) {
	                    return instanceExt_1.drawArraysInstancedANGLE(a, b, c, d);
	                };
	            }
	            else {
	                this.hasInstance = false;
	            }
	        }
	        this.canUseUInt32ElementIndex = context.webGLVersion === 2 || !!context.extensions.uint32ElementIndex;
	    };
	    
	    GeometrySystem.prototype.bind = function (geometry, shader) {
	        shader = shader || this.renderer.shader.shader;
	        var gl = this.gl;
	        
	        
	        
	        
	        var vaos = geometry.glVertexArrayObjects[this.CONTEXT_UID];
	        var incRefCount = false;
	        if (!vaos) {
	            this.managedGeometries[geometry.id] = geometry;
	            geometry.disposeRunner.add(this);
	            geometry.glVertexArrayObjects[this.CONTEXT_UID] = vaos = {};
	            incRefCount = true;
	        }
	        var vao = vaos[shader.program.id] || this.initGeometryVao(geometry, shader.program, incRefCount);
	        this._activeGeometry = geometry;
	        if (this._activeVao !== vao) {
	            this._activeVao = vao;
	            if (this.hasVao) {
	                gl.bindVertexArray(vao);
	            }
	            else {
	                this.activateVao(geometry, shader.program);
	            }
	        }
	        
	        
	        
	        this.updateBuffers();
	    };
	    
	    GeometrySystem.prototype.reset = function () {
	        this.unbind();
	    };
	    
	    GeometrySystem.prototype.updateBuffers = function () {
	        var geometry = this._activeGeometry;
	        var gl = this.gl;
	        for (var i = 0; i < geometry.buffers.length; i++) {
	            var buffer = geometry.buffers[i];
	            var glBuffer = buffer._glBuffers[this.CONTEXT_UID];
	            if (buffer._updateID !== glBuffer.updateID) {
	                glBuffer.updateID = buffer._updateID;
	                
	                var type = buffer.index ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
	                
	                
	                
	                
	                
	                gl.bindBuffer(type, glBuffer.buffer);
	                
	                this._boundBuffer = glBuffer;
	                if (glBuffer.byteLength >= buffer.data.byteLength) {
	                    
	                    gl.bufferSubData(type, 0, buffer.data);
	                }
	                else {
	                    var drawType = buffer.static ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;
	                    glBuffer.byteLength = buffer.data.byteLength;
	                    gl.bufferData(type, buffer.data, drawType);
	                }
	            }
	        }
	    };
	    
	    GeometrySystem.prototype.checkCompatibility = function (geometry, program) {
	        
	        var geometryAttributes = geometry.attributes;
	        var shaderAttributes = program.attributeData;
	        for (var j in shaderAttributes) {
	            if (!geometryAttributes[j]) {
	                throw new Error("shader and geometry incompatible, geometry missing the \"" + j + "\" attribute");
	            }
	        }
	    };
	    
	    GeometrySystem.prototype.getSignature = function (geometry, program) {
	        var attribs = geometry.attributes;
	        var shaderAttributes = program.attributeData;
	        var strings = ['g', geometry.id];
	        for (var i in attribs) {
	            if (shaderAttributes[i]) {
	                strings.push(i);
	            }
	        }
	        return strings.join('-');
	    };
	    
	    GeometrySystem.prototype.initGeometryVao = function (geometry, program, incRefCount) {
	        if (incRefCount === void 0) { incRefCount = true; }
	        this.checkCompatibility(geometry, program);
	        var gl = this.gl;
	        var CONTEXT_UID = this.CONTEXT_UID;
	        var signature = this.getSignature(geometry, program);
	        var vaoObjectHash = geometry.glVertexArrayObjects[this.CONTEXT_UID];
	        var vao = vaoObjectHash[signature];
	        if (vao) {
	            
	            vaoObjectHash[program.id] = vao;
	            return vao;
	        }
	        var buffers = geometry.buffers;
	        var attributes = geometry.attributes;
	        var tempStride = {};
	        var tempStart = {};
	        for (var j in buffers) {
	            tempStride[j] = 0;
	            tempStart[j] = 0;
	        }
	        for (var j in attributes) {
	            if (!attributes[j].size && program.attributeData[j]) {
	                attributes[j].size = program.attributeData[j].size;
	            }
	            else if (!attributes[j].size) {
	                console.warn("PIXI Geometry attribute '" + j + "' size cannot be determined (likely the bound shader does not have the attribute)"); 
	            }
	            tempStride[attributes[j].buffer] += attributes[j].size * byteSizeMap$1[attributes[j].type];
	        }
	        for (var j in attributes) {
	            var attribute = attributes[j];
	            var attribSize = attribute.size;
	            if (attribute.stride === undefined) {
	                if (tempStride[attribute.buffer] === attribSize * byteSizeMap$1[attribute.type]) {
	                    attribute.stride = 0;
	                }
	                else {
	                    attribute.stride = tempStride[attribute.buffer];
	                }
	            }
	            if (attribute.start === undefined) {
	                attribute.start = tempStart[attribute.buffer];
	                tempStart[attribute.buffer] += attribSize * byteSizeMap$1[attribute.type];
	            }
	        }
	        vao = gl.createVertexArray();
	        gl.bindVertexArray(vao);
	        
	        
	        for (var i = 0; i < buffers.length; i++) {
	            var buffer = buffers[i];
	            if (!buffer._glBuffers[CONTEXT_UID]) {
	                buffer._glBuffers[CONTEXT_UID] = new GLBuffer(gl.createBuffer());
	                this.managedBuffers[buffer.id] = buffer;
	                buffer.disposeRunner.add(this);
	            }
	            if (incRefCount) {
	                buffer._glBuffers[CONTEXT_UID].refCount++;
	            }
	        }
	        
	        
	        this.activateVao(geometry, program);
	        this._activeVao = vao;
	        
	        vaoObjectHash[program.id] = vao;
	        vaoObjectHash[signature] = vao;
	        return vao;
	    };
	    
	    GeometrySystem.prototype.disposeBuffer = function (buffer, contextLost) {
	        if (!this.managedBuffers[buffer.id]) {
	            return;
	        }
	        delete this.managedBuffers[buffer.id];
	        var glBuffer = buffer._glBuffers[this.CONTEXT_UID];
	        var gl = this.gl;
	        buffer.disposeRunner.remove(this);
	        if (!glBuffer) {
	            return;
	        }
	        if (!contextLost) {
	            gl.deleteBuffer(glBuffer.buffer);
	        }
	        delete buffer._glBuffers[this.CONTEXT_UID];
	    };
	    
	    GeometrySystem.prototype.disposeGeometry = function (geometry, contextLost) {
	        if (!this.managedGeometries[geometry.id]) {
	            return;
	        }
	        delete this.managedGeometries[geometry.id];
	        var vaos = geometry.glVertexArrayObjects[this.CONTEXT_UID];
	        var gl = this.gl;
	        var buffers = geometry.buffers;
	        geometry.disposeRunner.remove(this);
	        if (!vaos) {
	            return;
	        }
	        for (var i = 0; i < buffers.length; i++) {
	            var buf = buffers[i]._glBuffers[this.CONTEXT_UID];
	            buf.refCount--;
	            if (buf.refCount === 0 && !contextLost) {
	                this.disposeBuffer(buffers[i], contextLost);
	            }
	        }
	        if (!contextLost) {
	            for (var vaoId in vaos) {
	                
	                if (vaoId[0] === 'g') {
	                    var vao = vaos[vaoId];
	                    if (this._activeVao === vao) {
	                        this.unbind();
	                    }
	                    gl.deleteVertexArray(vao);
	                }
	            }
	        }
	        delete geometry.glVertexArrayObjects[this.CONTEXT_UID];
	    };
	    
	    GeometrySystem.prototype.disposeAll = function (contextLost) {
	        var all = Object.keys(this.managedGeometries);
	        for (var i = 0; i < all.length; i++) {
	            this.disposeGeometry(this.managedGeometries[all[i]], contextLost);
	        }
	        all = Object.keys(this.managedBuffers);
	        for (var i = 0; i < all.length; i++) {
	            this.disposeBuffer(this.managedBuffers[all[i]], contextLost);
	        }
	    };
	    
	    GeometrySystem.prototype.activateVao = function (geometry, program) {
	        var gl = this.gl;
	        var CONTEXT_UID = this.CONTEXT_UID;
	        var buffers = geometry.buffers;
	        var attributes = geometry.attributes;
	        if (geometry.indexBuffer) {
	            
	            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indexBuffer._glBuffers[CONTEXT_UID].buffer);
	        }
	        var lastBuffer = null;
	        
	        for (var j in attributes) {
	            var attribute = attributes[j];
	            var buffer = buffers[attribute.buffer];
	            var glBuffer = buffer._glBuffers[CONTEXT_UID];
	            if (program.attributeData[j]) {
	                if (lastBuffer !== glBuffer) {
	                    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer.buffer);
	                    lastBuffer = glBuffer;
	                }
	                var location = program.attributeData[j].location;
	                
	                
	                gl.enableVertexAttribArray(location);
	                gl.vertexAttribPointer(location, attribute.size, attribute.type || gl.FLOAT, attribute.normalized, attribute.stride, attribute.start);
	                if (attribute.instance) {
	                    
	                    if (this.hasInstance) {
	                        gl.vertexAttribDivisor(location, 1);
	                    }
	                    else {
	                        throw new Error('geometry error, GPU Instancing is not supported on this device');
	                    }
	                }
	            }
	        }
	    };
	    
	    GeometrySystem.prototype.draw = function (type, size, start, instanceCount) {
	        var gl = this.gl;
	        var geometry = this._activeGeometry;
	        
	        if (geometry.indexBuffer) {
	            var byteSize = geometry.indexBuffer.data.BYTES_PER_ELEMENT;
	            var glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
	            if (byteSize === 2 || (byteSize === 4 && this.canUseUInt32ElementIndex)) {
	                if (geometry.instanced) {
	                    
	                    gl.drawElementsInstanced(type, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize, instanceCount || 1);
	                    
	                }
	                else {
	                    
	                    gl.drawElements(type, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize);
	                    
	                }
	            }
	            else {
	                console.warn('unsupported index buffer type: uint32');
	            }
	        }
	        else if (geometry.instanced) {
	            
	            gl.drawArraysInstanced(type, start, size || geometry.getSize(), instanceCount || 1);
	        }
	        else {
	            gl.drawArrays(type, start, size || geometry.getSize());
	        }
	        return this;
	    };
	    
	    GeometrySystem.prototype.unbind = function () {
	        this.gl.bindVertexArray(null);
	        this._activeVao = null;
	        this._activeGeometry = null;
	    };
	    return GeometrySystem;
	}(System));

	
	var MaskData =  (function () {
	    
	    function MaskData(maskObject) {
	        if (maskObject === void 0) { maskObject = null; }
	        
	        this.type = exports.MASK_TYPES.NONE;
	        
	        this.autoDetect = true;
	        
	        this.maskObject = maskObject || null;
	        
	        this.pooled = false;
	        
	        this.isMaskData = true;
	        
	        this._stencilCounter = 0;
	        
	        this._scissorCounter = 0;
	        
	        this._scissorRect = null;
	        
	        this._target = null;
	    }
	    
	    MaskData.prototype.reset = function () {
	        if (this.pooled) {
	            this.maskObject = null;
	            this.type = exports.MASK_TYPES.NONE;
	            this.autoDetect = true;
	        }
	        this._target = null;
	    };
	    
	    MaskData.prototype.copyCountersOrReset = function (maskAbove) {
	        if (maskAbove) {
	            this._stencilCounter = maskAbove._stencilCounter;
	            this._scissorCounter = maskAbove._scissorCounter;
	            this._scissorRect = maskAbove._scissorRect;
	        }
	        else {
	            this._stencilCounter = 0;
	            this._scissorCounter = 0;
	            this._scissorRect = null;
	        }
	    };
	    return MaskData;
	}());

	
	function compileShader(gl, type, src) {
	    var shader = gl.createShader(type);
	    gl.shaderSource(shader, src);
	    gl.compileShader(shader);
	    return shader;
	}
	
	function compileProgram(gl, vertexSrc, fragmentSrc, attributeLocations) {
	    var glVertShader = compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
	    var glFragShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
	    var program = gl.createProgram();
	    gl.attachShader(program, glVertShader);
	    gl.attachShader(program, glFragShader);
	    
	    if (attributeLocations) {
	        for (var i in attributeLocations) {
	            gl.bindAttribLocation(program, attributeLocations[i], i);
	        }
	    }
	    gl.linkProgram(program);
	    
	    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	        if (!gl.getShaderParameter(glVertShader, gl.COMPILE_STATUS)) {
	            console.warn(vertexSrc);
	            console.error(gl.getShaderInfoLog(glVertShader));
	        }
	        if (!gl.getShaderParameter(glFragShader, gl.COMPILE_STATUS)) {
	            console.warn(fragmentSrc);
	            console.error(gl.getShaderInfoLog(glFragShader));
	        }
	        console.error('Pixi.js Error: Could not initialize shader.');
	        console.error('gl.VALIDATE_STATUS', gl.getProgramParameter(program, gl.VALIDATE_STATUS));
	        console.error('gl.getError()', gl.getError());
	        
	        if (gl.getProgramInfoLog(program) !== '') {
	            console.warn('Pixi.js Warning: gl.getProgramInfoLog()', gl.getProgramInfoLog(program));
	        }
	        gl.deleteProgram(program);
	        program = null;
	    }
	    
	    gl.deleteShader(glVertShader);
	    gl.deleteShader(glFragShader);
	    return program;
	}

	function booleanArray(size) {
	    var array = new Array(size);
	    for (var i = 0; i < array.length; i++) {
	        array[i] = false;
	    }
	    return array;
	}
	
	function defaultValue(type, size) {
	    switch (type) {
	        case 'float':
	            return 0;
	        case 'vec2':
	            return new Float32Array(2 * size);
	        case 'vec3':
	            return new Float32Array(3 * size);
	        case 'vec4':
	            return new Float32Array(4 * size);
	        case 'int':
	        case 'sampler2D':
	        case 'sampler2DArray':
	            return 0;
	        case 'ivec2':
	            return new Int32Array(2 * size);
	        case 'ivec3':
	            return new Int32Array(3 * size);
	        case 'ivec4':
	            return new Int32Array(4 * size);
	        case 'bool':
	            return false;
	        case 'bvec2':
	            return booleanArray(2 * size);
	        case 'bvec3':
	            return booleanArray(3 * size);
	        case 'bvec4':
	            return booleanArray(4 * size);
	        case 'mat2':
	            return new Float32Array([1, 0,
	                0, 1]);
	        case 'mat3':
	            return new Float32Array([1, 0, 0,
	                0, 1, 0,
	                0, 0, 1]);
	        case 'mat4':
	            return new Float32Array([1, 0, 0, 0,
	                0, 1, 0, 0,
	                0, 0, 1, 0,
	                0, 0, 0, 1]);
	    }
	    return null;
	}

	var unknownContext = {};
	var context = unknownContext;
	
	function getTestContext() {
	    if (context === unknownContext || (context && context.isContextLost())) {
	        var canvas = document.createElement('canvas');
	        var gl = void 0;
	        if (settings.PREFER_ENV >= exports.ENV.WEBGL2) {
	            gl = canvas.getContext('webgl2', {});
	        }
	        if (!gl) {
	            gl = canvas.getContext('webgl', {})
	                || canvas.getContext('experimental-webgl', {});
	            if (!gl) {
	                
	                gl = null;
	            }
	            else {
	                
	                gl.getExtension('WEBGL_draw_buffers');
	            }
	        }
	        context = gl;
	    }
	    return context;
	}

	var maxFragmentPrecision;
	function getMaxFragmentPrecision() {
	    if (!maxFragmentPrecision) {
	        maxFragmentPrecision = exports.PRECISION.MEDIUM;
	        var gl = getTestContext();
	        if (gl) {
	            if (gl.getShaderPrecisionFormat) {
	                var shaderFragment = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
	                maxFragmentPrecision = shaderFragment.precision ? exports.PRECISION.HIGH : exports.PRECISION.MEDIUM;
	            }
	        }
	    }
	    return maxFragmentPrecision;
	}

	
	function setPrecision(src, requestedPrecision, maxSupportedPrecision) {
	    if (src.substring(0, 9) !== 'precision') {
	        
	        var precision = requestedPrecision;
	        
	        if (requestedPrecision === exports.PRECISION.HIGH && maxSupportedPrecision !== exports.PRECISION.HIGH) {
	            precision = exports.PRECISION.MEDIUM;
	        }
	        return "precision " + precision + " float;\n" + src;
	    }
	    else if (maxSupportedPrecision !== exports.PRECISION.HIGH && src.substring(0, 15) === 'precision highp') {
	        
	        return src.replace('precision highp', 'precision mediump');
	    }
	    return src;
	}

	var GLSL_TO_SIZE = {
	    float: 1,
	    vec2: 2,
	    vec3: 3,
	    vec4: 4,
	    int: 1,
	    ivec2: 2,
	    ivec3: 3,
	    ivec4: 4,
	    bool: 1,
	    bvec2: 2,
	    bvec3: 3,
	    bvec4: 4,
	    mat2: 4,
	    mat3: 9,
	    mat4: 16,
	    sampler2D: 1,
	};
	
	function mapSize(type) {
	    return GLSL_TO_SIZE[type];
	}

	var GL_TABLE = null;
	var GL_TO_GLSL_TYPES = {
	    FLOAT: 'float',
	    FLOAT_VEC2: 'vec2',
	    FLOAT_VEC3: 'vec3',
	    FLOAT_VEC4: 'vec4',
	    INT: 'int',
	    INT_VEC2: 'ivec2',
	    INT_VEC3: 'ivec3',
	    INT_VEC4: 'ivec4',
	    BOOL: 'bool',
	    BOOL_VEC2: 'bvec2',
	    BOOL_VEC3: 'bvec3',
	    BOOL_VEC4: 'bvec4',
	    FLOAT_MAT2: 'mat2',
	    FLOAT_MAT3: 'mat3',
	    FLOAT_MAT4: 'mat4',
	    SAMPLER_2D: 'sampler2D',
	    INT_SAMPLER_2D: 'sampler2D',
	    UNSIGNED_INT_SAMPLER_2D: 'sampler2D',
	    SAMPLER_CUBE: 'samplerCube',
	    INT_SAMPLER_CUBE: 'samplerCube',
	    UNSIGNED_INT_SAMPLER_CUBE: 'samplerCube',
	    SAMPLER_2D_ARRAY: 'sampler2DArray',
	    INT_SAMPLER_2D_ARRAY: 'sampler2DArray',
	    UNSIGNED_INT_SAMPLER_2D_ARRAY: 'sampler2DArray',
	};
	
	function mapType(gl, type) {
	    if (!GL_TABLE) {
	        var typeNames = Object.keys(GL_TO_GLSL_TYPES);
	        GL_TABLE = {};
	        for (var i = 0; i < typeNames.length; ++i) {
	            var tn = typeNames[i];
	            GL_TABLE[gl[tn]] = GL_TO_GLSL_TYPES[tn];
	        }
	    }
	    return GL_TABLE[type];
	}

	
	
	
	
	
	
	
	
	
	
	
	
	
	
	var uniformParsers = [
	    
	    {
	        test: function (data) {
	            return data.type === 'float' && data.size === 1;
	        },
	        code: function (name) {
	            return "\n            if(uv[\"" + name + "\"] !== ud[\"" + name + "\"].value)\n            {\n                ud[\"" + name + "\"].value = uv[\"" + name + "\"]\n                gl.uniform1f(ud[\"" + name + "\"].location, uv[\"" + name + "\"])\n            }\n            ";
	        },
	    },
	    
	    {
	        test: function (data) {
	            
	            return (data.type === 'sampler2D' || data.type === 'samplerCube' || data.type === 'sampler2DArray') && data.size === 1 && !data.isArray;
	        },
	        code: function (name) { return "t = syncData.textureCount++;\n\n            renderer.texture.bind(uv[\"" + name + "\"], t);\n\n            if(ud[\"" + name + "\"].value !== t)\n            {\n                ud[\"" + name + "\"].value = t;\n                gl.uniform1i(ud[\"" + name + "\"].location, t);\n; 
	    },
	    
	    {
	        test: function (data, uniform) {
	            return data.type === 'mat3' && data.size === 1 && uniform.a !== undefined;
	        },
	        code: function (name) {
	            
	            return "\n            gl.uniformMatrix3fv(ud[\"" + name + "\"].location, false, uv[\"" + name + "\"].toArray(true));\n            ";
	        },
	    },
	    
	    {
	        test: function (data, uniform) {
	            return data.type === 'vec2' && data.size === 1 && uniform.x !== undefined;
	        },
	        code: function (name) {
	            return "\n                cv = ud[\"" + name + "\"].value;\n                v = uv[\"" + name + "\"];\n\n                if(cv[0] !== v.x || cv[1] !== v.y)\n                {\n                    cv[0] = v.x;\n                    cv[1] = v.y;\n                    gl.uniform2f(ud[\"" + name + "\"].location, v.x, v.y);\n                }";
	        },
	    },
	    
	    {
	        test: function (data) {
	            return data.type === 'vec2' && data.size === 1;
	        },
	        code: function (name) {
	            return "\n                cv = ud[\"" + name + "\"].value;\n                v = uv[\"" + name + "\"];\n\n                if(cv[0] !== v[0] || cv[1] !== v[1])\n                {\n                    cv[0] = v[0];\n                    cv[1] = v[1];\n                    gl.uniform2f(ud[\"" + name + "\"].location, v[0], v[1]);\n                }\n            ";
	        },
	    },
	    
	    {
	        test: function (data, uniform) {
	            return data.type === 'vec4' && data.size === 1 && uniform.width !== undefined;
	        },
	        code: function (name) {
	            return "\n                cv = ud[\"" + name + "\"].value;\n                v = uv[\"" + name + "\"];\n\n                if(cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.width || cv[3] !== v.height)\n                {\n                    cv[0] = v.x;\n                    cv[1] = v.y;\n                    cv[2] = v.width;\n                    cv[3] = v.height;\n                    gl.uniform4f(ud[\"" + name + "\"].location, v.x, v.y, v.width, v.height)\n                }";
	        },
	    },
	    
	    {
	        test: function (data) {
	            return data.type === 'vec4' && data.size === 1;
	        },
	        code: function (name) {
	            return "\n                cv = ud[\"" + name + "\"].value;\n                v = uv[\"" + name + "\"];\n\n                if(cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])\n                {\n                    cv[0] = v[0];\n                    cv[1] = v[1];\n                    cv[2] = v[2];\n                    cv[3] = v[3];\n\n                    gl.uniform4f(ud[\"" + name + "\"].location, v[0], v[1], v[2], v[3])\n                }";
	        },
	    } ];

	
	
	
	
	
	var GLSL_TO_SINGLE_SETTERS_CACHED = {
	    float: "\n    if(cv !== v)\n    {\n        cv.v = v;\n        gl.uniform1f(location, v)\n    }",
	    vec2: "\n    if(cv[0] !== v[0] || cv[1] !== v[1])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        gl.uniform2f(location, v[0], v[1])\n    }",
	    vec3: "\n    if(cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])\n    {\n        cv[0] = v[0];\n        cv[1] = v[1];\n        cv[2] = v[2];\n\n        gl.uniform3f(location, v[0], v[1], v[2])\n    }",
	    vec4: 'gl.uniform4f(location, v[0], v[1], v[2], v[3])',
	    int: 'gl.uniform1i(location, v)',
	    ivec2: 'gl.uniform2i(location, v[0], v[1])',
	    ivec3: 'gl.uniform3i(location, v[0], v[1], v[2])',
	    ivec4: 'gl.uniform4i(location, v[0], v[1], v[2], v[3])',
	    bool: 'gl.uniform1i(location, v)',
	    bvec2: 'gl.uniform2i(location, v[0], v[1])',
	    bvec3: 'gl.uniform3i(location, v[0], v[1], v[2])',
	    bvec4: 'gl.uniform4i(location, v[0], v[1], v[2], v[3])',
	    mat2: 'gl.uniformMatrix2fv(location, false, v)',
	    mat3: 'gl.uniformMatrix3fv(location, false, v)',
	    mat4: 'gl.uniformMatrix4fv(location, false, v)',
	    sampler2D: 'gl.uniform1i(location, v)',
	    samplerCube: 'gl.uniform1i(location, v)',
	    sampler2DArray: 'gl.uniform1i(location, v)',
	};
	var GLSL_TO_ARRAY_SETTERS = {
	    float: "gl.uniform1fv(location, v)",
	    vec2: "gl.uniform2fv(location, v)",
	    vec3: "gl.uniform3fv(location, v)",
	    vec4: 'gl.uniform4fv(location, v)',
	    mat4: 'gl.uniformMatrix4fv(location, false, v)',
	    mat3: 'gl.uniformMatrix3fv(location, false, v)',
	    mat2: 'gl.uniformMatrix2fv(location, false, v)',
	    int: 'gl.uniform1iv(location, v)',
	    ivec2: 'gl.uniform2iv(location, v)',
	    ivec3: 'gl.uniform3iv(location, v)',
	    ivec4: 'gl.uniform4iv(location, v)',
	    bool: 'gl.uniform1iv(location, v)',
	    bvec2: 'gl.uniform2iv(location, v)',
	    bvec3: 'gl.uniform3iv(location, v)',
	    bvec4: 'gl.uniform4iv(location, v)',
	    sampler2D: 'gl.uniform1iv(location, v)',
	    samplerCube: 'gl.uniform1iv(location, v)',
	    sampler2DArray: 'gl.uniform1iv(location, v)',
	};
	function generateUniformsSync(group, uniformData) {
	    var funcFragments = ["\n        var v = null;\n        var cv = null\n        var t = 0;\n        var gl = renderer.gl\n    "];
	    for (var i in group.uniforms) {
	        var data = uniformData[i];
	        if (!data) {
	            if (group.uniforms[i].group) {
	                funcFragments.push("\n                    renderer.shader.syncUniformGroup(uv[\"" + i + "\"], syncData);\n                ");
	            }
	            continue;
	        }
	        var uniform = group.uniforms[i];
	        var parsed = false;
	        for (var j = 0; j < uniformParsers.length; j++) {
	            if (uniformParsers[j].test(data, uniform)) {
	                funcFragments.push(uniformParsers[j].code(i, uniform));
	                parsed = true;
	                break;
	            }
	        }
	        if (!parsed) {
	            var templateType = (data.size === 1) ? GLSL_TO_SINGLE_SETTERS_CACHED : GLSL_TO_ARRAY_SETTERS;
	            var template = templateType[data.type].replace('location', "ud[\"" + i + "\"].location");
	            funcFragments.push("\n            cv = ud[\"" + i + "\"].value;\n            v = uv[\"" + i + "\"];\n            " + template + ";");
	        }
	    }
	    
	    
	    return new Function('ud', 'uv', 'renderer', 'syncData', funcFragments.join('\n'));
	}

	var fragTemplate = [
	    'precision mediump float;',
	    'void main(void){',
	    'float test = 0.1;',
	    '%forloop%',
	    'gl_FragColor = vec4(0.0);',
	    '}' ].join('\n');
	function generateIfTestSrc(maxIfs) {
	    var src = '';
	    for (var i = 0; i < maxIfs; ++i) {
	        if (i > 0) {
	            src += '\nelse ';
	        }
	        if (i < maxIfs - 1) {
	            src += "if(test == " + i + ".0){}";
	        }
	    }
	    return src;
	}
	function checkMaxIfStatementsInShader(maxIfs, gl) {
	    if (maxIfs === 0) {
	        throw new Error('Invalid value of `0` passed to `checkMaxIfStatementsInShader`');
	    }
	    var shader = gl.createShader(gl.FRAGMENT_SHADER);
	    while (true) 
	     {
	        var fragmentSrc = fragTemplate.replace(/%forloop%/gi, generateIfTestSrc(maxIfs));
	        gl.shaderSource(shader, fragmentSrc);
	        gl.compileShader(shader);
	        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	            maxIfs = (maxIfs / 2) | 0;
	        }
	        else {
	            
	            break;
	        }
	    }
	    return maxIfs;
	}

	
	var unsafeEval;
	
	function unsafeEvalSupported() {
	    if (typeof unsafeEval === 'boolean') {
	        return unsafeEval;
	    }
	    try {
	        
	        var func = new Function('param1', 'param2', 'param3', 'return param1[param2] === param3;');
	        
	        unsafeEval = func({ a: 'b' }, 'a', 'b') === true;
	    }
	    catch (e) {
	        unsafeEval = false;
	    }
	    return unsafeEval;
	}

	var defaultFragment = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\n\nvoid main(void){\n   gl_FragColor *= texture2D(uSampler, vTextureCoord);\n}";

	var defaultVertex = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void){\n   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n   vTextureCoord = aTextureCoord;\n}\n";

	var UID$3 = 0;
	var nameCache = {};
	
	var Program =  (function () {
	    
	    function Program(vertexSrc, fragmentSrc, name) {
	        if (name === void 0) { name = 'pixi-shader'; }
	        this.id = UID$3++;
	        
	        this.vertexSrc = vertexSrc || Program.defaultVertexSrc;
	        
	        this.fragmentSrc = fragmentSrc || Program.defaultFragmentSrc;
	        this.vertexSrc = this.vertexSrc.trim();
	        this.fragmentSrc = this.fragmentSrc.trim();
	        if (this.vertexSrc.substring(0, 8) !== '#version') {
	            name = name.replace(/\s+/g, '-');
	            if (nameCache[name]) {
	                nameCache[name]++;
	                name += "-" + nameCache[name];
	            }
	            else {
	                nameCache[name] = 1;
	            }
	            this.vertexSrc = "#define SHADER_NAME " + name + "\n" + this.vertexSrc;
	            this.fragmentSrc = "#define SHADER_NAME " + name + "\n" + this.fragmentSrc;
	            this.vertexSrc = setPrecision(this.vertexSrc, settings.PRECISION_VERTEX, exports.PRECISION.HIGH);
	            this.fragmentSrc = setPrecision(this.fragmentSrc, settings.PRECISION_FRAGMENT, getMaxFragmentPrecision());
	        }
	        
	        this.extractData(this.vertexSrc, this.fragmentSrc);
	        
	        this.glPrograms = {};
	        this.syncUniforms = null;
	    }
	    
	    Program.prototype.extractData = function (vertexSrc, fragmentSrc) {
	        var gl = getTestContext();
	        if (gl) {
	            var program = compileProgram(gl, vertexSrc, fragmentSrc);
	            this.attributeData = this.getAttributeData(program, gl);
	            this.uniformData = this.getUniformData(program, gl);
	            gl.deleteProgram(program);
	        }
	        else {
	            this.uniformData = {};
	            this.attributeData = {};
	        }
	    };
	    
	    Program.prototype.getAttributeData = function (program, gl) {
	        var attributes = {};
	        var attributesArray = [];
	        var totalAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	        for (var i = 0; i < totalAttributes; i++) {
	            var attribData = gl.getActiveAttrib(program, i);
	            var type = mapType(gl, attribData.type);
	            
	            var data = {
	                type: type,
	                name: attribData.name,
	                size: mapSize(type),
	                location: 0,
	            };
	            
	            attributes[attribData.name] = data;
	            attributesArray.push(data);
	        }
	        attributesArray.sort(function (a, b) { return (a.name > b.name) ? 1 : -1; }); 
	        for (var i = 0; i < attributesArray.length; i++) {
	            attributesArray[i].location = i;
	        }
	        return attributes;
	    };
	    
	    Program.prototype.getUniformData = function (program, gl) {
	        var uniforms = {};
	        var totalUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	        
	        
	        
	        for (var i = 0; i < totalUniforms; i++) {
	            var uniformData = gl.getActiveUniform(program, i);
	            var name = uniformData.name.replace(/\[.*?\]$/, '');
	            var isArray = uniformData.name.match(/\[.*?\]$/);
	            var type = mapType(gl, uniformData.type);
	            
	            uniforms[name] = {
	                type: type,
	                size: uniformData.size,
	                isArray: isArray,
	                value: defaultValue(type, uniformData.size),
	            };
	            
	        }
	        return uniforms;
	    };
	    Object.defineProperty(Program, "defaultVertexSrc", {
	        
	        get: function () {
	            return defaultVertex;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Program, "defaultFragmentSrc", {
	        
	        get: function () {
	            return defaultFragment;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    Program.from = function (vertexSrc, fragmentSrc, name) {
	        var key = vertexSrc + fragmentSrc;
	        var program = ProgramCache[key];
	        if (!program) {
	            ProgramCache[key] = program = new Program(vertexSrc, fragmentSrc, name);
	        }
	        return program;
	    };
	    return Program;
	}());

	
	var Shader =  (function () {
	    
	    function Shader(program, uniforms) {
	        
	        this.program = program;
	        
	        
	        if (uniforms) {
	            if (uniforms instanceof UniformGroup) {
	                this.uniformGroup = uniforms;
	            }
	            else {
	                this.uniformGroup = new UniformGroup(uniforms);
	            }
	        }
	        else {
	            this.uniformGroup = new UniformGroup({});
	        }
	        
	        
	        
	        for (var i in program.uniformData) {
	            if (this.uniformGroup.uniforms[i] instanceof Array) {
	                this.uniformGroup.uniforms[i] = new Float32Array(this.uniformGroup.uniforms[i]);
	            }
	        }
	    }
	    
	    Shader.prototype.checkUniformExists = function (name, group) {
	        if (group.uniforms[name]) {
	            return true;
	        }
	        for (var i in group.uniforms) {
	            var uniform = group.uniforms[i];
	            if (uniform.group) {
	                if (this.checkUniformExists(name, uniform)) {
	                    return true;
	                }
	            }
	        }
	        return false;
	    };
	    Shader.prototype.destroy = function () {
	        
	        
	        this.uniformGroup = null;
	    };
	    Object.defineProperty(Shader.prototype, "uniforms", {
	        
	        get: function () {
	            return this.uniformGroup.uniforms;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    Shader.from = function (vertexSrc, fragmentSrc, uniforms) {
	        var program = Program.from(vertexSrc, fragmentSrc);
	        return new Shader(program, uniforms);
	    };
	    return Shader;
	}());

	
	var BLEND = 0;
	var OFFSET = 1;
	var CULLING = 2;
	var DEPTH_TEST = 3;
	var WINDING = 4;
	
	var State =  (function () {
	    function State() {
	        this.data = 0;
	        this.blendMode = exports.BLEND_MODES.NORMAL;
	        this.polygonOffset = 0;
	        this.blend = true;
	        
	    }
	    Object.defineProperty(State.prototype, "blend", {
	        
	        get: function () {
	            return !!(this.data & (1 << BLEND));
	        },
	        set: function (value) {
	            if (!!(this.data & (1 << BLEND)) !== value) {
	                this.data ^= (1 << BLEND);
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(State.prototype, "offsets", {
	        
	        get: function () {
	            return !!(this.data & (1 << OFFSET));
	        },
	        set: function (value) {
	            if (!!(this.data & (1 << OFFSET)) !== value) {
	                this.data ^= (1 << OFFSET);
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(State.prototype, "culling", {
	        
	        get: function () {
	            return !!(this.data & (1 << CULLING));
	        },
	        set: function (value) {
	            if (!!(this.data & (1 << CULLING)) !== value) {
	                this.data ^= (1 << CULLING);
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(State.prototype, "depthTest", {
	        
	        get: function () {
	            return !!(this.data & (1 << DEPTH_TEST));
	        },
	        set: function (value) {
	            if (!!(this.data & (1 << DEPTH_TEST)) !== value) {
	                this.data ^= (1 << DEPTH_TEST);
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(State.prototype, "clockwiseFrontFace", {
	        
	        get: function () {
	            return !!(this.data & (1 << WINDING));
	        },
	        set: function (value) {
	            if (!!(this.data & (1 << WINDING)) !== value) {
	                this.data ^= (1 << WINDING);
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(State.prototype, "blendMode", {
	        
	        get: function () {
	            return this._blendMode;
	        },
	        set: function (value) {
	            this.blend = (value !== exports.BLEND_MODES.NONE);
	            this._blendMode = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(State.prototype, "polygonOffset", {
	        
	        get: function () {
	            return this._polygonOffset;
	        },
	        set: function (value) {
	            this.offsets = !!value;
	            this._polygonOffset = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    State.for2d = function () {
	        var state = new State();
	        state.depthTest = false;
	        state.blend = true;
	        return state;
	    };
	    return State;
	}());

	var defaultVertex$1 = "attribute vec2 aVertexPosition;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nuniform vec4 inputSize;\nuniform vec4 outputFrame;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;\n\n    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aVertexPosition * (outputFrame.zw * inputSize.zw);\n}\n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition();\n    vTextureCoord = filterTextureCoord();\n}\n";

	var defaultFragment$1 = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\n\nvoid main(void){\n   gl_FragColor = texture2D(uSampler, vTextureCoord);\n}\n";

	
	var Filter =  (function (_super) {
	    __extends$2(Filter, _super);
	    
	    function Filter(vertexSrc, fragmentSrc, uniforms) {
	        var _this = this;
	        var program = Program.from(vertexSrc || Filter.defaultVertexSrc, fragmentSrc || Filter.defaultFragmentSrc);
	        _this = _super.call(this, program, uniforms) || this;
	        
	        _this.padding = 0;
	        
	        _this.resolution = settings.FILTER_RESOLUTION;
	        
	        _this.enabled = true;
	        
	        _this.autoFit = true;
	        
	        _this.legacy = !!_this.program.attributeData.aTextureCoord;
	        
	        _this.state = new State();
	        return _this;
	    }
	    
	    Filter.prototype.apply = function (filterManager, input, output, clearMode, _currentState) {
	        
	        filterManager.applyFilter(this, input, output, clearMode);
	        
	    };
	    Object.defineProperty(Filter.prototype, "blendMode", {
	        
	        get: function () {
	            return this.state.blendMode;
	        },
	        set: function (value) {
	            this.state.blendMode = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Filter, "defaultVertexSrc", {
	        
	        get: function () {
	            return defaultVertex$1;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Filter, "defaultFragmentSrc", {
	        
	        get: function () {
	            return defaultFragment$1;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return Filter;
	}(Shader));

	var vertex = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\nuniform mat3 otherMatrix;\n\nvarying vec2 vMaskCoord;\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = aTextureCoord;\n    vMaskCoord = ( otherMatrix * vec3( aTextureCoord, 1.0)  ).xy;\n}\n";

	var fragment = "varying vec2 vMaskCoord;\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform sampler2D mask;\nuniform float alpha;\nuniform float npmAlpha;\nuniform vec4 maskClamp;\n\nvoid main(void)\n{\n    float clip = step(3.5,\n        step(maskClamp.x, vMaskCoord.x) +\n        step(maskClamp.y, vMaskCoord.y) +\n        step(vMaskCoord.x, maskClamp.z) +\n        step(vMaskCoord.y, maskClamp.w));\n\n    vec4 original = texture2D(uSampler, vTextureCoord);\n    vec4 masky = texture2D(mask, vMaskCoord);\n    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);\n\n    original *= (alphaMul * masky.r * alpha * clip);\n\n    gl_FragColor = original;\n}\n";

	var tempMat = new Matrix();
	
	var TextureMatrix =  (function () {
	    
	    function TextureMatrix(texture, clampMargin) {
	        this._texture = texture;
	        
	        this.mapCoord = new Matrix();
	        
	        this.uClampFrame = new Float32Array(4);
	        
	        this.uClampOffset = new Float32Array(2);
	        
	        this._textureID = -1;
	        
	        this._updateID = 0;
	        
	        this.clampOffset = 0;
	        
	        this.clampMargin = (typeof clampMargin === 'undefined') ? 0.5 : clampMargin;
	        
	        this.isSimple = false;
	    }
	    Object.defineProperty(TextureMatrix.prototype, "texture", {
	        
	        get: function () {
	            return this._texture;
	        },
	        set: function (value) {
	            this._texture = value;
	            this._textureID = -1;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    TextureMatrix.prototype.multiplyUvs = function (uvs, out) {
	        if (out === undefined) {
	            out = uvs;
	        }
	        var mat = this.mapCoord;
	        for (var i = 0; i < uvs.length; i += 2) {
	            var x = uvs[i];
	            var y = uvs[i + 1];
	            out[i] = (x * mat.a) + (y * mat.c) + mat.tx;
	            out[i + 1] = (x * mat.b) + (y * mat.d) + mat.ty;
	        }
	        return out;
	    };
	    
	    TextureMatrix.prototype.update = function (forceUpdate) {
	        var tex = this._texture;
	        if (!tex || !tex.valid) {
	            return false;
	        }
	        if (!forceUpdate
	            && this._textureID === tex._updateID) {
	            return false;
	        }
	        this._textureID = tex._updateID;
	        this._updateID++;
	        var uvs = tex._uvs;
	        this.mapCoord.set(uvs.x1 - uvs.x0, uvs.y1 - uvs.y0, uvs.x3 - uvs.x0, uvs.y3 - uvs.y0, uvs.x0, uvs.y0);
	        var orig = tex.orig;
	        var trim = tex.trim;
	        if (trim) {
	            tempMat.set(orig.width / trim.width, 0, 0, orig.height / trim.height, -trim.x / trim.width, -trim.y / trim.height);
	            this.mapCoord.append(tempMat);
	        }
	        var texBase = tex.baseTexture;
	        var frame = this.uClampFrame;
	        var margin = this.clampMargin / texBase.resolution;
	        var offset = this.clampOffset;
	        frame[0] = (tex._frame.x + margin + offset) / texBase.width;
	        frame[1] = (tex._frame.y + margin + offset) / texBase.height;
	        frame[2] = (tex._frame.x + tex._frame.width - margin + offset) / texBase.width;
	        frame[3] = (tex._frame.y + tex._frame.height - margin + offset) / texBase.height;
	        this.uClampOffset[0] = offset / texBase.realWidth;
	        this.uClampOffset[1] = offset / texBase.realHeight;
	        this.isSimple = tex._frame.width === texBase.width
	            && tex._frame.height === texBase.height
	            && tex.rotate === 0;
	        return true;
	    };
	    return TextureMatrix;
	}());

	
	var SpriteMaskFilter =  (function (_super) {
	    __extends$2(SpriteMaskFilter, _super);
	    
	    function SpriteMaskFilter(sprite) {
	        var _this = this;
	        var maskMatrix = new Matrix();
	        _this = _super.call(this, vertex, fragment) || this;
	        sprite.renderable = false;
	        
	        _this.maskSprite = sprite;
	        
	        _this.maskMatrix = maskMatrix;
	        return _this;
	    }
	    
	    SpriteMaskFilter.prototype.apply = function (filterManager, input, output, clearMode) {
	        var maskSprite = this.maskSprite;
	        var tex = maskSprite._texture;
	        if (!tex.valid) {
	            return;
	        }
	        if (!tex.uvMatrix) {
	            
	            
	            tex.uvMatrix = new TextureMatrix(tex, 0.0);
	        }
	        tex.uvMatrix.update();
	        this.uniforms.npmAlpha = tex.baseTexture.alphaMode ? 0.0 : 1.0;
	        this.uniforms.mask = tex;
	        
	        this.uniforms.otherMatrix = filterManager.calculateSpriteMatrix(this.maskMatrix, maskSprite)
	            .prepend(tex.uvMatrix.mapCoord);
	        this.uniforms.alpha = maskSprite.worldAlpha;
	        this.uniforms.maskClamp = tex.uvMatrix.uClampFrame;
	        filterManager.applyFilter(this, input, output, clearMode);
	    };
	    return SpriteMaskFilter;
	}(Filter));

	
	var MaskSystem =  (function (_super) {
	    __extends$2(MaskSystem, _super);
	    
	    function MaskSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        
	        _this.enableScissor = false;
	        
	        _this.alphaMaskPool = [];
	        
	        _this.maskDataPool = [];
	        _this.maskStack = [];
	        
	        _this.alphaMaskIndex = 0;
	        return _this;
	    }
	    
	    MaskSystem.prototype.setMaskStack = function (maskStack) {
	        this.maskStack = maskStack;
	        this.renderer.scissor.setMaskStack(maskStack);
	        this.renderer.stencil.setMaskStack(maskStack);
	    };
	    
	    MaskSystem.prototype.push = function (target, maskDataOrTarget) {
	        var maskData = maskDataOrTarget;
	        if (!maskData.isMaskData) {
	            var d = this.maskDataPool.pop() || new MaskData();
	            d.pooled = true;
	            d.maskObject = maskDataOrTarget;
	            maskData = d;
	        }
	        if (maskData.autoDetect) {
	            this.detect(maskData);
	        }
	        maskData.copyCountersOrReset(this.maskStack[this.maskStack.length - 1]);
	        maskData._target = target;
	        switch (maskData.type) {
	            case exports.MASK_TYPES.SCISSOR:
	                this.maskStack.push(maskData);
	                this.renderer.scissor.push(maskData);
	                break;
	            case exports.MASK_TYPES.STENCIL:
	                this.maskStack.push(maskData);
	                this.renderer.stencil.push(maskData);
	                break;
	            case exports.MASK_TYPES.SPRITE:
	                maskData.copyCountersOrReset(null);
	                this.pushSpriteMask(maskData);
	                this.maskStack.push(maskData);
	                break;
	            default:
	                break;
	        }
	    };
	    
	    MaskSystem.prototype.pop = function (target) {
	        var maskData = this.maskStack.pop();
	        if (!maskData || maskData._target !== target) {
	            
	            return;
	        }
	        switch (maskData.type) {
	            case exports.MASK_TYPES.SCISSOR:
	                this.renderer.scissor.pop();
	                break;
	            case exports.MASK_TYPES.STENCIL:
	                this.renderer.stencil.pop(maskData.maskObject);
	                break;
	            case exports.MASK_TYPES.SPRITE:
	                this.popSpriteMask();
	                break;
	            default:
	                break;
	        }
	        maskData.reset();
	        if (maskData.pooled) {
	            this.maskDataPool.push(maskData);
	        }
	    };
	    
	    MaskSystem.prototype.detect = function (maskData) {
	        var maskObject = maskData.maskObject;
	        if (maskObject.isSprite) {
	            maskData.type = exports.MASK_TYPES.SPRITE;
	            return;
	        }
	        maskData.type = exports.MASK_TYPES.STENCIL;
	        
	        if (this.enableScissor
	            && maskObject.isFastRect
	            && maskObject.isFastRect()) {
	            var matrix = maskObject.worldTransform;
	            
	            
	            var rotX = Math.atan2(matrix.b, matrix.a);
	            var rotXY = Math.atan2(matrix.d, matrix.c);
	            
	            rotX = Math.round(rotX * (180 / Math.PI) * 100);
	            rotXY = Math.round(rotXY * (180 / Math.PI) * 100) - rotX;
	            rotX = ((rotX % 9000) + 9000) % 9000;
	            rotXY = ((rotXY % 18000) + 18000) % 18000;
	            if (rotX === 0 && rotXY === 9000) {
	                maskData.type = exports.MASK_TYPES.SCISSOR;
	            }
	        }
	    };
	    
	    MaskSystem.prototype.pushSpriteMask = function (maskData) {
	        var maskObject = maskData.maskObject;
	        var target = maskData._target;
	        var alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex];
	        if (!alphaMaskFilter) {
	            alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex] = [new SpriteMaskFilter(maskObject)];
	        }
	        alphaMaskFilter[0].resolution = this.renderer.resolution;
	        alphaMaskFilter[0].maskSprite = maskObject;
	        var stashFilterArea = target.filterArea;
	        target.filterArea = maskObject.getBounds(true);
	        this.renderer.filter.push(target, alphaMaskFilter);
	        target.filterArea = stashFilterArea;
	        this.alphaMaskIndex++;
	    };
	    
	    MaskSystem.prototype.popSpriteMask = function () {
	        this.renderer.filter.pop();
	        this.alphaMaskIndex--;
	    };
	    return MaskSystem;
	}(System));

	
	var AbstractMaskSystem =  (function (_super) {
	    __extends$2(AbstractMaskSystem, _super);
	    
	    function AbstractMaskSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        
	        _this.maskStack = [];
	        
	        _this.glConst = 0;
	        return _this;
	    }
	    
	    AbstractMaskSystem.prototype.getStackLength = function () {
	        return this.maskStack.length;
	    };
	    
	    AbstractMaskSystem.prototype.setMaskStack = function (maskStack) {
	        var gl = this.renderer.gl;
	        var curStackLen = this.getStackLength();
	        this.maskStack = maskStack;
	        var newStackLen = this.getStackLength();
	        if (newStackLen !== curStackLen) {
	            if (newStackLen === 0) {
	                gl.disable(this.glConst);
	            }
	            else {
	                gl.enable(this.glConst);
	                this._useCurrent();
	            }
	        }
	    };
	    
	    AbstractMaskSystem.prototype._useCurrent = function () {
	        
	    };
	    
	    AbstractMaskSystem.prototype.destroy = function () {
	        _super.prototype.destroy.call(this);
	        this.maskStack = null;
	    };
	    return AbstractMaskSystem;
	}(System));

	
	var ScissorSystem =  (function (_super) {
	    __extends$2(ScissorSystem, _super);
	    
	    function ScissorSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        _this.glConst = WebGLRenderingContext.SCISSOR_TEST;
	        return _this;
	    }
	    ScissorSystem.prototype.getStackLength = function () {
	        var maskData = this.maskStack[this.maskStack.length - 1];
	        if (maskData) {
	            return maskData._scissorCounter;
	        }
	        return 0;
	    };
	    
	    ScissorSystem.prototype.push = function (maskData) {
	        var maskObject = maskData.maskObject;
	        maskObject.renderable = true;
	        var prevData = maskData._scissorRect;
	        var bounds = maskObject.getBounds(true);
	        var gl = this.renderer.gl;
	        maskObject.renderable = false;
	        if (prevData) {
	            bounds.fit(prevData);
	        }
	        else {
	            gl.enable(gl.SCISSOR_TEST);
	        }
	        maskData._scissorCounter++;
	        maskData._scissorRect = bounds;
	        this._useCurrent();
	    };
	    
	    ScissorSystem.prototype.pop = function () {
	        var gl = this.renderer.gl;
	        if (this.getStackLength() > 0) {
	            this._useCurrent();
	        }
	        else {
	            gl.disable(gl.SCISSOR_TEST);
	        }
	    };
	    
	    ScissorSystem.prototype._useCurrent = function () {
	        var rect = this.maskStack[this.maskStack.length - 1]._scissorRect;
	        var rt = this.renderer.renderTexture.current;
	        var _a = this.renderer.projection, transform = _a.transform, sourceFrame = _a.sourceFrame, destinationFrame = _a.destinationFrame;
	        var resolution = rt ? rt.resolution : this.renderer.resolution;
	        var x = ((rect.x - sourceFrame.x) * resolution) + destinationFrame.x;
	        var y = ((rect.y - sourceFrame.y) * resolution) + destinationFrame.y;
	        var width = rect.width * resolution;
	        var height = rect.height * resolution;
	        if (transform) {
	            x += transform.tx * resolution;
	            y += transform.ty * resolution;
	        }
	        if (!rt) {
	            
	            y = this.renderer.height - height - y;
	        }
	        this.renderer.gl.scissor(x, y, width, height);
	    };
	    return ScissorSystem;
	}(AbstractMaskSystem));

	
	var StencilSystem =  (function (_super) {
	    __extends$2(StencilSystem, _super);
	    
	    function StencilSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        _this.glConst = WebGLRenderingContext.STENCIL_TEST;
	        return _this;
	    }
	    StencilSystem.prototype.getStackLength = function () {
	        var maskData = this.maskStack[this.maskStack.length - 1];
	        if (maskData) {
	            return maskData._stencilCounter;
	        }
	        return 0;
	    };
	    
	    StencilSystem.prototype.push = function (maskData) {
	        var maskObject = maskData.maskObject;
	        var gl = this.renderer.gl;
	        var prevMaskCount = maskData._stencilCounter;
	        if (prevMaskCount === 0) {
	            
	            this.renderer.framebuffer.forceStencil();
	            gl.enable(gl.STENCIL_TEST);
	        }
	        maskData._stencilCounter++;
	        
	        gl.colorMask(false, false, false, false);
	        gl.stencilFunc(gl.EQUAL, prevMaskCount, this._getBitwiseMask());
	        gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
	        maskObject.renderable = true;
	        maskObject.render(this.renderer);
	        this.renderer.batch.flush();
	        maskObject.renderable = false;
	        this._useCurrent();
	    };
	    
	    StencilSystem.prototype.pop = function (maskObject) {
	        var gl = this.renderer.gl;
	        if (this.getStackLength() === 0) {
	            
	            gl.disable(gl.STENCIL_TEST);
	            gl.clear(gl.STENCIL_BUFFER_BIT);
	            gl.clearStencil(0);
	        }
	        else {
	            
	            gl.colorMask(false, false, false, false);
	            gl.stencilOp(gl.KEEP, gl.KEEP, gl.DECR);
	            maskObject.renderable = true;
	            maskObject.render(this.renderer);
	            this.renderer.batch.flush();
	            maskObject.renderable = false;
	            this._useCurrent();
	        }
	    };
	    
	    StencilSystem.prototype._useCurrent = function () {
	        var gl = this.renderer.gl;
	        gl.colorMask(true, true, true, true);
	        gl.stencilFunc(gl.EQUAL, this.getStackLength(), this._getBitwiseMask());
	        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
	    };
	    
	    StencilSystem.prototype._getBitwiseMask = function () {
	        return (1 << this.getStackLength()) - 1;
	    };
	    return StencilSystem;
	}(AbstractMaskSystem));

	
	var ProjectionSystem =  (function (_super) {
	    __extends$2(ProjectionSystem, _super);
	    
	    function ProjectionSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        
	        _this.destinationFrame = null;
	        
	        _this.sourceFrame = null;
	        
	        _this.defaultFrame = null;
	        
	        _this.projectionMatrix = new Matrix();
	        
	        _this.transform = null;
	        return _this;
	    }
	    
	    ProjectionSystem.prototype.update = function (destinationFrame, sourceFrame, resolution, root) {
	        this.destinationFrame = destinationFrame || this.destinationFrame || this.defaultFrame;
	        this.sourceFrame = sourceFrame || this.sourceFrame || destinationFrame;
	        
	        this.calculateProjection(this.destinationFrame, this.sourceFrame, resolution, root);
	        if (this.transform) {
	            this.projectionMatrix.append(this.transform);
	        }
	        var renderer = this.renderer;
	        renderer.globalUniforms.uniforms.projectionMatrix = this.projectionMatrix;
	        renderer.globalUniforms.update();
	        
	        
	        if (renderer.shader.shader) {
	            renderer.shader.syncUniformGroup(renderer.shader.shader.uniforms.globals);
	        }
	    };
	    
	    ProjectionSystem.prototype.calculateProjection = function (_destinationFrame, sourceFrame, _resolution, root) {
	        var pm = this.projectionMatrix;
	        var sign = !root ? 1 : -1;
	        pm.identity();
	        pm.a = (1 / sourceFrame.width * 2);
	        pm.d = sign * (1 / sourceFrame.height * 2);
	        pm.tx = -1 - (sourceFrame.x * pm.a);
	        pm.ty = -sign - (sourceFrame.y * pm.d);
	    };
	    
	    ProjectionSystem.prototype.setTransform = function (_matrix) {
	        
	    };
	    return ProjectionSystem;
	}(System));

	
	var tempRect = new Rectangle();
	
	var tempRect2 = new Rectangle();
	
	var viewportFrame = new Rectangle();
	
	var RenderTextureSystem =  (function (_super) {
	    __extends$2(RenderTextureSystem, _super);
	    
	    function RenderTextureSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        
	        _this.clearColor = renderer._backgroundColorRgba;
	        
	        
	        _this.defaultMaskStack = [];
	        
	        
	        _this.current = null;
	        
	        _this.sourceFrame = new Rectangle();
	        
	        _this.destinationFrame = new Rectangle();
	        return _this;
	    }
	    
	    RenderTextureSystem.prototype.bind = function (renderTexture, sourceFrame, destinationFrame) {
	        if (renderTexture === void 0) { renderTexture = null; }
	        var renderer = this.renderer;
	        this.current = renderTexture;
	        var baseTexture;
	        var framebuffer;
	        var resolution;
	        if (renderTexture) {
	            baseTexture = renderTexture.baseTexture;
	            resolution = baseTexture.resolution;
	            if (!sourceFrame) {
	                tempRect.width = renderTexture.frame.width;
	                tempRect.height = renderTexture.frame.height;
	                sourceFrame = tempRect;
	            }
	            if (!destinationFrame) {
	                tempRect2.x = renderTexture.frame.x;
	                tempRect2.y = renderTexture.frame.y;
	                tempRect2.width = sourceFrame.width;
	                tempRect2.height = sourceFrame.height;
	                destinationFrame = tempRect2;
	            }
	            framebuffer = baseTexture.framebuffer;
	        }
	        else {
	            resolution = renderer.resolution;
	            if (!sourceFrame) {
	                tempRect.width = renderer.screen.width;
	                tempRect.height = renderer.screen.height;
	                sourceFrame = tempRect;
	            }
	            if (!destinationFrame) {
	                destinationFrame = tempRect;
	                destinationFrame.width = sourceFrame.width;
	                destinationFrame.height = sourceFrame.height;
	            }
	        }
	        viewportFrame.x = destinationFrame.x * resolution;
	        viewportFrame.y = destinationFrame.y * resolution;
	        viewportFrame.width = destinationFrame.width * resolution;
	        viewportFrame.height = destinationFrame.height * resolution;
	        this.renderer.framebuffer.bind(framebuffer, viewportFrame);
	        this.renderer.projection.update(destinationFrame, sourceFrame, resolution, !framebuffer);
	        if (renderTexture) {
	            this.renderer.mask.setMaskStack(baseTexture.maskStack);
	        }
	        else {
	            this.renderer.mask.setMaskStack(this.defaultMaskStack);
	        }
	        this.sourceFrame.copyFrom(sourceFrame);
	        this.destinationFrame.copyFrom(destinationFrame);
	    };
	    
	    RenderTextureSystem.prototype.clear = function (clearColor, mask) {
	        if (this.current) {
	            clearColor = clearColor || this.current.baseTexture.clearColor;
	        }
	        else {
	            clearColor = clearColor || this.clearColor;
	        }
	        this.renderer.framebuffer.clear(clearColor[0], clearColor[1], clearColor[2], clearColor[3], mask);
	    };
	    RenderTextureSystem.prototype.resize = function () {
	        
	        this.bind(null);
	    };
	    
	    RenderTextureSystem.prototype.reset = function () {
	        this.bind(null);
	    };
	    return RenderTextureSystem;
	}(System));

	var IGLUniformData =  (function () {
	    function IGLUniformData() {
	    }
	    return IGLUniformData;
	}());
	
	var GLProgram =  (function () {
	    
	    function GLProgram(program, uniformData) {
	        
	        this.program = program;
	        
	        this.uniformData = uniformData;
	        
	        this.uniformGroups = {};
	    }
	    
	    GLProgram.prototype.destroy = function () {
	        this.uniformData = null;
	        this.uniformGroups = null;
	        this.program = null;
	    };
	    return GLProgram;
	}());

	var UID$4 = 0;
	
	var defaultSyncData = { textureCount: 0 };
	
	var ShaderSystem =  (function (_super) {
	    __extends$2(ShaderSystem, _super);
	    
	    function ShaderSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        _this.destroyed = false;
	        
	        _this.systemCheck();
	        
	        _this.gl = null;
	        _this.shader = null;
	        _this.program = null;
	        
	        _this.cache = {};
	        _this.id = UID$4++;
	        return _this;
	    }
	    
	    ShaderSystem.prototype.systemCheck = function () {
	        if (!unsafeEvalSupported()) {
	            throw new Error('Current environment does not allow unsafe-eval, '
	                + 'please use @pixi/unsafe-eval module to enable support.');
	        }
	    };
	    ShaderSystem.prototype.contextChange = function (gl) {
	        this.gl = gl;
	        this.reset();
	    };
	    
	    ShaderSystem.prototype.bind = function (shader, dontSync) {
	        shader.uniforms.globals = this.renderer.globalUniforms;
	        var program = shader.program;
	        var glProgram = program.glPrograms[this.renderer.CONTEXT_UID] || this.generateShader(shader);
	        this.shader = shader;
	        
	        if (this.program !== program) {
	            this.program = program;
	            this.gl.useProgram(glProgram.program);
	        }
	        if (!dontSync) {
	            defaultSyncData.textureCount = 0;
	            this.syncUniformGroup(shader.uniformGroup, defaultSyncData);
	        }
	        return glProgram;
	    };
	    
	    ShaderSystem.prototype.setUniforms = function (uniforms) {
	        var shader = this.shader.program;
	        var glProgram = shader.glPrograms[this.renderer.CONTEXT_UID];
	        shader.syncUniforms(glProgram.uniformData, uniforms, this.renderer);
	    };
	    
	    
	    ShaderSystem.prototype.syncUniformGroup = function (group, syncData) {
	        var glProgram = this.getglProgram();
	        if (!group.static || group.dirtyId !== glProgram.uniformGroups[group.id]) {
	            glProgram.uniformGroups[group.id] = group.dirtyId;
	            this.syncUniforms(group, glProgram, syncData);
	        }
	    };
	    
	    ShaderSystem.prototype.syncUniforms = function (group, glProgram, syncData) {
	        var syncFunc = group.syncUniforms[this.shader.program.id] || this.createSyncGroups(group);
	        syncFunc(glProgram.uniformData, group.uniforms, this.renderer, syncData);
	    };
	    
	    ShaderSystem.prototype.createSyncGroups = function (group) {
	        var id = this.getSignature(group, this.shader.program.uniformData);
	        if (!this.cache[id]) {
	            this.cache[id] = generateUniformsSync(group, this.shader.program.uniformData);
	        }
	        group.syncUniforms[this.shader.program.id] = this.cache[id];
	        return group.syncUniforms[this.shader.program.id];
	    };
	    
	    ShaderSystem.prototype.getSignature = function (group, uniformData) {
	        var uniforms = group.uniforms;
	        var strings = [];
	        for (var i in uniforms) {
	            strings.push(i);
	            if (uniformData[i]) {
	                strings.push(uniformData[i].type);
	            }
	        }
	        return strings.join('-');
	    };
	    
	    ShaderSystem.prototype.getglProgram = function () {
	        if (this.shader) {
	            return this.shader.program.glPrograms[this.renderer.CONTEXT_UID];
	        }
	        return null;
	    };
	    
	    ShaderSystem.prototype.generateShader = function (shader) {
	        var gl = this.gl;
	        var program = shader.program;
	        var attribMap = {};
	        for (var i in program.attributeData) {
	            attribMap[i] = program.attributeData[i].location;
	        }
	        var shaderProgram = compileProgram(gl, program.vertexSrc, program.fragmentSrc, attribMap);
	        var uniformData = {};
	        for (var i in program.uniformData) {
	            var data = program.uniformData[i];
	            uniformData[i] = {
	                location: gl.getUniformLocation(shaderProgram, i),
	                value: defaultValue(data.type, data.size),
	            };
	        }
	        var glProgram = new GLProgram(shaderProgram, uniformData);
	        program.glPrograms[this.renderer.CONTEXT_UID] = glProgram;
	        return glProgram;
	    };
	    
	    ShaderSystem.prototype.reset = function () {
	        this.program = null;
	        this.shader = null;
	    };
	    
	    ShaderSystem.prototype.destroy = function () {
	        
	        this.destroyed = true;
	    };
	    return ShaderSystem;
	}(System));

	
	function mapWebGLBlendModesToPixi(gl, array) {
	    if (array === void 0) { array = []; }
	    
	    
	    array[exports.BLEND_MODES.NORMAL] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.ADD] = [gl.ONE, gl.ONE];
	    array[exports.BLEND_MODES.MULTIPLY] = [gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.SCREEN] = [gl.ONE, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.OVERLAY] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.DARKEN] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.LIGHTEN] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.COLOR_DODGE] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.COLOR_BURN] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.HARD_LIGHT] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.SOFT_LIGHT] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.DIFFERENCE] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.EXCLUSION] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.HUE] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.SATURATION] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.COLOR] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.LUMINOSITY] = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.NONE] = [0, 0];
	    
	    array[exports.BLEND_MODES.NORMAL_NPM] = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.ADD_NPM] = [gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE];
	    array[exports.BLEND_MODES.SCREEN_NPM] = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	    
	    array[exports.BLEND_MODES.SRC_IN] = [gl.DST_ALPHA, gl.ZERO];
	    array[exports.BLEND_MODES.SRC_OUT] = [gl.ONE_MINUS_DST_ALPHA, gl.ZERO];
	    array[exports.BLEND_MODES.SRC_ATOP] = [gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.DST_OVER] = [gl.ONE_MINUS_DST_ALPHA, gl.ONE];
	    array[exports.BLEND_MODES.DST_IN] = [gl.ZERO, gl.SRC_ALPHA];
	    array[exports.BLEND_MODES.DST_OUT] = [gl.ZERO, gl.ONE_MINUS_SRC_ALPHA];
	    array[exports.BLEND_MODES.DST_ATOP] = [gl.ONE_MINUS_DST_ALPHA, gl.SRC_ALPHA];
	    array[exports.BLEND_MODES.XOR] = [gl.ONE_MINUS_DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA];
	    
	    array[exports.BLEND_MODES.SUBTRACT] = [gl.ONE, gl.ONE, gl.ONE, gl.ONE, gl.FUNC_REVERSE_SUBTRACT, gl.FUNC_ADD];
	    return array;
	}

	var BLEND$1 = 0;
	var OFFSET$1 = 1;
	var CULLING$1 = 2;
	var DEPTH_TEST$1 = 3;
	var WINDING$1 = 4;
	
	var StateSystem =  (function (_super) {
	    __extends$2(StateSystem, _super);
	    
	    function StateSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        
	        _this.gl = null;
	        
	        _this.stateId = 0;
	        
	        _this.polygonOffset = 0;
	        
	        _this.blendMode = exports.BLEND_MODES.NONE;
	        
	        _this._blendEq = false;
	        
	        _this.map = [];
	        
	        _this.map[BLEND$1] = _this.setBlend;
	        _this.map[OFFSET$1] = _this.setOffset;
	        _this.map[CULLING$1] = _this.setCullFace;
	        _this.map[DEPTH_TEST$1] = _this.setDepthTest;
	        _this.map[WINDING$1] = _this.setFrontFace;
	        
	        _this.checks = [];
	        
	        _this.defaultState = new State();
	        _this.defaultState.blend = true;
	        return _this;
	    }
	    StateSystem.prototype.contextChange = function (gl) {
	        this.gl = gl;
	        this.blendModes = mapWebGLBlendModesToPixi(gl);
	        this.set(this.defaultState);
	        this.reset();
	    };
	    
	    StateSystem.prototype.set = function (state) {
	        state = state || this.defaultState;
	        
	        if (this.stateId !== state.data) {
	            var diff = this.stateId ^ state.data;
	            var i = 0;
	            
	            while (diff) {
	                if (diff & 1) {
	                    
	                    this.map[i].call(this, !!(state.data & (1 << i)));
	                }
	                diff = diff >> 1;
	                i++;
	            }
	            this.stateId = state.data;
	        }
	        
	        
	        
	        for (var i = 0; i < this.checks.length; i++) {
	            this.checks[i](this, state);
	        }
	    };
	    
	    StateSystem.prototype.forceState = function (state) {
	        state = state || this.defaultState;
	        for (var i = 0; i < this.map.length; i++) {
	            this.map[i].call(this, !!(state.data & (1 << i)));
	        }
	        for (var i = 0; i < this.checks.length; i++) {
	            this.checks[i](this, state);
	        }
	        this.stateId = state.data;
	    };
	    
	    StateSystem.prototype.setBlend = function (value) {
	        this.updateCheck(StateSystem.checkBlendMode, value);
	        this.gl[value ? 'enable' : 'disable'](this.gl.BLEND);
	    };
	    
	    StateSystem.prototype.setOffset = function (value) {
	        this.updateCheck(StateSystem.checkPolygonOffset, value);
	        this.gl[value ? 'enable' : 'disable'](this.gl.POLYGON_OFFSET_FILL);
	    };
	    
	    StateSystem.prototype.setDepthTest = function (value) {
	        this.gl[value ? 'enable' : 'disable'](this.gl.DEPTH_TEST);
	    };
	    
	    StateSystem.prototype.setCullFace = function (value) {
	        this.gl[value ? 'enable' : 'disable'](this.gl.CULL_FACE);
	    };
	    
	    StateSystem.prototype.setFrontFace = function (value) {
	        this.gl.frontFace(this.gl[value ? 'CW' : 'CCW']);
	    };
	    
	    StateSystem.prototype.setBlendMode = function (value) {
	        if (value === this.blendMode) {
	            return;
	        }
	        this.blendMode = value;
	        var mode = this.blendModes[value];
	        var gl = this.gl;
	        if (mode.length === 2) {
	            gl.blendFunc(mode[0], mode[1]);
	        }
	        else {
	            gl.blendFuncSeparate(mode[0], mode[1], mode[2], mode[3]);
	        }
	        if (mode.length === 6) {
	            this._blendEq = true;
	            gl.blendEquationSeparate(mode[4], mode[5]);
	        }
	        else if (this._blendEq) {
	            this._blendEq = false;
	            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	        }
	    };
	    
	    StateSystem.prototype.setPolygonOffset = function (value, scale) {
	        this.gl.polygonOffset(value, scale);
	    };
	    
	    
	    StateSystem.prototype.reset = function () {
	        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
	        this.forceState(this.defaultState);
	        this._blendEq = true;
	        this.blendMode = -1;
	        this.setBlendMode(0);
	    };
	    
	    StateSystem.prototype.updateCheck = function (func, value) {
	        var index = this.checks.indexOf(func);
	        if (value && index === -1) {
	            this.checks.push(func);
	        }
	        else if (!value && index !== -1) {
	            this.checks.splice(index, 1);
	        }
	    };
	    
	    StateSystem.checkBlendMode = function (system, state) {
	        system.setBlendMode(state.blendMode);
	    };
	    
	    StateSystem.checkPolygonOffset = function (system, state) {
	        system.setPolygonOffset(1, state.polygonOffset);
	    };
	    return StateSystem;
	}(System));

	
	var TextureGCSystem =  (function (_super) {
	    __extends$2(TextureGCSystem, _super);
	    
	    function TextureGCSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        
	        _this.count = 0;
	        
	        _this.checkCount = 0;
	        
	        _this.maxIdle = settings.GC_MAX_IDLE;
	        
	        _this.checkCountMax = settings.GC_MAX_CHECK_COUNT;
	        
	        _this.mode = settings.GC_MODE;
	        return _this;
	    }
	    
	    TextureGCSystem.prototype.postrender = function () {
	        if (!this.renderer.renderingToScreen) {
	            return;
	        }
	        this.count++;
	        if (this.mode === exports.GC_MODES.MANUAL) {
	            return;
	        }
	        this.checkCount++;
	        if (this.checkCount > this.checkCountMax) {
	            this.checkCount = 0;
	            this.run();
	        }
	    };
	    
	    TextureGCSystem.prototype.run = function () {
	        var tm = this.renderer.texture;
	        var managedTextures = tm.managedTextures;
	        var wasRemoved = false;
	        for (var i = 0; i < managedTextures.length; i++) {
	            var texture = managedTextures[i];
	            
	            if (!texture.framebuffer && this.count - texture.touched > this.maxIdle) {
	                tm.destroyTexture(texture, true);
	                managedTextures[i] = null;
	                wasRemoved = true;
	            }
	        }
	        if (wasRemoved) {
	            var j = 0;
	            for (var i = 0; i < managedTextures.length; i++) {
	                if (managedTextures[i] !== null) {
	                    managedTextures[j++] = managedTextures[i];
	                }
	            }
	            managedTextures.length = j;
	        }
	    };
	    
	    TextureGCSystem.prototype.unload = function (displayObject) {
	        var tm = this.renderer.texture;
	        var texture = displayObject._texture;
	        
	        if (texture && !texture.framebuffer) {
	            tm.destroyTexture(texture);
	        }
	        for (var i = displayObject.children.length - 1; i >= 0; i--) {
	            this.unload(displayObject.children[i]);
	        }
	    };
	    return TextureGCSystem;
	}(System));

	
	var GLTexture =  (function () {
	    function GLTexture(texture) {
	        
	        this.texture = texture;
	        
	        this.width = -1;
	        
	        this.height = -1;
	        
	        this.dirtyId = -1;
	        
	        this.dirtyStyleId = -1;
	        
	        this.mipmap = false;
	        
	        this.wrapMode = 33071;
	        
	        this.type = 6408;
	        
	        this.internalFormat = 5121;
	    }
	    return GLTexture;
	}());

	
	var TextureSystem =  (function (_super) {
	    __extends$2(TextureSystem, _super);
	    
	    function TextureSystem(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        
	        
	        _this.boundTextures = [];
	        
	        _this.currentLocation = -1;
	        
	        _this.managedTextures = [];
	        
	        _this._unknownBoundTextures = false;
	        
	        _this.unknownTexture = new BaseTexture();
	        return _this;
	    }
	    
	    TextureSystem.prototype.contextChange = function () {
	        var gl = this.gl = this.renderer.gl;
	        this.CONTEXT_UID = this.renderer.CONTEXT_UID;
	        this.webGLVersion = this.renderer.context.webGLVersion;
	        var maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
	        this.boundTextures.length = maxTextures;
	        for (var i = 0; i < maxTextures; i++) {
	            this.boundTextures[i] = null;
	        }
	        
	        this.emptyTextures = {};
	        var emptyTexture2D = new GLTexture(gl.createTexture());
	        gl.bindTexture(gl.TEXTURE_2D, emptyTexture2D.texture);
	        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
	        this.emptyTextures[gl.TEXTURE_2D] = emptyTexture2D;
	        this.emptyTextures[gl.TEXTURE_CUBE_MAP] = new GLTexture(gl.createTexture());
	        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.emptyTextures[gl.TEXTURE_CUBE_MAP].texture);
	        for (var i = 0; i < 6; i++) {
	            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	        }
	        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	        for (var i = 0; i < this.boundTextures.length; i++) {
	            this.bind(null, i);
	        }
	    };
	    
	    TextureSystem.prototype.bind = function (texture, location) {
	        if (location === void 0) { location = 0; }
	        var gl = this.gl;
	        if (texture) {
	            texture = texture.castToBaseTexture();
	            if (texture.parentTextureArray) {
	                
	                
	                return;
	            }
	            if (texture.valid) {
	                texture.touched = this.renderer.textureGC.count;
	                var glTexture = texture._glTextures[this.CONTEXT_UID] || this.initTexture(texture);
	                if (this.boundTextures[location] !== texture) {
	                    if (this.currentLocation !== location) {
	                        this.currentLocation = location;
	                        gl.activeTexture(gl.TEXTURE0 + location);
	                    }
	                    gl.bindTexture(texture.target, glTexture.texture);
	                }
	                if (glTexture.dirtyId !== texture.dirtyId) {
	                    if (this.currentLocation !== location) {
	                        this.currentLocation = location;
	                        gl.activeTexture(gl.TEXTURE0 + location);
	                    }
	                    this.updateTexture(texture);
	                }
	                this.boundTextures[location] = texture;
	            }
	        }
	        else {
	            if (this.currentLocation !== location) {
	                this.currentLocation = location;
	                gl.activeTexture(gl.TEXTURE0 + location);
	            }
	            gl.bindTexture(gl.TEXTURE_2D, this.emptyTextures[gl.TEXTURE_2D].texture);
	            this.boundTextures[location] = null;
	        }
	    };
	    
	    TextureSystem.prototype.reset = function () {
	        this._unknownBoundTextures = true;
	        this.currentLocation = -1;
	        for (var i = 0; i < this.boundTextures.length; i++) {
	            this.boundTextures[i] = this.unknownTexture;
	        }
	    };
	    
	    TextureSystem.prototype.unbind = function (texture) {
	        var _a = this, gl = _a.gl, boundTextures = _a.boundTextures;
	        if (this._unknownBoundTextures) {
	            this._unknownBoundTextures = false;
	            
	            
	            for (var i = 0; i < boundTextures.length; i++) {
	                if (boundTextures[i] === this.unknownTexture) {
	                    this.bind(null, i);
	                }
	            }
	        }
	        for (var i = 0; i < boundTextures.length; i++) {
	            if (boundTextures[i] === texture) {
	                if (this.currentLocation !== i) {
	                    gl.activeTexture(gl.TEXTURE0 + i);
	                    this.currentLocation = i;
	                }
	                gl.bindTexture(texture.target, this.emptyTextures[texture.target].texture);
	                boundTextures[i] = null;
	            }
	        }
	    };
	    
	    TextureSystem.prototype.initTexture = function (texture) {
	        var glTexture = new GLTexture(this.gl.createTexture());
	        
	        glTexture.dirtyId = -1;
	        texture._glTextures[this.CONTEXT_UID] = glTexture;
	        this.managedTextures.push(texture);
	        texture.on('dispose', this.destroyTexture, this);
	        return glTexture;
	    };
	    TextureSystem.prototype.initTextureType = function (texture, glTexture) {
	        glTexture.internalFormat = texture.format;
	        glTexture.type = texture.type;
	        if (this.webGLVersion !== 2) {
	            return;
	        }
	        var gl = this.renderer.gl;
	        if (texture.type === gl.FLOAT
	            && texture.format === gl.RGBA) {
	            glTexture.internalFormat = gl.RGBA32F;
	        }
	        
	        
	        if (texture.type === exports.TYPES.HALF_FLOAT) {
	            glTexture.type = gl.HALF_FLOAT;
	        }
	        if (glTexture.type === gl.HALF_FLOAT
	            && texture.format === gl.RGBA) {
	            glTexture.internalFormat = gl.RGBA16F;
	        }
	    };
	    
	    TextureSystem.prototype.updateTexture = function (texture) {
	        var glTexture = texture._glTextures[this.CONTEXT_UID];
	        if (!glTexture) {
	            return;
	        }
	        var renderer = this.renderer;
	        this.initTextureType(texture, glTexture);
	        if (texture.resource && texture.resource.upload(renderer, texture, glTexture)) { ; }
	        else {
	            
	            var width = texture.realWidth;
	            var height = texture.realHeight;
	            var gl = renderer.gl;
	            if (glTexture.width !== width
	                || glTexture.height !== height
	                || glTexture.dirtyId < 0) {
	                glTexture.width = width;
	                glTexture.height = height;
	                gl.texImage2D(texture.target, 0, glTexture.internalFormat, width, height, 0, texture.format, glTexture.type, null);
	            }
	        }
	        
	        if (texture.dirtyStyleId !== glTexture.dirtyStyleId) {
	            this.updateTextureStyle(texture);
	        }
	        glTexture.dirtyId = texture.dirtyId;
	    };
	    
	    TextureSystem.prototype.destroyTexture = function (texture, skipRemove) {
	        var gl = this.gl;
	        texture = texture.castToBaseTexture();
	        if (texture._glTextures[this.CONTEXT_UID]) {
	            this.unbind(texture);
	            gl.deleteTexture(texture._glTextures[this.CONTEXT_UID].texture);
	            texture.off('dispose', this.destroyTexture, this);
	            delete texture._glTextures[this.CONTEXT_UID];
	            if (!skipRemove) {
	                var i = this.managedTextures.indexOf(texture);
	                if (i !== -1) {
	                    removeItems(this.managedTextures, i, 1);
	                }
	            }
	        }
	    };
	    
	    TextureSystem.prototype.updateTextureStyle = function (texture) {
	        var glTexture = texture._glTextures[this.CONTEXT_UID];
	        if (!glTexture) {
	            return;
	        }
	        if ((texture.mipmap === exports.MIPMAP_MODES.POW2 || this.webGLVersion !== 2) && !texture.isPowerOfTwo) {
	            glTexture.mipmap = false;
	        }
	        else {
	            glTexture.mipmap = texture.mipmap >= 1;
	        }
	        if (this.webGLVersion !== 2 && !texture.isPowerOfTwo) {
	            glTexture.wrapMode = exports.WRAP_MODES.CLAMP;
	        }
	        else {
	            glTexture.wrapMode = texture.wrapMode;
	        }
	        if (texture.resource && texture.resource.style(this.renderer, texture, glTexture)) { ; }
	        else {
	            this.setStyle(texture, glTexture);
	        }
	        glTexture.dirtyStyleId = texture.dirtyStyleId;
	    };
	    
	    TextureSystem.prototype.setStyle = function (texture, glTexture) {
	        var gl = this.gl;
	        if (glTexture.mipmap) {
	            gl.generateMipmap(texture.target);
	        }
	        gl.texParameteri(texture.target, gl.TEXTURE_WRAP_S, glTexture.wrapMode);
	        gl.texParameteri(texture.target, gl.TEXTURE_WRAP_T, glTexture.wrapMode);
	        if (glTexture.mipmap) {
	            
	            gl.texParameteri(texture.target, gl.TEXTURE_MIN_FILTER, texture.scaleMode === exports.SCALE_MODES.LINEAR ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_NEAREST);
	            
	            var anisotropicExt = this.renderer.context.extensions.anisotropicFiltering;
	            if (anisotropicExt && texture.anisotropicLevel > 0 && texture.scaleMode === exports.SCALE_MODES.LINEAR) {
	                var level = Math.min(texture.anisotropicLevel, gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
	                gl.texParameterf(texture.target, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, level);
	            }
	        }
	        else {
	            gl.texParameteri(texture.target, gl.TEXTURE_MIN_FILTER, texture.scaleMode === exports.SCALE_MODES.LINEAR ? gl.LINEAR : gl.NEAREST);
	        }
	        gl.texParameteri(texture.target, gl.TEXTURE_MAG_FILTER, texture.scaleMode === exports.SCALE_MODES.LINEAR ? gl.LINEAR : gl.NEAREST);
	    };
	    return TextureSystem;
	}(System));

	

	var systems = ({
	    FilterSystem: FilterSystem,
	    BatchSystem: BatchSystem,
	    ContextSystem: ContextSystem,
	    FramebufferSystem: FramebufferSystem,
	    GeometrySystem: GeometrySystem,
	    MaskSystem: MaskSystem,
	    ScissorSystem: ScissorSystem,
	    StencilSystem: StencilSystem,
	    ProjectionSystem: ProjectionSystem,
	    RenderTextureSystem: RenderTextureSystem,
	    ShaderSystem: ShaderSystem,
	    StateSystem: StateSystem,
	    TextureGCSystem: TextureGCSystem,
	    TextureSystem: TextureSystem
	});

	var tempMatrix = new Matrix();
	
	var AbstractRenderer =  (function (_super) {
	    __extends$2(AbstractRenderer, _super);
	    
	    function AbstractRenderer(type, options) {
	        if (type === void 0) { type = exports.RENDERER_TYPE.UNKNOWN; }
	        var _this = _super.call(this) || this;
	        
	        options = Object.assign({}, settings.RENDER_OPTIONS, options);
	        
	        if (options.roundPixels) {
	            settings.ROUND_PIXELS = options.roundPixels;
	            deprecation('5.0.0', 'Renderer roundPixels option is deprecated, please use PIXI.settings.ROUND_PIXELS', 2);
	        }
	        
	        _this.options = options;
	        
	        _this.type = type;
	        
	        _this.screen = new Rectangle(0, 0, options.width, options.height);
	        
	        _this.view = options.view || document.createElement('canvas');
	        
	        _this.resolution = options.resolution || settings.RESOLUTION;
	        
	        _this.transparent = options.transparent;
	        
	        _this.autoDensity = options.autoDensity || options.autoResize || false;
	        
	        
	        _this.preserveDrawingBuffer = options.preserveDrawingBuffer;
	        
	        _this.clearBeforeRender = options.clearBeforeRender;
	        
	        _this._backgroundColor = 0x000000;
	        
	        _this._backgroundColorRgba = [0, 0, 0, 0];
	        
	        _this._backgroundColorString = '#000000';
	        _this.backgroundColor = options.backgroundColor || _this._backgroundColor; 
	        
	        _this._lastObjectRendered = null;
	        
	        _this.plugins = {};
	        return _this;
	    }
	    
	    AbstractRenderer.prototype.initPlugins = function (staticMap) {
	        for (var o in staticMap) {
	            this.plugins[o] = new (staticMap[o])(this);
	        }
	    };
	    Object.defineProperty(AbstractRenderer.prototype, "width", {
	        
	        get: function () {
	            return this.view.width;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(AbstractRenderer.prototype, "height", {
	        
	        get: function () {
	            return this.view.height;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    AbstractRenderer.prototype.resize = function (screenWidth, screenHeight) {
	        this.screen.width = screenWidth;
	        this.screen.height = screenHeight;
	        this.view.width = screenWidth * this.resolution;
	        this.view.height = screenHeight * this.resolution;
	        if (this.autoDensity) {
	            this.view.style.width = screenWidth + "px";
	            this.view.style.height = screenHeight + "px";
	        }
	        
	        this.emit('resize', screenWidth, screenHeight);
	    };
	    
	    AbstractRenderer.prototype.generateTexture = function (displayObject, scaleMode, resolution, region) {
	        region = region || displayObject.getLocalBounds(null, true);
	        
	        if (region.width === 0)
	            { region.width = 1; }
	        if (region.height === 0)
	            { region.height = 1; }
	        var renderTexture = RenderTexture.create({
	            width: region.width | 0,
	            height: region.height | 0,
	            scaleMode: scaleMode,
	            resolution: resolution,
	        });
	        tempMatrix.tx = -region.x;
	        tempMatrix.ty = -region.y;
	        this.render(displayObject, renderTexture, false, tempMatrix, !!displayObject.parent);
	        return renderTexture;
	    };
	    
	    AbstractRenderer.prototype.destroy = function (removeView) {
	        for (var o in this.plugins) {
	            this.plugins[o].destroy();
	            this.plugins[o] = null;
	        }
	        if (removeView && this.view.parentNode) {
	            this.view.parentNode.removeChild(this.view);
	        }
	        var thisAny = this;
	        
	        thisAny.plugins = null;
	        thisAny.type = exports.RENDERER_TYPE.UNKNOWN;
	        thisAny.view = null;
	        thisAny.screen = null;
	        thisAny._tempDisplayObjectParent = null;
	        thisAny.options = null;
	        this._backgroundColorRgba = null;
	        this._backgroundColorString = null;
	        this._lastObjectRendered = null;
	    };
	    Object.defineProperty(AbstractRenderer.prototype, "backgroundColor", {
	        
	        get: function () {
	            return this._backgroundColor;
	        },
	        set: function (value) {
	            this._backgroundColor = value;
	            this._backgroundColorString = hex2string(value);
	            hex2rgb(value, this._backgroundColorRgba);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return AbstractRenderer;
	}(eventemitter3));

	
	var Renderer =  (function (_super) {
	    __extends$2(Renderer, _super);
	    
	    function Renderer(options) {
	        var _this = _super.call(this, exports.RENDERER_TYPE.WEBGL, options) || this;
	        
	        options = _this.options;
	        
	        _this.gl = null;
	        _this.CONTEXT_UID = 0;
	        
	        
	        _this.runners = {
	            destroy: new Runner('destroy'),
	            contextChange: new Runner('contextChange'),
	            reset: new Runner('reset'),
	            update: new Runner('update'),
	            postrender: new Runner('postrender'),
	            prerender: new Runner('prerender'),
	            resize: new Runner('resize'),
	        };
	        
	        _this.globalUniforms = new UniformGroup({
	            projectionMatrix: new Matrix(),
	        }, true);
	        
	        _this.addSystem(MaskSystem, 'mask')
	            
	            .addSystem(ContextSystem, 'context')
	            
	            .addSystem(StateSystem, 'state')
	            
	            .addSystem(ShaderSystem, 'shader')
	            
	            .addSystem(TextureSystem, 'texture')
	            
	            .addSystem(GeometrySystem, 'geometry')
	            
	            .addSystem(FramebufferSystem, 'framebuffer')
	            
	            .addSystem(ScissorSystem, 'scissor')
	            
	            .addSystem(StencilSystem, 'stencil')
	            
	            .addSystem(ProjectionSystem, 'projection')
	            
	            .addSystem(TextureGCSystem, 'textureGC')
	            
	            .addSystem(FilterSystem, 'filter')
	            
	            .addSystem(RenderTextureSystem, 'renderTexture')
	            
	            .addSystem(BatchSystem, 'batch');
	        _this.initPlugins(Renderer.__plugins);
	        
	        if (options.context) {
	            _this.context.initFromContext(options.context);
	        }
	        else {
	            _this.context.initFromOptions({
	                alpha: !!_this.transparent,
	                antialias: options.antialias,
	                premultipliedAlpha: _this.transparent && _this.transparent !== 'notMultiplied',
	                stencil: true,
	                preserveDrawingBuffer: options.preserveDrawingBuffer,
	                powerPreference: _this.options.powerPreference,
	            });
	        }
	        
	        _this.renderingToScreen = true;
	        sayHello(_this.context.webGLVersion === 2 ? 'WebGL 2' : 'WebGL 1');
	        _this.resize(_this.options.width, _this.options.height);
	        return _this;
	    }
	    
	    Renderer.create = function (options) {
	        if (isWebGLSupported()) {
	            return new Renderer(options);
	        }
	        throw new Error('WebGL unsupported in this browser, use "pixi.js-legacy" for fallback canvas2d support.');
	    };
	    
	    Renderer.prototype.addSystem = function (ClassRef, name) {
	        if (!name) {
	            name = ClassRef.name;
	        }
	        var system = new ClassRef(this);
	        if (this[name]) {
	            throw new Error("Whoops! The name \"" + name + "\" is already in use");
	        }
	        this[name] = system;
	        for (var i in this.runners) {
	            this.runners[i].add(system);
	        }
	        
	        
	        
	        return this;
	    };
	    
	    Renderer.prototype.render = function (displayObject, renderTexture, clear, transform, skipUpdateTransform) {
	        
	        this.renderingToScreen = !renderTexture;
	        this.runners.prerender.emit();
	        this.emit('prerender');
	        
	        this.projection.transform = transform;
	        
	        if (this.context.isLost) {
	            return;
	        }
	        if (!renderTexture) {
	            this._lastObjectRendered = displayObject;
	        }
	        if (!skipUpdateTransform) {
	            
	            var cacheParent = displayObject.enableTempParent();
	            displayObject.updateTransform();
	            displayObject.disableTempParent(cacheParent);
	            
	        }
	        this.renderTexture.bind(renderTexture);
	        this.batch.currentRenderer.start();
	        if (clear !== undefined ? clear : this.clearBeforeRender) {
	            this.renderTexture.clear();
	        }
	        displayObject.render(this);
	        
	        this.batch.currentRenderer.flush();
	        if (renderTexture) {
	            renderTexture.baseTexture.update();
	        }
	        this.runners.postrender.emit();
	        
	        this.projection.transform = null;
	        this.emit('postrender');
	    };
	    
	    Renderer.prototype.resize = function (screenWidth, screenHeight) {
	        _super.prototype.resize.call(this, screenWidth, screenHeight);
	        this.runners.resize.emit(screenWidth, screenHeight);
	    };
	    
	    Renderer.prototype.reset = function () {
	        this.runners.reset.emit();
	        return this;
	    };
	    
	    Renderer.prototype.clear = function () {
	        this.renderTexture.bind();
	        this.renderTexture.clear();
	    };
	    
	    Renderer.prototype.destroy = function (removeView) {
	        this.runners.destroy.emit();
	        for (var r in this.runners) {
	            this.runners[r].destroy();
	        }
	        
	        _super.prototype.destroy.call(this, removeView);
	        
	        this.gl = null;
	    };
	    
	    Renderer.registerPlugin = function (pluginName, ctor) {
	        Renderer.__plugins = Renderer.__plugins || {};
	        Renderer.__plugins[pluginName] = ctor;
	    };
	    return Renderer;
	}(AbstractRenderer));

	
	function autoDetectRenderer(options) {
	    return Renderer.create(options);
	}

	var _default = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n}";

	var defaultFilter = "attribute vec2 aVertexPosition;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nuniform vec4 inputSize;\nuniform vec4 outputFrame;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;\n\n    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aVertexPosition * (outputFrame.zw * inputSize.zw);\n}\n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition();\n    vTextureCoord = filterTextureCoord();\n}\n";

	
	var BatchDrawCall =  (function () {
	    function BatchDrawCall() {
	        this.texArray = null;
	        this.blend = 0;
	        this.type = exports.DRAW_MODES.TRIANGLES;
	        this.start = 0;
	        this.size = 0;
	        
	        this.data = null;
	    }
	    return BatchDrawCall;
	}());

	
	var BatchTextureArray =  (function () {
	    function BatchTextureArray() {
	        
	        this.elements = [];
	        
	        this.ids = [];
	        
	        this.count = 0;
	    }
	    BatchTextureArray.prototype.clear = function () {
	        for (var i = 0; i < this.count; i++) {
	            this.elements[i] = null;
	        }
	        this.count = 0;
	    };
	    return BatchTextureArray;
	}());

	
	var ViewableBuffer =  (function () {
	    
	    function ViewableBuffer(size) {
	        
	        this.rawBinaryData = new ArrayBuffer(size);
	        
	        this.uint32View = new Uint32Array(this.rawBinaryData);
	        
	        this.float32View = new Float32Array(this.rawBinaryData);
	    }
	    Object.defineProperty(ViewableBuffer.prototype, "int8View", {
	        
	        get: function () {
	            if (!this._int8View) {
	                this._int8View = new Int8Array(this.rawBinaryData);
	            }
	            return this._int8View;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(ViewableBuffer.prototype, "uint8View", {
	        
	        get: function () {
	            if (!this._uint8View) {
	                this._uint8View = new Uint8Array(this.rawBinaryData);
	            }
	            return this._uint8View;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(ViewableBuffer.prototype, "int16View", {
	        
	        get: function () {
	            if (!this._int16View) {
	                this._int16View = new Int16Array(this.rawBinaryData);
	            }
	            return this._int16View;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(ViewableBuffer.prototype, "uint16View", {
	        
	        get: function () {
	            if (!this._uint16View) {
	                this._uint16View = new Uint16Array(this.rawBinaryData);
	            }
	            return this._uint16View;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(ViewableBuffer.prototype, "int32View", {
	        
	        get: function () {
	            if (!this._int32View) {
	                this._int32View = new Int32Array(this.rawBinaryData);
	            }
	            return this._int32View;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    ViewableBuffer.prototype.view = function (type) {
	        return this[type + "View"];
	    };
	    
	    ViewableBuffer.prototype.destroy = function () {
	        this.rawBinaryData = null;
	        this._int8View = null;
	        this._uint8View = null;
	        this._int16View = null;
	        this._uint16View = null;
	        this._int32View = null;
	        this.uint32View = null;
	        this.float32View = null;
	    };
	    ViewableBuffer.sizeOf = function (type) {
	        switch (type) {
	            case 'int8':
	            case 'uint8':
	                return 1;
	            case 'int16':
	            case 'uint16':
	                return 2;
	            case 'int32':
	            case 'uint32':
	            case 'float32':
	                return 4;
	            default:
	                throw new Error(type + " isn't a valid view type");
	        }
	    };
	    return ViewableBuffer;
	}());

	
	var AbstractBatchRenderer =  (function (_super) {
	    __extends$2(AbstractBatchRenderer, _super);
	    
	    function AbstractBatchRenderer(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        
	        _this.shaderGenerator = null;
	        
	        _this.geometryClass = null;
	        
	        _this.vertexSize = null;
	        
	        _this.state = State.for2d();
	        
	        _this.size = settings.SPRITE_BATCH_SIZE * 4;
	        
	        _this._vertexCount = 0;
	        
	        _this._indexCount = 0;
	        
	        _this._bufferedElements = [];
	        
	        _this._bufferedTextures = [];
	        
	        _this._bufferSize = 0;
	        
	        _this._shader = null;
	        
	        _this._packedGeometries = [];
	        
	        _this._packedGeometryPoolSize = 2;
	        
	        _this._flushId = 0;
	        
	        _this._aBuffers = {};
	        
	        _this._iBuffers = {};
	        
	        _this.MAX_TEXTURES = 1;
	        _this.renderer.on('prerender', _this.onPrerender, _this);
	        renderer.runners.contextChange.add(_this);
	        _this._dcIndex = 0;
	        _this._aIndex = 0;
	        _this._iIndex = 0;
	        _this._attributeBuffer = null;
	        _this._indexBuffer = null;
	        _this._tempBoundTextures = [];
	        return _this;
	    }
	    
	    AbstractBatchRenderer.prototype.contextChange = function () {
	        var gl = this.renderer.gl;
	        if (settings.PREFER_ENV === exports.ENV.WEBGL_LEGACY) {
	            this.MAX_TEXTURES = 1;
	        }
	        else {
	            
	            this.MAX_TEXTURES = Math.min(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), settings.SPRITE_MAX_TEXTURES);
	            
	            this.MAX_TEXTURES = checkMaxIfStatementsInShader(this.MAX_TEXTURES, gl);
	        }
	        this._shader = this.shaderGenerator.generateShader(this.MAX_TEXTURES);
	        
	        
	        for (var i = 0; i < this._packedGeometryPoolSize; i++) {
	            
	            this._packedGeometries[i] = new (this.geometryClass)();
	        }
	        this.initFlushBuffers();
	    };
	    
	    AbstractBatchRenderer.prototype.initFlushBuffers = function () {
	        var _drawCallPool = AbstractBatchRenderer._drawCallPool, _textureArrayPool = AbstractBatchRenderer._textureArrayPool;
	        
	        var MAX_SPRITES = this.size / 4;
	        
	        var MAX_TA = Math.floor(MAX_SPRITES / this.MAX_TEXTURES) + 1;
	        while (_drawCallPool.length < MAX_SPRITES) {
	            _drawCallPool.push(new BatchDrawCall());
	        }
	        while (_textureArrayPool.length < MAX_TA) {
	            _textureArrayPool.push(new BatchTextureArray());
	        }
	        for (var i = 0; i < this.MAX_TEXTURES; i++) {
	            this._tempBoundTextures[i] = null;
	        }
	    };
	    
	    AbstractBatchRenderer.prototype.onPrerender = function () {
	        this._flushId = 0;
	    };
	    
	    AbstractBatchRenderer.prototype.render = function (element) {
	        if (!element._texture.valid) {
	            return;
	        }
	        if (this._vertexCount + (element.vertexData.length / 2) > this.size) {
	            this.flush();
	        }
	        this._vertexCount += element.vertexData.length / 2;
	        this._indexCount += element.indices.length;
	        this._bufferedTextures[this._bufferSize] = element._texture.baseTexture;
	        this._bufferedElements[this._bufferSize++] = element;
	    };
	    AbstractBatchRenderer.prototype.buildTexturesAndDrawCalls = function () {
	        var _a = this, textures = _a._bufferedTextures, MAX_TEXTURES = _a.MAX_TEXTURES;
	        var textureArrays = AbstractBatchRenderer._textureArrayPool;
	        var batch = this.renderer.batch;
	        var boundTextures = this._tempBoundTextures;
	        var touch = this.renderer.textureGC.count;
	        var TICK = ++BaseTexture._globalBatch;
	        var countTexArrays = 0;
	        var texArray = textureArrays[0];
	        var start = 0;
	        batch.copyBoundTextures(boundTextures, MAX_TEXTURES);
	        for (var i = 0; i < this._bufferSize; ++i) {
	            var tex = textures[i];
	            textures[i] = null;
	            if (tex._batchEnabled === TICK) {
	                continue;
	            }
	            if (texArray.count >= MAX_TEXTURES) {
	                batch.boundArray(texArray, boundTextures, TICK, MAX_TEXTURES);
	                this.buildDrawCalls(texArray, start, i);
	                start = i;
	                texArray = textureArrays[++countTexArrays];
	                ++TICK;
	            }
	            tex._batchEnabled = TICK;
	            tex.touched = touch;
	            texArray.elements[texArray.count++] = tex;
	        }
	        if (texArray.count > 0) {
	            batch.boundArray(texArray, boundTextures, TICK, MAX_TEXTURES);
	            this.buildDrawCalls(texArray, start, this._bufferSize);
	            ++countTexArrays;
	            ++TICK;
	        }
	        
	        for (var i = 0; i < boundTextures.length; i++) {
	            boundTextures[i] = null;
	        }
	        BaseTexture._globalBatch = TICK;
	    };
	    
	    AbstractBatchRenderer.prototype.buildDrawCalls = function (texArray, start, finish) {
	        var _a = this, elements = _a._bufferedElements, _attributeBuffer = _a._attributeBuffer, _indexBuffer = _a._indexBuffer, vertexSize = _a.vertexSize;
	        var drawCalls = AbstractBatchRenderer._drawCallPool;
	        var dcIndex = this._dcIndex;
	        var aIndex = this._aIndex;
	        var iIndex = this._iIndex;
	        var drawCall = drawCalls[dcIndex];
	        drawCall.start = this._iIndex;
	        drawCall.texArray = texArray;
	        for (var i = start; i < finish; ++i) {
	            var sprite = elements[i];
	            var tex = sprite._texture.baseTexture;
	            var spriteBlendMode = premultiplyBlendMode[tex.alphaMode ? 1 : 0][sprite.blendMode];
	            elements[i] = null;
	            if (start < i && drawCall.blend !== spriteBlendMode) {
	                drawCall.size = iIndex - drawCall.start;
	                start = i;
	                drawCall = drawCalls[++dcIndex];
	                drawCall.texArray = texArray;
	                drawCall.start = iIndex;
	            }
	            this.packInterleavedGeometry(sprite, _attributeBuffer, _indexBuffer, aIndex, iIndex);
	            aIndex += sprite.vertexData.length / 2 * vertexSize;
	            iIndex += sprite.indices.length;
	            drawCall.blend = spriteBlendMode;
	        }
	        if (start < finish) {
	            drawCall.size = iIndex - drawCall.start;
	            ++dcIndex;
	        }
	        this._dcIndex = dcIndex;
	        this._aIndex = aIndex;
	        this._iIndex = iIndex;
	    };
	    
	    AbstractBatchRenderer.prototype.bindAndClearTexArray = function (texArray) {
	        var textureSystem = this.renderer.texture;
	        for (var j = 0; j < texArray.count; j++) {
	            textureSystem.bind(texArray.elements[j], texArray.ids[j]);
	            texArray.elements[j] = null;
	        }
	        texArray.count = 0;
	    };
	    AbstractBatchRenderer.prototype.updateGeometry = function () {
	        var _a = this, packedGeometries = _a._packedGeometries, attributeBuffer = _a._attributeBuffer, indexBuffer = _a._indexBuffer;
	        if (!settings.CAN_UPLOAD_SAME_BUFFER) { 
	            if (this._packedGeometryPoolSize <= this._flushId) {
	                this._packedGeometryPoolSize++;
	                packedGeometries[this._flushId] = new (this.geometryClass)();
	            }
	            packedGeometries[this._flushId]._buffer.update(attributeBuffer.rawBinaryData);
	            packedGeometries[this._flushId]._indexBuffer.update(indexBuffer);
	            this.renderer.geometry.bind(packedGeometries[this._flushId]);
	            this.renderer.geometry.updateBuffers();
	            this._flushId++;
	        }
	        else {
	            
	            packedGeometries[this._flushId]._buffer.update(attributeBuffer.rawBinaryData);
	            packedGeometries[this._flushId]._indexBuffer.update(indexBuffer);
	            this.renderer.geometry.updateBuffers();
	        }
	    };
	    AbstractBatchRenderer.prototype.drawBatches = function () {
	        var dcCount = this._dcIndex;
	        var _a = this.renderer, gl = _a.gl, stateSystem = _a.state;
	        var drawCalls = AbstractBatchRenderer._drawCallPool;
	        var curTexArray = null;
	        
	        for (var i = 0; i < dcCount; i++) {
	            var _b = drawCalls[i], texArray = _b.texArray, type = _b.type, size = _b.size, start = _b.start, blend = _b.blend;
	            if (curTexArray !== texArray) {
	                curTexArray = texArray;
	                this.bindAndClearTexArray(texArray);
	            }
	            this.state.blendMode = blend;
	            stateSystem.set(this.state);
	            gl.drawElements(type, size, gl.UNSIGNED_SHORT, start * 2);
	        }
	    };
	    
	    AbstractBatchRenderer.prototype.flush = function () {
	        if (this._vertexCount === 0) {
	            return;
	        }
	        this._attributeBuffer = this.getAttributeBuffer(this._vertexCount);
	        this._indexBuffer = this.getIndexBuffer(this._indexCount);
	        this._aIndex = 0;
	        this._iIndex = 0;
	        this._dcIndex = 0;
	        this.buildTexturesAndDrawCalls();
	        this.updateGeometry();
	        this.drawBatches();
	        
	        this._bufferSize = 0;
	        this._vertexCount = 0;
	        this._indexCount = 0;
	    };
	    
	    AbstractBatchRenderer.prototype.start = function () {
	        this.renderer.state.set(this.state);
	        this.renderer.shader.bind(this._shader);
	        if (settings.CAN_UPLOAD_SAME_BUFFER) {
	            
	            this.renderer.geometry.bind(this._packedGeometries[this._flushId]);
	        }
	    };
	    
	    AbstractBatchRenderer.prototype.stop = function () {
	        this.flush();
	    };
	    
	    AbstractBatchRenderer.prototype.destroy = function () {
	        for (var i = 0; i < this._packedGeometryPoolSize; i++) {
	            if (this._packedGeometries[i]) {
	                this._packedGeometries[i].destroy();
	            }
	        }
	        this.renderer.off('prerender', this.onPrerender, this);
	        this._aBuffers = null;
	        this._iBuffers = null;
	        this._packedGeometries = null;
	        this._attributeBuffer = null;
	        this._indexBuffer = null;
	        if (this._shader) {
	            this._shader.destroy();
	            this._shader = null;
	        }
	        _super.prototype.destroy.call(this);
	    };
	    
	    AbstractBatchRenderer.prototype.getAttributeBuffer = function (size) {
	        
	        var roundedP2 = nextPow2(Math.ceil(size / 8));
	        var roundedSizeIndex = log2(roundedP2);
	        var roundedSize = roundedP2 * 8;
	        if (this._aBuffers.length <= roundedSizeIndex) {
	            this._iBuffers.length = roundedSizeIndex + 1;
	        }
	        var buffer = this._aBuffers[roundedSize];
	        if (!buffer) {
	            this._aBuffers[roundedSize] = buffer = new ViewableBuffer(roundedSize * this.vertexSize * 4);
	        }
	        return buffer;
	    };
	    
	    AbstractBatchRenderer.prototype.getIndexBuffer = function (size) {
	        
	        var roundedP2 = nextPow2(Math.ceil(size / 12));
	        var roundedSizeIndex = log2(roundedP2);
	        var roundedSize = roundedP2 * 12;
	        if (this._iBuffers.length <= roundedSizeIndex) {
	            this._iBuffers.length = roundedSizeIndex + 1;
	        }
	        var buffer = this._iBuffers[roundedSizeIndex];
	        if (!buffer) {
	            this._iBuffers[roundedSizeIndex] = buffer = new Uint16Array(roundedSize);
	        }
	        return buffer;
	    };
	    
	    AbstractBatchRenderer.prototype.packInterleavedGeometry = function (element, attributeBuffer, indexBuffer, aIndex, iIndex) {
	        var uint32View = attributeBuffer.uint32View, float32View = attributeBuffer.float32View;
	        var packedVertices = aIndex / this.vertexSize;
	        var uvs = element.uvs;
	        var indicies = element.indices;
	        var vertexData = element.vertexData;
	        var textureId = element._texture.baseTexture._batchLocation;
	        var alpha = Math.min(element.worldAlpha, 1.0);
	        var argb = (alpha < 1.0
	            && element._texture.baseTexture.alphaMode)
	            ? premultiplyTint(element._tintRGB, alpha)
	            : element._tintRGB + (alpha * 255 << 24);
	        
	        for (var i = 0; i < vertexData.length; i += 2) {
	            float32View[aIndex++] = vertexData[i];
	            float32View[aIndex++] = vertexData[i + 1];
	            float32View[aIndex++] = uvs[i];
	            float32View[aIndex++] = uvs[i + 1];
	            uint32View[aIndex++] = argb;
	            float32View[aIndex++] = textureId;
	        }
	        for (var i = 0; i < indicies.length; i++) {
	            indexBuffer[iIndex++] = packedVertices + indicies[i];
	        }
	    };
	    
	    AbstractBatchRenderer._drawCallPool = [];
	    
	    AbstractBatchRenderer._textureArrayPool = [];
	    return AbstractBatchRenderer;
	}(ObjectRenderer));

	
	var BatchShaderGenerator =  (function () {
	    
	    function BatchShaderGenerator(vertexSrc, fragTemplate) {
	        
	        this.vertexSrc = vertexSrc;
	        
	        this.fragTemplate = fragTemplate;
	        this.programCache = {};
	        this.defaultGroupCache = {};
	        if (fragTemplate.indexOf('%count%') < 0) {
	            throw new Error('Fragment template must contain "%count%".');
	        }
	        if (fragTemplate.indexOf('%forloop%') < 0) {
	            throw new Error('Fragment template must contain "%forloop%".');
	        }
	    }
	    BatchShaderGenerator.prototype.generateShader = function (maxTextures) {
	        if (!this.programCache[maxTextures]) {
	            var sampleValues = new Int32Array(maxTextures);
	            for (var i = 0; i < maxTextures; i++) {
	                sampleValues[i] = i;
	            }
	            this.defaultGroupCache[maxTextures] = UniformGroup.from({ uSamplers: sampleValues }, true);
	            var fragmentSrc = this.fragTemplate;
	            fragmentSrc = fragmentSrc.replace(/%count%/gi, "" + maxTextures);
	            fragmentSrc = fragmentSrc.replace(/%forloop%/gi, this.generateSampleSrc(maxTextures));
	            this.programCache[maxTextures] = new Program(this.vertexSrc, fragmentSrc);
	        }
	        var uniforms = {
	            tint: new Float32Array([1, 1, 1, 1]),
	            translationMatrix: new Matrix(),
	            default: this.defaultGroupCache[maxTextures],
	        };
	        return new Shader(this.programCache[maxTextures], uniforms);
	    };
	    BatchShaderGenerator.prototype.generateSampleSrc = function (maxTextures) {
	        var src = '';
	        src += '\n';
	        src += '\n';
	        for (var i = 0; i < maxTextures; i++) {
	            if (i > 0) {
	                src += '\nelse ';
	            }
	            if (i < maxTextures - 1) {
	                src += "if(vTextureId < " + i + ".5)";
	            }
	            src += '\n{';
	            src += "\n\tcolor = texture2D(uSamplers[" + i + "], vTextureCoord);";
	            src += '\n}';
	        }
	        src += '\n';
	        src += '\n';
	        return src;
	    };
	    return BatchShaderGenerator;
	}());

	
	var BatchGeometry =  (function (_super) {
	    __extends$2(BatchGeometry, _super);
	    
	    function BatchGeometry(_static) {
	        if (_static === void 0) { _static = false; }
	        var _this = _super.call(this) || this;
	        
	        _this._buffer = new Buffer(null, _static, false);
	        
	        _this._indexBuffer = new Buffer(null, _static, true);
	        _this.addAttribute('aVertexPosition', _this._buffer, 2, false, exports.TYPES.FLOAT)
	            .addAttribute('aTextureCoord', _this._buffer, 2, false, exports.TYPES.FLOAT)
	            .addAttribute('aColor', _this._buffer, 4, true, exports.TYPES.UNSIGNED_BYTE)
	            .addAttribute('aTextureId', _this._buffer, 1, true, exports.TYPES.FLOAT)
	            .addIndex(_this._indexBuffer);
	        return _this;
	    }
	    return BatchGeometry;
	}(Geometry));

	var defaultVertex$2 = "precision highp float;\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\nattribute float aTextureId;\n\nuniform mat3 projectionMatrix;\nuniform mat3 translationMatrix;\nuniform vec4 tint;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\nvarying float vTextureId;\n\nvoid main(void){\n    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = aTextureCoord;\n    vTextureId = aTextureId;\n    vColor = aColor * tint;\n}\n";

	var defaultFragment$2 = "varying vec2 vTextureCoord;\nvarying vec4 vColor;\nvarying float vTextureId;\nuniform sampler2D uSamplers[%count%];\n\nvoid main(void){\n    vec4 color;\n    %forloop%\n    gl_FragColor = color * vColor;\n}\n";

	
	var BatchPluginFactory =  (function () {
	    function BatchPluginFactory() {
	    }
	    
	    BatchPluginFactory.create = function (options) {
	        var _a = Object.assign({
	            vertex: defaultVertex$2,
	            fragment: defaultFragment$2,
	            geometryClass: BatchGeometry,
	            vertexSize: 6,
	        }, options), vertex = _a.vertex, fragment = _a.fragment, vertexSize = _a.vertexSize, geometryClass = _a.geometryClass;
	        return  (function (_super) {
	            __extends$2(BatchPlugin, _super);
	            function BatchPlugin(renderer) {
	                var _this = _super.call(this, renderer) || this;
	                _this.shaderGenerator = new BatchShaderGenerator(vertex, fragment);
	                _this.geometryClass = geometryClass;
	                _this.vertexSize = vertexSize;
	                return _this;
	            }
	            return BatchPlugin;
	        }(AbstractBatchRenderer));
	    };
	    Object.defineProperty(BatchPluginFactory, "defaultVertexSrc", {
	        
	        get: function () {
	            return defaultVertex$2;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BatchPluginFactory, "defaultFragmentTemplate", {
	        
	        get: function () {
	            return defaultFragment$2;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return BatchPluginFactory;
	}());
	
	
	var BatchRenderer = BatchPluginFactory.create();

	

	
	var Application =  (function () {
	    
	    function Application(options) {
	        var _this = this;
	        
	        options = Object.assign({
	            forceCanvas: false,
	        }, options);
	        
	        this.renderer = autoDetectRenderer(options);
	        
	        this.stage = new Container();
	        
	        Application._plugins.forEach(function (plugin) {
	            plugin.init.call(_this, options);
	        });
	    }
	    
	    Application.registerPlugin = function (plugin) {
	        Application._plugins.push(plugin);
	    };
	    
	    Application.prototype.render = function () {
	        
	        
	        this.renderer.render(this.stage);
	    };
	    Object.defineProperty(Application.prototype, "view", {
	        
	        get: function () {
	            return this.renderer.view;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Application.prototype, "screen", {
	        
	        get: function () {
	            return this.renderer.screen;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    Application.prototype.destroy = function (removeView, stageOptions) {
	        var _this = this;
	        
	        
	        var plugins = Application._plugins.slice(0);
	        plugins.reverse();
	        plugins.forEach(function (plugin) {
	            plugin.destroy.call(_this);
	        });
	        this.stage.destroy(stageOptions);
	        this.stage = null;
	        this.renderer.destroy(removeView);
	        this.renderer = null;
	    };
	    return Application;
	}());
	
	
	Application._plugins = [];

	
	var ResizePlugin =  (function () {
	    function ResizePlugin() {
	    }
	    
	    ResizePlugin.init = function (options) {
	        var _this = this;
	        
	        Object.defineProperty(this, 'resizeTo', {
	            set: function (dom) {
	                window.removeEventListener('resize', this.queueResize);
	                this._resizeTo = dom;
	                if (dom) {
	                    window.addEventListener('resize', this.queueResize);
	                    this.resize();
	                }
	            },
	            get: function () {
	                return this._resizeTo;
	            },
	        });
	        
	        this.queueResize = function () {
	            if (!_this._resizeTo) {
	                return;
	            }
	            _this.cancelResize();
	            
	            _this._resizeId = requestAnimationFrame(function () { return _this.resize(); });
	        };
	        
	        this.cancelResize = function () {
	            if (_this._resizeId) {
	                cancelAnimationFrame(_this._resizeId);
	                _this._resizeId = null;
	            }
	        };
	        
	        this.resize = function () {
	            if (!_this._resizeTo) {
	                return;
	            }
	            
	            _this.cancelResize();
	            var width;
	            var height;
	            
	            if (_this._resizeTo === window) {
	                width = window.innerWidth;
	                height = window.innerHeight;
	            }
	            
	            else {
	                var _a = _this._resizeTo, clientWidth = _a.clientWidth, clientHeight = _a.clientHeight;
	                width = clientWidth;
	                height = clientHeight;
	            }
	            _this.renderer.resize(width, height);
	        };
	        
	        this._resizeId = null;
	        this._resizeTo = null;
	        this.resizeTo = options.resizeTo || null;
	    };
	    
	    ResizePlugin.destroy = function () {
	        window.removeEventListener('resize', this.queueResize);
	        this.cancelResize();
	        this.cancelResize = null;
	        this.queueResize = null;
	        this.resizeTo = null;
	        this.resize = null;
	    };
	    return ResizePlugin;
	}());

	Application.registerPlugin(ResizePlugin);

	

	var TEMP_RECT = new Rectangle();
	var BYTES_PER_PIXEL = 4;
	
	var Extract =  (function () {
	    
	    function Extract(renderer) {
	        this.renderer = renderer;
	        
	        renderer.extract = this;
	    }
	    
	    Extract.prototype.image = function (target, format, quality) {
	        var image = new Image();
	        image.src = this.base64(target, format, quality);
	        return image;
	    };
	    
	    Extract.prototype.base64 = function (target, format, quality) {
	        return this.canvas(target).toDataURL(format, quality);
	    };
	    
	    Extract.prototype.canvas = function (target) {
	        var renderer = this.renderer;
	        var resolution;
	        var frame;
	        var flipY = false;
	        var renderTexture;
	        var generated = false;
	        if (target) {
	            if (target instanceof RenderTexture) {
	                renderTexture = target;
	            }
	            else {
	                renderTexture = this.renderer.generateTexture(target);
	                generated = true;
	            }
	        }
	        if (renderTexture) {
	            resolution = renderTexture.baseTexture.resolution;
	            frame = renderTexture.frame;
	            flipY = false;
	            renderer.renderTexture.bind(renderTexture);
	        }
	        else {
	            resolution = this.renderer.resolution;
	            flipY = true;
	            frame = TEMP_RECT;
	            frame.width = this.renderer.width;
	            frame.height = this.renderer.height;
	            renderer.renderTexture.bind(null);
	        }
	        var width = Math.floor((frame.width * resolution) + 1e-4);
	        var height = Math.floor((frame.height * resolution) + 1e-4);
	        var canvasBuffer = new CanvasRenderTarget(width, height, 1);
	        var webglPixels = new Uint8Array(BYTES_PER_PIXEL * width * height);
	        
	        var gl = renderer.gl;
	        gl.readPixels(frame.x * resolution, frame.y * resolution, width, height, gl.RGBA, gl.UNSIGNED_BYTE, webglPixels);
	        
	        var canvasData = canvasBuffer.context.getImageData(0, 0, width, height);
	        Extract.arrayPostDivide(webglPixels, canvasData.data);
	        canvasBuffer.context.putImageData(canvasData, 0, 0);
	        
	        if (flipY) {
	            var target_1 = new CanvasRenderTarget(canvasBuffer.width, canvasBuffer.height, 1);
	            target_1.context.scale(1, -1);
	            
	            target_1.context.drawImage(canvasBuffer.canvas, 0, -height);
	            canvasBuffer.destroy();
	            canvasBuffer = target_1;
	        }
	        if (generated) {
	            renderTexture.destroy(true);
	        }
	        
	        return canvasBuffer.canvas;
	    };
	    
	    Extract.prototype.pixels = function (target) {
	        var renderer = this.renderer;
	        var resolution;
	        var frame;
	        var renderTexture;
	        var generated = false;
	        if (target) {
	            if (target instanceof RenderTexture) {
	                renderTexture = target;
	            }
	            else {
	                renderTexture = this.renderer.generateTexture(target);
	                generated = true;
	            }
	        }
	        if (renderTexture) {
	            resolution = renderTexture.baseTexture.resolution;
	            frame = renderTexture.frame;
	            
	            renderer.renderTexture.bind(renderTexture);
	        }
	        else {
	            resolution = renderer.resolution;
	            frame = TEMP_RECT;
	            frame.width = renderer.width;
	            frame.height = renderer.height;
	            renderer.renderTexture.bind(null);
	        }
	        var width = frame.width * resolution;
	        var height = frame.height * resolution;
	        var webglPixels = new Uint8Array(BYTES_PER_PIXEL * width * height);
	        
	        var gl = renderer.gl;
	        gl.readPixels(frame.x * resolution, frame.y * resolution, width, height, gl.RGBA, gl.UNSIGNED_BYTE, webglPixels);
	        if (generated) {
	            renderTexture.destroy(true);
	        }
	        Extract.arrayPostDivide(webglPixels, webglPixels);
	        return webglPixels;
	    };
	    
	    Extract.prototype.destroy = function () {
	        this.renderer.extract = null;
	        this.renderer = null;
	    };
	    
	    Extract.arrayPostDivide = function (pixels, out) {
	        for (var i = 0; i < pixels.length; i += 4) {
	            var alpha = out[i + 3] = pixels[i + 3];
	            if (alpha !== 0) {
	                out[i] = Math.round(Math.min(pixels[i] * 255.0 / alpha, 255.0));
	                out[i + 1] = Math.round(Math.min(pixels[i + 1] * 255.0 / alpha, 255.0));
	                out[i + 2] = Math.round(Math.min(pixels[i + 2] * 255.0 / alpha, 255.0));
	            }
	            else {
	                out[i] = pixels[i];
	                out[i + 1] = pixels[i + 1];
	                out[i + 2] = pixels[i + 2];
	            }
	        }
	    };
	    return Extract;
	}());

	'use strict';

	var src = function (str, opts) {
	  if ( opts === void 0 ) opts = {};

	  if (!str) { return undefined }

	  var o = {
	    key: [
	      'source',
	      'protocol',
	      'authority',
	      'userInfo',
	      'user',
	      'password',
	      'host',
	      'port',
	      'relative',
	      'path',
	      'directory',
	      'file',
	      'query',
	      'anchor'
	    ],
	    q: {
	      name: 'queryKey',
	      parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	    },
	    parser: {
	      strict: /^(?:([^:/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?))?((((?:[^?#/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
	      loose: /^(?:(?![^:@]+:[^:@/]*@)([^:/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#/]*\.[^?#/.]+(?:[?#]|$)))*\/?)?([^?#/]*))(?:\?([^#]*))?(?:#(.*))?)/
	    }
	  };

	  var m = o.parser[opts.strictMode ? 'strict' : 'loose'].exec(str);
	  var uri = {};
	  var i = 14;

	  while (i--) { uri[o.key[i]] = m[i] || ''; }

	  uri[o.q.name] = {};
	  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
	    if ($1) { uri[o.q.name][$1] = $2; }
	  });

	  return uri
	};

	var miniSignals = createCommonjsModule(function (module, exports) {
	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) { descriptor.writable = true; } Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) { defineProperties(Constructor.prototype, protoProps); } if (staticProps) { defineProperties(Constructor, staticProps); } return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var MiniSignalBinding = (function () {
	  function MiniSignalBinding(fn, once, thisArg) {
	    if (once === undefined) { once = false; }

	    _classCallCheck(this, MiniSignalBinding);

	    this._fn = fn;
	    this._once = once;
	    this._thisArg = thisArg;
	    this._next = this._prev = this._owner = null;
	  }

	  _createClass(MiniSignalBinding, [{
	    key: 'detach',
	    value: function detach() {
	      if (this._owner === null) { return false; }
	      this._owner.detach(this);
	      return true;
	    }
	  }]);

	  return MiniSignalBinding;
	})();

	function _addMiniSignalBinding(self, node) {
	  if (!self._head) {
	    self._head = node;
	    self._tail = node;
	  } else {
	    self._tail._next = node;
	    node._prev = self._tail;
	    self._tail = node;
	  }

	  node._owner = self;

	  return node;
	}

	var MiniSignal = (function () {
	  function MiniSignal() {
	    _classCallCheck(this, MiniSignal);

	    this._head = this._tail = undefined;
	  }

	  _createClass(MiniSignal, [{
	    key: 'handlers',
	    value: function handlers() {
	      var exists = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

	      var node = this._head;

	      if (exists) { return !!node; }

	      var ee = [];

	      while (node) {
	        ee.push(node);
	        node = node._next;
	      }

	      return ee;
	    }
	  }, {
	    key: 'has',
	    value: function has(node) {
	      if (!(node instanceof MiniSignalBinding)) {
	        throw new Error('MiniSignal#has(): First arg must be a MiniSignalBinding object.');
	      }

	      return node._owner === this;
	    }
	  }, {
	    key: 'dispatch',
	    value: function dispatch() {
	      var arguments$1 = arguments;

	      var node = this._head;

	      if (!node) { return false; }

	      while (node) {
	        if (node._once) { this.detach(node); }
	        node._fn.apply(node._thisArg, arguments$1);
	        node = node._next;
	      }

	      return true;
	    }
	  }, {
	    key: 'add',
	    value: function add(fn) {
	      var thisArg = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

	      if (typeof fn !== 'function') {
	        throw new Error('MiniSignal#add(): First arg must be a Function.');
	      }
	      return _addMiniSignalBinding(this, new MiniSignalBinding(fn, false, thisArg));
	    }
	  }, {
	    key: 'once',
	    value: function once(fn) {
	      var thisArg = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

	      if (typeof fn !== 'function') {
	        throw new Error('MiniSignal#once(): First arg must be a Function.');
	      }
	      return _addMiniSignalBinding(this, new MiniSignalBinding(fn, true, thisArg));
	    }
	  }, {
	    key: 'detach',
	    value: function detach(node) {
	      if (!(node instanceof MiniSignalBinding)) {
	        throw new Error('MiniSignal#detach(): First arg must be a MiniSignalBinding object.');
	      }
	      if (node._owner !== this) { return this; }

	      if (node._prev) { node._prev._next = node._next; }
	      if (node._next) { node._next._prev = node._prev; }

	      if (node === this._head) {
	        this._head = node._next;
	        if (node._next === null) {
	          this._tail = null;
	        }
	      } else if (node === this._tail) {
	        this._tail = node._prev;
	        this._tail._next = null;
	      }

	      node._owner = null;
	      return this;
	    }
	  }, {
	    key: 'detachAll',
	    value: function detachAll() {
	      var node = this._head;
	      if (!node) { return this; }

	      this._head = this._tail = null;

	      while (node) {
	        node._owner = null;
	        node = node._next;
	      }
	      return this;
	    }
	  }]);

	  return MiniSignal;
	})();

	MiniSignal.MiniSignalBinding = MiniSignalBinding;

	exports['default'] = MiniSignal;
	module.exports = exports['default'];
	});

	var Signal = unwrapExports(miniSignals);

	

	

	
	function _noop() {}
	

	


	function eachSeries(array, iterator, callback, deferNext) {
	  var i = 0;
	  var len = array.length;

	  (function next(err) {
	    if (err || i === len) {
	      if (callback) {
	        callback(err);
	      }

	      return;
	    }

	    if (deferNext) {
	      setTimeout(function () {
	        iterator(array[i++], next);
	      }, 1);
	    } else {
	      iterator(array[i++], next);
	    }
	  })();
	}
	

	function onlyOnce(fn) {
	  return function onceWrapper() {
	    if (fn === null) {
	      throw new Error('Callback was already called.');
	    }

	    var callFn = fn;
	    fn = null;
	    callFn.apply(this, arguments);
	  };
	}
	


	function queue(worker, concurrency) {
	  if (concurrency == null) {
	    
	    concurrency = 1;
	  } else if (concurrency === 0) {
	    throw new Error('Concurrency must not be zero');
	  }

	  var workers = 0;
	  var q = {
	    _tasks: [],
	    concurrency: concurrency,
	    saturated: _noop,
	    unsaturated: _noop,
	    buffer: concurrency / 4,
	    empty: _noop,
	    drain: _noop,
	    error: _noop,
	    started: false,
	    paused: false,
	    push: function push(data, callback) {
	      _insert(data, false, callback);
	    },
	    kill: function kill() {
	      workers = 0;
	      q.drain = _noop;
	      q.started = false;
	      q._tasks = [];
	    },
	    unshift: function unshift(data, callback) {
	      _insert(data, true, callback);
	    },
	    process: function process() {
	      while (!q.paused && workers < q.concurrency && q._tasks.length) {
	        var task = q._tasks.shift();

	        if (q._tasks.length === 0) {
	          q.empty();
	        }

	        workers += 1;

	        if (workers === q.concurrency) {
	          q.saturated();
	        }

	        worker(task.data, onlyOnce(_next(task)));
	      }
	    },
	    length: function length() {
	      return q._tasks.length;
	    },
	    running: function running() {
	      return workers;
	    },
	    idle: function idle() {
	      return q._tasks.length + workers === 0;
	    },
	    pause: function pause() {
	      if (q.paused === true) {
	        return;
	      }

	      q.paused = true;
	    },
	    resume: function resume() {
	      if (q.paused === false) {
	        return;
	      }

	      q.paused = false; 
	      

	      for (var w = 1; w <= q.concurrency; w++) {
	        q.process();
	      }
	    }
	  };

	  function _insert(data, insertAtFront, callback) {
	    if (callback != null && typeof callback !== 'function') {
	      
	      throw new Error('task callback must be a function');
	    }

	    q.started = true;

	    if (data == null && q.idle()) {
	      
	      
	      setTimeout(function () {
	        return q.drain();
	      }, 1);
	      return;
	    }

	    var item = {
	      data: data,
	      callback: typeof callback === 'function' ? callback : _noop
	    };

	    if (insertAtFront) {
	      q._tasks.unshift(item);
	    } else {
	      q._tasks.push(item);
	    }

	    setTimeout(function () {
	      return q.process();
	    }, 1);
	  }

	  function _next(task) {
	    return function next() {
	      workers -= 1;
	      task.callback.apply(task, arguments);

	      if (arguments[0] != null) {
	        
	        q.error(arguments[0], task.data);
	      }

	      if (workers <= q.concurrency - q.buffer) {
	        q.unsaturated();
	      }

	      if (q.idle()) {
	        q.drain();
	      }

	      q.process();
	    };
	  }

	  return q;
	}

	var async = ({
	    eachSeries: eachSeries,
	    queue: queue
	});

	
	var cache = {};
	

	function caching(resource, next) {
	  var _this = this;

	  
	  if (cache[resource.url]) {
	    resource.data = cache[resource.url];
	    resource.complete(); 
	  } 
	  else {
	      resource.onComplete.once(function () {
	        return cache[_this.url] = _this.data;
	      });
	    }

	  next();
	}

	function _defineProperties(target, props) {
	  for (var i = 0; i < props.length; i++) {
	    var descriptor = props[i];
	    descriptor.enumerable = descriptor.enumerable || false;
	    descriptor.configurable = true;
	    if ("value" in descriptor) { descriptor.writable = true; }
	    Object.defineProperty(target, descriptor.key, descriptor);
	  }
	}

	function _createClass(Constructor, protoProps, staticProps) {
	  if (protoProps) { _defineProperties(Constructor.prototype, protoProps); }
	  if (staticProps) { _defineProperties(Constructor, staticProps); }
	  return Constructor;
	}

	var useXdr = !!(window.XDomainRequest && !('withCredentials' in new XMLHttpRequest()));
	var tempAnchor$1 = null; 

	var STATUS_NONE = 0;
	var STATUS_OK = 200;
	var STATUS_EMPTY = 204;
	var STATUS_IE_BUG_EMPTY = 1223;
	var STATUS_TYPE_OK = 2; 

	function _noop$1() {}
	

	


	var Resource$1 =
	
	function () {
	  
	  Resource.setExtensionLoadType = function setExtensionLoadType(extname, loadType) {
	    setExtMap(Resource._loadTypeMap, extname, loadType);
	  }
	  
	  ;

	  Resource.setExtensionXhrType = function setExtensionXhrType(extname, xhrType) {
	    setExtMap(Resource._xhrTypeMap, extname, xhrType);
	  }
	  
	  ;

	  function Resource(name, url, options) {
	    if (typeof name !== 'string' || typeof url !== 'string') {
	      throw new Error('Both name and url are required for constructing a resource.');
	    }

	    options = options || {};
	    

	    this._flags = 0; 

	    this._setFlag(Resource.STATUS_FLAGS.DATA_URL, url.indexOf('data:') === 0);
	    


	    this.name = name;
	    

	    this.url = url;
	    

	    this.extension = this._getExtension();
	    

	    this.data = null;
	    

	    this.crossOrigin = options.crossOrigin === true ? 'anonymous' : options.crossOrigin;
	    

	    this.timeout = options.timeout || 0;
	    

	    this.loadType = options.loadType || this._determineLoadType();
	    

	    this.xhrType = options.xhrType;
	    

	    this.metadata = options.metadata || {};
	    

	    this.error = null;
	    

	    this.xhr = null;
	    

	    this.children = [];
	    

	    this.type = Resource.TYPE.UNKNOWN;
	    

	    this.progressChunk = 0;
	    

	    this._dequeue = _noop$1;
	    

	    this._onLoadBinding = null;
	    

	    this._elementTimer = 0;
	    

	    this._boundComplete = this.complete.bind(this);
	    

	    this._boundOnError = this._onError.bind(this);
	    

	    this._boundOnProgress = this._onProgress.bind(this);
	    

	    this._boundOnTimeout = this._onTimeout.bind(this); 

	    this._boundXhrOnError = this._xhrOnError.bind(this);
	    this._boundXhrOnTimeout = this._xhrOnTimeout.bind(this);
	    this._boundXhrOnAbort = this._xhrOnAbort.bind(this);
	    this._boundXhrOnLoad = this._xhrOnLoad.bind(this);
	    

	    this.onStart = new Signal();
	    

	    this.onProgress = new Signal();
	    

	    this.onComplete = new Signal();
	    

	    this.onAfterMiddleware = new Signal();
	  }
	  

	  

	  

	  

	  


	  var _proto = Resource.prototype;

	  
	  _proto.complete = function complete() {
	    this._clearEvents();

	    this._finish();
	  }
	  
	  ;

	  _proto.abort = function abort(message) {
	    
	    if (this.error) {
	      return;
	    } 


	    this.error = new Error(message); 

	    this._clearEvents(); 


	    if (this.xhr) {
	      this.xhr.abort();
	    } else if (this.xdr) {
	      this.xdr.abort();
	    } else if (this.data) {
	      
	      if (this.data.src) {
	        this.data.src = Resource.EMPTY_GIF;
	      } 
	      else {
	          while (this.data.firstChild) {
	            this.data.removeChild(this.data.firstChild);
	          }
	        }
	    } 


	    this._finish();
	  }
	  
	  ;

	  _proto.load = function load(cb) {
	    var _this = this;

	    if (this.isLoading) {
	      return;
	    }

	    if (this.isComplete) {
	      if (cb) {
	        setTimeout(function () {
	          return cb(_this);
	        }, 1);
	      }

	      return;
	    } else if (cb) {
	      this.onComplete.once(cb);
	    }

	    this._setFlag(Resource.STATUS_FLAGS.LOADING, true);

	    this.onStart.dispatch(this); 

	    if (this.crossOrigin === false || typeof this.crossOrigin !== 'string') {
	      this.crossOrigin = this._determineCrossOrigin(this.url);
	    }

	    switch (this.loadType) {
	      case Resource.LOAD_TYPE.IMAGE:
	        this.type = Resource.TYPE.IMAGE;

	        this._loadElement('image');

	        break;

	      case Resource.LOAD_TYPE.AUDIO:
	        this.type = Resource.TYPE.AUDIO;

	        this._loadSourceElement('audio');

	        break;

	      case Resource.LOAD_TYPE.VIDEO:
	        this.type = Resource.TYPE.VIDEO;

	        this._loadSourceElement('video');

	        break;

	      case Resource.LOAD_TYPE.XHR:
	      

	      default:
	        if (useXdr && this.crossOrigin) {
	          this._loadXdr();
	        } else {
	          this._loadXhr();
	        }

	        break;
	    }
	  }
	  
	  ;

	  _proto._hasFlag = function _hasFlag(flag) {
	    return (this._flags & flag) !== 0;
	  }
	  
	  ;

	  _proto._setFlag = function _setFlag(flag, value) {
	    this._flags = value ? this._flags | flag : this._flags & ~flag;
	  }
	  
	  ;

	  _proto._clearEvents = function _clearEvents() {
	    clearTimeout(this._elementTimer);

	    if (this.data && this.data.removeEventListener) {
	      this.data.removeEventListener('error', this._boundOnError, false);
	      this.data.removeEventListener('load', this._boundComplete, false);
	      this.data.removeEventListener('progress', this._boundOnProgress, false);
	      this.data.removeEventListener('canplaythrough', this._boundComplete, false);
	    }

	    if (this.xhr) {
	      if (this.xhr.removeEventListener) {
	        this.xhr.removeEventListener('error', this._boundXhrOnError, false);
	        this.xhr.removeEventListener('timeout', this._boundXhrOnTimeout, false);
	        this.xhr.removeEventListener('abort', this._boundXhrOnAbort, false);
	        this.xhr.removeEventListener('progress', this._boundOnProgress, false);
	        this.xhr.removeEventListener('load', this._boundXhrOnLoad, false);
	      } else {
	        this.xhr.onerror = null;
	        this.xhr.ontimeout = null;
	        this.xhr.onprogress = null;
	        this.xhr.onload = null;
	      }
	    }
	  }
	  
	  ;

	  _proto._finish = function _finish() {
	    if (this.isComplete) {
	      throw new Error('Complete called again for an already completed resource.');
	    }

	    this._setFlag(Resource.STATUS_FLAGS.COMPLETE, true);

	    this._setFlag(Resource.STATUS_FLAGS.LOADING, false);

	    this.onComplete.dispatch(this);
	  }
	  
	  ;

	  _proto._loadElement = function _loadElement(type) {
	    if (this.metadata.loadElement) {
	      this.data = this.metadata.loadElement;
	    } else if (type === 'image' && typeof window.Image !== 'undefined') {
	      this.data = new Image();
	    } else {
	      this.data = document.createElement(type);
	    }

	    if (this.crossOrigin) {
	      this.data.crossOrigin = this.crossOrigin;
	    }

	    if (!this.metadata.skipSource) {
	      this.data.src = this.url;
	    }

	    this.data.addEventListener('error', this._boundOnError, false);
	    this.data.addEventListener('load', this._boundComplete, false);
	    this.data.addEventListener('progress', this._boundOnProgress, false);

	    if (this.timeout) {
	      this._elementTimer = setTimeout(this._boundOnTimeout, this.timeout);
	    }
	  }
	  
	  ;

	  _proto._loadSourceElement = function _loadSourceElement(type) {
	    if (this.metadata.loadElement) {
	      this.data = this.metadata.loadElement;
	    } else if (type === 'audio' && typeof window.Audio !== 'undefined') {
	      this.data = new Audio();
	    } else {
	      this.data = document.createElement(type);
	    }

	    if (this.data === null) {
	      this.abort("Unsupported element: " + type);
	      return;
	    }

	    if (this.crossOrigin) {
	      this.data.crossOrigin = this.crossOrigin;
	    }

	    if (!this.metadata.skipSource) {
	      
	      if (navigator.isCocoonJS) {
	        this.data.src = Array.isArray(this.url) ? this.url[0] : this.url;
	      } else if (Array.isArray(this.url)) {
	        var mimeTypes = this.metadata.mimeType;

	        for (var i = 0; i < this.url.length; ++i) {
	          this.data.appendChild(this._createSource(type, this.url[i], Array.isArray(mimeTypes) ? mimeTypes[i] : mimeTypes));
	        }
	      } else {
	        var _mimeTypes = this.metadata.mimeType;
	        this.data.appendChild(this._createSource(type, this.url, Array.isArray(_mimeTypes) ? _mimeTypes[0] : _mimeTypes));
	      }
	    }

	    this.data.addEventListener('error', this._boundOnError, false);
	    this.data.addEventListener('load', this._boundComplete, false);
	    this.data.addEventListener('progress', this._boundOnProgress, false);
	    this.data.addEventListener('canplaythrough', this._boundComplete, false);
	    this.data.load();

	    if (this.timeout) {
	      this._elementTimer = setTimeout(this._boundOnTimeout, this.timeout);
	    }
	  }
	  
	  ;

	  _proto._loadXhr = function _loadXhr() {
	    
	    if (typeof this.xhrType !== 'string') {
	      this.xhrType = this._determineXhrType();
	    }

	    var xhr = this.xhr = new XMLHttpRequest(); 

	    xhr.open('GET', this.url, true);
	    xhr.timeout = this.timeout; 
	    

	    if (this.xhrType === Resource.XHR_RESPONSE_TYPE.JSON || this.xhrType === Resource.XHR_RESPONSE_TYPE.DOCUMENT) {
	      xhr.responseType = Resource.XHR_RESPONSE_TYPE.TEXT;
	    } else {
	      xhr.responseType = this.xhrType;
	    }

	    xhr.addEventListener('error', this._boundXhrOnError, false);
	    xhr.addEventListener('timeout', this._boundXhrOnTimeout, false);
	    xhr.addEventListener('abort', this._boundXhrOnAbort, false);
	    xhr.addEventListener('progress', this._boundOnProgress, false);
	    xhr.addEventListener('load', this._boundXhrOnLoad, false);
	    xhr.send();
	  }
	  
	  ;

	  _proto._loadXdr = function _loadXdr() {
	    
	    if (typeof this.xhrType !== 'string') {
	      this.xhrType = this._determineXhrType();
	    }

	    var xdr = this.xhr = new XDomainRequest(); 
	    
	    
	    

	    xdr.timeout = this.timeout || 5000; 

	    xdr.onerror = this._boundXhrOnError;
	    xdr.ontimeout = this._boundXhrOnTimeout;
	    xdr.onprogress = this._boundOnProgress;
	    xdr.onload = this._boundXhrOnLoad;
	    xdr.open('GET', this.url, true); 
	    
	    
	    

	    setTimeout(function () {
	      return xdr.send();
	    }, 1);
	  }
	  
	  ;

	  _proto._createSource = function _createSource(type, url, mime) {
	    if (!mime) {
	      mime = type + "/" + this._getExtension(url);
	    }

	    var source = document.createElement('source');
	    source.src = url;
	    source.type = mime;
	    return source;
	  }
	  
	  ;

	  _proto._onError = function _onError(event) {
	    this.abort("Failed to load element using: " + event.target.nodeName);
	  }
	  
	  ;

	  _proto._onProgress = function _onProgress(event) {
	    if (event && event.lengthComputable) {
	      this.onProgress.dispatch(this, event.loaded / event.total);
	    }
	  }
	  
	  ;

	  _proto._onTimeout = function _onTimeout() {
	    this.abort("Load timed out.");
	  }
	  
	  ;

	  _proto._xhrOnError = function _xhrOnError() {
	    var xhr = this.xhr;
	    this.abort(reqType(xhr) + " Request failed. Status: " + xhr.status + ", text: \"" + xhr.statusText + "\"");
	  }
	  
	  ;

	  _proto._xhrOnTimeout = function _xhrOnTimeout() {
	    var xhr = this.xhr;
	    this.abort(reqType(xhr) + " Request timed out.");
	  }
	  
	  ;

	  _proto._xhrOnAbort = function _xhrOnAbort() {
	    var xhr = this.xhr;
	    this.abort(reqType(xhr) + " Request was aborted by the user.");
	  }
	  
	  ;

	  _proto._xhrOnLoad = function _xhrOnLoad() {
	    var xhr = this.xhr;
	    var text = '';
	    var status = typeof xhr.status === 'undefined' ? STATUS_OK : xhr.status; 
	    

	    if (xhr.responseType === '' || xhr.responseType === 'text' || typeof xhr.responseType === 'undefined') {
	      text = xhr.responseText;
	    } 
	    


	    if (status === STATUS_NONE && (text.length > 0 || xhr.responseType === Resource.XHR_RESPONSE_TYPE.BUFFER)) {
	      status = STATUS_OK;
	    } 
	    else if (status === STATUS_IE_BUG_EMPTY) {
	        status = STATUS_EMPTY;
	      }

	    var statusType = status / 100 | 0;

	    if (statusType === STATUS_TYPE_OK) {
	      
	      if (this.xhrType === Resource.XHR_RESPONSE_TYPE.TEXT) {
	        this.data = text;
	        this.type = Resource.TYPE.TEXT;
	      } 
	      else if (this.xhrType === Resource.XHR_RESPONSE_TYPE.JSON) {
	          try {
	            this.data = JSON.parse(text);
	            this.type = Resource.TYPE.JSON;
	          } catch (e) {
	            this.abort("Error trying to parse loaded json: " + e);
	            return;
	          }
	        } 
	        else if (this.xhrType === Resource.XHR_RESPONSE_TYPE.DOCUMENT) {
	            try {
	              if (window.DOMParser) {
	                var domparser = new DOMParser();
	                this.data = domparser.parseFromString(text, 'text/xml');
	              } else {
	                var div = document.createElement('div');
	                div.innerHTML = text;
	                this.data = div;
	              }

	              this.type = Resource.TYPE.XML;
	            } catch (e) {
	              this.abort("Error trying to parse loaded xml: " + e);
	              return;
	            }
	          } 
	          else {
	              this.data = xhr.response || text;
	            }
	    } else {
	      this.abort("[" + xhr.status + "] " + xhr.statusText + ": " + xhr.responseURL);
	      return;
	    }

	    this.complete();
	  }
	  
	  ;

	  _proto._determineCrossOrigin = function _determineCrossOrigin(url, loc) {
	    
	    if (url.indexOf('data:') === 0) {
	      return '';
	    } 
	    
	    


	    if (window.origin !== window.location.origin) {
	      return 'anonymous';
	    } 


	    loc = loc || window.location;

	    if (!tempAnchor$1) {
	      tempAnchor$1 = document.createElement('a');
	    } 
	    
	    


	    tempAnchor$1.href = url;
	    url = src(tempAnchor$1.href, {
	      strictMode: true
	    });
	    var samePort = !url.port && loc.port === '' || url.port === loc.port;
	    var protocol = url.protocol ? url.protocol + ":" : ''; 

	    if (url.host !== loc.hostname || !samePort || protocol !== loc.protocol) {
	      return 'anonymous';
	    }

	    return '';
	  }
	  
	  ;

	  _proto._determineXhrType = function _determineXhrType() {
	    return Resource._xhrTypeMap[this.extension] || Resource.XHR_RESPONSE_TYPE.TEXT;
	  }
	  
	  ;

	  _proto._determineLoadType = function _determineLoadType() {
	    return Resource._loadTypeMap[this.extension] || Resource.LOAD_TYPE.XHR;
	  }
	  
	  ;

	  _proto._getExtension = function _getExtension() {
	    var url = this.url;
	    var ext = '';

	    if (this.isDataUrl) {
	      var slashIndex = url.indexOf('/');
	      ext = url.substring(slashIndex + 1, url.indexOf(';', slashIndex));
	    } else {
	      var queryStart = url.indexOf('?');
	      var hashStart = url.indexOf('#');
	      var index = Math.min(queryStart > -1 ? queryStart : url.length, hashStart > -1 ? hashStart : url.length);
	      url = url.substring(0, index);
	      ext = url.substring(url.lastIndexOf('.') + 1);
	    }

	    return ext.toLowerCase();
	  }
	  
	  ;

	  _proto._getMimeFromXhrType = function _getMimeFromXhrType(type) {
	    switch (type) {
	      case Resource.XHR_RESPONSE_TYPE.BUFFER:
	        return 'application/octet-binary';

	      case Resource.XHR_RESPONSE_TYPE.BLOB:
	        return 'application/blob';

	      case Resource.XHR_RESPONSE_TYPE.DOCUMENT:
	        return 'application/xml';

	      case Resource.XHR_RESPONSE_TYPE.JSON:
	        return 'application/json';

	      case Resource.XHR_RESPONSE_TYPE.DEFAULT:
	      case Resource.XHR_RESPONSE_TYPE.TEXT:
	      

	      default:
	        return 'text/plain';
	    }
	  };

	  _createClass(Resource, [{
	    key: "isDataUrl",
	    get: function get() {
	      return this._hasFlag(Resource.STATUS_FLAGS.DATA_URL);
	    }
	    

	  }, {
	    key: "isComplete",
	    get: function get() {
	      return this._hasFlag(Resource.STATUS_FLAGS.COMPLETE);
	    }
	    

	  }, {
	    key: "isLoading",
	    get: function get() {
	      return this._hasFlag(Resource.STATUS_FLAGS.LOADING);
	    }
	  }]);

	  return Resource;
	}();
	


	Resource$1.STATUS_FLAGS = {
	  NONE: 0,
	  DATA_URL: 1 << 0,
	  COMPLETE: 1 << 1,
	  LOADING: 1 << 2
	};
	

	Resource$1.TYPE = {
	  UNKNOWN: 0,
	  JSON: 1,
	  XML: 2,
	  IMAGE: 3,
	  AUDIO: 4,
	  VIDEO: 5,
	  TEXT: 6
	};
	

	Resource$1.LOAD_TYPE = {
	  
	  XHR: 1,

	  
	  IMAGE: 2,

	  
	  AUDIO: 3,

	  
	  VIDEO: 4
	};
	

	Resource$1.XHR_RESPONSE_TYPE = {
	  
	  DEFAULT: 'text',

	  
	  BUFFER: 'arraybuffer',

	  
	  BLOB: 'blob',

	  
	  DOCUMENT: 'document',

	  
	  JSON: 'json',

	  
	  TEXT: 'text'
	};
	Resource$1._loadTypeMap = {
	  
	  gif: Resource$1.LOAD_TYPE.IMAGE,
	  png: Resource$1.LOAD_TYPE.IMAGE,
	  bmp: Resource$1.LOAD_TYPE.IMAGE,
	  jpg: Resource$1.LOAD_TYPE.IMAGE,
	  jpeg: Resource$1.LOAD_TYPE.IMAGE,
	  tif: Resource$1.LOAD_TYPE.IMAGE,
	  tiff: Resource$1.LOAD_TYPE.IMAGE,
	  webp: Resource$1.LOAD_TYPE.IMAGE,
	  tga: Resource$1.LOAD_TYPE.IMAGE,
	  svg: Resource$1.LOAD_TYPE.IMAGE,
	  'svg+xml': Resource$1.LOAD_TYPE.IMAGE,
	  
	  
	  mp3: Resource$1.LOAD_TYPE.AUDIO,
	  ogg: Resource$1.LOAD_TYPE.AUDIO,
	  wav: Resource$1.LOAD_TYPE.AUDIO,
	  
	  mp4: Resource$1.LOAD_TYPE.VIDEO,
	  webm: Resource$1.LOAD_TYPE.VIDEO
	};
	Resource$1._xhrTypeMap = {
	  
	  xhtml: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
	  html: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
	  htm: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
	  xml: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
	  tmx: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
	  svg: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
	  
	  
	  
	  tsx: Resource$1.XHR_RESPONSE_TYPE.DOCUMENT,
	  
	  gif: Resource$1.XHR_RESPONSE_TYPE.BLOB,
	  png: Resource$1.XHR_RESPONSE_TYPE.BLOB,
	  bmp: Resource$1.XHR_RESPONSE_TYPE.BLOB,
	  jpg: Resource$1.XHR_RESPONSE_TYPE.BLOB,
	  jpeg: Resource$1.XHR_RESPONSE_TYPE.BLOB,
	  tif: Resource$1.XHR_RESPONSE_TYPE.BLOB,
	  tiff: Resource$1.XHR_RESPONSE_TYPE.BLOB,
	  webp: Resource$1.XHR_RESPONSE_TYPE.BLOB,
	  tga: Resource$1.XHR_RESPONSE_TYPE.BLOB,
	  
	  json: Resource$1.XHR_RESPONSE_TYPE.JSON,
	  
	  text: Resource$1.XHR_RESPONSE_TYPE.TEXT,
	  txt: Resource$1.XHR_RESPONSE_TYPE.TEXT,
	  
	  ttf: Resource$1.XHR_RESPONSE_TYPE.BUFFER,
	  otf: Resource$1.XHR_RESPONSE_TYPE.BUFFER
	}; 

	Resource$1.EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAP
	

	function setExtMap(map, extname, val) {
	  if (extname && extname.indexOf('.') === 0) {
	    extname = extname.substring(1);
	  }

	  if (!extname) {
	    return;
	  }

	  map[extname] = val;
	}
	


	function reqType(xhr) {
	  return xhr.toString().replace('object ', '');
	}

	var _keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	

	function encodeBinary(input) {
	  var output = '';
	  var inx = 0;

	  while (inx < input.length) {
	    
	    var bytebuffer = [0, 0, 0];
	    var encodedCharIndexes = [0, 0, 0, 0];

	    for (var jnx = 0; jnx < bytebuffer.length; ++jnx) {
	      if (inx < input.length) {
	        
	        
	        bytebuffer[jnx] = input.charCodeAt(inx++) & 0xff;
	      } else {
	        bytebuffer[jnx] = 0;
	      }
	    } 
	    


	    encodedCharIndexes[0] = bytebuffer[0] >> 2; 

	    encodedCharIndexes[1] = (bytebuffer[0] & 0x3) << 4 | bytebuffer[1] >> 4; 

	    encodedCharIndexes[2] = (bytebuffer[1] & 0x0f) << 2 | bytebuffer[2] >> 6; 

	    encodedCharIndexes[3] = bytebuffer[2] & 0x3f; 

	    var paddingBytes = inx - (input.length - 1);

	    switch (paddingBytes) {
	      case 2:
	        
	        encodedCharIndexes[3] = 64;
	        encodedCharIndexes[2] = 64;
	        break;

	      case 1:
	        
	        encodedCharIndexes[3] = 64;
	        break;

	      default:
	        break;
	      
	    } 
	    


	    for (var _jnx = 0; _jnx < encodedCharIndexes.length; ++_jnx) {
	      output += _keyStr.charAt(encodedCharIndexes[_jnx]);
	    }
	  }

	  return output;
	}

	var Url$1 = window.URL || window.webkitURL;
	

	function parsing(resource, next) {
	  if (!resource.data) {
	    next();
	    return;
	  } 


	  if (resource.xhr && resource.xhrType === Resource$1.XHR_RESPONSE_TYPE.BLOB) {
	    
	    if (!window.Blob || typeof resource.data === 'string') {
	      var type = resource.xhr.getResponseHeader('content-type'); 

	      if (type && type.indexOf('image') === 0) {
	        resource.data = new Image();
	        resource.data.src = "data:" + type + ";base64," + encodeBinary(resource.xhr.responseText);
	        resource.type = Resource$1.TYPE.IMAGE; 

	        resource.data.onload = function () {
	          resource.data.onload = null;
	          next();
	        }; 


	        return;
	      }
	    } 
	    else if (resource.data.type.indexOf('image') === 0) {
	        var src = Url$1.createObjectURL(resource.data);
	        resource.blob = resource.data;
	        resource.data = new Image();
	        resource.data.src = src;
	        resource.type = Resource$1.TYPE.IMAGE; 
	        

	        resource.data.onload = function () {
	          Url$1.revokeObjectURL(src);
	          resource.data.onload = null;
	          next();
	        }; 


	        return;
	      }
	  }

	  next();
	}

	

	var index$1 = ({
	    caching: caching,
	    parsing: parsing
	});

	var MAX_PROGRESS = 100;
	var rgxExtractUrlHash = /(#[\w-]+)?$/;
	

	var Loader =
	
	function () {
	  
	  function Loader(baseUrl, concurrency) {
	    var _this = this;

	    if (baseUrl === void 0) {
	      baseUrl = '';
	    }

	    if (concurrency === void 0) {
	      concurrency = 10;
	    }

	    
	    this.baseUrl = baseUrl;
	    

	    this.progress = 0;
	    

	    this.loading = false;
	    

	    this.defaultQueryString = '';
	    

	    this._beforeMiddleware = [];
	    

	    this._afterMiddleware = [];
	    

	    this._resourcesParsing = [];
	    

	    this._boundLoadResource = function (r, d) {
	      return _this._loadResource(r, d);
	    };
	    


	    this._queue = queue(this._boundLoadResource, concurrency);

	    this._queue.pause();
	    


	    this.resources = {};
	    

	    this.onProgress = new Signal();
	    

	    this.onError = new Signal();
	    

	    this.onLoad = new Signal();
	    

	    this.onStart = new Signal();
	    

	    this.onComplete = new Signal(); 

	    for (var i = 0; i < Loader._defaultBeforeMiddleware.length; ++i) {
	      this.pre(Loader._defaultBeforeMiddleware[i]);
	    } 


	    for (var _i = 0; _i < Loader._defaultAfterMiddleware.length; ++_i) {
	      this.use(Loader._defaultAfterMiddleware[_i]);
	    }
	  }
	  

	  

	  

	  

	  

	  

	  

	  

	  

	  

	  

	  

	  


	  var _proto = Loader.prototype;

	  _proto.add = function add(name, url, options, cb) {
	    
	    if (Array.isArray(name)) {
	      for (var i = 0; i < name.length; ++i) {
	        this.add(name[i]);
	      }

	      return this;
	    } 


	    if (typeof name === 'object') {
	      cb = url || name.callback || name.onComplete;
	      options = name;
	      url = name.url;
	      name = name.name || name.key || name.url;
	    } 


	    if (typeof url !== 'string') {
	      cb = options;
	      options = url;
	      url = name;
	    } 


	    if (typeof url !== 'string') {
	      throw new Error('No url passed to add resource to loader.');
	    } 


	    if (typeof options === 'function') {
	      cb = options;
	      options = null;
	    } 


	    if (this.loading && (!options || !options.parentResource)) {
	      throw new Error('Cannot add resources while the loader is running.');
	    } 


	    if (this.resources[name]) {
	      throw new Error("Resource named \"" + name + "\" already exists.");
	    } 


	    url = this._prepareUrl(url); 

	    this.resources[name] = new Resource$1(name, url, options);

	    if (typeof cb === 'function') {
	      this.resources[name].onAfterMiddleware.once(cb);
	    } 


	    if (this.loading) {
	      var parent = options.parentResource;
	      var incompleteChildren = [];

	      for (var _i2 = 0; _i2 < parent.children.length; ++_i2) {
	        if (!parent.children[_i2].isComplete) {
	          incompleteChildren.push(parent.children[_i2]);
	        }
	      }

	      var fullChunk = parent.progressChunk * (incompleteChildren.length + 1); 

	      var eachChunk = fullChunk / (incompleteChildren.length + 2); 

	      parent.children.push(this.resources[name]);
	      parent.progressChunk = eachChunk;

	      for (var _i3 = 0; _i3 < incompleteChildren.length; ++_i3) {
	        incompleteChildren[_i3].progressChunk = eachChunk;
	      }

	      this.resources[name].progressChunk = eachChunk;
	    } 


	    this._queue.push(this.resources[name]);

	    return this;
	  }
	  

	  
	  ;

	  _proto.pre = function pre(fn) {
	    this._beforeMiddleware.push(fn);

	    return this;
	  }
	  
	  ;

	  _proto.use = function use(fn) {
	    this._afterMiddleware.push(fn);

	    return this;
	  }
	  
	  ;

	  _proto.reset = function reset() {
	    this.progress = 0;
	    this.loading = false;

	    this._queue.kill();

	    this._queue.pause(); 


	    for (var k in this.resources) {
	      var res = this.resources[k];

	      if (res._onLoadBinding) {
	        res._onLoadBinding.detach();
	      }

	      if (res.isLoading) {
	        res.abort();
	      }
	    }

	    this.resources = {};
	    return this;
	  }
	  
	  ;

	  _proto.load = function load(cb) {
	    
	    if (typeof cb === 'function') {
	      this.onComplete.once(cb);
	    } 


	    if (this.loading) {
	      return this;
	    }

	    if (this._queue.idle()) {
	      this._onStart();

	      this._onComplete();
	    } else {
	      
	      var numTasks = this._queue._tasks.length;
	      var chunk = MAX_PROGRESS / numTasks;

	      for (var i = 0; i < this._queue._tasks.length; ++i) {
	        this._queue._tasks[i].data.progressChunk = chunk;
	      } 


	      this._onStart(); 


	      this._queue.resume();
	    }

	    return this;
	  }
	  
	  ;

	  
	  _proto._prepareUrl = function _prepareUrl(url) {
	    var parsedUrl = src(url, {
	      strictMode: true
	    });
	    var result; 

	    if (parsedUrl.protocol || !parsedUrl.path || url.indexOf('
	      result = url;
	    } 
	    else if (this.baseUrl.length && this.baseUrl.lastIndexOf('/') !== this.baseUrl.length - 1 && url.charAt(0) !== '/') {
	        result = this.baseUrl + "/" + url;
	      } else {
	        result = this.baseUrl + url;
	      } 


	    if (this.defaultQueryString) {
	      var hash = rgxExtractUrlHash.exec(result)[0];
	      result = result.substr(0, result.length - hash.length);

	      if (result.indexOf('?') !== -1) {
	        result += "&" + this.defaultQueryString;
	      } else {
	        result += "?" + this.defaultQueryString;
	      }

	      result += hash;
	    }

	    return result;
	  }
	  
	  ;

	  _proto._loadResource = function _loadResource(resource, dequeue) {
	    var _this2 = this;

	    resource._dequeue = dequeue; 

	    eachSeries(this._beforeMiddleware, function (fn, next) {
	      fn.call(_this2, resource, function () {
	        
	        
	        next(resource.isComplete ? {} : null);
	      });
	    }, function () {
	      if (resource.isComplete) {
	        _this2._onLoad(resource);
	      } else {
	        resource._onLoadBinding = resource.onComplete.once(_this2._onLoad, _this2);
	        resource.load();
	      }
	    }, true);
	  }
	  
	  ;

	  _proto._onStart = function _onStart() {
	    this.progress = 0;
	    this.loading = true;
	    this.onStart.dispatch(this);
	  }
	  
	  ;

	  _proto._onComplete = function _onComplete() {
	    this.progress = MAX_PROGRESS;
	    this.loading = false;
	    this.onComplete.dispatch(this, this.resources);
	  }
	  
	  ;

	  _proto._onLoad = function _onLoad(resource) {
	    var _this3 = this;

	    resource._onLoadBinding = null; 

	    this._resourcesParsing.push(resource);

	    resource._dequeue(); 


	    eachSeries(this._afterMiddleware, function (fn, next) {
	      fn.call(_this3, resource, next);
	    }, function () {
	      resource.onAfterMiddleware.dispatch(resource);
	      _this3.progress = Math.min(MAX_PROGRESS, _this3.progress + resource.progressChunk);

	      _this3.onProgress.dispatch(_this3, resource);

	      if (resource.error) {
	        _this3.onError.dispatch(resource.error, _this3, resource);
	      } else {
	        _this3.onLoad.dispatch(_this3, resource);
	      }

	      _this3._resourcesParsing.splice(_this3._resourcesParsing.indexOf(resource), 1); 


	      if (_this3._queue.idle() && _this3._resourcesParsing.length === 0) {
	        _this3._onComplete();
	      }
	    }, true);
	  };

	  _createClass(Loader, [{
	    key: "concurrency",
	    get: function get() {
	      return this._queue.concurrency;
	    } 
	    ,
	    set: function set(concurrency) {
	      this._queue.concurrency = concurrency;
	    }
	  }]);

	  return Loader;
	}();
	


	Loader._defaultBeforeMiddleware = [];
	

	Loader._defaultAfterMiddleware = [];
	

	Loader.pre = function LoaderPreStatic(fn) {
	  Loader._defaultBeforeMiddleware.push(fn);

	  return Loader;
	};
	


	Loader.use = function LoaderUseStatic(fn) {
	  Loader._defaultAfterMiddleware.push(fn);

	  return Loader;
	};

	

	
	var LoaderResource = Resource$1;

	
	

	var extendStatics$3 = function(d, b) {
	    extendStatics$3 = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$3(d, b);
	};

	function __extends$3(d, b) {
	    extendStatics$3(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	
	var TextureLoader =  (function () {
	    function TextureLoader() {
	    }
	    
	    TextureLoader.use = function (resource, next) {
	        
	        if (resource.data && resource.type === Resource$1.TYPE.IMAGE) {
	            resource.texture = Texture.fromLoader(resource.data, resource.url, resource.name);
	        }
	        next();
	    };
	    return TextureLoader;
	}());

	
	var Loader$1 =  (function (_super) {
	    __extends$3(Loader, _super);
	    function Loader(baseUrl, concurrency) {
	        var _this = _super.call(this, baseUrl, concurrency) || this;
	        for (var i = 0; i < Loader._plugins.length; ++i) {
	            var plugin = Loader._plugins[i];
	            var pre = plugin.pre, use = plugin.use;
	            if (pre) {
	                _this.pre(pre);
	            }
	            if (use) {
	                _this.use(use);
	            }
	        }
	        
	        _this._protected = false;
	        return _this;
	    }
	    
	    Loader.prototype.destroy = function () {
	        if (!this._protected) {
	            this.reset();
	        }
	    };
	    Object.defineProperty(Loader, "shared", {
	        
	        get: function () {
	            var shared = Loader._shared;
	            if (!shared) {
	                shared = new Loader();
	                shared._protected = true;
	                Loader._shared = shared;
	            }
	            return shared;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    Loader.registerPlugin = function (plugin) {
	        Loader._plugins.push(plugin);
	        if (plugin.add) {
	            plugin.add();
	        }
	        return Loader;
	    };
	    
	    Loader._plugins = [];
	    return Loader;
	}(Loader));
	
	Loader$1.registerPlugin({ use: index$1.parsing });
	
	Loader$1.registerPlugin(TextureLoader);
	
	
	
	
	
	
	
	
	
	
	

	
	var AppLoaderPlugin =  (function () {
	    function AppLoaderPlugin() {
	    }
	    
	    AppLoaderPlugin.init = function (options) {
	        options = Object.assign({
	            sharedLoader: false,
	        }, options);
	        
	        this.loader = options.sharedLoader ? Loader$1.shared : new Loader$1();
	    };
	    
	    AppLoaderPlugin.destroy = function () {
	        if (this.loader) {
	            this.loader.destroy();
	            this.loader = null;
	        }
	    };
	    return AppLoaderPlugin;
	}());

	

	
	

	var extendStatics$4 = function(d, b) {
	    extendStatics$4 = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$4(d, b);
	};

	function __extends$4(d, b) {
	    extendStatics$4(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	
	var ParticleContainer =  (function (_super) {
	    __extends$4(ParticleContainer, _super);
	    
	    function ParticleContainer(maxSize, properties, batchSize, autoResize) {
	        if (maxSize === void 0) { maxSize = 1500; }
	        if (batchSize === void 0) { batchSize = 16384; }
	        if (autoResize === void 0) { autoResize = false; }
	        var _this = _super.call(this) || this;
	        
	        
	        
	        var maxBatchSize = 16384;
	        if (batchSize > maxBatchSize) {
	            batchSize = maxBatchSize;
	        }
	        
	        _this._properties = [false, true, false, false, false];
	        
	        _this._maxSize = maxSize;
	        
	        _this._batchSize = batchSize;
	        
	        _this._buffers = null;
	        
	        _this._bufferUpdateIDs = [];
	        
	        _this._updateID = 0;
	        
	        _this.interactiveChildren = false;
	        
	        _this.blendMode = exports.BLEND_MODES.NORMAL;
	        
	        _this.autoResize = autoResize;
	        
	        _this.roundPixels = true;
	        
	        _this.baseTexture = null;
	        _this.setProperties(properties);
	        
	        _this._tint = 0;
	        _this.tintRgb = new Float32Array(4);
	        _this.tint = 0xFFFFFF;
	        return _this;
	    }
	    
	    ParticleContainer.prototype.setProperties = function (properties) {
	        if (properties) {
	            this._properties[0] = 'vertices' in properties || 'scale' in properties
	                ? !!properties.vertices || !!properties.scale : this._properties[0];
	            this._properties[1] = 'position' in properties ? !!properties.position : this._properties[1];
	            this._properties[2] = 'rotation' in properties ? !!properties.rotation : this._properties[2];
	            this._properties[3] = 'uvs' in properties ? !!properties.uvs : this._properties[3];
	            this._properties[4] = 'tint' in properties || 'alpha' in properties
	                ? !!properties.tint || !!properties.alpha : this._properties[4];
	        }
	    };
	    
	    ParticleContainer.prototype.updateTransform = function () {
	        
	        this.displayObjectUpdateTransform();
	    };
	    Object.defineProperty(ParticleContainer.prototype, "tint", {
	        
	        get: function () {
	            return this._tint;
	        },
	        set: function (value) {
	            this._tint = value;
	            hex2rgb(value, this.tintRgb);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    ParticleContainer.prototype.render = function (renderer) {
	        var _this = this;
	        if (!this.visible || this.worldAlpha <= 0 || !this.children.length || !this.renderable) {
	            return;
	        }
	        if (!this.baseTexture) {
	            this.baseTexture = this.children[0]._texture.baseTexture;
	            if (!this.baseTexture.valid) {
	                this.baseTexture.once('update', function () { return _this.onChildrenChange(0); });
	            }
	        }
	        renderer.batch.setObjectRenderer(renderer.plugins.particle);
	        renderer.plugins.particle.render(this);
	    };
	    
	    ParticleContainer.prototype.onChildrenChange = function (smallestChildIndex) {
	        var bufferIndex = Math.floor(smallestChildIndex / this._batchSize);
	        while (this._bufferUpdateIDs.length < bufferIndex) {
	            this._bufferUpdateIDs.push(0);
	        }
	        this._bufferUpdateIDs[bufferIndex] = ++this._updateID;
	    };
	    ParticleContainer.prototype.dispose = function () {
	        if (this._buffers) {
	            for (var i = 0; i < this._buffers.length; ++i) {
	                this._buffers[i].destroy();
	            }
	            this._buffers = null;
	        }
	    };
	    
	    ParticleContainer.prototype.destroy = function (options) {
	        _super.prototype.destroy.call(this, options);
	        this.dispose();
	        this._properties = null;
	        this._buffers = null;
	        this._bufferUpdateIDs = null;
	    };
	    return ParticleContainer;
	}(Container));

	
	
	var ParticleBuffer =  (function () {
	    
	    function ParticleBuffer(properties, dynamicPropertyFlags, size) {
	        this.geometry = new Geometry();
	        this.indexBuffer = null;
	        
	        this.size = size;
	        
	        this.dynamicProperties = [];
	        
	        this.staticProperties = [];
	        for (var i = 0; i < properties.length; ++i) {
	            var property = properties[i];
	            
	            
	            property = {
	                attributeName: property.attributeName,
	                size: property.size,
	                uploadFunction: property.uploadFunction,
	                type: property.type || exports.TYPES.FLOAT,
	                offset: property.offset,
	            };
	            if (dynamicPropertyFlags[i]) {
	                this.dynamicProperties.push(property);
	            }
	            else {
	                this.staticProperties.push(property);
	            }
	        }
	        this.staticStride = 0;
	        this.staticBuffer = null;
	        this.staticData = null;
	        this.staticDataUint32 = null;
	        this.dynamicStride = 0;
	        this.dynamicBuffer = null;
	        this.dynamicData = null;
	        this.dynamicDataUint32 = null;
	        this._updateID = 0;
	        this.initBuffers();
	    }
	    
	    ParticleBuffer.prototype.initBuffers = function () {
	        var geometry = this.geometry;
	        var dynamicOffset = 0;
	        
	        this.indexBuffer = new Buffer(createIndicesForQuads(this.size), true, true);
	        geometry.addIndex(this.indexBuffer);
	        this.dynamicStride = 0;
	        for (var i = 0; i < this.dynamicProperties.length; ++i) {
	            var property = this.dynamicProperties[i];
	            property.offset = dynamicOffset;
	            dynamicOffset += property.size;
	            this.dynamicStride += property.size;
	        }
	        var dynBuffer = new ArrayBuffer(this.size * this.dynamicStride * 4 * 4);
	        this.dynamicData = new Float32Array(dynBuffer);
	        this.dynamicDataUint32 = new Uint32Array(dynBuffer);
	        this.dynamicBuffer = new Buffer(this.dynamicData, false, false);
	        
	        var staticOffset = 0;
	        this.staticStride = 0;
	        for (var i = 0; i < this.staticProperties.length; ++i) {
	            var property = this.staticProperties[i];
	            property.offset = staticOffset;
	            staticOffset += property.size;
	            this.staticStride += property.size;
	        }
	        var statBuffer = new ArrayBuffer(this.size * this.staticStride * 4 * 4);
	        this.staticData = new Float32Array(statBuffer);
	        this.staticDataUint32 = new Uint32Array(statBuffer);
	        this.staticBuffer = new Buffer(this.staticData, true, false);
	        for (var i = 0; i < this.dynamicProperties.length; ++i) {
	            var property = this.dynamicProperties[i];
	            geometry.addAttribute(property.attributeName, this.dynamicBuffer, 0, property.type === exports.TYPES.UNSIGNED_BYTE, property.type, this.dynamicStride * 4, property.offset * 4);
	        }
	        for (var i = 0; i < this.staticProperties.length; ++i) {
	            var property = this.staticProperties[i];
	            geometry.addAttribute(property.attributeName, this.staticBuffer, 0, property.type === exports.TYPES.UNSIGNED_BYTE, property.type, this.staticStride * 4, property.offset * 4);
	        }
	    };
	    
	    ParticleBuffer.prototype.uploadDynamic = function (children, startIndex, amount) {
	        for (var i = 0; i < this.dynamicProperties.length; i++) {
	            var property = this.dynamicProperties[i];
	            property.uploadFunction(children, startIndex, amount, property.type === exports.TYPES.UNSIGNED_BYTE ? this.dynamicDataUint32 : this.dynamicData, this.dynamicStride, property.offset);
	        }
	        this.dynamicBuffer._updateID++;
	    };
	    
	    ParticleBuffer.prototype.uploadStatic = function (children, startIndex, amount) {
	        for (var i = 0; i < this.staticProperties.length; i++) {
	            var property = this.staticProperties[i];
	            property.uploadFunction(children, startIndex, amount, property.type === exports.TYPES.UNSIGNED_BYTE ? this.staticDataUint32 : this.staticData, this.staticStride, property.offset);
	        }
	        this.staticBuffer._updateID++;
	    };
	    
	    ParticleBuffer.prototype.destroy = function () {
	        this.indexBuffer = null;
	        this.dynamicProperties = null;
	        this.dynamicBuffer = null;
	        this.dynamicData = null;
	        this.dynamicDataUint32 = null;
	        this.staticProperties = null;
	        this.staticBuffer = null;
	        this.staticData = null;
	        this.staticDataUint32 = null;
	        
	        this.geometry.destroy();
	    };
	    return ParticleBuffer;
	}());

	var fragment$1 = "varying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler;\n\nvoid main(void){\n    vec4 color = texture2D(uSampler, vTextureCoord) * vColor;\n    gl_FragColor = color;\n}";

	var vertex$1 = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\n\nattribute vec2 aPositionCoord;\nattribute float aRotation;\n\nuniform mat3 translationMatrix;\nuniform vec4 uColor;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nvoid main(void){\n    float x = (aVertexPosition.x) * cos(aRotation) - (aVertexPosition.y) * sin(aRotation);\n    float y = (aVertexPosition.x) * sin(aRotation) + (aVertexPosition.y) * cos(aRotation);\n\n    vec2 v = vec2(x, y);\n    v = v + aPositionCoord;\n\n    gl_Position = vec4((translationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = aTextureCoord;\n    vColor = aColor * uColor;\n}\n";

	
	
	var ParticleRenderer =  (function (_super) {
	    __extends$4(ParticleRenderer, _super);
	    
	    function ParticleRenderer(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        
	        
	        
	        
	        
	        
	        _this.shader = null;
	        _this.properties = null;
	        _this.tempMatrix = new Matrix();
	        _this.properties = [
	            
	            {
	                attributeName: 'aVertexPosition',
	                size: 2,
	                uploadFunction: _this.uploadVertices,
	                offset: 0,
	            },
	            
	            {
	                attributeName: 'aPositionCoord',
	                size: 2,
	                uploadFunction: _this.uploadPosition,
	                offset: 0,
	            },
	            
	            {
	                attributeName: 'aRotation',
	                size: 1,
	                uploadFunction: _this.uploadRotation,
	                offset: 0,
	            },
	            
	            {
	                attributeName: 'aTextureCoord',
	                size: 2,
	                uploadFunction: _this.uploadUvs,
	                offset: 0,
	            },
	            
	            {
	                attributeName: 'aColor',
	                size: 1,
	                type: exports.TYPES.UNSIGNED_BYTE,
	                uploadFunction: _this.uploadTint,
	                offset: 0,
	            } ];
	        _this.shader = Shader.from(vertex$1, fragment$1, {});
	        
	        _this.state = State.for2d();
	        return _this;
	    }
	    
	    ParticleRenderer.prototype.render = function (container) {
	        var children = container.children;
	        var maxSize = container._maxSize;
	        var batchSize = container._batchSize;
	        var renderer = this.renderer;
	        var totalChildren = children.length;
	        if (totalChildren === 0) {
	            return;
	        }
	        else if (totalChildren > maxSize && !container.autoResize) {
	            totalChildren = maxSize;
	        }
	        var buffers = container._buffers;
	        if (!buffers) {
	            buffers = container._buffers = this.generateBuffers(container);
	        }
	        var baseTexture = children[0]._texture.baseTexture;
	        
	        this.state.blendMode = correctBlendMode(container.blendMode, baseTexture.alphaMode);
	        renderer.state.set(this.state);
	        var gl = renderer.gl;
	        var m = container.worldTransform.copyTo(this.tempMatrix);
	        m.prepend(renderer.globalUniforms.uniforms.projectionMatrix);
	        this.shader.uniforms.translationMatrix = m.toArray(true);
	        this.shader.uniforms.uColor = premultiplyRgba(container.tintRgb, container.worldAlpha, this.shader.uniforms.uColor, baseTexture.alphaMode);
	        this.shader.uniforms.uSampler = baseTexture;
	        this.renderer.shader.bind(this.shader);
	        var updateStatic = false;
	        
	        for (var i = 0, j = 0; i < totalChildren; i += batchSize, j += 1) {
	            var amount = (totalChildren - i);
	            if (amount > batchSize) {
	                amount = batchSize;
	            }
	            if (j >= buffers.length) {
	                buffers.push(this._generateOneMoreBuffer(container));
	            }
	            var buffer = buffers[j];
	            
	            buffer.uploadDynamic(children, i, amount);
	            var bid = container._bufferUpdateIDs[j] || 0;
	            updateStatic = updateStatic || (buffer._updateID < bid);
	            
	            if (updateStatic) {
	                buffer._updateID = container._updateID;
	                buffer.uploadStatic(children, i, amount);
	            }
	            
	            renderer.geometry.bind(buffer.geometry);
	            gl.drawElements(gl.TRIANGLES, amount * 6, gl.UNSIGNED_SHORT, 0);
	        }
	    };
	    
	    ParticleRenderer.prototype.generateBuffers = function (container) {
	        var buffers = [];
	        var size = container._maxSize;
	        var batchSize = container._batchSize;
	        var dynamicPropertyFlags = container._properties;
	        for (var i = 0; i < size; i += batchSize) {
	            buffers.push(new ParticleBuffer(this.properties, dynamicPropertyFlags, batchSize));
	        }
	        return buffers;
	    };
	    
	    ParticleRenderer.prototype._generateOneMoreBuffer = function (container) {
	        var batchSize = container._batchSize;
	        var dynamicPropertyFlags = container._properties;
	        return new ParticleBuffer(this.properties, dynamicPropertyFlags, batchSize);
	    };
	    
	    ParticleRenderer.prototype.uploadVertices = function (children, startIndex, amount, array, stride, offset) {
	        var w0 = 0;
	        var w1 = 0;
	        var h0 = 0;
	        var h1 = 0;
	        for (var i = 0; i < amount; ++i) {
	            var sprite = children[startIndex + i];
	            var texture = sprite._texture;
	            var sx = sprite.scale.x;
	            var sy = sprite.scale.y;
	            var trim = texture.trim;
	            var orig = texture.orig;
	            if (trim) {
	                
	                
	                w1 = trim.x - (sprite.anchor.x * orig.width);
	                w0 = w1 + trim.width;
	                h1 = trim.y - (sprite.anchor.y * orig.height);
	                h0 = h1 + trim.height;
	            }
	            else {
	                w0 = (orig.width) * (1 - sprite.anchor.x);
	                w1 = (orig.width) * -sprite.anchor.x;
	                h0 = orig.height * (1 - sprite.anchor.y);
	                h1 = orig.height * -sprite.anchor.y;
	            }
	            array[offset] = w1 * sx;
	            array[offset + 1] = h1 * sy;
	            array[offset + stride] = w0 * sx;
	            array[offset + stride + 1] = h1 * sy;
	            array[offset + (stride * 2)] = w0 * sx;
	            array[offset + (stride * 2) + 1] = h0 * sy;
	            array[offset + (stride * 3)] = w1 * sx;
	            array[offset + (stride * 3) + 1] = h0 * sy;
	            offset += stride * 4;
	        }
	    };
	    
	    ParticleRenderer.prototype.uploadPosition = function (children, startIndex, amount, array, stride, offset) {
	        for (var i = 0; i < amount; i++) {
	            var spritePosition = children[startIndex + i].position;
	            array[offset] = spritePosition.x;
	            array[offset + 1] = spritePosition.y;
	            array[offset + stride] = spritePosition.x;
	            array[offset + stride + 1] = spritePosition.y;
	            array[offset + (stride * 2)] = spritePosition.x;
	            array[offset + (stride * 2) + 1] = spritePosition.y;
	            array[offset + (stride * 3)] = spritePosition.x;
	            array[offset + (stride * 3) + 1] = spritePosition.y;
	            offset += stride * 4;
	        }
	    };
	    
	    ParticleRenderer.prototype.uploadRotation = function (children, startIndex, amount, array, stride, offset) {
	        for (var i = 0; i < amount; i++) {
	            var spriteRotation = children[startIndex + i].rotation;
	            array[offset] = spriteRotation;
	            array[offset + stride] = spriteRotation;
	            array[offset + (stride * 2)] = spriteRotation;
	            array[offset + (stride * 3)] = spriteRotation;
	            offset += stride * 4;
	        }
	    };
	    
	    ParticleRenderer.prototype.uploadUvs = function (children, startIndex, amount, array, stride, offset) {
	        for (var i = 0; i < amount; ++i) {
	            var textureUvs = children[startIndex + i]._texture._uvs;
	            if (textureUvs) {
	                array[offset] = textureUvs.x0;
	                array[offset + 1] = textureUvs.y0;
	                array[offset + stride] = textureUvs.x1;
	                array[offset + stride + 1] = textureUvs.y1;
	                array[offset + (stride * 2)] = textureUvs.x2;
	                array[offset + (stride * 2) + 1] = textureUvs.y2;
	                array[offset + (stride * 3)] = textureUvs.x3;
	                array[offset + (stride * 3) + 1] = textureUvs.y3;
	                offset += stride * 4;
	            }
	            else {
	                
	                array[offset] = 0;
	                array[offset + 1] = 0;
	                array[offset + stride] = 0;
	                array[offset + stride + 1] = 0;
	                array[offset + (stride * 2)] = 0;
	                array[offset + (stride * 2) + 1] = 0;
	                array[offset + (stride * 3)] = 0;
	                array[offset + (stride * 3) + 1] = 0;
	                offset += stride * 4;
	            }
	        }
	    };
	    
	    ParticleRenderer.prototype.uploadTint = function (children, startIndex, amount, array, stride, offset) {
	        for (var i = 0; i < amount; ++i) {
	            var sprite = children[startIndex + i];
	            var premultiplied = sprite._texture.baseTexture.alphaMode > 0;
	            var alpha = sprite.alpha;
	            
	            var argb = alpha < 1.0 && premultiplied
	                ? premultiplyTint(sprite._tintRGB, alpha) : sprite._tintRGB + (alpha * 255 << 24);
	            array[offset] = argb;
	            array[offset + stride] = argb;
	            array[offset + (stride * 2)] = argb;
	            array[offset + (stride * 3)] = argb;
	            offset += stride * 4;
	        }
	    };
	    
	    ParticleRenderer.prototype.destroy = function () {
	        _super.prototype.destroy.call(this);
	        if (this.shader) {
	            this.shader.destroy();
	            this.shader = null;
	        }
	        this.tempMatrix = null;
	    };
	    return ParticleRenderer;
	}(ObjectRenderer));

	

	

	(function (LINE_JOIN) {
	    LINE_JOIN["MITER"] = "miter";
	    LINE_JOIN["BEVEL"] = "bevel";
	    LINE_JOIN["ROUND"] = "round";
	})(exports.LINE_JOIN || (exports.LINE_JOIN = {}));
	

	(function (LINE_CAP) {
	    LINE_CAP["BUTT"] = "butt";
	    LINE_CAP["ROUND"] = "round";
	    LINE_CAP["SQUARE"] = "square";
	})(exports.LINE_CAP || (exports.LINE_CAP = {}));
	
	var GRAPHICS_CURVES = {
	    adaptive: true,
	    maxLength: 10,
	    minSegments: 8,
	    maxSegments: 2048,
	    epsilon: 0.0001,
	    _segmentsCount: function (length, defaultSegments) {
	        if (defaultSegments === void 0) { defaultSegments = 20; }
	        if (!this.adaptive || !length || isNaN(length)) {
	            return defaultSegments;
	        }
	        var result = Math.ceil(length / this.maxLength);
	        if (result < this.minSegments) {
	            result = this.minSegments;
	        }
	        else if (result > this.maxSegments) {
	            result = this.maxSegments;
	        }
	        return result;
	    },
	};

	
	var FillStyle =  (function () {
	    function FillStyle() {
	        
	        this.color = 0xFFFFFF;
	        
	        this.alpha = 1.0;
	        
	        this.texture = Texture.WHITE;
	        
	        this.matrix = null;
	        
	        this.visible = false;
	        this.reset();
	    }
	    
	    FillStyle.prototype.clone = function () {
	        var obj = new FillStyle();
	        obj.color = this.color;
	        obj.alpha = this.alpha;
	        obj.texture = this.texture;
	        obj.matrix = this.matrix;
	        obj.visible = this.visible;
	        return obj;
	    };
	    
	    FillStyle.prototype.reset = function () {
	        this.color = 0xFFFFFF;
	        this.alpha = 1;
	        this.texture = Texture.WHITE;
	        this.matrix = null;
	        this.visible = false;
	    };
	    
	    FillStyle.prototype.destroy = function () {
	        this.texture = null;
	        this.matrix = null;
	    };
	    return FillStyle;
	}());

	
	

	var extendStatics$5 = function(d, b) {
	    extendStatics$5 = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$5(d, b);
	};

	function __extends$5(d, b) {
	    extendStatics$5(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	
	var buildPoly = {
	    build: function (graphicsData) {
	        graphicsData.points = graphicsData.shape.points.slice();
	    },
	    triangulate: function (graphicsData, graphicsGeometry) {
	        var points = graphicsData.points;
	        var holes = graphicsData.holes;
	        var verts = graphicsGeometry.points;
	        var indices = graphicsGeometry.indices;
	        if (points.length >= 6) {
	            var holeArray = [];
	            
	            for (var i = 0; i < holes.length; i++) {
	                var hole = holes[i];
	                holeArray.push(points.length / 2);
	                points = points.concat(hole.points);
	            }
	            
	            var triangles = earcut_1(points, holeArray, 2);
	            if (!triangles) {
	                return;
	            }
	            var vertPos = verts.length / 2;
	            for (var i = 0; i < triangles.length; i += 3) {
	                indices.push(triangles[i] + vertPos);
	                indices.push(triangles[i + 1] + vertPos);
	                indices.push(triangles[i + 2] + vertPos);
	            }
	            for (var i = 0; i < points.length; i++) {
	                verts.push(points[i]);
	            }
	        }
	    },
	};

	
	
	var buildCircle = {
	    build: function (graphicsData) {
	        
	        var circleData = graphicsData.shape;
	        var points = graphicsData.points;
	        var x = circleData.x;
	        var y = circleData.y;
	        var width;
	        var height;
	        points.length = 0;
	        
	        if (graphicsData.type === exports.SHAPES.CIRC) {
	            width = circleData.radius;
	            height = circleData.radius;
	        }
	        else {
	            var ellipseData = graphicsData.shape;
	            width = ellipseData.width;
	            height = ellipseData.height;
	        }
	        if (width === 0 || height === 0) {
	            return;
	        }
	        var totalSegs = Math.floor(30 * Math.sqrt(circleData.radius))
	            || Math.floor(15 * Math.sqrt(width + height));
	        totalSegs /= 2.3;
	        var seg = (Math.PI * 2) / totalSegs;
	        for (var i = 0; i < totalSegs - 0.5; i++) {
	            points.push(x + (Math.sin(-seg * i) * width), y + (Math.cos(-seg * i) * height));
	        }
	        points.push(points[0], points[1]);
	    },
	    triangulate: function (graphicsData, graphicsGeometry) {
	        var points = graphicsData.points;
	        var verts = graphicsGeometry.points;
	        var indices = graphicsGeometry.indices;
	        var vertPos = verts.length / 2;
	        var center = vertPos;
	        var circle = (graphicsData.shape);
	        var matrix = graphicsData.matrix;
	        var x = circle.x;
	        var y = circle.y;
	        
	        verts.push(graphicsData.matrix ? (matrix.a * x) + (matrix.c * y) + matrix.tx : x, graphicsData.matrix ? (matrix.b * x) + (matrix.d * y) + matrix.ty : y);
	        for (var i = 0; i < points.length; i += 2) {
	            verts.push(points[i], points[i + 1]);
	            
	            indices.push(vertPos++, center, vertPos);
	        }
	    },
	};

	
	var buildRectangle = {
	    build: function (graphicsData) {
	        
	        
	        
	        var rectData = graphicsData.shape;
	        var x = rectData.x;
	        var y = rectData.y;
	        var width = rectData.width;
	        var height = rectData.height;
	        var points = graphicsData.points;
	        points.length = 0;
	        points.push(x, y, x + width, y, x + width, y + height, x, y + height);
	    },
	    triangulate: function (graphicsData, graphicsGeometry) {
	        var points = graphicsData.points;
	        var verts = graphicsGeometry.points;
	        var vertPos = verts.length / 2;
	        verts.push(points[0], points[1], points[2], points[3], points[6], points[7], points[4], points[5]);
	        graphicsGeometry.indices.push(vertPos, vertPos + 1, vertPos + 2, vertPos + 1, vertPos + 2, vertPos + 3);
	    },
	};

	
	function getPt(n1, n2, perc) {
	    var diff = n2 - n1;
	    return n1 + (diff * perc);
	}
	
	function quadraticBezierCurve(fromX, fromY, cpX, cpY, toX, toY, out) {
	    if (out === void 0) { out = []; }
	    var n = 20;
	    var points = out;
	    var xa = 0;
	    var ya = 0;
	    var xb = 0;
	    var yb = 0;
	    var x = 0;
	    var y = 0;
	    for (var i = 0, j = 0; i <= n; ++i) {
	        j = i / n;
	        
	        xa = getPt(fromX, cpX, j);
	        ya = getPt(fromY, cpY, j);
	        xb = getPt(cpX, toX, j);
	        yb = getPt(cpY, toY, j);
	        
	        x = getPt(xa, xb, j);
	        y = getPt(ya, yb, j);
	        points.push(x, y);
	    }
	    return points;
	}
	
	var buildRoundedRectangle = {
	    build: function (graphicsData) {
	        var rrectData = graphicsData.shape;
	        var points = graphicsData.points;
	        var x = rrectData.x;
	        var y = rrectData.y;
	        var width = rrectData.width;
	        var height = rrectData.height;
	        
	        var radius = Math.max(0, Math.min(rrectData.radius, Math.min(width, height) / 2));
	        points.length = 0;
	        
	        if (!radius) {
	            points.push(x, y, x + width, y, x + width, y + height, x, y + height);
	        }
	        else {
	            quadraticBezierCurve(x, y + radius, x, y, x + radius, y, points);
	            quadraticBezierCurve(x + width - radius, y, x + width, y, x + width, y + radius, points);
	            quadraticBezierCurve(x + width, y + height - radius, x + width, y + height, x + width - radius, y + height, points);
	            quadraticBezierCurve(x + radius, y + height, x, y + height, x, y + height - radius, points);
	        }
	        
	        
	    },
	    triangulate: function (graphicsData, graphicsGeometry) {
	        var points = graphicsData.points;
	        var verts = graphicsGeometry.points;
	        var indices = graphicsGeometry.indices;
	        var vecPos = verts.length / 2;
	        var triangles = earcut_1(points, null, 2);
	        for (var i = 0, j = triangles.length; i < j; i += 3) {
	            indices.push(triangles[i] + vecPos);
	            
	            indices.push(triangles[i + 1] + vecPos);
	            
	            indices.push(triangles[i + 2] + vecPos);
	        }
	        for (var i = 0, j = points.length; i < j; i++) {
	            verts.push(points[i], points[++i]);
	        }
	    },
	};

	
	function square(x, y, nx, ny, innerWeight, outerWeight, clockwise,  verts) {
	    var ix = x - (nx * innerWeight);
	    var iy = y - (ny * innerWeight);
	    var ox = x + (nx * outerWeight);
	    var oy = y + (ny * outerWeight);
	    
	    var exx;
	    var eyy;
	    if (clockwise) {
	        exx = ny;
	        eyy = -nx;
	    }
	    else {
	        exx = -ny;
	        eyy = nx;
	    }
	    
	    var eix = ix + exx;
	    var eiy = iy + eyy;
	    var eox = ox + exx;
	    var eoy = oy + eyy;
	    
	    verts.push(eix, eiy);
	    verts.push(eox, eoy);
	    return 2;
	}
	
	function round(cx, cy, sx, sy, ex, ey, verts, clockwise) {
	    var cx2p0x = sx - cx;
	    var cy2p0y = sy - cy;
	    var angle0 = Math.atan2(cx2p0x, cy2p0y);
	    var angle1 = Math.atan2(ex - cx, ey - cy);
	    if (clockwise && angle0 < angle1) {
	        angle0 += Math.PI * 2;
	    }
	    else if (!clockwise && angle0 > angle1) {
	        angle1 += Math.PI * 2;
	    }
	    var startAngle = angle0;
	    var angleDiff = angle1 - angle0;
	    var absAngleDiff = Math.abs(angleDiff);
	    
	    var radius = Math.sqrt((cx2p0x * cx2p0x) + (cy2p0y * cy2p0y));
	    var segCount = ((15 * absAngleDiff * Math.sqrt(radius) / Math.PI) >> 0) + 1;
	    var angleInc = angleDiff / segCount;
	    startAngle += angleInc;
	    if (clockwise) {
	        verts.push(cx, cy);
	        verts.push(sx, sy);
	        for (var i = 1, angle = startAngle; i < segCount; i++, angle += angleInc) {
	            verts.push(cx, cy);
	            verts.push(cx + ((Math.sin(angle) * radius)), cy + ((Math.cos(angle) * radius)));
	        }
	        verts.push(cx, cy);
	        verts.push(ex, ey);
	    }
	    else {
	        verts.push(sx, sy);
	        verts.push(cx, cy);
	        for (var i = 1, angle = startAngle; i < segCount; i++, angle += angleInc) {
	            verts.push(cx + ((Math.sin(angle) * radius)), cy + ((Math.cos(angle) * radius)));
	            verts.push(cx, cy);
	        }
	        verts.push(ex, ey);
	        verts.push(cx, cy);
	    }
	    return segCount * 2;
	}
	
	function buildNonNativeLine(graphicsData, graphicsGeometry) {
	    var shape = graphicsData.shape;
	    var points = graphicsData.points || shape.points.slice();
	    var eps = graphicsGeometry.closePointEps;
	    if (points.length === 0) {
	        return;
	    }
	    
	    
	    
	    
	    
	    
	    
	    
	    
	    var style = graphicsData.lineStyle;
	    
	    var firstPoint = new Point(points[0], points[1]);
	    var lastPoint = new Point(points[points.length - 2], points[points.length - 1]);
	    var closedShape = shape.type !== exports.SHAPES.POLY || shape.closeStroke;
	    var closedPath = Math.abs(firstPoint.x - lastPoint.x) < eps
	        && Math.abs(firstPoint.y - lastPoint.y) < eps;
	    
	    if (closedShape) {
	        
	        points = points.slice();
	        if (closedPath) {
	            points.pop();
	            points.pop();
	            lastPoint.set(points[points.length - 2], points[points.length - 1]);
	        }
	        var midPointX = (firstPoint.x + lastPoint.x) * 0.5;
	        var midPointY = (lastPoint.y + firstPoint.y) * 0.5;
	        points.unshift(midPointX, midPointY);
	        points.push(midPointX, midPointY);
	    }
	    var verts = graphicsGeometry.points;
	    var length = points.length / 2;
	    var indexCount = points.length;
	    var indexStart = verts.length / 2;
	    
	    var width = style.width / 2;
	    var widthSquared = width * width;
	    var miterLimitSquared = style.miterLimit * style.miterLimit;
	    
	    var x0 = points[0];
	    var y0 = points[1];
	    var x1 = points[2];
	    var y1 = points[3];
	    var x2 = 0;
	    var y2 = 0;
	    
	    var perpx = -(y0 - y1);
	    var perpy = x0 - x1;
	    var perp1x = 0;
	    var perp1y = 0;
	    var dist = Math.sqrt((perpx * perpx) + (perpy * perpy));
	    perpx /= dist;
	    perpy /= dist;
	    perpx *= width;
	    perpy *= width;
	    var ratio = style.alignment; 
	    var innerWeight = (1 - ratio) * 2;
	    var outerWeight = ratio * 2;
	    if (!closedShape) {
	        if (style.cap === exports.LINE_CAP.ROUND) {
	            indexCount += round(x0 - (perpx * (innerWeight - outerWeight) * 0.5), y0 - (perpy * (innerWeight - outerWeight) * 0.5), x0 - (perpx * innerWeight), y0 - (perpy * innerWeight), x0 + (perpx * outerWeight), y0 + (perpy * outerWeight), verts, true) + 2;
	        }
	        else if (style.cap === exports.LINE_CAP.SQUARE) {
	            indexCount += square(x0, y0, perpx, perpy, innerWeight, outerWeight, true, verts);
	        }
	    }
	    
	    verts.push(x0 - (perpx * innerWeight), y0 - (perpy * innerWeight));
	    verts.push(x0 + (perpx * outerWeight), y0 + (perpy * outerWeight));
	    for (var i = 1; i < length - 1; ++i) {
	        x0 = points[(i - 1) * 2];
	        y0 = points[((i - 1) * 2) + 1];
	        x1 = points[i * 2];
	        y1 = points[(i * 2) + 1];
	        x2 = points[(i + 1) * 2];
	        y2 = points[((i + 1) * 2) + 1];
	        perpx = -(y0 - y1);
	        perpy = x0 - x1;
	        dist = Math.sqrt((perpx * perpx) + (perpy * perpy));
	        perpx /= dist;
	        perpy /= dist;
	        perpx *= width;
	        perpy *= width;
	        perp1x = -(y1 - y2);
	        perp1y = x1 - x2;
	        dist = Math.sqrt((perp1x * perp1x) + (perp1y * perp1y));
	        perp1x /= dist;
	        perp1y /= dist;
	        perp1x *= width;
	        perp1y *= width;
	        
	        var dx0 = x1 - x0;
	        var dy0 = y0 - y1;
	        var dx1 = x1 - x2;
	        var dy1 = y2 - y1;
	        
	        var cross = (dy0 * dx1) - (dy1 * dx0);
	        var clockwise = (cross < 0);
	        
	        if (Math.abs(cross) < 0.1) {
	            verts.push(x1 - (perpx * innerWeight), y1 - (perpy * innerWeight));
	            verts.push(x1 + (perpx * outerWeight), y1 + (perpy * outerWeight));
	            continue;
	        }
	        
	        var c1 = ((-perpx + x0) * (-perpy + y1)) - ((-perpx + x1) * (-perpy + y0));
	        var c2 = ((-perp1x + x2) * (-perp1y + y1)) - ((-perp1x + x1) * (-perp1y + y2));
	        var px = ((dx0 * c2) - (dx1 * c1)) / cross;
	        var py = ((dy1 * c1) - (dy0 * c2)) / cross;
	        var pdist = ((px - x1) * (px - x1)) + ((py - y1) * (py - y1));
	        
	        var imx = x1 + ((px - x1) * innerWeight);
	        var imy = y1 + ((py - y1) * innerWeight);
	        
	        var omx = x1 - ((px - x1) * outerWeight);
	        var omy = y1 - ((py - y1) * outerWeight);
	        
	        var smallerInsideSegmentSq = Math.min((dx0 * dx0) + (dy0 * dy0), (dx1 * dx1) + (dy1 * dy1));
	        var insideWeight = clockwise ? innerWeight : outerWeight;
	        var smallerInsideDiagonalSq = smallerInsideSegmentSq + (insideWeight * insideWeight * widthSquared);
	        var insideMiterOk = pdist <= smallerInsideDiagonalSq;
	        if (insideMiterOk) {
	            if (style.join === exports.LINE_JOIN.BEVEL || pdist / widthSquared > miterLimitSquared) {
	                if (clockwise)  {
	                    verts.push(imx, imy); 
	                    verts.push(x1 + (perpx * outerWeight), y1 + (perpy * outerWeight)); 
	                    verts.push(imx, imy); 
	                    verts.push(x1 + (perp1x * outerWeight), y1 + (perp1y * outerWeight)); 
	                }
	                else  {
	                    verts.push(x1 - (perpx * innerWeight), y1 - (perpy * innerWeight)); 
	                    verts.push(omx, omy); 
	                    verts.push(x1 - (perp1x * innerWeight), y1 - (perp1y * innerWeight)); 
	                    verts.push(omx, omy); 
	                }
	                indexCount += 2;
	            }
	            else if (style.join === exports.LINE_JOIN.ROUND) {
	                if (clockwise)  {
	                    verts.push(imx, imy);
	                    verts.push(x1 + (perpx * outerWeight), y1 + (perpy * outerWeight));
	                    indexCount += round(x1, y1, x1 + (perpx * outerWeight), y1 + (perpy * outerWeight), x1 + (perp1x * outerWeight), y1 + (perp1y * outerWeight), verts, true) + 4;
	                    verts.push(imx, imy);
	                    verts.push(x1 + (perp1x * outerWeight), y1 + (perp1y * outerWeight));
	                }
	                else  {
	                    verts.push(x1 - (perpx * innerWeight), y1 - (perpy * innerWeight));
	                    verts.push(omx, omy);
	                    indexCount += round(x1, y1, x1 - (perpx * innerWeight), y1 - (perpy * innerWeight), x1 - (perp1x * innerWeight), y1 - (perp1y * innerWeight), verts, false) + 4;
	                    verts.push(x1 - (perp1x * innerWeight), y1 - (perp1y * innerWeight));
	                    verts.push(omx, omy);
	                }
	            }
	            else {
	                verts.push(imx, imy);
	                verts.push(omx, omy);
	            }
	        }
	        else 
	         {
	            verts.push(x1 - (perpx * innerWeight), y1 - (perpy * innerWeight)); 
	            verts.push(x1 + (perpx * outerWeight), y1 + (perpy * outerWeight)); 
	            if (style.join === exports.LINE_JOIN.BEVEL || pdist / widthSquared > miterLimitSquared) { ; }
	            else if (style.join === exports.LINE_JOIN.ROUND) {
	                if (clockwise)  {
	                    indexCount += round(x1, y1, x1 + (perpx * outerWeight), y1 + (perpy * outerWeight), x1 + (perp1x * outerWeight), y1 + (perp1y * outerWeight), verts, true) + 2;
	                }
	                else  {
	                    indexCount += round(x1, y1, x1 - (perpx * innerWeight), y1 - (perpy * innerWeight), x1 - (perp1x * innerWeight), y1 - (perp1y * innerWeight), verts, false) + 2;
	                }
	            }
	            else {
	                if (clockwise) {
	                    verts.push(omx, omy); 
	                    verts.push(omx, omy); 
	                }
	                else {
	                    verts.push(imx, imy); 
	                    verts.push(imx, imy); 
	                }
	                indexCount += 2;
	            }
	            verts.push(x1 - (perp1x * innerWeight), y1 - (perp1y * innerWeight)); 
	            verts.push(x1 + (perp1x * outerWeight), y1 + (perp1y * outerWeight)); 
	            indexCount += 2;
	        }
	    }
	    x0 = points[(length - 2) * 2];
	    y0 = points[((length - 2) * 2) + 1];
	    x1 = points[(length - 1) * 2];
	    y1 = points[((length - 1) * 2) + 1];
	    perpx = -(y0 - y1);
	    perpy = x0 - x1;
	    dist = Math.sqrt((perpx * perpx) + (perpy * perpy));
	    perpx /= dist;
	    perpy /= dist;
	    perpx *= width;
	    perpy *= width;
	    verts.push(x1 - (perpx * innerWeight), y1 - (perpy * innerWeight));
	    verts.push(x1 + (perpx * outerWeight), y1 + (perpy * outerWeight));
	    if (!closedShape) {
	        if (style.cap === exports.LINE_CAP.ROUND) {
	            indexCount += round(x1 - (perpx * (innerWeight - outerWeight) * 0.5), y1 - (perpy * (innerWeight - outerWeight) * 0.5), x1 - (perpx * innerWeight), y1 - (perpy * innerWeight), x1 + (perpx * outerWeight), y1 + (perpy * outerWeight), verts, false) + 2;
	        }
	        else if (style.cap === exports.LINE_CAP.SQUARE) {
	            indexCount += square(x1, y1, perpx, perpy, innerWeight, outerWeight, false, verts);
	        }
	    }
	    var indices = graphicsGeometry.indices;
	    var eps2 = GRAPHICS_CURVES.epsilon * GRAPHICS_CURVES.epsilon;
	    
	    for (var i = indexStart; i < indexCount + indexStart - 2; ++i) {
	        x0 = verts[(i * 2)];
	        y0 = verts[(i * 2) + 1];
	        x1 = verts[(i + 1) * 2];
	        y1 = verts[((i + 1) * 2) + 1];
	        x2 = verts[(i + 2) * 2];
	        y2 = verts[((i + 2) * 2) + 1];
	        
	        if (Math.abs((x0 * (y1 - y2)) + (x1 * (y2 - y0)) + (x2 * (y0 - y1))) < eps2) {
	            continue;
	        }
	        indices.push(i, i + 1, i + 2);
	    }
	}
	
	function buildNativeLine(graphicsData, graphicsGeometry) {
	    var i = 0;
	    var shape = graphicsData.shape;
	    var points = graphicsData.points || shape.points;
	    var closedShape = shape.type !== exports.SHAPES.POLY || shape.closeStroke;
	    if (points.length === 0)
	        { return; }
	    var verts = graphicsGeometry.points;
	    var indices = graphicsGeometry.indices;
	    var length = points.length / 2;
	    var startIndex = verts.length / 2;
	    var currentIndex = startIndex;
	    verts.push(points[0], points[1]);
	    for (i = 1; i < length; i++) {
	        verts.push(points[i * 2], points[(i * 2) + 1]);
	        indices.push(currentIndex, currentIndex + 1);
	        currentIndex++;
	    }
	    if (closedShape) {
	        indices.push(currentIndex, startIndex);
	    }
	}
	
	function buildLine(graphicsData, graphicsGeometry) {
	    if (graphicsData.lineStyle.native) {
	        buildNativeLine(graphicsData, graphicsGeometry);
	    }
	    else {
	        buildNonNativeLine(graphicsData, graphicsGeometry);
	    }
	}

	
	var Star =  (function (_super) {
	    __extends$5(Star, _super);
	    function Star(x, y, points, radius, innerRadius, rotation) {
	        if (rotation === void 0) { rotation = 0; }
	        var _this = this;
	        innerRadius = innerRadius || radius / 2;
	        var startAngle = (-1 * Math.PI / 2) + rotation;
	        var len = points * 2;
	        var delta = PI_2 / len;
	        var polygon = [];
	        for (var i = 0; i < len; i++) {
	            var r = i % 2 ? innerRadius : radius;
	            var angle = (i * delta) + startAngle;
	            polygon.push(x + (r * Math.cos(angle)), y + (r * Math.sin(angle)));
	        }
	        _this = _super.call(this, polygon) || this;
	        return _this;
	    }
	    return Star;
	}(Polygon));

	
	var ArcUtils =  (function () {
	    function ArcUtils() {
	    }
	    
	    ArcUtils.curveTo = function (x1, y1, x2, y2, radius, points) {
	        var fromX = points[points.length - 2];
	        var fromY = points[points.length - 1];
	        var a1 = fromY - y1;
	        var b1 = fromX - x1;
	        var a2 = y2 - y1;
	        var b2 = x2 - x1;
	        var mm = Math.abs((a1 * b2) - (b1 * a2));
	        if (mm < 1.0e-8 || radius === 0) {
	            if (points[points.length - 2] !== x1 || points[points.length - 1] !== y1) {
	                points.push(x1, y1);
	            }
	            return null;
	        }
	        var dd = (a1 * a1) + (b1 * b1);
	        var cc = (a2 * a2) + (b2 * b2);
	        var tt = (a1 * a2) + (b1 * b2);
	        var k1 = radius * Math.sqrt(dd) / mm;
	        var k2 = radius * Math.sqrt(cc) / mm;
	        var j1 = k1 * tt / dd;
	        var j2 = k2 * tt / cc;
	        var cx = (k1 * b2) + (k2 * b1);
	        var cy = (k1 * a2) + (k2 * a1);
	        var px = b1 * (k2 + j1);
	        var py = a1 * (k2 + j1);
	        var qx = b2 * (k1 + j2);
	        var qy = a2 * (k1 + j2);
	        var startAngle = Math.atan2(py - cy, px - cx);
	        var endAngle = Math.atan2(qy - cy, qx - cx);
	        return {
	            cx: (cx + x1),
	            cy: (cy + y1),
	            radius: radius,
	            startAngle: startAngle,
	            endAngle: endAngle,
	            anticlockwise: (b1 * a2 > b2 * a1),
	        };
	    };
	    
	    
	    ArcUtils.arc = function (_startX, _startY, cx, cy, radius, startAngle, endAngle, _anticlockwise, points) {
	        var sweep = endAngle - startAngle;
	        var n = GRAPHICS_CURVES._segmentsCount(Math.abs(sweep) * radius, Math.ceil(Math.abs(sweep) / PI_2) * 40);
	        var theta = (sweep) / (n * 2);
	        var theta2 = theta * 2;
	        var cTheta = Math.cos(theta);
	        var sTheta = Math.sin(theta);
	        var segMinus = n - 1;
	        var remainder = (segMinus % 1) / segMinus;
	        for (var i = 0; i <= segMinus; ++i) {
	            var real = i + (remainder * i);
	            var angle = ((theta) + startAngle + (theta2 * real));
	            var c = Math.cos(angle);
	            var s = -Math.sin(angle);
	            points.push((((cTheta * c) + (sTheta * s)) * radius) + cx, (((cTheta * -s) + (sTheta * c)) * radius) + cy);
	        }
	    };
	    return ArcUtils;
	}());

	
	var BezierUtils =  (function () {
	    function BezierUtils() {
	    }
	    
	    BezierUtils.curveLength = function (fromX, fromY, cpX, cpY, cpX2, cpY2, toX, toY) {
	        var n = 10;
	        var result = 0.0;
	        var t = 0.0;
	        var t2 = 0.0;
	        var t3 = 0.0;
	        var nt = 0.0;
	        var nt2 = 0.0;
	        var nt3 = 0.0;
	        var x = 0.0;
	        var y = 0.0;
	        var dx = 0.0;
	        var dy = 0.0;
	        var prevX = fromX;
	        var prevY = fromY;
	        for (var i = 1; i <= n; ++i) {
	            t = i / n;
	            t2 = t * t;
	            t3 = t2 * t;
	            nt = (1.0 - t);
	            nt2 = nt * nt;
	            nt3 = nt2 * nt;
	            x = (nt3 * fromX) + (3.0 * nt2 * t * cpX) + (3.0 * nt * t2 * cpX2) + (t3 * toX);
	            y = (nt3 * fromY) + (3.0 * nt2 * t * cpY) + (3 * nt * t2 * cpY2) + (t3 * toY);
	            dx = prevX - x;
	            dy = prevY - y;
	            prevX = x;
	            prevY = y;
	            result += Math.sqrt((dx * dx) + (dy * dy));
	        }
	        return result;
	    };
	    
	    BezierUtils.curveTo = function (cpX, cpY, cpX2, cpY2, toX, toY, points) {
	        var fromX = points[points.length - 2];
	        var fromY = points[points.length - 1];
	        points.length -= 2;
	        var n = GRAPHICS_CURVES._segmentsCount(BezierUtils.curveLength(fromX, fromY, cpX, cpY, cpX2, cpY2, toX, toY));
	        var dt = 0;
	        var dt2 = 0;
	        var dt3 = 0;
	        var t2 = 0;
	        var t3 = 0;
	        points.push(fromX, fromY);
	        for (var i = 1, j = 0; i <= n; ++i) {
	            j = i / n;
	            dt = (1 - j);
	            dt2 = dt * dt;
	            dt3 = dt2 * dt;
	            t2 = j * j;
	            t3 = t2 * j;
	            points.push((dt3 * fromX) + (3 * dt2 * j * cpX) + (3 * dt * t2 * cpX2) + (t3 * toX), (dt3 * fromY) + (3 * dt2 * j * cpY) + (3 * dt * t2 * cpY2) + (t3 * toY));
	        }
	    };
	    return BezierUtils;
	}());

	
	var QuadraticUtils =  (function () {
	    function QuadraticUtils() {
	    }
	    
	    QuadraticUtils.curveLength = function (fromX, fromY, cpX, cpY, toX, toY) {
	        var ax = fromX - (2.0 * cpX) + toX;
	        var ay = fromY - (2.0 * cpY) + toY;
	        var bx = (2.0 * cpX) - (2.0 * fromX);
	        var by = (2.0 * cpY) - (2.0 * fromY);
	        var a = 4.0 * ((ax * ax) + (ay * ay));
	        var b = 4.0 * ((ax * bx) + (ay * by));
	        var c = (bx * bx) + (by * by);
	        var s = 2.0 * Math.sqrt(a + b + c);
	        var a2 = Math.sqrt(a);
	        var a32 = 2.0 * a * a2;
	        var c2 = 2.0 * Math.sqrt(c);
	        var ba = b / a2;
	        return ((a32 * s)
	            + (a2 * b * (s - c2))
	            + (((4.0 * c * a) - (b * b))
	                * Math.log(((2.0 * a2) + ba + s) / (ba + c2)))) / (4.0 * a32);
	    };
	    
	    QuadraticUtils.curveTo = function (cpX, cpY, toX, toY, points) {
	        var fromX = points[points.length - 2];
	        var fromY = points[points.length - 1];
	        var n = GRAPHICS_CURVES._segmentsCount(QuadraticUtils.curveLength(fromX, fromY, cpX, cpY, toX, toY));
	        var xa = 0;
	        var ya = 0;
	        for (var i = 1; i <= n; ++i) {
	            var j = i / n;
	            xa = fromX + ((cpX - fromX) * j);
	            ya = fromY + ((cpY - fromY) * j);
	            points.push(xa + (((cpX + ((toX - cpX) * j)) - xa) * j), ya + (((cpY + ((toY - cpY) * j)) - ya) * j));
	        }
	    };
	    return QuadraticUtils;
	}());

	
	var BatchPart =  (function () {
	    function BatchPart() {
	        this.reset();
	    }
	    
	    BatchPart.prototype.begin = function (style, startIndex, attribStart) {
	        this.reset();
	        this.style = style;
	        this.start = startIndex;
	        this.attribStart = attribStart;
	    };
	    
	    BatchPart.prototype.end = function (endIndex, endAttrib) {
	        this.attribSize = endAttrib - this.attribStart;
	        this.size = endIndex - this.start;
	    };
	    BatchPart.prototype.reset = function () {
	        this.style = null;
	        this.size = 0;
	        this.start = 0;
	        this.attribStart = 0;
	        this.attribSize = 0;
	    };
	    return BatchPart;
	}());

	
	var _a;
	
	var FILL_COMMANDS = (_a = {},
	    _a[exports.SHAPES.POLY] = buildPoly,
	    _a[exports.SHAPES.CIRC] = buildCircle,
	    _a[exports.SHAPES.ELIP] = buildCircle,
	    _a[exports.SHAPES.RECT] = buildRectangle,
	    _a[exports.SHAPES.RREC] = buildRoundedRectangle,
	    _a);
	
	var BATCH_POOL = [];
	
	var DRAW_CALL_POOL = [];

	var index$2 = ({
	    buildPoly: buildPoly,
	    buildCircle: buildCircle,
	    buildRectangle: buildRectangle,
	    buildRoundedRectangle: buildRoundedRectangle,
	    FILL_COMMANDS: FILL_COMMANDS,
	    BATCH_POOL: BATCH_POOL,
	    DRAW_CALL_POOL: DRAW_CALL_POOL,
	    buildLine: buildLine,
	    Star: Star,
	    ArcUtils: ArcUtils,
	    BezierUtils: BezierUtils,
	    QuadraticUtils: QuadraticUtils,
	    BatchPart: BatchPart
	});

	
	var GraphicsData =  (function () {
	    
	    function GraphicsData(shape, fillStyle, lineStyle, matrix) {
	        if (fillStyle === void 0) { fillStyle = null; }
	        if (lineStyle === void 0) { lineStyle = null; }
	        if (matrix === void 0) { matrix = null; }
	        
	        this.shape = shape;
	        
	        this.lineStyle = lineStyle;
	        
	        this.fillStyle = fillStyle;
	        
	        this.matrix = matrix;
	        
	        this.type = shape.type;
	        
	        this.points = [];
	        
	        this.holes = [];
	    }
	    
	    GraphicsData.prototype.clone = function () {
	        return new GraphicsData(this.shape, this.fillStyle, this.lineStyle, this.matrix);
	    };
	    
	    GraphicsData.prototype.destroy = function () {
	        this.shape = null;
	        this.holes.length = 0;
	        this.holes = null;
	        this.points.length = 0;
	        this.points = null;
	        this.lineStyle = null;
	        this.fillStyle = null;
	    };
	    return GraphicsData;
	}());

	var tmpPoint = new Point();
	var tmpBounds = new Bounds();
	
	var GraphicsGeometry =  (function (_super) {
	    __extends$5(GraphicsGeometry, _super);
	    function GraphicsGeometry() {
	        var _this = _super.call(this) || this;
	        _this.uvsFloat32 = null;
	        _this.indicesUint16 = null;
	        
	        _this.points = [];
	        
	        _this.colors = [];
	        
	        _this.uvs = [];
	        
	        _this.indices = [];
	        
	        _this.textureIds = [];
	        
	        _this.graphicsData = [];
	        
	        _this.dirty = 0;
	        
	        _this.batchDirty = -1;
	        
	        _this.cacheDirty = -1;
	        
	        _this.clearDirty = 0;
	        
	        _this.drawCalls = [];
	        
	        _this.batches = [];
	        
	        _this.shapeIndex = 0;
	        
	        _this._bounds = new Bounds();
	        
	        _this.boundsDirty = -1;
	        
	        _this.boundsPadding = 0;
	        _this.batchable = false;
	        _this.indicesUint16 = null;
	        _this.uvsFloat32 = null;
	        
	        _this.closePointEps = 1e-4;
	        return _this;
	    }
	    Object.defineProperty(GraphicsGeometry.prototype, "bounds", {
	        
	        get: function () {
	            if (this.boundsDirty !== this.dirty) {
	                this.boundsDirty = this.dirty;
	                this.calculateBounds();
	            }
	            return this._bounds;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    GraphicsGeometry.prototype.invalidate = function () {
	        this.boundsDirty = -1;
	        this.dirty++;
	        this.batchDirty++;
	        this.shapeIndex = 0;
	        this.points.length = 0;
	        this.colors.length = 0;
	        this.uvs.length = 0;
	        this.indices.length = 0;
	        this.textureIds.length = 0;
	        for (var i = 0; i < this.drawCalls.length; i++) {
	            this.drawCalls[i].texArray.clear();
	            DRAW_CALL_POOL.push(this.drawCalls[i]);
	        }
	        this.drawCalls.length = 0;
	        for (var i = 0; i < this.batches.length; i++) {
	            var batchPart = this.batches[i];
	            batchPart.reset();
	            BATCH_POOL.push(batchPart);
	        }
	        this.batches.length = 0;
	    };
	    
	    GraphicsGeometry.prototype.clear = function () {
	        if (this.graphicsData.length > 0) {
	            this.invalidate();
	            this.clearDirty++;
	            this.graphicsData.length = 0;
	        }
	        return this;
	    };
	    
	    GraphicsGeometry.prototype.drawShape = function (shape, fillStyle, lineStyle, matrix) {
	        if (fillStyle === void 0) { fillStyle = null; }
	        if (lineStyle === void 0) { lineStyle = null; }
	        if (matrix === void 0) { matrix = null; }
	        var data = new GraphicsData(shape, fillStyle, lineStyle, matrix);
	        this.graphicsData.push(data);
	        this.dirty++;
	        return this;
	    };
	    
	    GraphicsGeometry.prototype.drawHole = function (shape, matrix) {
	        if (matrix === void 0) { matrix = null; }
	        if (!this.graphicsData.length) {
	            return null;
	        }
	        var data = new GraphicsData(shape, null, null, matrix);
	        var lastShape = this.graphicsData[this.graphicsData.length - 1];
	        data.lineStyle = lastShape.lineStyle;
	        lastShape.holes.push(data);
	        this.dirty++;
	        return this;
	    };
	    
	    GraphicsGeometry.prototype.destroy = function () {
	        _super.prototype.destroy.call(this);
	        
	        for (var i = 0; i < this.graphicsData.length; ++i) {
	            this.graphicsData[i].destroy();
	        }
	        this.points.length = 0;
	        this.points = null;
	        this.colors.length = 0;
	        this.colors = null;
	        this.uvs.length = 0;
	        this.uvs = null;
	        this.indices.length = 0;
	        this.indices = null;
	        this.indexBuffer.destroy();
	        this.indexBuffer = null;
	        this.graphicsData.length = 0;
	        this.graphicsData = null;
	        this.drawCalls.length = 0;
	        this.drawCalls = null;
	        this.batches.length = 0;
	        this.batches = null;
	        this._bounds = null;
	    };
	    
	    GraphicsGeometry.prototype.containsPoint = function (point) {
	        var graphicsData = this.graphicsData;
	        for (var i = 0; i < graphicsData.length; ++i) {
	            var data = graphicsData[i];
	            if (!data.fillStyle.visible) {
	                continue;
	            }
	            
	            if (data.shape) {
	                if (data.matrix) {
	                    data.matrix.applyInverse(point, tmpPoint);
	                }
	                else {
	                    tmpPoint.copyFrom(point);
	                }
	                if (data.shape.contains(tmpPoint.x, tmpPoint.y)) {
	                    var hitHole = false;
	                    if (data.holes) {
	                        for (var i_1 = 0; i_1 < data.holes.length; i_1++) {
	                            var hole = data.holes[i_1];
	                            if (hole.shape.contains(tmpPoint.x, tmpPoint.y)) {
	                                hitHole = true;
	                                break;
	                            }
	                        }
	                    }
	                    if (!hitHole) {
	                        return true;
	                    }
	                }
	            }
	        }
	        return false;
	    };
	    
	    GraphicsGeometry.prototype.updateBatches = function (allow32Indices) {
	        if (!this.graphicsData.length) {
	            this.batchable = true;
	            return;
	        }
	        if (!this.validateBatching()) {
	            return;
	        }
	        this.cacheDirty = this.dirty;
	        var uvs = this.uvs;
	        var graphicsData = this.graphicsData;
	        var batchPart = null;
	        var currentStyle = null;
	        if (this.batches.length > 0) {
	            batchPart = this.batches[this.batches.length - 1];
	            currentStyle = batchPart.style;
	        }
	        for (var i = this.shapeIndex; i < graphicsData.length; i++) {
	            this.shapeIndex++;
	            var data = graphicsData[i];
	            var fillStyle = data.fillStyle;
	            var lineStyle = data.lineStyle;
	            var command = FILL_COMMANDS[data.type];
	            
	            command.build(data);
	            if (data.matrix) {
	                this.transformPoints(data.points, data.matrix);
	            }
	            for (var j = 0; j < 2; j++) {
	                var style = (j === 0) ? fillStyle : lineStyle;
	                if (!style.visible)
	                    { continue; }
	                var nextTexture = style.texture.baseTexture;
	                var index_1 = this.indices.length;
	                var attribIndex = this.points.length / 2;
	                nextTexture.wrapMode = exports.WRAP_MODES.REPEAT;
	                if (j === 0) {
	                    this.processFill(data);
	                }
	                else {
	                    this.processLine(data);
	                }
	                var size = (this.points.length / 2) - attribIndex;
	                if (size === 0)
	                    { continue; }
	                
	                if (batchPart && !this._compareStyles(currentStyle, style)) {
	                    batchPart.end(index_1, attribIndex);
	                    batchPart = null;
	                }
	                
	                if (!batchPart) {
	                    batchPart = BATCH_POOL.pop() || new BatchPart();
	                    batchPart.begin(style, index_1, attribIndex);
	                    this.batches.push(batchPart);
	                    currentStyle = style;
	                }
	                this.addUvs(this.points, uvs, style.texture, attribIndex, size, style.matrix);
	            }
	        }
	        var index = this.indices.length;
	        var attrib = this.points.length / 2;
	        if (batchPart) {
	            batchPart.end(index, attrib);
	        }
	        if (this.batches.length === 0) {
	            
	            
	            this.batchable = true;
	            return;
	        }
	        
	        if (this.indicesUint16 && this.indices.length === this.indicesUint16.length) {
	            this.indicesUint16.set(this.indices);
	        }
	        else {
	            var need32 = attrib > 0xffff && allow32Indices;
	            this.indicesUint16 = need32 ? new Uint32Array(this.indices) : new Uint16Array(this.indices);
	        }
	        
	        this.batchable = this.isBatchable();
	        if (this.batchable) {
	            this.packBatches();
	        }
	        else {
	            this.buildDrawCalls();
	        }
	    };
	    
	    GraphicsGeometry.prototype._compareStyles = function (styleA, styleB) {
	        if (!styleA || !styleB) {
	            return false;
	        }
	        if (styleA.texture.baseTexture !== styleB.texture.baseTexture) {
	            return false;
	        }
	        if (styleA.color + styleA.alpha !== styleB.color + styleB.alpha) {
	            return false;
	        }
	        if (!!styleA.native !== !!styleB.native) {
	            return false;
	        }
	        return true;
	    };
	    
	    GraphicsGeometry.prototype.validateBatching = function () {
	        if (this.dirty === this.cacheDirty || !this.graphicsData.length) {
	            return false;
	        }
	        for (var i = 0, l = this.graphicsData.length; i < l; i++) {
	            var data = this.graphicsData[i];
	            var fill = data.fillStyle;
	            var line = data.lineStyle;
	            if (fill && !fill.texture.baseTexture.valid)
	                { return false; }
	            if (line && !line.texture.baseTexture.valid)
	                { return false; }
	        }
	        return true;
	    };
	    
	    GraphicsGeometry.prototype.packBatches = function () {
	        this.batchDirty++;
	        this.uvsFloat32 = new Float32Array(this.uvs);
	        var batches = this.batches;
	        for (var i = 0, l = batches.length; i < l; i++) {
	            var batch = batches[i];
	            for (var j = 0; j < batch.size; j++) {
	                var index = batch.start + j;
	                this.indicesUint16[index] = this.indicesUint16[index] - batch.attribStart;
	            }
	        }
	    };
	    
	    GraphicsGeometry.prototype.isBatchable = function () {
	        
	        if (this.points.length > 0xffff * 2) {
	            return false;
	        }
	        var batches = this.batches;
	        for (var i = 0; i < batches.length; i++) {
	            if (batches[i].style.native) {
	                return false;
	            }
	        }
	        return (this.points.length < GraphicsGeometry.BATCHABLE_SIZE * 2);
	    };
	    
	    GraphicsGeometry.prototype.buildDrawCalls = function () {
	        var TICK = ++BaseTexture._globalBatch;
	        for (var i = 0; i < this.drawCalls.length; i++) {
	            this.drawCalls[i].texArray.clear();
	            DRAW_CALL_POOL.push(this.drawCalls[i]);
	        }
	        this.drawCalls.length = 0;
	        var colors = this.colors;
	        var textureIds = this.textureIds;
	        var currentGroup = DRAW_CALL_POOL.pop();
	        if (!currentGroup) {
	            currentGroup = new BatchDrawCall();
	            currentGroup.texArray = new BatchTextureArray();
	        }
	        currentGroup.texArray.count = 0;
	        currentGroup.start = 0;
	        currentGroup.size = 0;
	        currentGroup.type = exports.DRAW_MODES.TRIANGLES;
	        var textureCount = 0;
	        var currentTexture = null;
	        var textureId = 0;
	        var native = false;
	        var drawMode = exports.DRAW_MODES.TRIANGLES;
	        var index = 0;
	        this.drawCalls.push(currentGroup);
	        
	        for (var i = 0; i < this.batches.length; i++) {
	            var data = this.batches[i];
	            
	            var MAX_TEXTURES = 8;
	            
	            var style = data.style;
	            var nextTexture = style.texture.baseTexture;
	            if (native !== !!style.native) {
	                native = !!style.native;
	                drawMode = native ? exports.DRAW_MODES.LINES : exports.DRAW_MODES.TRIANGLES;
	                
	                currentTexture = null;
	                textureCount = MAX_TEXTURES;
	                TICK++;
	            }
	            if (currentTexture !== nextTexture) {
	                currentTexture = nextTexture;
	                if (nextTexture._batchEnabled !== TICK) {
	                    if (textureCount === MAX_TEXTURES) {
	                        TICK++;
	                        textureCount = 0;
	                        if (currentGroup.size > 0) {
	                            currentGroup = DRAW_CALL_POOL.pop();
	                            if (!currentGroup) {
	                                currentGroup = new BatchDrawCall();
	                                currentGroup.texArray = new BatchTextureArray();
	                            }
	                            this.drawCalls.push(currentGroup);
	                        }
	                        currentGroup.start = index;
	                        currentGroup.size = 0;
	                        currentGroup.texArray.count = 0;
	                        currentGroup.type = drawMode;
	                    }
	                    
	                    
	                    nextTexture.touched = 1; 
	                    nextTexture._batchEnabled = TICK;
	                    nextTexture._batchLocation = textureCount;
	                    nextTexture.wrapMode = 10497;
	                    currentGroup.texArray.elements[currentGroup.texArray.count++] = nextTexture;
	                    textureCount++;
	                }
	            }
	            currentGroup.size += data.size;
	            index += data.size;
	            textureId = nextTexture._batchLocation;
	            this.addColors(colors, style.color, style.alpha, data.attribSize, data.attribStart);
	            this.addTextureIds(textureIds, textureId, data.attribSize, data.attribStart);
	        }
	        BaseTexture._globalBatch = TICK;
	        
	        
	        this.packAttributes();
	    };
	    
	    GraphicsGeometry.prototype.packAttributes = function () {
	        var verts = this.points;
	        var uvs = this.uvs;
	        var colors = this.colors;
	        var textureIds = this.textureIds;
	        
	        var glPoints = new ArrayBuffer(verts.length * 3 * 4);
	        var f32 = new Float32Array(glPoints);
	        var u32 = new Uint32Array(glPoints);
	        var p = 0;
	        for (var i = 0; i < verts.length / 2; i++) {
	            f32[p++] = verts[i * 2];
	            f32[p++] = verts[(i * 2) + 1];
	            f32[p++] = uvs[i * 2];
	            f32[p++] = uvs[(i * 2) + 1];
	            u32[p++] = colors[i];
	            f32[p++] = textureIds[i];
	        }
	        this._buffer.update(glPoints);
	        this._indexBuffer.update(this.indicesUint16);
	    };
	    
	    GraphicsGeometry.prototype.processFill = function (data) {
	        if (data.holes.length) {
	            this.processHoles(data.holes);
	            buildPoly.triangulate(data, this);
	        }
	        else {
	            var command = FILL_COMMANDS[data.type];
	            command.triangulate(data, this);
	        }
	    };
	    
	    GraphicsGeometry.prototype.processLine = function (data) {
	        buildLine(data, this);
	        for (var i = 0; i < data.holes.length; i++) {
	            buildLine(data.holes[i], this);
	        }
	    };
	    
	    GraphicsGeometry.prototype.processHoles = function (holes) {
	        for (var i = 0; i < holes.length; i++) {
	            var hole = holes[i];
	            var command = FILL_COMMANDS[hole.type];
	            command.build(hole);
	            if (hole.matrix) {
	                this.transformPoints(hole.points, hole.matrix);
	            }
	        }
	    };
	    
	    GraphicsGeometry.prototype.calculateBounds = function () {
	        var bounds = this._bounds;
	        var sequenceBounds = tmpBounds;
	        var curMatrix = Matrix.IDENTITY;
	        this._bounds.clear();
	        sequenceBounds.clear();
	        for (var i = 0; i < this.graphicsData.length; i++) {
	            var data = this.graphicsData[i];
	            var shape = data.shape;
	            var type = data.type;
	            var lineStyle = data.lineStyle;
	            var nextMatrix = data.matrix || Matrix.IDENTITY;
	            var lineWidth = 0.0;
	            if (lineStyle && lineStyle.visible) {
	                var alignment = lineStyle.alignment;
	                lineWidth = lineStyle.width;
	                if (type === exports.SHAPES.POLY) {
	                    lineWidth = lineWidth * (0.5 + Math.abs(0.5 - alignment));
	                }
	                else {
	                    lineWidth = lineWidth * Math.max(0, alignment);
	                }
	            }
	            if (curMatrix !== nextMatrix) {
	                if (!sequenceBounds.isEmpty()) {
	                    bounds.addBoundsMatrix(sequenceBounds, curMatrix);
	                    sequenceBounds.clear();
	                }
	                curMatrix = nextMatrix;
	            }
	            if (type === exports.SHAPES.RECT || type === exports.SHAPES.RREC) {
	                var rect = shape;
	                sequenceBounds.addFramePad(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height, lineWidth, lineWidth);
	            }
	            else if (type === exports.SHAPES.CIRC) {
	                var circle = shape;
	                sequenceBounds.addFramePad(circle.x, circle.y, circle.x, circle.y, circle.radius + lineWidth, circle.radius + lineWidth);
	            }
	            else if (type === exports.SHAPES.ELIP) {
	                var ellipse = shape;
	                sequenceBounds.addFramePad(ellipse.x, ellipse.y, ellipse.x, ellipse.y, ellipse.width + lineWidth, ellipse.height + lineWidth);
	            }
	            else {
	                var poly = shape;
	                
	                bounds.addVerticesMatrix(curMatrix, poly.points, 0, poly.points.length, lineWidth, lineWidth);
	            }
	        }
	        if (!sequenceBounds.isEmpty()) {
	            bounds.addBoundsMatrix(sequenceBounds, curMatrix);
	        }
	        bounds.pad(this.boundsPadding, this.boundsPadding);
	    };
	    
	    GraphicsGeometry.prototype.transformPoints = function (points, matrix) {
	        for (var i = 0; i < points.length / 2; i++) {
	            var x = points[(i * 2)];
	            var y = points[(i * 2) + 1];
	            points[(i * 2)] = (matrix.a * x) + (matrix.c * y) + matrix.tx;
	            points[(i * 2) + 1] = (matrix.b * x) + (matrix.d * y) + matrix.ty;
	        }
	    };
	    
	    GraphicsGeometry.prototype.addColors = function (colors, color, alpha, size, offset) {
	        if (offset === void 0) { offset = 0; }
	        
	        var rgb = (color >> 16) + (color & 0xff00) + ((color & 0xff) << 16);
	        var rgba = premultiplyTint(rgb, alpha);
	        colors.length = Math.max(colors.length, offset + size);
	        for (var i = 0; i < size; i++) {
	            colors[offset + i] = rgba;
	        }
	    };
	    
	    GraphicsGeometry.prototype.addTextureIds = function (textureIds, id, size, offset) {
	        if (offset === void 0) { offset = 0; }
	        textureIds.length = Math.max(textureIds.length, offset + size);
	        for (var i = 0; i < size; i++) {
	            textureIds[offset + i] = id;
	        }
	    };
	    
	    GraphicsGeometry.prototype.addUvs = function (verts, uvs, texture, start, size, matrix) {
	        if (matrix === void 0) { matrix = null; }
	        var index = 0;
	        var uvsStart = uvs.length;
	        var frame = texture.frame;
	        while (index < size) {
	            var x = verts[(start + index) * 2];
	            var y = verts[((start + index) * 2) + 1];
	            if (matrix) {
	                var nx = (matrix.a * x) + (matrix.c * y) + matrix.tx;
	                y = (matrix.b * x) + (matrix.d * y) + matrix.ty;
	                x = nx;
	            }
	            index++;
	            uvs.push(x / frame.width, y / frame.height);
	        }
	        var baseTexture = texture.baseTexture;
	        if (frame.width < baseTexture.width
	            || frame.height < baseTexture.height) {
	            this.adjustUvs(uvs, texture, uvsStart, size);
	        }
	    };
	    
	    GraphicsGeometry.prototype.adjustUvs = function (uvs, texture, start, size) {
	        var baseTexture = texture.baseTexture;
	        var eps = 1e-6;
	        var finish = start + (size * 2);
	        var frame = texture.frame;
	        var scaleX = frame.width / baseTexture.width;
	        var scaleY = frame.height / baseTexture.height;
	        var offsetX = frame.x / frame.width;
	        var offsetY = frame.y / frame.height;
	        var minX = Math.floor(uvs[start] + eps);
	        var minY = Math.floor(uvs[start + 1] + eps);
	        for (var i = start + 2; i < finish; i += 2) {
	            minX = Math.min(minX, Math.floor(uvs[i] + eps));
	            minY = Math.min(minY, Math.floor(uvs[i + 1] + eps));
	        }
	        offsetX -= minX;
	        offsetY -= minY;
	        for (var i = start; i < finish; i += 2) {
	            uvs[i] = (uvs[i] + offsetX) * scaleX;
	            uvs[i + 1] = (uvs[i + 1] + offsetY) * scaleY;
	        }
	    };
	    
	    GraphicsGeometry.BATCHABLE_SIZE = 100;
	    return GraphicsGeometry;
	}(BatchGeometry));

	
	var LineStyle =  (function (_super) {
	    __extends$5(LineStyle, _super);
	    function LineStyle() {
	        var _this = _super !== null && _super.apply(this, arguments) || this;
	        
	        _this.width = 0;
	        
	        _this.alignment = 0.5;
	        
	        _this.native = false;
	        
	        _this.cap = exports.LINE_CAP.BUTT;
	        
	        _this.join = exports.LINE_JOIN.MITER;
	        
	        _this.miterLimit = 10;
	        return _this;
	    }
	    
	    LineStyle.prototype.clone = function () {
	        var obj = new LineStyle();
	        obj.color = this.color;
	        obj.alpha = this.alpha;
	        obj.texture = this.texture;
	        obj.matrix = this.matrix;
	        obj.visible = this.visible;
	        obj.width = this.width;
	        obj.alignment = this.alignment;
	        obj.native = this.native;
	        obj.cap = this.cap;
	        obj.join = this.join;
	        obj.miterLimit = this.miterLimit;
	        return obj;
	    };
	    
	    LineStyle.prototype.reset = function () {
	        _super.prototype.reset.call(this);
	        
	        this.color = 0x0;
	        this.alignment = 0.5;
	        this.width = 0;
	        this.native = false;
	    };
	    return LineStyle;
	}(FillStyle));

	var temp = new Float32Array(3);
	
	var DEFAULT_SHADERS = {};
	
	var Graphics =  (function (_super) {
	    __extends$5(Graphics, _super);
	    
	    function Graphics(geometry) {
	        if (geometry === void 0) { geometry = null; }
	        var _this = _super.call(this) || this;
	        _this._geometry = geometry || new GraphicsGeometry();
	        _this._geometry.refCount++;
	        
	        _this.shader = null;
	        
	        _this.state = State.for2d();
	        
	        _this._fillStyle = new FillStyle();
	        
	        _this._lineStyle = new LineStyle();
	        
	        _this._matrix = null;
	        
	        _this._holeMode = false;
	        
	        _this.currentPath = null;
	        
	        
	        _this.batches = [];
	        
	        _this.batchTint = -1;
	        
	        _this.batchDirty = -1;
	        
	        _this.vertexData = null;
	        
	        _this.pluginName = 'batch';
	        _this._transformID = -1;
	        
	        _this.tint = 0xFFFFFF;
	        _this.blendMode = exports.BLEND_MODES.NORMAL;
	        return _this;
	    }
	    Object.defineProperty(Graphics.prototype, "geometry", {
	        
	        get: function () {
	            return this._geometry;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    Graphics.prototype.clone = function () {
	        this.finishPoly();
	        return new Graphics(this._geometry);
	    };
	    Object.defineProperty(Graphics.prototype, "blendMode", {
	        get: function () {
	            return this.state.blendMode;
	        },
	        
	        set: function (value) {
	            this.state.blendMode = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Graphics.prototype, "tint", {
	        
	        get: function () {
	            return this._tint;
	        },
	        set: function (value) {
	            this._tint = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Graphics.prototype, "fill", {
	        
	        get: function () {
	            return this._fillStyle;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Graphics.prototype, "line", {
	        
	        get: function () {
	            return this._lineStyle;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    
	    Graphics.prototype.lineStyle = function (options) {
	        if (options === void 0) { options = null; }
	        
	        if (typeof options === 'number') {
	            
	            var args = arguments;
	            options = {
	                width: args[0] || 0,
	                color: args[1] || 0x0,
	                alpha: args[2] !== undefined ? args[2] : 1,
	                alignment: args[3] !== undefined ? args[3] : 0.5,
	                native: !!args[4],
	            };
	        }
	        return this.lineTextureStyle(options);
	    };
	    
	    Graphics.prototype.lineTextureStyle = function (options) {
	        
	        
	        if (typeof options === 'number') {
	            deprecation('v5.2.0', 'Please use object-based options for Graphics#lineTextureStyle');
	            
	            var _a = arguments, width = _a[0], texture = _a[1], color = _a[2], alpha = _a[3], matrix = _a[4], alignment = _a[5], native = _a[6];
	            options = { width: width, texture: texture, color: color, alpha: alpha, matrix: matrix, alignment: alignment, native: native };
	            
	            Object.keys(options).forEach(function (key) { return options[key] === undefined && delete options[key]; });
	        }
	        
	        options = Object.assign({
	            width: 0,
	            texture: Texture.WHITE,
	            color: (options && options.texture) ? 0xFFFFFF : 0x0,
	            alpha: 1,
	            matrix: null,
	            alignment: 0.5,
	            native: false,
	            cap: exports.LINE_CAP.BUTT,
	            join: exports.LINE_JOIN.MITER,
	            miterLimit: 10,
	        }, options);
	        if (this.currentPath) {
	            this.startPoly();
	        }
	        var visible = options.width > 0 && options.alpha > 0;
	        if (!visible) {
	            this._lineStyle.reset();
	        }
	        else {
	            if (options.matrix) {
	                options.matrix = options.matrix.clone();
	                options.matrix.invert();
	            }
	            Object.assign(this._lineStyle, { visible: visible }, options);
	        }
	        return this;
	    };
	    
	    Graphics.prototype.startPoly = function () {
	        if (this.currentPath) {
	            var points = this.currentPath.points;
	            var len = this.currentPath.points.length;
	            if (len > 2) {
	                this.drawShape(this.currentPath);
	                this.currentPath = new Polygon();
	                this.currentPath.closeStroke = false;
	                this.currentPath.points.push(points[len - 2], points[len - 1]);
	            }
	        }
	        else {
	            this.currentPath = new Polygon();
	            this.currentPath.closeStroke = false;
	        }
	    };
	    
	    Graphics.prototype.finishPoly = function () {
	        if (this.currentPath) {
	            if (this.currentPath.points.length > 2) {
	                this.drawShape(this.currentPath);
	                this.currentPath = null;
	            }
	            else {
	                this.currentPath.points.length = 0;
	            }
	        }
	    };
	    
	    Graphics.prototype.moveTo = function (x, y) {
	        this.startPoly();
	        this.currentPath.points[0] = x;
	        this.currentPath.points[1] = y;
	        return this;
	    };
	    
	    Graphics.prototype.lineTo = function (x, y) {
	        if (!this.currentPath) {
	            this.moveTo(0, 0);
	        }
	        
	        var points = this.currentPath.points;
	        var fromX = points[points.length - 2];
	        var fromY = points[points.length - 1];
	        if (fromX !== x || fromY !== y) {
	            points.push(x, y);
	        }
	        return this;
	    };
	    
	    Graphics.prototype._initCurve = function (x, y) {
	        if (x === void 0) { x = 0; }
	        if (y === void 0) { y = 0; }
	        if (this.currentPath) {
	            if (this.currentPath.points.length === 0) {
	                this.currentPath.points = [x, y];
	            }
	        }
	        else {
	            this.moveTo(x, y);
	        }
	    };
	    
	    Graphics.prototype.quadraticCurveTo = function (cpX, cpY, toX, toY) {
	        this._initCurve();
	        var points = this.currentPath.points;
	        if (points.length === 0) {
	            this.moveTo(0, 0);
	        }
	        QuadraticUtils.curveTo(cpX, cpY, toX, toY, points);
	        return this;
	    };
	    
	    Graphics.prototype.bezierCurveTo = function (cpX, cpY, cpX2, cpY2, toX, toY) {
	        this._initCurve();
	        BezierUtils.curveTo(cpX, cpY, cpX2, cpY2, toX, toY, this.currentPath.points);
	        return this;
	    };
	    
	    Graphics.prototype.arcTo = function (x1, y1, x2, y2, radius) {
	        this._initCurve(x1, y1);
	        var points = this.currentPath.points;
	        var result = ArcUtils.curveTo(x1, y1, x2, y2, radius, points);
	        if (result) {
	            var cx = result.cx, cy = result.cy, radius_1 = result.radius, startAngle = result.startAngle, endAngle = result.endAngle, anticlockwise = result.anticlockwise;
	            this.arc(cx, cy, radius_1, startAngle, endAngle, anticlockwise);
	        }
	        return this;
	    };
	    
	    Graphics.prototype.arc = function (cx, cy, radius, startAngle, endAngle, anticlockwise) {
	        if (anticlockwise === void 0) { anticlockwise = false; }
	        if (startAngle === endAngle) {
	            return this;
	        }
	        if (!anticlockwise && endAngle <= startAngle) {
	            endAngle += PI_2;
	        }
	        else if (anticlockwise && startAngle <= endAngle) {
	            startAngle += PI_2;
	        }
	        var sweep = endAngle - startAngle;
	        if (sweep === 0) {
	            return this;
	        }
	        var startX = cx + (Math.cos(startAngle) * radius);
	        var startY = cy + (Math.sin(startAngle) * radius);
	        var eps = this._geometry.closePointEps;
	        
	        var points = this.currentPath ? this.currentPath.points : null;
	        if (points) {
	            
	            
	            var xDiff = Math.abs(points[points.length - 2] - startX);
	            var yDiff = Math.abs(points[points.length - 1] - startY);
	            if (xDiff < eps && yDiff < eps) { ; }
	            else {
	                points.push(startX, startY);
	            }
	        }
	        else {
	            this.moveTo(startX, startY);
	            points = this.currentPath.points;
	        }
	        ArcUtils.arc(startX, startY, cx, cy, radius, startAngle, endAngle, anticlockwise, points);
	        return this;
	    };
	    
	    Graphics.prototype.beginFill = function (color, alpha) {
	        if (color === void 0) { color = 0; }
	        if (alpha === void 0) { alpha = 1; }
	        return this.beginTextureFill({ texture: Texture.WHITE, color: color, alpha: alpha });
	    };
	    
	    Graphics.prototype.beginTextureFill = function (options) {
	        
	        if (options instanceof Texture) {
	            deprecation('v5.2.0', 'Please use object-based options for Graphics#beginTextureFill');
	            
	            var _a = arguments, texture = _a[0], color = _a[1], alpha = _a[2], matrix = _a[3];
	            options = { texture: texture, color: color, alpha: alpha, matrix: matrix };
	            
	            Object.keys(options).forEach(function (key) { return options[key] === undefined && delete options[key]; });
	        }
	        
	        options = Object.assign({
	            texture: Texture.WHITE,
	            color: 0xFFFFFF,
	            alpha: 1,
	            matrix: null,
	        }, options);
	        if (this.currentPath) {
	            this.startPoly();
	        }
	        var visible = options.alpha > 0;
	        if (!visible) {
	            this._fillStyle.reset();
	        }
	        else {
	            if (options.matrix) {
	                options.matrix = options.matrix.clone();
	                options.matrix.invert();
	            }
	            Object.assign(this._fillStyle, { visible: visible }, options);
	        }
	        return this;
	    };
	    
	    Graphics.prototype.endFill = function () {
	        this.finishPoly();
	        this._fillStyle.reset();
	        return this;
	    };
	    
	    Graphics.prototype.drawRect = function (x, y, width, height) {
	        return this.drawShape(new Rectangle(x, y, width, height));
	    };
	    
	    Graphics.prototype.drawRoundedRect = function (x, y, width, height, radius) {
	        return this.drawShape(new RoundedRectangle(x, y, width, height, radius));
	    };
	    
	    Graphics.prototype.drawCircle = function (x, y, radius) {
	        return this.drawShape(new Circle(x, y, radius));
	    };
	    
	    Graphics.prototype.drawEllipse = function (x, y, width, height) {
	        return this.drawShape(new Ellipse(x, y, width, height));
	    };
	    
	    Graphics.prototype.drawPolygon = function () {
	        var arguments$1 = arguments;

	        var path = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            path[_i] = arguments$1[_i];
	        }
	        var points;
	        var closeStroke = true; 
	        var poly = path[0];
	        
	        if (poly.points) {
	            closeStroke = poly.closeStroke;
	            points = poly.points;
	        }
	        else if (Array.isArray(path[0])) {
	            points = path[0];
	        }
	        else {
	            points = path;
	        }
	        var shape = new Polygon(points);
	        shape.closeStroke = closeStroke;
	        this.drawShape(shape);
	        return this;
	    };
	    
	    Graphics.prototype.drawShape = function (shape) {
	        if (!this._holeMode) {
	            this._geometry.drawShape(shape, this._fillStyle.clone(), this._lineStyle.clone(), this._matrix);
	        }
	        else {
	            this._geometry.drawHole(shape, this._matrix);
	        }
	        return this;
	    };
	    
	    Graphics.prototype.drawStar = function (x, y, points, radius, innerRadius, rotation) {
	        if (rotation === void 0) { rotation = 0; }
	        return this.drawPolygon(new Star(x, y, points, radius, innerRadius, rotation));
	    };
	    
	    Graphics.prototype.clear = function () {
	        this._geometry.clear();
	        this._lineStyle.reset();
	        this._fillStyle.reset();
	        this._boundsID++;
	        this._matrix = null;
	        this._holeMode = false;
	        this.currentPath = null;
	        return this;
	    };
	    
	    Graphics.prototype.isFastRect = function () {
	        var data = this._geometry.graphicsData;
	        return data.length === 1
	            && data[0].shape.type === exports.SHAPES.RECT
	            && !(data[0].lineStyle.visible && data[0].lineStyle.width);
	    };
	    
	    Graphics.prototype._render = function (renderer) {
	        this.finishPoly();
	        var geometry = this._geometry;
	        var hasuint32 = renderer.context.supports.uint32Indices;
	        
	        
	        geometry.updateBatches(hasuint32);
	        if (geometry.batchable) {
	            if (this.batchDirty !== geometry.batchDirty) {
	                this._populateBatches();
	            }
	            this._renderBatched(renderer);
	        }
	        else {
	            
	            renderer.batch.flush();
	            this._renderDirect(renderer);
	        }
	    };
	    
	    Graphics.prototype._populateBatches = function () {
	        var geometry = this._geometry;
	        var blendMode = this.blendMode;
	        var len = geometry.batches.length;
	        this.batchTint = -1;
	        this._transformID = -1;
	        this.batchDirty = geometry.batchDirty;
	        this.batches.length = len;
	        this.vertexData = new Float32Array(geometry.points);
	        for (var i = 0; i < len; i++) {
	            var gI = geometry.batches[i];
	            var color = gI.style.color;
	            var vertexData = new Float32Array(this.vertexData.buffer, gI.attribStart * 4 * 2, gI.attribSize * 2);
	            var uvs = new Float32Array(geometry.uvsFloat32.buffer, gI.attribStart * 4 * 2, gI.attribSize * 2);
	            var indices = new Uint16Array(geometry.indicesUint16.buffer, gI.start * 2, gI.size);
	            var batch = {
	                vertexData: vertexData,
	                blendMode: blendMode,
	                indices: indices,
	                uvs: uvs,
	                _batchRGB: hex2rgb(color),
	                _tintRGB: color,
	                _texture: gI.style.texture,
	                alpha: gI.style.alpha,
	                worldAlpha: 1
	            };
	            this.batches[i] = batch;
	        }
	    };
	    
	    Graphics.prototype._renderBatched = function (renderer) {
	        if (!this.batches.length) {
	            return;
	        }
	        renderer.batch.setObjectRenderer(renderer.plugins[this.pluginName]);
	        this.calculateVertices();
	        this.calculateTints();
	        for (var i = 0, l = this.batches.length; i < l; i++) {
	            var batch = this.batches[i];
	            batch.worldAlpha = this.worldAlpha * batch.alpha;
	            renderer.plugins[this.pluginName].render(batch);
	        }
	    };
	    
	    Graphics.prototype._renderDirect = function (renderer) {
	        var shader = this._resolveDirectShader(renderer);
	        var geometry = this._geometry;
	        var tint = this.tint;
	        var worldAlpha = this.worldAlpha;
	        var uniforms = shader.uniforms;
	        var drawCalls = geometry.drawCalls;
	        
	        uniforms.translationMatrix = this.transform.worldTransform;
	        
	        uniforms.tint[0] = (((tint >> 16) & 0xFF) / 255) * worldAlpha;
	        uniforms.tint[1] = (((tint >> 8) & 0xFF) / 255) * worldAlpha;
	        uniforms.tint[2] = ((tint & 0xFF) / 255) * worldAlpha;
	        uniforms.tint[3] = worldAlpha;
	        
	        
	        
	        
	        renderer.shader.bind(shader);
	        renderer.geometry.bind(geometry, shader);
	        
	        renderer.state.set(this.state);
	        
	        for (var i = 0, l = drawCalls.length; i < l; i++) {
	            this._renderDrawCallDirect(renderer, geometry.drawCalls[i]);
	        }
	    };
	    
	    Graphics.prototype._renderDrawCallDirect = function (renderer, drawCall) {
	        var texArray = drawCall.texArray, type = drawCall.type, size = drawCall.size, start = drawCall.start;
	        var groupTextureCount = texArray.count;
	        for (var j = 0; j < groupTextureCount; j++) {
	            renderer.texture.bind(texArray.elements[j], j);
	        }
	        renderer.geometry.draw(type, size, start);
	    };
	    
	    Graphics.prototype._resolveDirectShader = function (renderer) {
	        var shader = this.shader;
	        var pluginName = this.pluginName;
	        if (!shader) {
	            
	            
	            
	            if (!DEFAULT_SHADERS[pluginName]) {
	                var MAX_TEXTURES = renderer.plugins.batch.MAX_TEXTURES;
	                var sampleValues = new Int32Array(MAX_TEXTURES);
	                for (var i = 0; i < MAX_TEXTURES; i++) {
	                    sampleValues[i] = i;
	                }
	                var uniforms = {
	                    tint: new Float32Array([1, 1, 1, 1]),
	                    translationMatrix: new Matrix(),
	                    default: UniformGroup.from({ uSamplers: sampleValues }, true),
	                };
	                var program = renderer.plugins[pluginName]._shader.program;
	                DEFAULT_SHADERS[pluginName] = new Shader(program, uniforms);
	            }
	            shader = DEFAULT_SHADERS[pluginName];
	        }
	        return shader;
	    };
	    
	    Graphics.prototype._calculateBounds = function () {
	        this.finishPoly();
	        var geometry = this._geometry;
	        
	        if (!geometry.graphicsData.length) {
	            return;
	        }
	        var _a = geometry.bounds, minX = _a.minX, minY = _a.minY, maxX = _a.maxX, maxY = _a.maxY;
	        this._bounds.addFrame(this.transform, minX, minY, maxX, maxY);
	    };
	    
	    Graphics.prototype.containsPoint = function (point) {
	        this.worldTransform.applyInverse(point, Graphics._TEMP_POINT);
	        return this._geometry.containsPoint(Graphics._TEMP_POINT);
	    };
	    
	    Graphics.prototype.calculateTints = function () {
	        if (this.batchTint !== this.tint) {
	            this.batchTint = this.tint;
	            var tintRGB = hex2rgb(this.tint, temp);
	            for (var i = 0; i < this.batches.length; i++) {
	                var batch = this.batches[i];
	                var batchTint = batch._batchRGB;
	                var r = (tintRGB[0] * batchTint[0]) * 255;
	                var g = (tintRGB[1] * batchTint[1]) * 255;
	                var b = (tintRGB[2] * batchTint[2]) * 255;
	                
	                var color = (r << 16) + (g << 8) + (b | 0);
	                batch._tintRGB = (color >> 16)
	                    + (color & 0xff00)
	                    + ((color & 0xff) << 16);
	            }
	        }
	    };
	    
	    Graphics.prototype.calculateVertices = function () {
	        var wtID = this.transform._worldID;
	        if (this._transformID === wtID) {
	            return;
	        }
	        this._transformID = wtID;
	        var wt = this.transform.worldTransform;
	        var a = wt.a;
	        var b = wt.b;
	        var c = wt.c;
	        var d = wt.d;
	        var tx = wt.tx;
	        var ty = wt.ty;
	        var data = this._geometry.points; 
	        var vertexData = this.vertexData;
	        var count = 0;
	        for (var i = 0; i < data.length; i += 2) {
	            var x = data[i];
	            var y = data[i + 1];
	            vertexData[count++] = (a * x) + (c * y) + tx;
	            vertexData[count++] = (d * y) + (b * x) + ty;
	        }
	    };
	    
	    Graphics.prototype.closePath = function () {
	        var currentPath = this.currentPath;
	        if (currentPath) {
	            
	            currentPath.closeStroke = true;
	        }
	        return this;
	    };
	    
	    Graphics.prototype.setMatrix = function (matrix) {
	        this._matrix = matrix;
	        return this;
	    };
	    
	    Graphics.prototype.beginHole = function () {
	        this.finishPoly();
	        this._holeMode = true;
	        return this;
	    };
	    
	    Graphics.prototype.endHole = function () {
	        this.finishPoly();
	        this._holeMode = false;
	        return this;
	    };
	    
	    Graphics.prototype.destroy = function (options) {
	        this._geometry.refCount--;
	        if (this._geometry.refCount === 0) {
	            this._geometry.dispose();
	        }
	        this._matrix = null;
	        this.currentPath = null;
	        this._lineStyle.destroy();
	        this._lineStyle = null;
	        this._fillStyle.destroy();
	        this._fillStyle = null;
	        this._geometry = null;
	        this.shader = null;
	        this.vertexData = null;
	        this.batches.length = 0;
	        this.batches = null;
	        _super.prototype.destroy.call(this, options);
	    };
	    
	    Graphics._TEMP_POINT = new Point();
	    return Graphics;
	}(Container));

	

	
	

	var extendStatics$6 = function(d, b) {
	    extendStatics$6 = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$6(d, b);
	};

	function __extends$6(d, b) {
	    extendStatics$6(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var tempPoint = new Point();
	var indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
	
	var Sprite =  (function (_super) {
	    __extends$6(Sprite, _super);
	    
	    function Sprite(texture) {
	        var _this = _super.call(this) || this;
	        
	        _this._anchor = new ObservablePoint(_this._onAnchorUpdate, _this, (texture ? texture.defaultAnchor.x : 0), (texture ? texture.defaultAnchor.y : 0));
	        
	        _this._texture = null;
	        
	        _this._width = 0;
	        
	        _this._height = 0;
	        
	        _this._tint = null;
	        
	        _this._tintRGB = null;
	        _this.tint = 0xFFFFFF;
	        
	        _this.blendMode = exports.BLEND_MODES.NORMAL;
	        
	        _this._cachedTint = 0xFFFFFF;
	        
	        _this.uvs = null;
	        
	        _this.texture = texture || Texture.EMPTY;
	        
	        _this.vertexData = new Float32Array(8);
	        
	        _this.vertexTrimmedData = null;
	        _this._transformID = -1;
	        _this._textureID = -1;
	        _this._transformTrimmedID = -1;
	        _this._textureTrimmedID = -1;
	        
	        
	        _this.indices = indices;
	        
	        _this.pluginName = 'batch';
	        
	        _this.isSprite = true;
	        
	        _this._roundPixels = settings.ROUND_PIXELS;
	        return _this;
	    }
	    
	    Sprite.prototype._onTextureUpdate = function () {
	        this._textureID = -1;
	        this._textureTrimmedID = -1;
	        this._cachedTint = 0xFFFFFF;
	        
	        if (this._width) {
	            this.scale.x = sign$1(this.scale.x) * this._width / this._texture.orig.width;
	        }
	        if (this._height) {
	            this.scale.y = sign$1(this.scale.y) * this._height / this._texture.orig.height;
	        }
	    };
	    
	    Sprite.prototype._onAnchorUpdate = function () {
	        this._transformID = -1;
	        this._transformTrimmedID = -1;
	    };
	    
	    Sprite.prototype.calculateVertices = function () {
	        var texture = this._texture;
	        if (this._transformID === this.transform._worldID && this._textureID === texture._updateID) {
	            return;
	        }
	        
	        if (this._textureID !== texture._updateID) {
	            this.uvs = this._texture._uvs.uvsFloat32;
	        }
	        this._transformID = this.transform._worldID;
	        this._textureID = texture._updateID;
	        
	        var wt = this.transform.worldTransform;
	        var a = wt.a;
	        var b = wt.b;
	        var c = wt.c;
	        var d = wt.d;
	        var tx = wt.tx;
	        var ty = wt.ty;
	        var vertexData = this.vertexData;
	        var trim = texture.trim;
	        var orig = texture.orig;
	        var anchor = this._anchor;
	        var w0 = 0;
	        var w1 = 0;
	        var h0 = 0;
	        var h1 = 0;
	        if (trim) {
	            
	            
	            w1 = trim.x - (anchor._x * orig.width);
	            w0 = w1 + trim.width;
	            h1 = trim.y - (anchor._y * orig.height);
	            h0 = h1 + trim.height;
	        }
	        else {
	            w1 = -anchor._x * orig.width;
	            w0 = w1 + orig.width;
	            h1 = -anchor._y * orig.height;
	            h0 = h1 + orig.height;
	        }
	        
	        vertexData[0] = (a * w1) + (c * h1) + tx;
	        vertexData[1] = (d * h1) + (b * w1) + ty;
	        
	        vertexData[2] = (a * w0) + (c * h1) + tx;
	        vertexData[3] = (d * h1) + (b * w0) + ty;
	        
	        vertexData[4] = (a * w0) + (c * h0) + tx;
	        vertexData[5] = (d * h0) + (b * w0) + ty;
	        
	        vertexData[6] = (a * w1) + (c * h0) + tx;
	        vertexData[7] = (d * h0) + (b * w1) + ty;
	        if (this._roundPixels) {
	            var resolution = settings.RESOLUTION;
	            for (var i = 0; i < vertexData.length; ++i) {
	                vertexData[i] = Math.round((vertexData[i] * resolution | 0) / resolution);
	            }
	        }
	    };
	    
	    Sprite.prototype.calculateTrimmedVertices = function () {
	        if (!this.vertexTrimmedData) {
	            this.vertexTrimmedData = new Float32Array(8);
	        }
	        else if (this._transformTrimmedID === this.transform._worldID && this._textureTrimmedID === this._texture._updateID) {
	            return;
	        }
	        this._transformTrimmedID = this.transform._worldID;
	        this._textureTrimmedID = this._texture._updateID;
	        
	        var texture = this._texture;
	        var vertexData = this.vertexTrimmedData;
	        var orig = texture.orig;
	        var anchor = this._anchor;
	        
	        var wt = this.transform.worldTransform;
	        var a = wt.a;
	        var b = wt.b;
	        var c = wt.c;
	        var d = wt.d;
	        var tx = wt.tx;
	        var ty = wt.ty;
	        var w1 = -anchor._x * orig.width;
	        var w0 = w1 + orig.width;
	        var h1 = -anchor._y * orig.height;
	        var h0 = h1 + orig.height;
	        
	        vertexData[0] = (a * w1) + (c * h1) + tx;
	        vertexData[1] = (d * h1) + (b * w1) + ty;
	        
	        vertexData[2] = (a * w0) + (c * h1) + tx;
	        vertexData[3] = (d * h1) + (b * w0) + ty;
	        
	        vertexData[4] = (a * w0) + (c * h0) + tx;
	        vertexData[5] = (d * h0) + (b * w0) + ty;
	        
	        vertexData[6] = (a * w1) + (c * h0) + tx;
	        vertexData[7] = (d * h0) + (b * w1) + ty;
	    };
	    
	    Sprite.prototype._render = function (renderer) {
	        this.calculateVertices();
	        renderer.batch.setObjectRenderer(renderer.plugins[this.pluginName]);
	        renderer.plugins[this.pluginName].render(this);
	    };
	    
	    Sprite.prototype._calculateBounds = function () {
	        var trim = this._texture.trim;
	        var orig = this._texture.orig;
	        
	        if (!trim || (trim.width === orig.width && trim.height === orig.height)) {
	            
	            this.calculateVertices();
	            this._bounds.addQuad(this.vertexData);
	        }
	        else {
	            
	            this.calculateTrimmedVertices();
	            this._bounds.addQuad(this.vertexTrimmedData);
	        }
	    };
	    
	    Sprite.prototype.getLocalBounds = function (rect) {
	        
	        if (this.children.length === 0) {
	            this._bounds.minX = this._texture.orig.width * -this._anchor._x;
	            this._bounds.minY = this._texture.orig.height * -this._anchor._y;
	            this._bounds.maxX = this._texture.orig.width * (1 - this._anchor._x);
	            this._bounds.maxY = this._texture.orig.height * (1 - this._anchor._y);
	            if (!rect) {
	                if (!this._localBoundsRect) {
	                    this._localBoundsRect = new Rectangle();
	                }
	                rect = this._localBoundsRect;
	            }
	            return this._bounds.getRectangle(rect);
	        }
	        return _super.prototype.getLocalBounds.call(this, rect);
	    };
	    
	    Sprite.prototype.containsPoint = function (point) {
	        this.worldTransform.applyInverse(point, tempPoint);
	        var width = this._texture.orig.width;
	        var height = this._texture.orig.height;
	        var x1 = -width * this.anchor.x;
	        var y1 = 0;
	        if (tempPoint.x >= x1 && tempPoint.x < x1 + width) {
	            y1 = -height * this.anchor.y;
	            if (tempPoint.y >= y1 && tempPoint.y < y1 + height) {
	                return true;
	            }
	        }
	        return false;
	    };
	    
	    Sprite.prototype.destroy = function (options) {
	        _super.prototype.destroy.call(this, options);
	        this._texture.off('update', this._onTextureUpdate, this);
	        this._anchor = null;
	        var destroyTexture = typeof options === 'boolean' ? options : options && options.texture;
	        if (destroyTexture) {
	            var destroyBaseTexture = typeof options === 'boolean' ? options : options && options.baseTexture;
	            this._texture.destroy(!!destroyBaseTexture);
	        }
	        this._texture = null;
	    };
	    
	    
	    Sprite.from = function (source, options) {
	        var texture = (source instanceof Texture)
	            ? source
	            : Texture.from(source, options);
	        return new Sprite(texture);
	    };
	    Object.defineProperty(Sprite.prototype, "roundPixels", {
	        get: function () {
	            return this._roundPixels;
	        },
	        
	        set: function (value) {
	            if (this._roundPixels !== value) {
	                this._transformID = -1;
	            }
	            this._roundPixels = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Sprite.prototype, "width", {
	        
	        get: function () {
	            return Math.abs(this.scale.x) * this._texture.orig.width;
	        },
	        set: function (value) {
	            var s = sign$1(this.scale.x) || 1;
	            this.scale.x = s * value / this._texture.orig.width;
	            this._width = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Sprite.prototype, "height", {
	        
	        get: function () {
	            return Math.abs(this.scale.y) * this._texture.orig.height;
	        },
	        set: function (value) {
	            var s = sign$1(this.scale.y) || 1;
	            this.scale.y = s * value / this._texture.orig.height;
	            this._height = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Sprite.prototype, "anchor", {
	        
	        get: function () {
	            return this._anchor;
	        },
	        set: function (value) {
	            this._anchor.copyFrom(value);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Sprite.prototype, "tint", {
	        
	        get: function () {
	            return this._tint;
	        },
	        set: function (value) {
	            this._tint = value;
	            this._tintRGB = (value >> 16) + (value & 0xff00) + ((value & 0xff) << 16);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Sprite.prototype, "texture", {
	        
	        get: function () {
	            return this._texture;
	        },
	        set: function (value) {
	            if (this._texture === value) {
	                return;
	            }
	            if (this._texture) {
	                this._texture.off('update', this._onTextureUpdate, this);
	            }
	            this._texture = value || Texture.EMPTY;
	            this._cachedTint = 0xFFFFFF;
	            this._textureID = -1;
	            this._textureTrimmedID = -1;
	            if (value) {
	                
	                if (value.baseTexture.valid) {
	                    this._onTextureUpdate();
	                }
	                else {
	                    value.once('update', this._onTextureUpdate, this);
	                }
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return Sprite;
	}(Container));

	

	
	

	var extendStatics$7 = function(d, b) {
	    extendStatics$7 = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$7(d, b);
	};

	function __extends$7(d, b) {
	    extendStatics$7(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	

	(function (TEXT_GRADIENT) {
	    TEXT_GRADIENT[TEXT_GRADIENT["LINEAR_VERTICAL"] = 0] = "LINEAR_VERTICAL";
	    TEXT_GRADIENT[TEXT_GRADIENT["LINEAR_HORIZONTAL"] = 1] = "LINEAR_HORIZONTAL";
	})(exports.TEXT_GRADIENT || (exports.TEXT_GRADIENT = {}));

	
	var defaultStyle = {
	    align: 'left',
	    breakWords: false,
	    dropShadow: false,
	    dropShadowAlpha: 1,
	    dropShadowAngle: Math.PI / 6,
	    dropShadowBlur: 0,
	    dropShadowColor: 'black',
	    dropShadowDistance: 5,
	    fill: 'black',
	    fillGradientType: exports.TEXT_GRADIENT.LINEAR_VERTICAL,
	    fillGradientStops: [],
	    fontFamily: 'Arial',
	    fontSize: 26,
	    fontStyle: 'normal',
	    fontVariant: 'normal',
	    fontWeight: 'normal',
	    letterSpacing: 0,
	    lineHeight: 0,
	    lineJoin: 'miter',
	    miterLimit: 10,
	    padding: 0,
	    stroke: 'black',
	    strokeThickness: 0,
	    textBaseline: 'alphabetic',
	    trim: false,
	    whiteSpace: 'pre',
	    wordWrap: false,
	    wordWrapWidth: 100,
	    leading: 0,
	};
	var genericFontFamilies = [
	    'serif',
	    'sans-serif',
	    'monospace',
	    'cursive',
	    'fantasy',
	    'system-ui' ];
	
	var TextStyle =  (function () {
	    
	    function TextStyle(style) {
	        this.styleID = 0;
	        this.reset();
	        deepCopyProperties(this, style, style);
	    }
	    
	    TextStyle.prototype.clone = function () {
	        var clonedProperties = {};
	        deepCopyProperties(clonedProperties, this, defaultStyle);
	        return new TextStyle(clonedProperties);
	    };
	    
	    TextStyle.prototype.reset = function () {
	        deepCopyProperties(this, defaultStyle, defaultStyle);
	    };
	    Object.defineProperty(TextStyle.prototype, "align", {
	        
	        get: function () {
	            return this._align;
	        },
	        set: function (align) {
	            if (this._align !== align) {
	                this._align = align;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "breakWords", {
	        
	        get: function () {
	            return this._breakWords;
	        },
	        set: function (breakWords) {
	            if (this._breakWords !== breakWords) {
	                this._breakWords = breakWords;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "dropShadow", {
	        
	        get: function () {
	            return this._dropShadow;
	        },
	        set: function (dropShadow) {
	            if (this._dropShadow !== dropShadow) {
	                this._dropShadow = dropShadow;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "dropShadowAlpha", {
	        
	        get: function () {
	            return this._dropShadowAlpha;
	        },
	        set: function (dropShadowAlpha) {
	            if (this._dropShadowAlpha !== dropShadowAlpha) {
	                this._dropShadowAlpha = dropShadowAlpha;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "dropShadowAngle", {
	        
	        get: function () {
	            return this._dropShadowAngle;
	        },
	        set: function (dropShadowAngle) {
	            if (this._dropShadowAngle !== dropShadowAngle) {
	                this._dropShadowAngle = dropShadowAngle;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "dropShadowBlur", {
	        
	        get: function () {
	            return this._dropShadowBlur;
	        },
	        set: function (dropShadowBlur) {
	            if (this._dropShadowBlur !== dropShadowBlur) {
	                this._dropShadowBlur = dropShadowBlur;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "dropShadowColor", {
	        
	        get: function () {
	            return this._dropShadowColor;
	        },
	        set: function (dropShadowColor) {
	            var outputColor = getColor(dropShadowColor);
	            if (this._dropShadowColor !== outputColor) {
	                this._dropShadowColor = outputColor;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "dropShadowDistance", {
	        
	        get: function () {
	            return this._dropShadowDistance;
	        },
	        set: function (dropShadowDistance) {
	            if (this._dropShadowDistance !== dropShadowDistance) {
	                this._dropShadowDistance = dropShadowDistance;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "fill", {
	        
	        get: function () {
	            return this._fill;
	        },
	        set: function (fill) {
	            
	            
	            
	            
	            
	            var outputColor = getColor(fill);
	            if (this._fill !== outputColor) {
	                this._fill = outputColor;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "fillGradientType", {
	        
	        get: function () {
	            return this._fillGradientType;
	        },
	        set: function (fillGradientType) {
	            if (this._fillGradientType !== fillGradientType) {
	                this._fillGradientType = fillGradientType;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "fillGradientStops", {
	        
	        get: function () {
	            return this._fillGradientStops;
	        },
	        set: function (fillGradientStops) {
	            if (!areArraysEqual(this._fillGradientStops, fillGradientStops)) {
	                this._fillGradientStops = fillGradientStops;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "fontFamily", {
	        
	        get: function () {
	            return this._fontFamily;
	        },
	        set: function (fontFamily) {
	            if (this.fontFamily !== fontFamily) {
	                this._fontFamily = fontFamily;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "fontSize", {
	        
	        get: function () {
	            return this._fontSize;
	        },
	        set: function (fontSize) {
	            if (this._fontSize !== fontSize) {
	                this._fontSize = fontSize;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "fontStyle", {
	        
	        get: function () {
	            return this._fontStyle;
	        },
	        set: function (fontStyle) {
	            if (this._fontStyle !== fontStyle) {
	                this._fontStyle = fontStyle;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "fontVariant", {
	        
	        get: function () {
	            return this._fontVariant;
	        },
	        set: function (fontVariant) {
	            if (this._fontVariant !== fontVariant) {
	                this._fontVariant = fontVariant;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "fontWeight", {
	        
	        get: function () {
	            return this._fontWeight;
	        },
	        set: function (fontWeight) {
	            if (this._fontWeight !== fontWeight) {
	                this._fontWeight = fontWeight;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "letterSpacing", {
	        
	        get: function () {
	            return this._letterSpacing;
	        },
	        set: function (letterSpacing) {
	            if (this._letterSpacing !== letterSpacing) {
	                this._letterSpacing = letterSpacing;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "lineHeight", {
	        
	        get: function () {
	            return this._lineHeight;
	        },
	        set: function (lineHeight) {
	            if (this._lineHeight !== lineHeight) {
	                this._lineHeight = lineHeight;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "leading", {
	        
	        get: function () {
	            return this._leading;
	        },
	        set: function (leading) {
	            if (this._leading !== leading) {
	                this._leading = leading;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "lineJoin", {
	        
	        get: function () {
	            return this._lineJoin;
	        },
	        set: function (lineJoin) {
	            if (this._lineJoin !== lineJoin) {
	                this._lineJoin = lineJoin;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "miterLimit", {
	        
	        get: function () {
	            return this._miterLimit;
	        },
	        set: function (miterLimit) {
	            if (this._miterLimit !== miterLimit) {
	                this._miterLimit = miterLimit;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "padding", {
	        
	        get: function () {
	            return this._padding;
	        },
	        set: function (padding) {
	            if (this._padding !== padding) {
	                this._padding = padding;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "stroke", {
	        
	        get: function () {
	            return this._stroke;
	        },
	        set: function (stroke) {
	            
	            
	            
	            var outputColor = getColor(stroke);
	            if (this._stroke !== outputColor) {
	                this._stroke = outputColor;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "strokeThickness", {
	        
	        get: function () {
	            return this._strokeThickness;
	        },
	        set: function (strokeThickness) {
	            if (this._strokeThickness !== strokeThickness) {
	                this._strokeThickness = strokeThickness;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "textBaseline", {
	        
	        get: function () {
	            return this._textBaseline;
	        },
	        set: function (textBaseline) {
	            if (this._textBaseline !== textBaseline) {
	                this._textBaseline = textBaseline;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "trim", {
	        
	        get: function () {
	            return this._trim;
	        },
	        set: function (trim) {
	            if (this._trim !== trim) {
	                this._trim = trim;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "whiteSpace", {
	        
	        get: function () {
	            return this._whiteSpace;
	        },
	        set: function (whiteSpace) {
	            if (this._whiteSpace !== whiteSpace) {
	                this._whiteSpace = whiteSpace;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "wordWrap", {
	        
	        get: function () {
	            return this._wordWrap;
	        },
	        set: function (wordWrap) {
	            if (this._wordWrap !== wordWrap) {
	                this._wordWrap = wordWrap;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TextStyle.prototype, "wordWrapWidth", {
	        
	        get: function () {
	            return this._wordWrapWidth;
	        },
	        set: function (wordWrapWidth) {
	            if (this._wordWrapWidth !== wordWrapWidth) {
	                this._wordWrapWidth = wordWrapWidth;
	                this.styleID++;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    TextStyle.prototype.toFontString = function () {
	        
	        var fontSizeString = (typeof this.fontSize === 'number') ? this.fontSize + "px" : this.fontSize;
	        
	        
	        var fontFamilies = this.fontFamily;
	        if (!Array.isArray(this.fontFamily)) {
	            fontFamilies = this.fontFamily.split(',');
	        }
	        for (var i = fontFamilies.length - 1; i >= 0; i--) {
	            
	            var fontFamily = fontFamilies[i].trim();
	            
	            if (!(/([\"\'])[^\'\"]+\1/).test(fontFamily) && genericFontFamilies.indexOf(fontFamily) < 0) {
	                fontFamily = "\"" + fontFamily + "\"";
	            }
	            fontFamilies[i] = fontFamily;
	        }
	        return this.fontStyle + " " + this.fontVariant + " " + this.fontWeight + " " + fontSizeString + " " + fontFamilies.join(',');
	    };
	    return TextStyle;
	}());
	
	function getSingleColor(color) {
	    if (typeof color === 'number') {
	        return hex2string(color);
	    }
	    else if (typeof color === 'string') {
	        if (color.indexOf('0x') === 0) {
	            color = color.replace('0x', '#');
	        }
	    }
	    return color;
	}
	function getColor(color) {
	    if (!Array.isArray(color)) {
	        return getSingleColor(color);
	    }
	    else {
	        for (var i = 0; i < color.length; ++i) {
	            color[i] = getSingleColor(color[i]);
	        }
	        return color;
	    }
	}
	
	function areArraysEqual(array1, array2) {
	    if (!Array.isArray(array1) || !Array.isArray(array2)) {
	        return false;
	    }
	    if (array1.length !== array2.length) {
	        return false;
	    }
	    for (var i = 0; i < array1.length; ++i) {
	        if (array1[i] !== array2[i]) {
	            return false;
	        }
	    }
	    return true;
	}
	
	function deepCopyProperties(target, source, propertyObj) {
	    for (var prop in propertyObj) {
	        if (Array.isArray(source[prop])) {
	            target[prop] = source[prop].slice();
	        }
	        else {
	            target[prop] = source[prop];
	        }
	    }
	}

	
	var TextMetrics =  (function () {
	    
	    function TextMetrics(text, style, width, height, lines, lineWidths, lineHeight, maxLineWidth, fontProperties) {
	        
	        this.text = text;
	        
	        this.style = style;
	        
	        this.width = width;
	        
	        this.height = height;
	        
	        this.lines = lines;
	        
	        this.lineWidths = lineWidths;
	        
	        this.lineHeight = lineHeight;
	        
	        this.maxLineWidth = maxLineWidth;
	        
	        this.fontProperties = fontProperties;
	    }
	    
	    TextMetrics.measureText = function (text, style, wordWrap, canvas) {
	        if (canvas === void 0) { canvas = TextMetrics._canvas; }
	        wordWrap = (wordWrap === undefined || wordWrap === null) ? style.wordWrap : wordWrap;
	        var font = style.toFontString();
	        var fontProperties = TextMetrics.measureFont(font);
	        
	        
	        if (fontProperties.fontSize === 0) {
	            fontProperties.fontSize = style.fontSize;
	            fontProperties.ascent = style.fontSize;
	        }
	        var context = canvas.getContext('2d');
	        context.font = font;
	        var outputText = wordWrap ? TextMetrics.wordWrap(text, style, canvas) : text;
	        var lines = outputText.split(/(?:\r\n|\r|\n)/);
	        var lineWidths = new Array(lines.length);
	        var maxLineWidth = 0;
	        for (var i = 0; i < lines.length; i++) {
	            var lineWidth = context.measureText(lines[i]).width + ((lines[i].length - 1) * style.letterSpacing);
	            lineWidths[i] = lineWidth;
	            maxLineWidth = Math.max(maxLineWidth, lineWidth);
	        }
	        var width = maxLineWidth + style.strokeThickness;
	        if (style.dropShadow) {
	            width += style.dropShadowDistance;
	        }
	        var lineHeight = style.lineHeight || fontProperties.fontSize + style.strokeThickness;
	        var height = Math.max(lineHeight, fontProperties.fontSize + style.strokeThickness)
	            + ((lines.length - 1) * (lineHeight + style.leading));
	        if (style.dropShadow) {
	            height += style.dropShadowDistance;
	        }
	        return new TextMetrics(text, style, width, height, lines, lineWidths, lineHeight + style.leading, maxLineWidth, fontProperties);
	    };
	    
	    TextMetrics.wordWrap = function (text, style, canvas) {
	        if (canvas === void 0) { canvas = TextMetrics._canvas; }
	        var context = canvas.getContext('2d');
	        var width = 0;
	        var line = '';
	        var lines = '';
	        var cache = Object.create(null);
	        var letterSpacing = style.letterSpacing, whiteSpace = style.whiteSpace;
	        
	        var collapseSpaces = TextMetrics.collapseSpaces(whiteSpace);
	        var collapseNewlines = TextMetrics.collapseNewlines(whiteSpace);
	        
	        var canPrependSpaces = !collapseSpaces;
	        
	        
	        
	        
	        
	        
	        var wordWrapWidth = style.wordWrapWidth + letterSpacing;
	        
	        var tokens = TextMetrics.tokenize(text);
	        for (var i = 0; i < tokens.length; i++) {
	            
	            var token = tokens[i];
	            
	            if (TextMetrics.isNewline(token)) {
	                
	                if (!collapseNewlines) {
	                    lines += TextMetrics.addLine(line);
	                    canPrependSpaces = !collapseSpaces;
	                    line = '';
	                    width = 0;
	                    continue;
	                }
	                
	                
	                token = ' ';
	            }
	            
	            if (collapseSpaces) {
	                
	                var currIsBreakingSpace = TextMetrics.isBreakingSpace(token);
	                var lastIsBreakingSpace = TextMetrics.isBreakingSpace(line[line.length - 1]);
	                if (currIsBreakingSpace && lastIsBreakingSpace) {
	                    continue;
	                }
	            }
	            
	            var tokenWidth = TextMetrics.getFromCache(token, letterSpacing, cache, context);
	            
	            if (tokenWidth > wordWrapWidth) {
	                
	                if (line !== '') {
	                    
	                    lines += TextMetrics.addLine(line);
	                    line = '';
	                    width = 0;
	                }
	                
	                if (TextMetrics.canBreakWords(token, style.breakWords)) {
	                    
	                    var characters = TextMetrics.wordWrapSplit(token);
	                    
	                    for (var j = 0; j < characters.length; j++) {
	                        var char = characters[j];
	                        var k = 1;
	                        
	                        while (characters[j + k]) {
	                            var nextChar = characters[j + k];
	                            var lastChar = char[char.length - 1];
	                            
	                            if (!TextMetrics.canBreakChars(lastChar, nextChar, token, j, style.breakWords)) {
	                                
	                                char += nextChar;
	                            }
	                            else {
	                                break;
	                            }
	                            k++;
	                        }
	                        j += char.length - 1;
	                        var characterWidth = TextMetrics.getFromCache(char, letterSpacing, cache, context);
	                        if (characterWidth + width > wordWrapWidth) {
	                            lines += TextMetrics.addLine(line);
	                            canPrependSpaces = false;
	                            line = '';
	                            width = 0;
	                        }
	                        line += char;
	                        width += characterWidth;
	                    }
	                }
	                
	                else {
	                    
	                    
	                    if (line.length > 0) {
	                        lines += TextMetrics.addLine(line);
	                        line = '';
	                        width = 0;
	                    }
	                    var isLastToken = i === tokens.length - 1;
	                    
	                    lines += TextMetrics.addLine(token, !isLastToken);
	                    canPrependSpaces = false;
	                    line = '';
	                    width = 0;
	                }
	            }
	            
	            else {
	                
	                
	                if (tokenWidth + width > wordWrapWidth) {
	                    
	                    canPrependSpaces = false;
	                    
	                    lines += TextMetrics.addLine(line);
	                    
	                    line = '';
	                    width = 0;
	                }
	                
	                if (line.length > 0 || !TextMetrics.isBreakingSpace(token) || canPrependSpaces) {
	                    
	                    line += token;
	                    
	                    width += tokenWidth;
	                }
	            }
	        }
	        lines += TextMetrics.addLine(line, false);
	        return lines;
	    };
	    
	    TextMetrics.addLine = function (line, newLine) {
	        if (newLine === void 0) { newLine = true; }
	        line = TextMetrics.trimRight(line);
	        line = (newLine) ? line + "\n" : line;
	        return line;
	    };
	    
	    TextMetrics.getFromCache = function (key, letterSpacing, cache, context) {
	        var width = cache[key];
	        if (typeof width !== 'number') {
	            var spacing = ((key.length) * letterSpacing);
	            width = context.measureText(key).width + spacing;
	            cache[key] = width;
	        }
	        return width;
	    };
	    
	    TextMetrics.collapseSpaces = function (whiteSpace) {
	        return (whiteSpace === 'normal' || whiteSpace === 'pre-line');
	    };
	    
	    TextMetrics.collapseNewlines = function (whiteSpace) {
	        return (whiteSpace === 'normal');
	    };
	    
	    TextMetrics.trimRight = function (text) {
	        if (typeof text !== 'string') {
	            return '';
	        }
	        for (var i = text.length - 1; i >= 0; i--) {
	            var char = text[i];
	            if (!TextMetrics.isBreakingSpace(char)) {
	                break;
	            }
	            text = text.slice(0, -1);
	        }
	        return text;
	    };
	    
	    TextMetrics.isNewline = function (char) {
	        if (typeof char !== 'string') {
	            return false;
	        }
	        return (TextMetrics._newlines.indexOf(char.charCodeAt(0)) >= 0);
	    };
	    
	    TextMetrics.isBreakingSpace = function (char) {
	        if (typeof char !== 'string') {
	            return false;
	        }
	        return (TextMetrics._breakingSpaces.indexOf(char.charCodeAt(0)) >= 0);
	    };
	    
	    TextMetrics.tokenize = function (text) {
	        var tokens = [];
	        var token = '';
	        if (typeof text !== 'string') {
	            return tokens;
	        }
	        for (var i = 0; i < text.length; i++) {
	            var char = text[i];
	            if (TextMetrics.isBreakingSpace(char) || TextMetrics.isNewline(char)) {
	                if (token !== '') {
	                    tokens.push(token);
	                    token = '';
	                }
	                tokens.push(char);
	                continue;
	            }
	            token += char;
	        }
	        if (token !== '') {
	            tokens.push(token);
	        }
	        return tokens;
	    };
	    
	    TextMetrics.canBreakWords = function (_token, breakWords) {
	        return breakWords;
	    };
	    
	    TextMetrics.canBreakChars = function (_char, _nextChar, _token, _index, _breakWords) {
	        return true;
	    };
	    
	    TextMetrics.wordWrapSplit = function (token) {
	        return token.split('');
	    };
	    
	    TextMetrics.measureFont = function (font) {
	        
	        if (TextMetrics._fonts[font]) {
	            return TextMetrics._fonts[font];
	        }
	        var properties = {
	            ascent: 0,
	            descent: 0,
	            fontSize: 0,
	        };
	        var canvas = TextMetrics._canvas;
	        var context = TextMetrics._context;
	        context.font = font;
	        var metricsString = TextMetrics.METRICS_STRING + TextMetrics.BASELINE_SYMBOL;
	        var width = Math.ceil(context.measureText(metricsString).width);
	        var baseline = Math.ceil(context.measureText(TextMetrics.BASELINE_SYMBOL).width);
	        var height = 2 * baseline;
	        baseline = baseline * TextMetrics.BASELINE_MULTIPLIER | 0;
	        canvas.width = width;
	        canvas.height = height;
	        context.fillStyle = '#f00';
	        context.fillRect(0, 0, width, height);
	        context.font = font;
	        context.textBaseline = 'alphabetic';
	        context.fillStyle = '#000';
	        context.fillText(metricsString, 0, baseline);
	        var imagedata = context.getImageData(0, 0, width, height).data;
	        var pixels = imagedata.length;
	        var line = width * 4;
	        var i = 0;
	        var idx = 0;
	        var stop = false;
	        
	        for (i = 0; i < baseline; ++i) {
	            for (var j = 0; j < line; j += 4) {
	                if (imagedata[idx + j] !== 255) {
	                    stop = true;
	                    break;
	                }
	            }
	            if (!stop) {
	                idx += line;
	            }
	            else {
	                break;
	            }
	        }
	        properties.ascent = baseline - i;
	        idx = pixels - line;
	        stop = false;
	        
	        for (i = height; i > baseline; --i) {
	            for (var j = 0; j < line; j += 4) {
	                if (imagedata[idx + j] !== 255) {
	                    stop = true;
	                    break;
	                }
	            }
	            if (!stop) {
	                idx -= line;
	            }
	            else {
	                break;
	            }
	        }
	        properties.descent = i - baseline;
	        properties.fontSize = properties.ascent + properties.descent;
	        TextMetrics._fonts[font] = properties;
	        return properties;
	    };
	    
	    TextMetrics.clearMetrics = function (font) {
	        if (font === void 0) { font = ''; }
	        if (font) {
	            delete TextMetrics._fonts[font];
	        }
	        else {
	            TextMetrics._fonts = {};
	        }
	    };
	    return TextMetrics;
	}());
	
	var canvas = (function () {
	    try {
	        
	        var c = new OffscreenCanvas(0, 0);
	        var context = c.getContext('2d');
	        if (context && context.measureText) {
	            return c;
	        }
	        return document.createElement('canvas');
	    }
	    catch (ex) {
	        return document.createElement('canvas');
	    }
	})();
	canvas.width = canvas.height = 10;
	
	TextMetrics._canvas = canvas;
	
	TextMetrics._context = canvas.getContext('2d');
	
	TextMetrics._fonts = {};
	
	TextMetrics.METRICS_STRING = '|ÉqÅ';
	
	TextMetrics.BASELINE_SYMBOL = 'M';
	
	TextMetrics.BASELINE_MULTIPLIER = 1.4;
	
	TextMetrics._newlines = [
	    0x000A,
	    0x000D ];
	
	TextMetrics._breakingSpaces = [
	    0x0009,
	    0x0020,
	    0x2000,
	    0x2001,
	    0x2002,
	    0x2003,
	    0x2004,
	    0x2005,
	    0x2006,
	    0x2008,
	    0x2009,
	    0x200A,
	    0x205F,
	    0x3000 ];
	

	var defaultDestroyOptions = {
	    texture: true,
	    children: false,
	    baseTexture: true,
	};
	
	var Text =  (function (_super) {
	    __extends$7(Text, _super);
	    
	    function Text(text, style, canvas) {
	        var _this = this;
	        var ownCanvas = false;
	        if (!canvas) {
	            canvas = document.createElement('canvas');
	            ownCanvas = true;
	        }
	        canvas.width = 3;
	        canvas.height = 3;
	        var texture = Texture.from(canvas);
	        texture.orig = new Rectangle();
	        texture.trim = new Rectangle();
	        _this = _super.call(this, texture) || this;
	        
	        _this._ownCanvas = ownCanvas;
	        
	        _this.canvas = canvas;
	        
	        _this.context = _this.canvas.getContext('2d');
	        
	        _this._resolution = settings.RESOLUTION;
	        _this._autoResolution = true;
	        
	        _this._text = null;
	        
	        _this._style = null;
	        
	        _this._styleListener = null;
	        
	        _this._font = '';
	        _this.text = text;
	        _this.style = style;
	        _this.localStyleID = -1;
	        return _this;
	    }
	    
	    Text.prototype.updateText = function (respectDirty) {
	        var style = this._style;
	        
	        if (this.localStyleID !== style.styleID) {
	            this.dirty = true;
	            this.localStyleID = style.styleID;
	        }
	        if (!this.dirty && respectDirty) {
	            return;
	        }
	        this._font = this._style.toFontString();
	        var context = this.context;
	        var measured = TextMetrics.measureText(this._text || ' ', this._style, this._style.wordWrap, this.canvas);
	        var width = measured.width;
	        var height = measured.height;
	        var lines = measured.lines;
	        var lineHeight = measured.lineHeight;
	        var lineWidths = measured.lineWidths;
	        var maxLineWidth = measured.maxLineWidth;
	        var fontProperties = measured.fontProperties;
	        this.canvas.width = Math.ceil((Math.max(1, width) + (style.padding * 2)) * this._resolution);
	        this.canvas.height = Math.ceil((Math.max(1, height) + (style.padding * 2)) * this._resolution);
	        context.scale(this._resolution, this._resolution);
	        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	        context.font = this._font;
	        context.lineWidth = style.strokeThickness;
	        context.textBaseline = style.textBaseline;
	        context.lineJoin = style.lineJoin;
	        context.miterLimit = style.miterLimit;
	        var linePositionX;
	        var linePositionY;
	        
	        var passesCount = style.dropShadow ? 2 : 1;
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        
	        for (var i = 0; i < passesCount; ++i) {
	            var isShadowPass = style.dropShadow && i === 0;
	            
	            var dsOffsetText = isShadowPass ? Math.ceil(Math.max(1, height) + (style.padding * 2)) : 0;
	            var dsOffsetShadow = dsOffsetText * this._resolution;
	            if (isShadowPass) {
	                
	                
	                
	                context.fillStyle = 'black';
	                context.strokeStyle = 'black';
	                var dropShadowColor = style.dropShadowColor;
	                var rgb = hex2rgb(typeof dropShadowColor === 'number' ? dropShadowColor : string2hex(dropShadowColor));
	                var dropShadowBlur = style.dropShadowBlur * this._resolution;
	                var dropShadowDistance = style.dropShadowDistance * this._resolution;
	                context.shadowColor = "rgba(" + rgb[0] * 255 + "," + rgb[1] * 255 + "," + rgb[2] * 255 + "," + style.dropShadowAlpha + ")";
	                context.shadowBlur = dropShadowBlur;
	                context.shadowOffsetX = Math.cos(style.dropShadowAngle) * dropShadowDistance;
	                context.shadowOffsetY = (Math.sin(style.dropShadowAngle) * dropShadowDistance) + dsOffsetShadow;
	            }
	            else {
	                
	                context.fillStyle = this._generateFillStyle(style, lines, measured);
	                
	                
	                
	                context.strokeStyle = style.stroke;
	                context.shadowColor = 'black';
	                context.shadowBlur = 0;
	                context.shadowOffsetX = 0;
	                context.shadowOffsetY = 0;
	            }
	            
	            for (var i_1 = 0; i_1 < lines.length; i_1++) {
	                linePositionX = style.strokeThickness / 2;
	                linePositionY = ((style.strokeThickness / 2) + (i_1 * lineHeight)) + fontProperties.ascent;
	                if (style.align === 'right') {
	                    linePositionX += maxLineWidth - lineWidths[i_1];
	                }
	                else if (style.align === 'center') {
	                    linePositionX += (maxLineWidth - lineWidths[i_1]) / 2;
	                }
	                if (style.stroke && style.strokeThickness) {
	                    this.drawLetterSpacing(lines[i_1], linePositionX + style.padding, linePositionY + style.padding - dsOffsetText, true);
	                }
	                if (style.fill) {
	                    this.drawLetterSpacing(lines[i_1], linePositionX + style.padding, linePositionY + style.padding - dsOffsetText);
	                }
	            }
	        }
	        this.updateTexture();
	    };
	    
	    Text.prototype.drawLetterSpacing = function (text, x, y, isStroke) {
	        if (isStroke === void 0) { isStroke = false; }
	        var style = this._style;
	        
	        var letterSpacing = style.letterSpacing;
	        if (letterSpacing === 0) {
	            if (isStroke) {
	                this.context.strokeText(text, x, y);
	            }
	            else {
	                this.context.fillText(text, x, y);
	            }
	            return;
	        }
	        var currentPosition = x;
	        
	        
	        
	        
	        
	        
	        var stringArray = Array.from ? Array.from(text) : text.split('');
	        var previousWidth = this.context.measureText(text).width;
	        var currentWidth = 0;
	        for (var i = 0; i < stringArray.length; ++i) {
	            var currentChar = stringArray[i];
	            if (isStroke) {
	                this.context.strokeText(currentChar, currentPosition, y);
	            }
	            else {
	                this.context.fillText(currentChar, currentPosition, y);
	            }
	            currentWidth = this.context.measureText(text.substring(i + 1)).width;
	            currentPosition += previousWidth - currentWidth + letterSpacing;
	            previousWidth = currentWidth;
	        }
	    };
	    
	    Text.prototype.updateTexture = function () {
	        var canvas = this.canvas;
	        if (this._style.trim) {
	            var trimmed = trimCanvas(canvas);
	            if (trimmed.data) {
	                canvas.width = trimmed.width;
	                canvas.height = trimmed.height;
	                this.context.putImageData(trimmed.data, 0, 0);
	            }
	        }
	        var texture = this._texture;
	        var style = this._style;
	        var padding = style.trim ? 0 : style.padding;
	        var baseTexture = texture.baseTexture;
	        texture.trim.width = texture._frame.width = Math.ceil(canvas.width / this._resolution);
	        texture.trim.height = texture._frame.height = Math.ceil(canvas.height / this._resolution);
	        texture.trim.x = -padding;
	        texture.trim.y = -padding;
	        texture.orig.width = texture._frame.width - (padding * 2);
	        texture.orig.height = texture._frame.height - (padding * 2);
	        
	        this._onTextureUpdate();
	        baseTexture.setRealSize(canvas.width, canvas.height, this._resolution);
	        
	        this._recursivePostUpdateTransform();
	        this.dirty = false;
	    };
	    
	    Text.prototype._render = function (renderer) {
	        if (this._autoResolution && this._resolution !== renderer.resolution) {
	            this._resolution = renderer.resolution;
	            this.dirty = true;
	        }
	        this.updateText(true);
	        _super.prototype._render.call(this, renderer);
	    };
	    
	    Text.prototype.getLocalBounds = function (rect) {
	        this.updateText(true);
	        return _super.prototype.getLocalBounds.call(this, rect);
	    };
	    
	    Text.prototype._calculateBounds = function () {
	        this.updateText(true);
	        this.calculateVertices();
	        
	        this._bounds.addQuad(this.vertexData);
	    };
	    
	    Text.prototype._generateFillStyle = function (style, lines, metrics) {
	        
	        
	        
	        var fillStyle = style.fill;
	        if (!Array.isArray(fillStyle)) {
	            return fillStyle;
	        }
	        else if (fillStyle.length === 1) {
	            return fillStyle[0];
	        }
	        
	        
	        var gradient;
	        
	        
	        var dropShadowCorrection = (style.dropShadow) ? style.dropShadowDistance : 0;
	        
	        var padding = style.padding || 0;
	        var width = Math.ceil(this.canvas.width / this._resolution) - dropShadowCorrection - (padding * 2);
	        var height = Math.ceil(this.canvas.height / this._resolution) - dropShadowCorrection - (padding * 2);
	        
	        var fill = fillStyle.slice();
	        var fillGradientStops = style.fillGradientStops.slice();
	        
	        if (!fillGradientStops.length) {
	            var lengthPlus1 = fill.length + 1;
	            for (var i = 1; i < lengthPlus1; ++i) {
	                fillGradientStops.push(i / lengthPlus1);
	            }
	        }
	        
	        
	        fill.unshift(fillStyle[0]);
	        fillGradientStops.unshift(0);
	        fill.push(fillStyle[fillStyle.length - 1]);
	        fillGradientStops.push(1);
	        if (style.fillGradientType === exports.TEXT_GRADIENT.LINEAR_VERTICAL) {
	            
	            gradient = this.context.createLinearGradient(width / 2, padding, width / 2, height + padding);
	            
	            
	            
	            
	            
	            
	            var lastIterationStop = 0;
	            
	            var textHeight = metrics.fontProperties.fontSize + style.strokeThickness;
	            
	            var gradStopLineHeight = textHeight / height;
	            for (var i = 0; i < lines.length; i++) {
	                var thisLineTop = metrics.lineHeight * i;
	                for (var j = 0; j < fill.length; j++) {
	                    
	                    var lineStop = 0;
	                    if (typeof fillGradientStops[j] === 'number') {
	                        lineStop = fillGradientStops[j];
	                    }
	                    else {
	                        lineStop = j / fill.length;
	                    }
	                    var globalStop = (thisLineTop / height) + (lineStop * gradStopLineHeight);
	                    
	                    var clampedStop = Math.max(lastIterationStop, globalStop);
	                    clampedStop = Math.min(clampedStop, 1); 
	                    gradient.addColorStop(clampedStop, fill[j]);
	                    lastIterationStop = clampedStop;
	                }
	            }
	        }
	        else {
	            
	            gradient = this.context.createLinearGradient(padding, height / 2, width + padding, height / 2);
	            
	            
	            var totalIterations = fill.length + 1;
	            var currentIteration = 1;
	            for (var i = 0; i < fill.length; i++) {
	                var stop = void 0;
	                if (typeof fillGradientStops[i] === 'number') {
	                    stop = fillGradientStops[i];
	                }
	                else {
	                    stop = currentIteration / totalIterations;
	                }
	                gradient.addColorStop(stop, fill[i]);
	                currentIteration++;
	            }
	        }
	        return gradient;
	    };
	    
	    Text.prototype.destroy = function (options) {
	        if (typeof options === 'boolean') {
	            options = { children: options };
	        }
	        options = Object.assign({}, defaultDestroyOptions, options);
	        _super.prototype.destroy.call(this, options);
	        
	        
	        if (this._ownCanvas) {
	            this.canvas.height = this.canvas.width = 0;
	        }
	        
	        this.context = null;
	        this.canvas = null;
	        this._style = null;
	    };
	    Object.defineProperty(Text.prototype, "width", {
	        
	        get: function () {
	            this.updateText(true);
	            return Math.abs(this.scale.x) * this._texture.orig.width;
	        },
	        set: function (value) {
	            this.updateText(true);
	            var s = sign$1(this.scale.x) || 1;
	            this.scale.x = s * value / this._texture.orig.width;
	            this._width = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Text.prototype, "height", {
	        
	        get: function () {
	            this.updateText(true);
	            return Math.abs(this.scale.y) * this._texture.orig.height;
	        },
	        set: function (value) {
	            this.updateText(true);
	            var s = sign$1(this.scale.y) || 1;
	            this.scale.y = s * value / this._texture.orig.height;
	            this._height = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Text.prototype, "style", {
	        
	        get: function () {
	            
	            
	            
	            return this._style;
	        },
	        set: function (style) {
	            style = style || {};
	            if (style instanceof TextStyle) {
	                this._style = style;
	            }
	            else {
	                this._style = new TextStyle(style);
	            }
	            this.localStyleID = -1;
	            this.dirty = true;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Text.prototype, "text", {
	        
	        get: function () {
	            return this._text;
	        },
	        set: function (text) {
	            text = String(text === null || text === undefined ? '' : text);
	            if (this._text === text) {
	                return;
	            }
	            this._text = text;
	            this.dirty = true;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Text.prototype, "resolution", {
	        
	        get: function () {
	            return this._resolution;
	        },
	        set: function (value) {
	            this._autoResolution = false;
	            if (this._resolution === value) {
	                return;
	            }
	            this._resolution = value;
	            this.dirty = true;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return Text;
	}(Sprite));

	

	
	settings.UPLOADS_PER_FRAME = 4;

	
	

	var extendStatics$8 = function(d, b) {
	    extendStatics$8 = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$8(d, b);
	};

	function __extends$8(d, b) {
	    extendStatics$8(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	
	var CountLimiter =  (function () {
	    
	    function CountLimiter(maxItemsPerFrame) {
	        
	        this.maxItemsPerFrame = maxItemsPerFrame;
	        
	        this.itemsLeft = 0;
	    }
	    
	    CountLimiter.prototype.beginFrame = function () {
	        this.itemsLeft = this.maxItemsPerFrame;
	    };
	    
	    CountLimiter.prototype.allowedToUpload = function () {
	        return this.itemsLeft-- > 0;
	    };
	    return CountLimiter;
	}());

	
	function findMultipleBaseTextures(item, queue) {
	    var result = false;
	    
	    if (item && item._textures && item._textures.length) {
	        for (var i = 0; i < item._textures.length; i++) {
	            if (item._textures[i] instanceof Texture) {
	                var baseTexture = item._textures[i].baseTexture;
	                if (queue.indexOf(baseTexture) === -1) {
	                    queue.push(baseTexture);
	                    result = true;
	                }
	            }
	        }
	    }
	    return result;
	}
	
	function findBaseTexture(item, queue) {
	    if (item.baseTexture instanceof BaseTexture) {
	        var texture = item.baseTexture;
	        if (queue.indexOf(texture) === -1) {
	            queue.push(texture);
	        }
	        return true;
	    }
	    return false;
	}
	
	function findTexture(item, queue) {
	    if (item._texture && item._texture instanceof Texture) {
	        var texture = item._texture.baseTexture;
	        if (queue.indexOf(texture) === -1) {
	            queue.push(texture);
	        }
	        return true;
	    }
	    return false;
	}
	
	function drawText(_helper, item) {
	    if (item instanceof Text) {
	        
	        item.updateText(true);
	        return true;
	    }
	    return false;
	}
	
	function calculateTextStyle(_helper, item) {
	    if (item instanceof TextStyle) {
	        var font = item.toFontString();
	        TextMetrics.measureFont(font);
	        return true;
	    }
	    return false;
	}
	
	function findText(item, queue) {
	    if (item instanceof Text) {
	        
	        if (queue.indexOf(item.style) === -1) {
	            queue.push(item.style);
	        }
	        
	        if (queue.indexOf(item) === -1) {
	            queue.push(item);
	        }
	        
	        var texture = item._texture.baseTexture;
	        if (queue.indexOf(texture) === -1) {
	            queue.push(texture);
	        }
	        return true;
	    }
	    return false;
	}
	
	function findTextStyle(item, queue) {
	    if (item instanceof TextStyle) {
	        if (queue.indexOf(item) === -1) {
	            queue.push(item);
	        }
	        return true;
	    }
	    return false;
	}
	
	var BasePrepare =  (function () {
	    
	    function BasePrepare(renderer) {
	        var _this = this;
	        
	        this.limiter = new CountLimiter(settings.UPLOADS_PER_FRAME);
	        
	        this.renderer = renderer;
	        
	        this.uploadHookHelper = null;
	        
	        this.queue = [];
	        
	        this.addHooks = [];
	        
	        this.uploadHooks = [];
	        
	        this.completes = [];
	        
	        this.ticking = false;
	        
	        this.delayedTick = function () {
	            
	            if (!_this.queue) {
	                return;
	            }
	            _this.prepareItems();
	        };
	        
	        this.registerFindHook(findText);
	        this.registerFindHook(findTextStyle);
	        this.registerFindHook(findMultipleBaseTextures);
	        this.registerFindHook(findBaseTexture);
	        this.registerFindHook(findTexture);
	        
	        this.registerUploadHook(drawText);
	        this.registerUploadHook(calculateTextStyle);
	    }
	    
	    BasePrepare.prototype.upload = function (item, done) {
	        if (typeof item === 'function') {
	            done = item;
	            item = null;
	        }
	        
	        
	        if (item) {
	            this.add(item);
	        }
	        
	        if (this.queue.length) {
	            if (done) {
	                this.completes.push(done);
	            }
	            if (!this.ticking) {
	                this.ticking = true;
	                Ticker.system.addOnce(this.tick, this, exports.UPDATE_PRIORITY.UTILITY);
	            }
	        }
	        else if (done) {
	            done();
	        }
	    };
	    
	    BasePrepare.prototype.tick = function () {
	        setTimeout(this.delayedTick, 0);
	    };
	    
	    BasePrepare.prototype.prepareItems = function () {
	        this.limiter.beginFrame();
	        
	        while (this.queue.length && this.limiter.allowedToUpload()) {
	            var item = this.queue[0];
	            var uploaded = false;
	            if (item && !item._destroyed) {
	                for (var i = 0, len = this.uploadHooks.length; i < len; i++) {
	                    if (this.uploadHooks[i](this.uploadHookHelper, item)) {
	                        this.queue.shift();
	                        uploaded = true;
	                        break;
	                    }
	                }
	            }
	            if (!uploaded) {
	                this.queue.shift();
	            }
	        }
	        
	        if (!this.queue.length) {
	            this.ticking = false;
	            var completes = this.completes.slice(0);
	            this.completes.length = 0;
	            for (var i = 0, len = completes.length; i < len; i++) {
	                completes[i]();
	            }
	        }
	        else {
	            
	            Ticker.system.addOnce(this.tick, this, exports.UPDATE_PRIORITY.UTILITY);
	        }
	    };
	    
	    BasePrepare.prototype.registerFindHook = function (addHook) {
	        if (addHook) {
	            this.addHooks.push(addHook);
	        }
	        return this;
	    };
	    
	    BasePrepare.prototype.registerUploadHook = function (uploadHook) {
	        if (uploadHook) {
	            this.uploadHooks.push(uploadHook);
	        }
	        return this;
	    };
	    
	    BasePrepare.prototype.add = function (item) {
	        
	        
	        for (var i = 0, len = this.addHooks.length; i < len; i++) {
	            if (this.addHooks[i](item, this.queue)) {
	                break;
	            }
	        }
	        
	        if (item instanceof Container) {
	            for (var i = item.children.length - 1; i >= 0; i--) {
	                this.add(item.children[i]);
	            }
	        }
	        return this;
	    };
	    
	    BasePrepare.prototype.destroy = function () {
	        if (this.ticking) {
	            Ticker.system.remove(this.tick, this);
	        }
	        this.ticking = false;
	        this.addHooks = null;
	        this.uploadHooks = null;
	        this.renderer = null;
	        this.completes = null;
	        this.queue = null;
	        this.limiter = null;
	        this.uploadHookHelper = null;
	    };
	    return BasePrepare;
	}());

	
	function uploadBaseTextures(renderer, item) {
	    if (item instanceof BaseTexture) {
	        
	        
	        
	        if (!item._glTextures[renderer.CONTEXT_UID]) {
	            renderer.texture.bind(item);
	        }
	        return true;
	    }
	    return false;
	}
	
	function uploadGraphics(renderer, item) {
	    if (!(item instanceof Graphics)) {
	        return false;
	    }
	    var geometry = item.geometry;
	    
	    item.finishPoly();
	    geometry.updateBatches();
	    var batches = geometry.batches;
	    
	    for (var i = 0; i < batches.length; i++) {
	        var texture = batches[i].style.texture;
	        if (texture) {
	            uploadBaseTextures(renderer, texture.baseTexture);
	        }
	    }
	    
	    if (!geometry.batchable) {
	        renderer.geometry.bind(geometry, item._resolveDirectShader(renderer));
	    }
	    return true;
	}
	
	function findGraphics(item, queue) {
	    if (item instanceof Graphics) {
	        queue.push(item);
	        return true;
	    }
	    return false;
	}
	
	var Prepare =  (function (_super) {
	    __extends$8(Prepare, _super);
	    
	    function Prepare(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        _this.uploadHookHelper = _this.renderer;
	        
	        _this.registerFindHook(findGraphics);
	        _this.registerUploadHook(uploadBaseTextures);
	        _this.registerUploadHook(uploadGraphics);
	        return _this;
	    }
	    return Prepare;
	}(BasePrepare));

	
	var TimeLimiter =  (function () {
	    
	    function TimeLimiter(maxMilliseconds) {
	        
	        this.maxMilliseconds = maxMilliseconds;
	        
	        this.frameStart = 0;
	    }
	    
	    TimeLimiter.prototype.beginFrame = function () {
	        this.frameStart = Date.now();
	    };
	    
	    TimeLimiter.prototype.allowedToUpload = function () {
	        return Date.now() - this.frameStart < this.maxMilliseconds;
	    };
	    return TimeLimiter;
	}());

	

	
	var Spritesheet =  (function () {
	    
	    function Spritesheet(texture, data, resolutionFilename) {
	        if (resolutionFilename === void 0) { resolutionFilename = null; }
	        
	        this._texture = texture instanceof Texture ? texture : null;
	        
	        this.baseTexture = texture instanceof BaseTexture ? texture : this._texture.baseTexture;
	        
	        this.textures = {};
	        
	        this.animations = {};
	        
	        this.data = data;
	        var resource = this.baseTexture.resource;
	        
	        this.resolution = this._updateResolution(resolutionFilename || (resource ? resource.url : null));
	        
	        this._frames = this.data.frames;
	        
	        this._frameKeys = Object.keys(this._frames);
	        
	        this._batchIndex = 0;
	        
	        this._callback = null;
	    }
	    
	    Spritesheet.prototype._updateResolution = function (resolutionFilename) {
	        if (resolutionFilename === void 0) { resolutionFilename = null; }
	        var scale = this.data.meta.scale;
	        
	        var resolution = getResolutionOfUrl(resolutionFilename, null);
	        
	        if (resolution === null) {
	            
	            resolution = scale !== undefined ? parseFloat(scale) : 1;
	        }
	        
	        if (resolution !== 1) {
	            this.baseTexture.setResolution(resolution);
	        }
	        return resolution;
	    };
	    
	    Spritesheet.prototype.parse = function (callback) {
	        this._batchIndex = 0;
	        this._callback = callback;
	        if (this._frameKeys.length <= Spritesheet.BATCH_SIZE) {
	            this._processFrames(0);
	            this._processAnimations();
	            this._parseComplete();
	        }
	        else {
	            this._nextBatch();
	        }
	    };
	    
	    Spritesheet.prototype._processFrames = function (initialFrameIndex) {
	        var frameIndex = initialFrameIndex;
	        var maxFrames = Spritesheet.BATCH_SIZE;
	        while (frameIndex - initialFrameIndex < maxFrames && frameIndex < this._frameKeys.length) {
	            var i = this._frameKeys[frameIndex];
	            var data = this._frames[i];
	            var rect = data.frame;
	            if (rect) {
	                var frame = null;
	                var trim = null;
	                var sourceSize = data.trimmed !== false && data.sourceSize
	                    ? data.sourceSize : data.frame;
	                var orig = new Rectangle(0, 0, Math.floor(sourceSize.w) / this.resolution, Math.floor(sourceSize.h) / this.resolution);
	                if (data.rotated) {
	                    frame = new Rectangle(Math.floor(rect.x) / this.resolution, Math.floor(rect.y) / this.resolution, Math.floor(rect.h) / this.resolution, Math.floor(rect.w) / this.resolution);
	                }
	                else {
	                    frame = new Rectangle(Math.floor(rect.x) / this.resolution, Math.floor(rect.y) / this.resolution, Math.floor(rect.w) / this.resolution, Math.floor(rect.h) / this.resolution);
	                }
	                
	                if (data.trimmed !== false && data.spriteSourceSize) {
	                    trim = new Rectangle(Math.floor(data.spriteSourceSize.x) / this.resolution, Math.floor(data.spriteSourceSize.y) / this.resolution, Math.floor(rect.w) / this.resolution, Math.floor(rect.h) / this.resolution);
	                }
	                this.textures[i] = new Texture(this.baseTexture, frame, orig, trim, data.rotated ? 2 : 0, data.anchor);
	                
	                Texture.addToCache(this.textures[i], i);
	            }
	            frameIndex++;
	        }
	    };
	    
	    Spritesheet.prototype._processAnimations = function () {
	        var animations = this.data.animations || {};
	        for (var animName in animations) {
	            this.animations[animName] = [];
	            for (var i = 0; i < animations[animName].length; i++) {
	                var frameName = animations[animName][i];
	                this.animations[animName].push(this.textures[frameName]);
	            }
	        }
	    };
	    
	    Spritesheet.prototype._parseComplete = function () {
	        var callback = this._callback;
	        this._callback = null;
	        this._batchIndex = 0;
	        callback.call(this, this.textures);
	    };
	    
	    Spritesheet.prototype._nextBatch = function () {
	        var _this = this;
	        this._processFrames(this._batchIndex * Spritesheet.BATCH_SIZE);
	        this._batchIndex++;
	        setTimeout(function () {
	            if (_this._batchIndex * Spritesheet.BATCH_SIZE < _this._frameKeys.length) {
	                _this._nextBatch();
	            }
	            else {
	                _this._processAnimations();
	                _this._parseComplete();
	            }
	        }, 0);
	    };
	    
	    Spritesheet.prototype.destroy = function (destroyBase) {
	        var _a;
	        if (destroyBase === void 0) { destroyBase = false; }
	        for (var i in this.textures) {
	            this.textures[i].destroy();
	        }
	        this._frames = null;
	        this._frameKeys = null;
	        this.data = null;
	        this.textures = null;
	        if (destroyBase) {
	            (_a = this._texture) === null || _a === void 0 ? void 0 : _a.destroy();
	            this.baseTexture.destroy();
	        }
	        this._texture = null;
	        this.baseTexture = null;
	    };
	    
	    Spritesheet.BATCH_SIZE = 1000;
	    return Spritesheet;
	}());

	
	var SpritesheetLoader =  (function () {
	    function SpritesheetLoader() {
	    }
	    
	    SpritesheetLoader.use = function (resource, next) {
	        
	        var loader = this;
	        var imageResourceName = resource.name + "_image";
	        
	        if (!resource.data
	            || resource.type !== LoaderResource.TYPE.JSON
	            || !resource.data.frames
	            || loader.resources[imageResourceName]) {
	            next();
	            return;
	        }
	        var loadOptions = {
	            crossOrigin: resource.crossOrigin,
	            metadata: resource.metadata.imageMetadata,
	            parentResource: resource,
	        };
	        var resourcePath = SpritesheetLoader.getResourcePath(resource, loader.baseUrl);
	        
	        loader.add(imageResourceName, resourcePath, loadOptions, function onImageLoad(res) {
	            if (res.error) {
	                next(res.error);
	                return;
	            }
	            var spritesheet = new Spritesheet(res.texture, resource.data, resource.url);
	            spritesheet.parse(function () {
	                resource.spritesheet = spritesheet;
	                resource.textures = spritesheet.textures;
	                next();
	            });
	        });
	    };
	    
	    SpritesheetLoader.getResourcePath = function (resource, baseUrl) {
	        
	        if (resource.isDataUrl) {
	            return resource.data.meta.image;
	        }
	        return url.resolve(resource.url.replace(baseUrl, ''), resource.data.meta.image);
	    };
	    return SpritesheetLoader;
	}());

	

	
	

	var extendStatics$9 = function(d, b) {
	    extendStatics$9 = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$9(d, b);
	};

	function __extends$9(d, b) {
	    extendStatics$9(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var tempPoint$1 = new Point();
	
	var TilingSprite =  (function (_super) {
	    __extends$9(TilingSprite, _super);
	    
	    function TilingSprite(texture, width, height) {
	        if (width === void 0) { width = 100; }
	        if (height === void 0) { height = 100; }
	        var _this = _super.call(this, texture) || this;
	        
	        _this.tileTransform = new Transform();
	        
	        _this._width = width;
	        
	        _this._height = height;
	        
	        _this.uvMatrix = _this.texture.uvMatrix || new TextureMatrix(texture);
	        
	        _this.pluginName = 'tilingSprite';
	        
	        _this.uvRespectAnchor = false;
	        return _this;
	    }
	    Object.defineProperty(TilingSprite.prototype, "clampMargin", {
	        
	        get: function () {
	            return this.uvMatrix.clampMargin;
	        },
	        set: function (value) {
	            this.uvMatrix.clampMargin = value;
	            this.uvMatrix.update(true);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TilingSprite.prototype, "tileScale", {
	        
	        get: function () {
	            return this.tileTransform.scale;
	        },
	        set: function (value) {
	            this.tileTransform.scale.copyFrom(value);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TilingSprite.prototype, "tilePosition", {
	        
	        get: function () {
	            return this.tileTransform.position;
	        },
	        set: function (value) {
	            this.tileTransform.position.copyFrom(value);
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    TilingSprite.prototype._onTextureUpdate = function () {
	        if (this.uvMatrix) {
	            this.uvMatrix.texture = this._texture;
	        }
	        this._cachedTint = 0xFFFFFF;
	    };
	    
	    TilingSprite.prototype._render = function (renderer) {
	        
	        var texture = this._texture;
	        if (!texture || !texture.valid) {
	            return;
	        }
	        this.tileTransform.updateLocalTransform();
	        this.uvMatrix.update();
	        renderer.batch.setObjectRenderer(renderer.plugins[this.pluginName]);
	        renderer.plugins[this.pluginName].render(this);
	    };
	    
	    TilingSprite.prototype._calculateBounds = function () {
	        var minX = this._width * -this._anchor._x;
	        var minY = this._height * -this._anchor._y;
	        var maxX = this._width * (1 - this._anchor._x);
	        var maxY = this._height * (1 - this._anchor._y);
	        this._bounds.addFrame(this.transform, minX, minY, maxX, maxY);
	    };
	    
	    TilingSprite.prototype.getLocalBounds = function (rect) {
	        
	        if (this.children.length === 0) {
	            this._bounds.minX = this._width * -this._anchor._x;
	            this._bounds.minY = this._height * -this._anchor._y;
	            this._bounds.maxX = this._width * (1 - this._anchor._x);
	            this._bounds.maxY = this._height * (1 - this._anchor._y);
	            if (!rect) {
	                if (!this._localBoundsRect) {
	                    this._localBoundsRect = new Rectangle();
	                }
	                rect = this._localBoundsRect;
	            }
	            return this._bounds.getRectangle(rect);
	        }
	        return _super.prototype.getLocalBounds.call(this, rect);
	    };
	    
	    TilingSprite.prototype.containsPoint = function (point) {
	        this.worldTransform.applyInverse(point, tempPoint$1);
	        var width = this._width;
	        var height = this._height;
	        var x1 = -width * this.anchor._x;
	        if (tempPoint$1.x >= x1 && tempPoint$1.x < x1 + width) {
	            var y1 = -height * this.anchor._y;
	            if (tempPoint$1.y >= y1 && tempPoint$1.y < y1 + height) {
	                return true;
	            }
	        }
	        return false;
	    };
	    
	    TilingSprite.prototype.destroy = function (options) {
	        _super.prototype.destroy.call(this, options);
	        this.tileTransform = null;
	        this.uvMatrix = null;
	    };
	    
	    TilingSprite.from = function (source, options) {
	        
	        if (typeof options === 'number') {
	            deprecation('5.3.0', 'TilingSprite.from use options instead of width and height args');
	            
	            options = { width: options, height: arguments[2] };
	        }
	        return new TilingSprite(Texture.from(source, options), options.width, options.height);
	    };
	    Object.defineProperty(TilingSprite.prototype, "width", {
	        
	        get: function () {
	            return this._width;
	        },
	        set: function (value) {
	            this._width = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(TilingSprite.prototype, "height", {
	        
	        get: function () {
	            return this._height;
	        },
	        set: function (value) {
	            this._height = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return TilingSprite;
	}(Sprite));

	var vertex$2 = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\nuniform mat3 translationMatrix;\nuniform mat3 uTransform;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = (uTransform * vec3(aTextureCoord, 1.0)).xy;\n}\n";

	var fragment$2 = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform vec4 uColor;\nuniform mat3 uMapCoord;\nuniform vec4 uClampFrame;\nuniform vec2 uClampOffset;\n\nvoid main(void)\n{\n    vec2 coord = vTextureCoord + ceil(uClampOffset - vTextureCoord);\n    coord = (uMapCoord * vec3(coord, 1.0)).xy;\n    coord = clamp(coord, uClampFrame.xy, uClampFrame.zw);\n\n    vec4 texSample = texture2D(uSampler, coord);\n    gl_FragColor = texSample * uColor;\n}\n";

	var fragmentSimple = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform vec4 uColor;\n\nvoid main(void)\n{\n    vec4 texSample = texture2D(uSampler, vTextureCoord);\n    gl_FragColor = texSample * uColor;\n}\n";

	var tempMat$1 = new Matrix();
	
	var TilingSpriteRenderer =  (function (_super) {
	    __extends$9(TilingSpriteRenderer, _super);
	    
	    function TilingSpriteRenderer(renderer) {
	        var _this = _super.call(this, renderer) || this;
	        var uniforms = { globals: _this.renderer.globalUniforms };
	        _this.shader = Shader.from(vertex$2, fragment$2, uniforms);
	        _this.simpleShader = Shader.from(vertex$2, fragmentSimple, uniforms);
	        _this.quad = new QuadUv();
	        
	        _this.state = State.for2d();
	        return _this;
	    }
	    
	    TilingSpriteRenderer.prototype.render = function (ts) {
	        var renderer = this.renderer;
	        var quad = this.quad;
	        var vertices = quad.vertices;
	        vertices[0] = vertices[6] = (ts._width) * -ts.anchor.x;
	        vertices[1] = vertices[3] = ts._height * -ts.anchor.y;
	        vertices[2] = vertices[4] = (ts._width) * (1.0 - ts.anchor.x);
	        vertices[5] = vertices[7] = ts._height * (1.0 - ts.anchor.y);
	        if (ts.uvRespectAnchor) {
	            vertices = quad.uvs;
	            vertices[0] = vertices[6] = -ts.anchor.x;
	            vertices[1] = vertices[3] = -ts.anchor.y;
	            vertices[2] = vertices[4] = 1.0 - ts.anchor.x;
	            vertices[5] = vertices[7] = 1.0 - ts.anchor.y;
	        }
	        quad.invalidate();
	        var tex = ts._texture;
	        var baseTex = tex.baseTexture;
	        var lt = ts.tileTransform.localTransform;
	        var uv = ts.uvMatrix;
	        var isSimple = baseTex.isPowerOfTwo
	            && tex.frame.width === baseTex.width && tex.frame.height === baseTex.height;
	        
	        if (isSimple) {
	            if (!baseTex._glTextures[renderer.CONTEXT_UID]) {
	                if (baseTex.wrapMode === exports.WRAP_MODES.CLAMP) {
	                    baseTex.wrapMode = exports.WRAP_MODES.REPEAT;
	                }
	            }
	            else {
	                isSimple = baseTex.wrapMode !== exports.WRAP_MODES.CLAMP;
	            }
	        }
	        var shader = isSimple ? this.simpleShader : this.shader;
	        var w = tex.width;
	        var h = tex.height;
	        var W = ts._width;
	        var H = ts._height;
	        tempMat$1.set(lt.a * w / W, lt.b * w / H, lt.c * h / W, lt.d * h / H, lt.tx / W, lt.ty / H);
	        
	        
	        
	        
	        
	        tempMat$1.invert();
	        if (isSimple) {
	            tempMat$1.prepend(uv.mapCoord);
	        }
	        else {
	            shader.uniforms.uMapCoord = uv.mapCoord.toArray(true);
	            shader.uniforms.uClampFrame = uv.uClampFrame;
	            shader.uniforms.uClampOffset = uv.uClampOffset;
	        }
	        shader.uniforms.uTransform = tempMat$1.toArray(true);
	        shader.uniforms.uColor = premultiplyTintToRgba(ts.tint, ts.worldAlpha, shader.uniforms.uColor, baseTex.alphaMode);
	        shader.uniforms.translationMatrix = ts.transform.worldTransform.toArray(true);
	        shader.uniforms.uSampler = tex;
	        renderer.shader.bind(shader);
	        renderer.geometry.bind(quad);
	        this.state.blendMode = correctBlendMode(ts.blendMode, baseTex.alphaMode);
	        renderer.state.set(this.state);
	        renderer.geometry.draw(this.renderer.gl.TRIANGLES, 6, 0);
	    };
	    return TilingSpriteRenderer;
	}(ObjectRenderer));

	

	
	

	var extendStatics$a = function(d, b) {
	    extendStatics$a = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$a(d, b);
	};

	function __extends$a(d, b) {
	    extendStatics$a(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	
	var MeshBatchUvs =  (function () {
	    
	    function MeshBatchUvs(uvBuffer, uvMatrix) {
	        
	        this.uvBuffer = uvBuffer;
	        
	        this.uvMatrix = uvMatrix;
	        
	        this.data = null;
	        this._bufferUpdateId = -1;
	        this._textureUpdateId = -1;
	        this._updateID = 0;
	    }
	    
	    MeshBatchUvs.prototype.update = function (forceUpdate) {
	        if (!forceUpdate
	            && this._bufferUpdateId === this.uvBuffer._updateID
	            && this._textureUpdateId === this.uvMatrix._updateID) {
	            return;
	        }
	        this._bufferUpdateId = this.uvBuffer._updateID;
	        this._textureUpdateId = this.uvMatrix._updateID;
	        var data = this.uvBuffer.data;
	        if (!this.data || this.data.length !== data.length) {
	            this.data = new Float32Array(data.length);
	        }
	        this.uvMatrix.multiplyUvs(data, this.data);
	        this._updateID++;
	    };
	    return MeshBatchUvs;
	}());

	var tempPoint$2 = new Point();
	var tempPolygon = new Polygon();
	
	var Mesh =  (function (_super) {
	    __extends$a(Mesh, _super);
	    
	    function Mesh(geometry, shader, state, drawMode) {
	        if (drawMode === void 0) { drawMode = exports.DRAW_MODES.TRIANGLES; }
	        var _this = _super.call(this) || this;
	        
	        _this.geometry = geometry;
	        geometry.refCount++;
	        
	        _this.shader = shader;
	        
	        _this.state = state || State.for2d();
	        
	        _this.drawMode = drawMode;
	        
	        _this.start = 0;
	        
	        _this.size = 0;
	        
	        _this.uvs = null;
	        
	        _this.indices = null;
	        
	        _this.vertexData = new Float32Array(1);
	        
	        _this.vertexDirty = 0;
	        _this._transformID = -1;
	        
	        _this._roundPixels = settings.ROUND_PIXELS;
	        
	        _this.batchUvs = null;
	        return _this;
	    }
	    Object.defineProperty(Mesh.prototype, "uvBuffer", {
	        
	        get: function () {
	            return this.geometry.buffers[1];
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Mesh.prototype, "verticesBuffer", {
	        
	        get: function () {
	            return this.geometry.buffers[0];
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Mesh.prototype, "material", {
	        get: function () {
	            return this.shader;
	        },
	        
	        set: function (value) {
	            this.shader = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Mesh.prototype, "blendMode", {
	        get: function () {
	            return this.state.blendMode;
	        },
	        
	        set: function (value) {
	            this.state.blendMode = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Mesh.prototype, "roundPixels", {
	        get: function () {
	            return this._roundPixels;
	        },
	        
	        set: function (value) {
	            if (this._roundPixels !== value) {
	                this._transformID = -1;
	            }
	            this._roundPixels = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Mesh.prototype, "tint", {
	        
	        get: function () {
	            return this.shader.tint;
	        },
	        set: function (value) {
	            this.shader.tint = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(Mesh.prototype, "texture", {
	        
	        get: function () {
	            return this.shader.texture;
	        },
	        set: function (value) {
	            this.shader.texture = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    Mesh.prototype._render = function (renderer) {
	        
	        
	        var vertices = this.geometry.buffers[0].data;
	        
	        if (this.shader.batchable
	            && this.drawMode === exports.DRAW_MODES.TRIANGLES
	            && vertices.length < Mesh.BATCHABLE_SIZE * 2) {
	            this._renderToBatch(renderer);
	        }
	        else {
	            this._renderDefault(renderer);
	        }
	    };
	    
	    Mesh.prototype._renderDefault = function (renderer) {
	        var shader = this.shader;
	        shader.alpha = this.worldAlpha;
	        if (shader.update) {
	            shader.update();
	        }
	        renderer.batch.flush();
	        if (shader.program.uniformData.translationMatrix) {
	            shader.uniforms.translationMatrix = this.transform.worldTransform.toArray(true);
	        }
	        
	        renderer.shader.bind(shader);
	        
	        renderer.state.set(this.state);
	        
	        renderer.geometry.bind(this.geometry, shader);
	        
	        renderer.geometry.draw(this.drawMode, this.size, this.start, this.geometry.instanceCount);
	    };
	    
	    Mesh.prototype._renderToBatch = function (renderer) {
	        var geometry = this.geometry;
	        if (this.shader.uvMatrix) {
	            this.shader.uvMatrix.update();
	            this.calculateUvs();
	        }
	        
	        this.calculateVertices();
	        this.indices = geometry.indexBuffer.data;
	        this._tintRGB = this.shader._tintRGB;
	        this._texture = this.shader.texture;
	        var pluginName = this.material.pluginName;
	        renderer.batch.setObjectRenderer(renderer.plugins[pluginName]);
	        renderer.plugins[pluginName].render(this);
	    };
	    
	    Mesh.prototype.calculateVertices = function () {
	        var geometry = this.geometry;
	        var vertices = geometry.buffers[0].data;
	        if (geometry.vertexDirtyId === this.vertexDirty && this._transformID === this.transform._worldID) {
	            return;
	        }
	        this._transformID = this.transform._worldID;
	        if (this.vertexData.length !== vertices.length) {
	            this.vertexData = new Float32Array(vertices.length);
	        }
	        var wt = this.transform.worldTransform;
	        var a = wt.a;
	        var b = wt.b;
	        var c = wt.c;
	        var d = wt.d;
	        var tx = wt.tx;
	        var ty = wt.ty;
	        var vertexData = this.vertexData;
	        for (var i = 0; i < vertexData.length / 2; i++) {
	            var x = vertices[(i * 2)];
	            var y = vertices[(i * 2) + 1];
	            vertexData[(i * 2)] = (a * x) + (c * y) + tx;
	            vertexData[(i * 2) + 1] = (b * x) + (d * y) + ty;
	        }
	        if (this._roundPixels) {
	            var resolution = settings.RESOLUTION;
	            for (var i = 0; i < vertexData.length; ++i) {
	                vertexData[i] = Math.round((vertexData[i] * resolution | 0) / resolution);
	            }
	        }
	        this.vertexDirty = geometry.vertexDirtyId;
	    };
	    
	    Mesh.prototype.calculateUvs = function () {
	        var geomUvs = this.geometry.buffers[1];
	        if (!this.shader.uvMatrix.isSimple) {
	            if (!this.batchUvs) {
	                this.batchUvs = new MeshBatchUvs(geomUvs, this.shader.uvMatrix);
	            }
	            this.batchUvs.update();
	            this.uvs = this.batchUvs.data;
	        }
	        else {
	            this.uvs = geomUvs.data;
	        }
	    };
	    
	    Mesh.prototype._calculateBounds = function () {
	        this.calculateVertices();
	        this._bounds.addVertexData(this.vertexData, 0, this.vertexData.length);
	    };
	    
	    Mesh.prototype.containsPoint = function (point) {
	        if (!this.getBounds().contains(point.x, point.y)) {
	            return false;
	        }
	        this.worldTransform.applyInverse(point, tempPoint$2);
	        var vertices = this.geometry.getBuffer('aVertexPosition').data;
	        var points = tempPolygon.points;
	        var indices = this.geometry.getIndex().data;
	        var len = indices.length;
	        var step = this.drawMode === 4 ? 3 : 1;
	        for (var i = 0; i + 2 < len; i += step) {
	            var ind0 = indices[i] * 2;
	            var ind1 = indices[i + 1] * 2;
	            var ind2 = indices[i + 2] * 2;
	            points[0] = vertices[ind0];
	            points[1] = vertices[ind0 + 1];
	            points[2] = vertices[ind1];
	            points[3] = vertices[ind1 + 1];
	            points[4] = vertices[ind2];
	            points[5] = vertices[ind2 + 1];
	            if (tempPolygon.contains(tempPoint$2.x, tempPoint$2.y)) {
	                return true;
	            }
	        }
	        return false;
	    };
	    
	    Mesh.prototype.destroy = function (options) {
	        _super.prototype.destroy.call(this, options);
	        this.geometry.refCount--;
	        if (this.geometry.refCount === 0) {
	            this.geometry.dispose();
	        }
	        this.geometry = null;
	        this.shader = null;
	        this.state = null;
	        this.uvs = null;
	        this.indices = null;
	        this.vertexData = null;
	    };
	    
	    Mesh.BATCHABLE_SIZE = 100;
	    return Mesh;
	}(Container));

	var fragment$3 = "varying vec2 vTextureCoord;\nuniform vec4 uColor;\n\nuniform sampler2D uSampler;\n\nvoid main(void)\n{\n    gl_FragColor = texture2D(uSampler, vTextureCoord) * uColor;\n}\n";

	var vertex$3 = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\nuniform mat3 translationMatrix;\nuniform mat3 uTextureMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = (uTextureMatrix * vec3(aTextureCoord, 1.0)).xy;\n}\n";

	
	var MeshMaterial =  (function (_super) {
	    __extends$a(MeshMaterial, _super);
	    
	    function MeshMaterial(uSampler, options) {
	        var _this = this;
	        var uniforms = {
	            uSampler: uSampler,
	            alpha: 1,
	            uTextureMatrix: Matrix.IDENTITY,
	            uColor: new Float32Array([1, 1, 1, 1]),
	        };
	        
	        options = Object.assign({
	            tint: 0xFFFFFF,
	            alpha: 1,
	            pluginName: 'batch',
	        }, options);
	        if (options.uniforms) {
	            Object.assign(uniforms, options.uniforms);
	        }
	        _this = _super.call(this, options.program || Program.from(vertex$3, fragment$3), uniforms) || this;
	        
	        _this._colorDirty = false;
	        
	        _this.uvMatrix = new TextureMatrix(uSampler);
	        
	        _this.batchable = options.program === undefined;
	        
	        _this.pluginName = options.pluginName;
	        _this.tint = options.tint;
	        _this.alpha = options.alpha;
	        return _this;
	    }
	    Object.defineProperty(MeshMaterial.prototype, "texture", {
	        
	        get: function () {
	            return this.uniforms.uSampler;
	        },
	        set: function (value) {
	            if (this.uniforms.uSampler !== value) {
	                this.uniforms.uSampler = value;
	                this.uvMatrix.texture = value;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(MeshMaterial.prototype, "alpha", {
	        get: function () {
	            return this._alpha;
	        },
	        
	        set: function (value) {
	            if (value === this._alpha)
	                { return; }
	            this._alpha = value;
	            this._colorDirty = true;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(MeshMaterial.prototype, "tint", {
	        get: function () {
	            return this._tint;
	        },
	        
	        set: function (value) {
	            if (value === this._tint)
	                { return; }
	            this._tint = value;
	            this._tintRGB = (value >> 16) + (value & 0xff00) + ((value & 0xff) << 16);
	            this._colorDirty = true;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    MeshMaterial.prototype.update = function () {
	        if (this._colorDirty) {
	            this._colorDirty = false;
	            var baseTexture = this.texture.baseTexture;
	            premultiplyTintToRgba(this._tint, this._alpha, this.uniforms.uColor, baseTexture.alphaMode);
	        }
	        if (this.uvMatrix.update()) {
	            this.uniforms.uTextureMatrix = this.uvMatrix.mapCoord;
	        }
	    };
	    return MeshMaterial;
	}(Shader));

	
	var MeshGeometry =  (function (_super) {
	    __extends$a(MeshGeometry, _super);
	    
	    function MeshGeometry(vertices, uvs, index) {
	        var _this = _super.call(this) || this;
	        var verticesBuffer = new Buffer(vertices);
	        var uvsBuffer = new Buffer(uvs, true);
	        var indexBuffer = new Buffer(index, true, true);
	        _this.addAttribute('aVertexPosition', verticesBuffer, 2, false, exports.TYPES.FLOAT)
	            .addAttribute('aTextureCoord', uvsBuffer, 2, false, exports.TYPES.FLOAT)
	            .addIndex(indexBuffer);
	        
	        _this._updateId = -1;
	        return _this;
	    }
	    Object.defineProperty(MeshGeometry.prototype, "vertexDirtyId", {
	        
	        get: function () {
	            return this.buffers[0]._updateID;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return MeshGeometry;
	}(Geometry));

	

	
	

	var extendStatics$b = function(d, b) {
	    extendStatics$b = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$b(d, b);
	};

	function __extends$b(d, b) {
	    extendStatics$b(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	
	
	var BitmapFontData =  (function () {
	    function BitmapFontData() {
	        
	        this.info = [];
	        
	        this.common = [];
	        
	        this.page = [];
	        
	        this.char = [];
	        
	        this.kerning = [];
	    }
	    return BitmapFontData;
	}());
	
	
	
	
	

	
	var TextFormat =  (function () {
	    function TextFormat() {
	    }
	    
	    TextFormat.test = function (data) {
	        return typeof data === 'string' && data.indexOf('info face=') === 0;
	    };
	    
	    TextFormat.parse = function (txt) {
	        
	        var items = txt.match(/^[a-z]+\s+.+$/gm);
	        var rawData = {
	            info: [],
	            common: [],
	            page: [],
	            char: [],
	            chars: [],
	            kerning: [],
	            kernings: [],
	        };
	        for (var i in items) {
	            
	            var name = items[i].match(/^[a-z]+/gm)[0];
	            
	            var attributeList = items[i].match(/[a-zA-Z]+=([^\s"']+|"([^"]*)")/gm);
	            
	            var itemData = {};
	            for (var i_1 in attributeList) {
	                
	                var split = attributeList[i_1].split('=');
	                var key = split[0];
	                
	                var strValue = split[1].replace(/"/gm, '');
	                
	                var floatValue = parseFloat(strValue);
	                
	                var value = isNaN(floatValue) ? strValue : floatValue;
	                itemData[key] = value;
	            }
	            
	            rawData[name].push(itemData);
	        }
	        var font = new BitmapFontData();
	        rawData.info.forEach(function (info) { return font.info.push({
	            face: info.face,
	            size: parseInt(info.size, 10),
	        }); });
	        rawData.common.forEach(function (common) { return font.common.push({
	            lineHeight: parseInt(common.lineHeight, 10),
	        }); });
	        rawData.page.forEach(function (page) { return font.page.push({
	            id: parseInt(page.id, 10),
	            file: page.file,
	        }); });
	        rawData.char.forEach(function (char) { return font.char.push({
	            id: parseInt(char.id, 10),
	            page: parseInt(char.page, 10),
	            x: parseInt(char.x, 10),
	            y: parseInt(char.y, 10),
	            width: parseInt(char.width, 10),
	            height: parseInt(char.height, 10),
	            xoffset: parseInt(char.xoffset, 10),
	            yoffset: parseInt(char.yoffset, 10),
	            xadvance: parseInt(char.xadvance, 10),
	        }); });
	        rawData.kerning.forEach(function (kerning) { return font.kerning.push({
	            first: parseInt(kerning.first, 10),
	            second: parseInt(kerning.second, 10),
	            amount: parseInt(kerning.amount, 10),
	        }); });
	        return font;
	    };
	    return TextFormat;
	}());

	
	var XMLFormat =  (function () {
	    function XMLFormat() {
	    }
	    
	    XMLFormat.test = function (data) {
	        return data instanceof XMLDocument
	            && data.getElementsByTagName('page').length
	            && data.getElementsByTagName('info')[0].getAttribute('face') !== null;
	    };
	    
	    XMLFormat.parse = function (xml) {
	        var data = new BitmapFontData();
	        var info = xml.getElementsByTagName('info');
	        var common = xml.getElementsByTagName('common');
	        var page = xml.getElementsByTagName('page');
	        var char = xml.getElementsByTagName('char');
	        var kerning = xml.getElementsByTagName('kerning');
	        for (var i = 0; i < info.length; i++) {
	            data.info.push({
	                face: info[i].getAttribute('face'),
	                size: parseInt(info[i].getAttribute('size'), 10),
	            });
	        }
	        for (var i = 0; i < common.length; i++) {
	            data.common.push({
	                lineHeight: parseInt(common[i].getAttribute('lineHeight'), 10),
	            });
	        }
	        for (var i = 0; i < page.length; i++) {
	            data.page.push({
	                id: parseInt(page[i].getAttribute('id'), 10) || 0,
	                file: page[i].getAttribute('file'),
	            });
	        }
	        for (var i = 0; i < char.length; i++) {
	            var letter = char[i];
	            data.char.push({
	                id: parseInt(letter.getAttribute('id'), 10),
	                page: parseInt(letter.getAttribute('page'), 10) || 0,
	                x: parseInt(letter.getAttribute('x'), 10),
	                y: parseInt(letter.getAttribute('y'), 10),
	                width: parseInt(letter.getAttribute('width'), 10),
	                height: parseInt(letter.getAttribute('height'), 10),
	                xoffset: parseInt(letter.getAttribute('xoffset'), 10),
	                yoffset: parseInt(letter.getAttribute('yoffset'), 10),
	                xadvance: parseInt(letter.getAttribute('xadvance'), 10),
	            });
	        }
	        for (var i = 0; i < kerning.length; i++) {
	            data.kerning.push({
	                first: parseInt(kerning[i].getAttribute('first'), 10),
	                second: parseInt(kerning[i].getAttribute('second'), 10),
	                amount: parseInt(kerning[i].getAttribute('amount'), 10),
	            });
	        }
	        return data;
	    };
	    return XMLFormat;
	}());

	
	var XMLStringFormat =  (function () {
	    function XMLStringFormat() {
	    }
	    
	    XMLStringFormat.test = function (data) {
	        if (typeof data === 'string' && data.indexOf('<font>') > -1) {
	            var xml = new self.DOMParser().parseFromString(data, 'text/xml');
	            return XMLFormat.test(xml);
	        }
	        return false;
	    };
	    
	    XMLStringFormat.parse = function (xmlTxt) {
	        var xml = new window.DOMParser().parseFromString(xmlTxt, 'text/xml');
	        return XMLFormat.parse(xml);
	    };
	    return XMLStringFormat;
	}());

	
	var formats = [
	    TextFormat,
	    XMLFormat,
	    XMLStringFormat ];
	
	function autoDetectFormat(data) {
	    for (var i = 0; i < formats.length; i++) {
	        if (formats[i].test(data)) {
	            return formats[i];
	        }
	    }
	    return null;
	}

	
	
	function generateFillStyle(canvas, context, style, resolution, lines, metrics) {
	    
	    
	    
	    var fillStyle = style.fill;
	    if (!Array.isArray(fillStyle)) {
	        return fillStyle;
	    }
	    else if (fillStyle.length === 1) {
	        return fillStyle[0];
	    }
	    
	    
	    var gradient;
	    
	    
	    var dropShadowCorrection = (style.dropShadow) ? style.dropShadowDistance : 0;
	    
	    var padding = style.padding || 0;
	    var width = Math.ceil(canvas.width / resolution) - dropShadowCorrection - (padding * 2);
	    var height = Math.ceil(canvas.height / resolution) - dropShadowCorrection - (padding * 2);
	    
	    var fill = fillStyle.slice();
	    var fillGradientStops = style.fillGradientStops.slice();
	    
	    if (!fillGradientStops.length) {
	        var lengthPlus1 = fill.length + 1;
	        for (var i = 1; i < lengthPlus1; ++i) {
	            fillGradientStops.push(i / lengthPlus1);
	        }
	    }
	    
	    
	    fill.unshift(fillStyle[0]);
	    fillGradientStops.unshift(0);
	    fill.push(fillStyle[fillStyle.length - 1]);
	    fillGradientStops.push(1);
	    if (style.fillGradientType === exports.TEXT_GRADIENT.LINEAR_VERTICAL) {
	        
	        gradient = context.createLinearGradient(width / 2, padding, width / 2, height + padding);
	        
	        
	        
	        
	        
	        
	        var lastIterationStop = 0;
	        
	        var textHeight = metrics.fontProperties.fontSize + style.strokeThickness;
	        
	        var gradStopLineHeight = textHeight / height;
	        for (var i = 0; i < lines.length; i++) {
	            var thisLineTop = metrics.lineHeight * i;
	            for (var j = 0; j < fill.length; j++) {
	                
	                var lineStop = 0;
	                if (typeof fillGradientStops[j] === 'number') {
	                    lineStop = fillGradientStops[j];
	                }
	                else {
	                    lineStop = j / fill.length;
	                }
	                var globalStop = (thisLineTop / height) + (lineStop * gradStopLineHeight);
	                
	                var clampedStop = Math.max(lastIterationStop, globalStop);
	                clampedStop = Math.min(clampedStop, 1); 
	                gradient.addColorStop(clampedStop, fill[j]);
	                lastIterationStop = clampedStop;
	            }
	        }
	    }
	    else {
	        
	        gradient = context.createLinearGradient(padding, height / 2, width + padding, height / 2);
	        
	        
	        var totalIterations = fill.length + 1;
	        var currentIteration = 1;
	        for (var i = 0; i < fill.length; i++) {
	            var stop = void 0;
	            if (typeof fillGradientStops[i] === 'number') {
	                stop = fillGradientStops[i];
	            }
	            else {
	                stop = currentIteration / totalIterations;
	            }
	            gradient.addColorStop(stop, fill[i]);
	            currentIteration++;
	        }
	    }
	    return gradient;
	}

	
	
	function drawGlyph(canvas, context, metrics, x, y, resolution, style) {
	    var char = metrics.text;
	    var fontProperties = metrics.fontProperties;
	    context.translate(x, y);
	    context.scale(resolution, resolution);
	    var tx = style.strokeThickness / 2;
	    var ty = -(style.strokeThickness / 2);
	    context.font = style.toFontString();
	    context.lineWidth = style.strokeThickness;
	    context.textBaseline = style.textBaseline;
	    context.lineJoin = style.lineJoin;
	    context.miterLimit = style.miterLimit;
	    
	    context.fillStyle = generateFillStyle(canvas, context, style, resolution, [char], metrics);
	    context.strokeStyle = style.stroke;
	    if (style.dropShadow) {
	        var dropShadowColor = style.dropShadowColor;
	        var rgb = hex2rgb(typeof dropShadowColor === 'number' ? dropShadowColor : string2hex(dropShadowColor));
	        var dropShadowBlur = style.dropShadowBlur * resolution;
	        var dropShadowDistance = style.dropShadowDistance * resolution;
	        context.shadowColor = "rgba(" + rgb[0] * 255 + "," + rgb[1] * 255 + "," + rgb[2] * 255 + "," + style.dropShadowAlpha + ")";
	        context.shadowBlur = dropShadowBlur;
	        context.shadowOffsetX = Math.cos(style.dropShadowAngle) * dropShadowDistance;
	        context.shadowOffsetY = Math.sin(style.dropShadowAngle) * dropShadowDistance;
	    }
	    else {
	        context.shadowColor = 'black';
	        context.shadowBlur = 0;
	        context.shadowOffsetX = 0;
	        context.shadowOffsetY = 0;
	    }
	    if (style.stroke && style.strokeThickness) {
	        context.strokeText(char, tx, ty + metrics.lineHeight - fontProperties.descent);
	    }
	    if (style.fill) {
	        context.fillText(char, tx, ty + metrics.lineHeight - fontProperties.descent);
	    }
	    context.setTransform(1, 0, 0, 1, 0, 0); 
	    context.fillStyle = 'rgba(0, 0, 0, 0)';
	}

	
	function resolveCharacters(chars) {
	    
	    if (typeof chars === 'string') {
	        chars = [chars];
	    }
	    
	    var result = [];
	    for (var i = 0, j = chars.length; i < j; i++) {
	        var item = chars[i];
	        
	        if (Array.isArray(item)) {
	            if (item.length !== 2) {
	                throw new Error("[BitmapFont]: Invalid character range length, expecting 2 got " + item.length + ".");
	            }
	            var startCode = item[0].charCodeAt(0);
	            var endCode = item[1].charCodeAt(0);
	            if (endCode < startCode) {
	                throw new Error('[BitmapFont]: Invalid character range.');
	            }
	            for (var i_1 = startCode, j_1 = endCode; i_1 <= j_1; i_1++) {
	                result.push(String.fromCharCode(i_1));
	            }
	        }
	        
	        else {
	            result.push.apply(result, item.split(''));
	        }
	    }
	    if (result.length === 0) {
	        throw new Error('[BitmapFont]: Empty set when resolving characters.');
	    }
	    return result;
	}

	
	var BitmapFont =  (function () {
	    
	    function BitmapFont(data, textures, ownsTextures) {
	        var info = data.info[0];
	        var common = data.common[0];
	        var page = data.page[0];
	        var res = getResolutionOfUrl(page.file);
	        var pageTextures = {};
	        this._ownsTextures = ownsTextures;
	        
	        this.font = info.face;
	        
	        this.size = info.size;
	        
	        this.lineHeight = common.lineHeight / res;
	        
	        this.chars = {};
	        
	        this.pageTextures = pageTextures;
	        
	        
	        for (var i = 0; i < data.page.length; i++) {
	            var _a = data.page[i], id = _a.id, file = _a.file;
	            pageTextures[id] = textures instanceof Array
	                ? textures[i] : textures[file];
	        }
	        
	        for (var i = 0; i < data.char.length; i++) {
	            var _b = data.char[i], id = _b.id, page_1 = _b.page;
	            var _c = data.char[i], x = _c.x, y = _c.y, width = _c.width, height = _c.height, xoffset = _c.xoffset, yoffset = _c.yoffset, xadvance = _c.xadvance;
	            x /= res;
	            y /= res;
	            width /= res;
	            height /= res;
	            xoffset /= res;
	            yoffset /= res;
	            xadvance /= res;
	            var rect = new Rectangle(x + (pageTextures[page_1].frame.x / res), y + (pageTextures[page_1].frame.y / res), width, height);
	            this.chars[id] = {
	                xOffset: xoffset,
	                yOffset: yoffset,
	                xAdvance: xadvance,
	                kerning: {},
	                texture: new Texture(pageTextures[page_1].baseTexture, rect),
	                page: page_1,
	            };
	        }
	        
	        for (var i = 0; i < data.kerning.length; i++) {
	            var _d = data.kerning[i], first = _d.first, second = _d.second, amount = _d.amount;
	            first /= res;
	            second /= res;
	            amount /= res;
	            if (this.chars[second]) {
	                this.chars[second].kerning[first] = amount;
	            }
	        }
	    }
	    
	    BitmapFont.prototype.destroy = function () {
	        for (var id in this.chars) {
	            this.chars[id].texture.destroy();
	            this.chars[id].texture = null;
	        }
	        for (var id in this.pageTextures) {
	            if (this._ownsTextures) {
	                this.pageTextures[id].destroy(true);
	            }
	            this.pageTextures[id] = null;
	        }
	        
	        this.chars = null;
	        this.pageTextures = null;
	    };
	    
	    BitmapFont.install = function (data, textures, ownsTextures) {
	        var fontData;
	        if (data instanceof BitmapFontData) {
	            fontData = data;
	        }
	        else {
	            var format = autoDetectFormat(data);
	            if (!format) {
	                throw new Error('Unrecognized data format for font.');
	            }
	            fontData = format.parse(data);
	        }
	        
	        if (textures instanceof Texture) {
	            textures = [textures];
	        }
	        var font = new BitmapFont(fontData, textures, ownsTextures);
	        BitmapFont.available[font.font] = font;
	        return font;
	    };
	    
	    BitmapFont.uninstall = function (name) {
	        var font = BitmapFont.available[name];
	        if (!font) {
	            throw new Error("No font found named '" + name + "'");
	        }
	        font.destroy();
	        delete BitmapFont.available[name];
	    };
	    
	    BitmapFont.from = function (name, textStyle, options) {
	        if (!name) {
	            throw new Error('[BitmapFont] Property `name` is required.');
	        }
	        var _a = Object.assign({}, BitmapFont.defaultOptions, options), chars = _a.chars, padding = _a.padding, resolution = _a.resolution, textureWidth = _a.textureWidth, textureHeight = _a.textureHeight;
	        var charsList = resolveCharacters(chars);
	        var style = textStyle instanceof TextStyle ? textStyle : new TextStyle(textStyle);
	        var lineWidth = textureWidth;
	        var fontData = new BitmapFontData();
	        fontData.info[0] = {
	            face: style.fontFamily,
	            size: style.fontSize,
	        };
	        fontData.common[0] = {
	            lineHeight: style.fontSize,
	        };
	        var positionX = 0;
	        var positionY = 0;
	        var canvas;
	        var context;
	        var baseTexture;
	        var maxCharHeight = 0;
	        var textures = [];
	        for (var i = 0; i < charsList.length; i++) {
	            if (!canvas) {
	                canvas = document.createElement('canvas');
	                canvas.width = textureWidth;
	                canvas.height = textureHeight;
	                context = canvas.getContext('2d');
	                baseTexture = new BaseTexture(canvas, { resolution: resolution });
	                textures.push(new Texture(baseTexture));
	                fontData.page.push({
	                    id: textures.length - 1,
	                    file: '',
	                });
	            }
	            
	            var metrics = TextMetrics.measureText(charsList[i], style, false, canvas);
	            var width = metrics.width;
	            var height = Math.ceil(metrics.height);
	            
	            var textureGlyphWidth = Math.ceil((style.fontStyle === 'italic' ? 2 : 1) * width);
	            
	            if (positionY >= textureHeight - (height * resolution)) {
	                if (positionY === 0) {
	                    
	                    throw new Error("[BitmapFont] textureHeight " + textureHeight + "px is "
	                        + ("too small for " + style.fontSize + "px fonts"));
	                }
	                --i;
	                
	                canvas = null;
	                context = null;
	                baseTexture = null;
	                positionY = 0;
	                positionX = 0;
	                maxCharHeight = 0;
	                continue;
	            }
	            maxCharHeight = Math.max(height + metrics.fontProperties.descent, maxCharHeight);
	            
	            if ((textureGlyphWidth * resolution) + positionX >= lineWidth) {
	                --i;
	                positionY += maxCharHeight * resolution;
	                positionY = Math.ceil(positionY);
	                positionX = 0;
	                maxCharHeight = 0;
	                continue;
	            }
	            drawGlyph(canvas, context, metrics, positionX, positionY, resolution, style);
	            
	            var id = metrics.text.charCodeAt(0);
	            
	            fontData.char.push({
	                id: id,
	                page: textures.length - 1,
	                x: positionX / resolution,
	                y: positionY / resolution,
	                width: textureGlyphWidth,
	                height: height,
	                xoffset: 0,
	                yoffset: 0,
	                xadvance: Math.ceil(width
	                    - (style.dropShadow ? style.dropShadowDistance : 0)
	                    - (style.stroke ? style.strokeThickness : 0)),
	            });
	            positionX += (textureGlyphWidth + (2 * padding)) * resolution;
	            positionX = Math.ceil(positionX);
	        }
	        var font = new BitmapFont(fontData, textures, true);
	        
	        if (BitmapFont.available[name] !== undefined) {
	            BitmapFont.uninstall(name);
	        }
	        BitmapFont.available[name] = font;
	        return font;
	    };
	    
	    BitmapFont.ALPHA = [['a', 'z'], ['A', 'Z'], ' '];
	    
	    BitmapFont.NUMERIC = [['0', '9']];
	    
	    BitmapFont.ALPHANUMERIC = [['a', 'z'], ['A', 'Z'], ['0', '9'], ' '];
	    
	    BitmapFont.ASCII = [[' ', '~']];
	    
	    BitmapFont.defaultOptions = {
	        resolution: 1,
	        textureWidth: 512,
	        textureHeight: 512,
	        padding: 4,
	        chars: BitmapFont.ALPHANUMERIC,
	    };
	    
	    BitmapFont.available = {};
	    return BitmapFont;
	}());
	

	var pageMeshDataPool = [];
	var charRenderDataPool = [];
	
	var BitmapText =  (function (_super) {
	    __extends$b(BitmapText, _super);
	    
	    function BitmapText(text, style) {
	        if (style === void 0) { style = {}; }
	        var _this = _super.call(this) || this;
	        _this._tint = 0xFFFFFF;
	        if (style.font) {
	            deprecation('5.3.0', 'PIXI.BitmapText constructor style.font property is deprecated.');
	            _this._upgradeStyle(style);
	        }
	        
	        var _a = Object.assign({}, BitmapText.styleDefaults, style), align = _a.align, tint = _a.tint, maxWidth = _a.maxWidth, letterSpacing = _a.letterSpacing, fontName = _a.fontName, fontSize = _a.fontSize;
	        if (!BitmapFont.available[fontName]) {
	            throw new Error("Missing BitmapFont \"" + fontName + "\"");
	        }
	        
	        _this._activePagesMeshData = [];
	        
	        _this._textWidth = 0;
	        
	        _this._textHeight = 0;
	        
	        _this._align = align;
	        
	        _this._tint = tint;
	        
	        _this._fontName = fontName;
	        
	        _this._fontSize = fontSize || BitmapFont.available[fontName].size;
	        
	        _this._text = text;
	        
	        _this._maxWidth = maxWidth;
	        
	        _this._maxLineHeight = 0;
	        
	        _this._letterSpacing = letterSpacing;
	        
	        _this._anchor = new ObservablePoint(function () { _this.dirty = true; }, _this, 0, 0);
	        
	        _this._roundPixels = settings.ROUND_PIXELS;
	        
	        _this.dirty = true;
	        
	        _this._textureCache = {};
	        return _this;
	    }
	    
	    BitmapText.prototype.updateText = function () {
	        var _a;
	        var data = BitmapFont.available[this._fontName];
	        var scale = this._fontSize / data.size;
	        var pos = new Point();
	        var chars = [];
	        var lineWidths = [];
	        var text = this._text.replace(/(?:\r\n|\r)/g, '\n') || ' ';
	        var textLength = text.length;
	        var maxWidth = this._maxWidth * data.size / this._fontSize;
	        var prevCharCode = null;
	        var lastLineWidth = 0;
	        var maxLineWidth = 0;
	        var line = 0;
	        var lastBreakPos = -1;
	        var lastBreakWidth = 0;
	        var spacesRemoved = 0;
	        var maxLineHeight = 0;
	        for (var i = 0; i < textLength; i++) {
	            var charCode = text.charCodeAt(i);
	            var char = text.charAt(i);
	            if ((/(?:\s)/).test(char)) {
	                lastBreakPos = i;
	                lastBreakWidth = lastLineWidth;
	            }
	            if (char === '\r' || char === '\n') {
	                lineWidths.push(lastLineWidth);
	                maxLineWidth = Math.max(maxLineWidth, lastLineWidth);
	                ++line;
	                ++spacesRemoved;
	                pos.x = 0;
	                pos.y += data.lineHeight;
	                prevCharCode = null;
	                continue;
	            }
	            var charData = data.chars[charCode];
	            if (!charData) {
	                continue;
	            }
	            if (prevCharCode && charData.kerning[prevCharCode]) {
	                pos.x += charData.kerning[prevCharCode];
	            }
	            var charRenderData = charRenderDataPool.pop() || {
	                texture: Texture.EMPTY,
	                line: 0,
	                charCode: 0,
	                position: new Point(),
	            };
	            charRenderData.texture = charData.texture;
	            charRenderData.line = line;
	            charRenderData.charCode = charCode;
	            charRenderData.position.x = pos.x + charData.xOffset + (this._letterSpacing / 2);
	            charRenderData.position.y = pos.y + charData.yOffset;
	            chars.push(charRenderData);
	            pos.x += charData.xAdvance + this._letterSpacing;
	            lastLineWidth = pos.x;
	            maxLineHeight = Math.max(maxLineHeight, (charData.yOffset + charData.texture.height));
	            prevCharCode = charCode;
	            if (lastBreakPos !== -1 && maxWidth > 0 && pos.x > maxWidth) {
	                ++spacesRemoved;
	                removeItems(chars, 1 + lastBreakPos - spacesRemoved, 1 + i - lastBreakPos);
	                i = lastBreakPos;
	                lastBreakPos = -1;
	                lineWidths.push(lastBreakWidth);
	                maxLineWidth = Math.max(maxLineWidth, lastBreakWidth);
	                line++;
	                pos.x = 0;
	                pos.y += data.lineHeight;
	                prevCharCode = null;
	            }
	        }
	        var lastChar = text.charAt(text.length - 1);
	        if (lastChar !== '\r' && lastChar !== '\n') {
	            if ((/(?:\s)/).test(lastChar)) {
	                lastLineWidth = lastBreakWidth;
	            }
	            lineWidths.push(lastLineWidth);
	            maxLineWidth = Math.max(maxLineWidth, lastLineWidth);
	        }
	        var lineAlignOffsets = [];
	        for (var i = 0; i <= line; i++) {
	            var alignOffset = 0;
	            if (this._align === 'right') {
	                alignOffset = maxLineWidth - lineWidths[i];
	            }
	            else if (this._align === 'center') {
	                alignOffset = (maxLineWidth - lineWidths[i]) / 2;
	            }
	            lineAlignOffsets.push(alignOffset);
	        }
	        var lenChars = chars.length;
	        var pagesMeshData = {};
	        var newPagesMeshData = [];
	        var activePagesMeshData = this._activePagesMeshData;
	        for (var i = 0; i < activePagesMeshData.length; i++) {
	            pageMeshDataPool.push(activePagesMeshData[i]);
	        }
	        for (var i = 0; i < lenChars; i++) {
	            var texture = chars[i].texture;
	            var baseTextureUid = texture.baseTexture.uid;
	            if (!pagesMeshData[baseTextureUid]) {
	                var pageMeshData = pageMeshDataPool.pop();
	                if (!pageMeshData) {
	                    var geometry = new MeshGeometry();
	                    var material = new MeshMaterial(Texture.EMPTY);
	                    var mesh = new Mesh(geometry, material);
	                    pageMeshData = {
	                        index: 0,
	                        indexCount: 0,
	                        vertexCount: 0,
	                        uvsCount: 0,
	                        total: 0,
	                        mesh: mesh,
	                        vertices: null,
	                        uvs: null,
	                        indices: null,
	                    };
	                }
	                
	                pageMeshData.index = 0;
	                pageMeshData.indexCount = 0;
	                pageMeshData.vertexCount = 0;
	                pageMeshData.uvsCount = 0;
	                pageMeshData.total = 0;
	                
	                var _textureCache = this._textureCache;
	                _textureCache[baseTextureUid] = _textureCache[baseTextureUid] || new Texture(texture.baseTexture);
	                pageMeshData.mesh.texture = _textureCache[baseTextureUid];
	                pageMeshData.mesh.tint = this._tint;
	                newPagesMeshData.push(pageMeshData);
	                pagesMeshData[baseTextureUid] = pageMeshData;
	            }
	            pagesMeshData[baseTextureUid].total++;
	        }
	        
	        
	        for (var i = 0; i < activePagesMeshData.length; i++) {
	            if (newPagesMeshData.indexOf(activePagesMeshData[i]) === -1) {
	                this.removeChild(activePagesMeshData[i].mesh);
	            }
	        }
	        
	        
	        for (var i = 0; i < newPagesMeshData.length; i++) {
	            if (newPagesMeshData[i].mesh.parent !== this) {
	                this.addChild(newPagesMeshData[i].mesh);
	            }
	        }
	        
	        this._activePagesMeshData = newPagesMeshData;
	        for (var i in pagesMeshData) {
	            var pageMeshData = pagesMeshData[i];
	            var total = pageMeshData.total;
	            
	            
	            if (!(((_a = pageMeshData.indices) === null || _a === void 0 ? void 0 : _a.length) > 6 * total) || pageMeshData.vertices.length < Mesh.BATCHABLE_SIZE * 2) {
	                pageMeshData.vertices = new Float32Array(4 * 2 * total);
	                pageMeshData.uvs = new Float32Array(4 * 2 * total);
	                pageMeshData.indices = new Uint16Array(6 * total);
	            }
	            else {
	                var total_1 = pageMeshData.total;
	                var vertices = pageMeshData.vertices;
	                
	                for (var i_1 = total_1 * 4 * 2; i_1 < vertices.length; i_1++) {
	                    vertices[i_1] = 0;
	                }
	            }
	            
	            
	            pageMeshData.mesh.size = 6 * total;
	        }
	        for (var i = 0; i < lenChars; i++) {
	            var char = chars[i];
	            var offset = char.position.x + lineAlignOffsets[char.line];
	            if (this._roundPixels) {
	                offset = Math.round(offset);
	            }
	            var xPos = offset * scale;
	            var yPos = char.position.y * scale;
	            var texture = char.texture;
	            var pageMesh = pagesMeshData[texture.baseTexture.uid];
	            var textureFrame = texture.frame;
	            var textureUvs = texture._uvs;
	            var index = pageMesh.index++;
	            pageMesh.indices[(index * 6) + 0] = 0 + (index * 4);
	            pageMesh.indices[(index * 6) + 1] = 1 + (index * 4);
	            pageMesh.indices[(index * 6) + 2] = 2 + (index * 4);
	            pageMesh.indices[(index * 6) + 3] = 0 + (index * 4);
	            pageMesh.indices[(index * 6) + 4] = 2 + (index * 4);
	            pageMesh.indices[(index * 6) + 5] = 3 + (index * 4);
	            pageMesh.vertices[(index * 8) + 0] = xPos;
	            pageMesh.vertices[(index * 8) + 1] = yPos;
	            pageMesh.vertices[(index * 8) + 2] = xPos + (textureFrame.width * scale);
	            pageMesh.vertices[(index * 8) + 3] = yPos;
	            pageMesh.vertices[(index * 8) + 4] = xPos + (textureFrame.width * scale);
	            pageMesh.vertices[(index * 8) + 5] = yPos + (textureFrame.height * scale);
	            pageMesh.vertices[(index * 8) + 6] = xPos;
	            pageMesh.vertices[(index * 8) + 7] = yPos + (textureFrame.height * scale);
	            pageMesh.uvs[(index * 8) + 0] = textureUvs.x0;
	            pageMesh.uvs[(index * 8) + 1] = textureUvs.y0;
	            pageMesh.uvs[(index * 8) + 2] = textureUvs.x1;
	            pageMesh.uvs[(index * 8) + 3] = textureUvs.y1;
	            pageMesh.uvs[(index * 8) + 4] = textureUvs.x2;
	            pageMesh.uvs[(index * 8) + 5] = textureUvs.y2;
	            pageMesh.uvs[(index * 8) + 6] = textureUvs.x3;
	            pageMesh.uvs[(index * 8) + 7] = textureUvs.y3;
	        }
	        this._textWidth = maxLineWidth * scale;
	        this._textHeight = (pos.y + data.lineHeight) * scale;
	        for (var i in pagesMeshData) {
	            var pageMeshData = pagesMeshData[i];
	            
	            if (this.anchor.x !== 0 || this.anchor.y !== 0) {
	                var vertexCount = 0;
	                var anchorOffsetX = this._textWidth * this.anchor.x;
	                var anchorOffsetY = this._textHeight * this.anchor.y;
	                for (var i_2 = 0; i_2 < pageMeshData.total; i_2++) {
	                    pageMeshData.vertices[vertexCount++] -= anchorOffsetX;
	                    pageMeshData.vertices[vertexCount++] -= anchorOffsetY;
	                    pageMeshData.vertices[vertexCount++] -= anchorOffsetX;
	                    pageMeshData.vertices[vertexCount++] -= anchorOffsetY;
	                    pageMeshData.vertices[vertexCount++] -= anchorOffsetX;
	                    pageMeshData.vertices[vertexCount++] -= anchorOffsetY;
	                    pageMeshData.vertices[vertexCount++] -= anchorOffsetX;
	                    pageMeshData.vertices[vertexCount++] -= anchorOffsetY;
	                }
	            }
	            this._maxLineHeight = maxLineHeight * scale;
	            var vertexBuffer = pageMeshData.mesh.geometry.getBuffer('aVertexPosition');
	            var textureBuffer = pageMeshData.mesh.geometry.getBuffer('aTextureCoord');
	            var indexBuffer = pageMeshData.mesh.geometry.getIndex();
	            vertexBuffer.data = pageMeshData.vertices;
	            textureBuffer.data = pageMeshData.uvs;
	            indexBuffer.data = pageMeshData.indices;
	            vertexBuffer.update();
	            textureBuffer.update();
	            indexBuffer.update();
	        }
	        for (var i = 0; i < chars.length; i++) {
	            charRenderDataPool.push(chars[i]);
	        }
	    };
	    
	    BitmapText.prototype.updateTransform = function () {
	        this.validate();
	        this.containerUpdateTransform();
	    };
	    
	    BitmapText.prototype.getLocalBounds = function () {
	        this.validate();
	        return _super.prototype.getLocalBounds.call(this);
	    };
	    
	    BitmapText.prototype.validate = function () {
	        if (this.dirty) {
	            this.updateText();
	            this.dirty = false;
	        }
	    };
	    Object.defineProperty(BitmapText.prototype, "tint", {
	        
	        get: function () {
	            return this._tint;
	        },
	        set: function (value) {
	            if (this._tint === value)
	                { return; }
	            this._tint = value;
	            for (var i = 0; i < this._activePagesMeshData.length; i++) {
	                this._activePagesMeshData[i].mesh.tint = value;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BitmapText.prototype, "align", {
	        
	        get: function () {
	            return this._align;
	        },
	        set: function (value) {
	            if (this._align !== value) {
	                this._align = value;
	                this.dirty = true;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BitmapText.prototype, "fontName", {
	        
	        get: function () {
	            return this._fontName;
	        },
	        set: function (value) {
	            if (!BitmapFont.available[value]) {
	                throw new Error("Missing BitmapFont \"" + value + "\"");
	            }
	            if (this._fontName !== value) {
	                this._fontName = value;
	                this.dirty = true;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BitmapText.prototype, "fontSize", {
	        
	        get: function () {
	            return this._fontSize;
	        },
	        set: function (value) {
	            if (this._fontSize !== value) {
	                this._fontSize = value;
	                this.dirty = true;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BitmapText.prototype, "anchor", {
	        
	        get: function () {
	            return this._anchor;
	        },
	        set: function (value) {
	            if (typeof value === 'number') {
	                this._anchor.set(value);
	            }
	            else {
	                this._anchor.copyFrom(value);
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BitmapText.prototype, "text", {
	        
	        get: function () {
	            return this._text;
	        },
	        set: function (text) {
	            text = String(text === null || text === undefined ? '' : text);
	            if (this._text === text) {
	                return;
	            }
	            this._text = text;
	            this.dirty = true;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BitmapText.prototype, "maxWidth", {
	        
	        get: function () {
	            return this._maxWidth;
	        },
	        set: function (value) {
	            if (this._maxWidth === value) {
	                return;
	            }
	            this._maxWidth = value;
	            this.dirty = true;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BitmapText.prototype, "maxLineHeight", {
	        
	        get: function () {
	            this.validate();
	            return this._maxLineHeight;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BitmapText.prototype, "textWidth", {
	        
	        get: function () {
	            this.validate();
	            return this._textWidth;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BitmapText.prototype, "letterSpacing", {
	        
	        get: function () {
	            return this._letterSpacing;
	        },
	        set: function (value) {
	            if (this._letterSpacing !== value) {
	                this._letterSpacing = value;
	                this.dirty = true;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BitmapText.prototype, "roundPixels", {
	        
	        get: function () {
	            return this._roundPixels;
	        },
	        set: function (value) {
	            if (value !== this._roundPixels) {
	                this._roundPixels = value;
	                this.dirty = true;
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BitmapText.prototype, "textHeight", {
	        
	        get: function () {
	            this.validate();
	            return this._textHeight;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    BitmapText.prototype._upgradeStyle = function (style) {
	        if (typeof style.font === 'string') {
	            var valueSplit = style.font.split(' ');
	            style.fontName = valueSplit.length === 1
	                ? valueSplit[0]
	                : valueSplit.slice(1).join(' ');
	            if (valueSplit.length >= 2) {
	                style.fontSize = parseInt(valueSplit[0], 10);
	            }
	        }
	        else {
	            style.fontName = style.font.name;
	            style.fontSize = typeof style.font.size === 'number'
	                ? style.font.size
	                : parseInt(style.font.size, 10);
	        }
	    };
	    BitmapText.prototype.destroy = function (options) {
	        var _textureCache = this._textureCache;
	        for (var id in _textureCache) {
	            var texture = _textureCache[id];
	            texture.destroy();
	            delete _textureCache[id];
	        }
	        this._textureCache = null;
	        _super.prototype.destroy.call(this, options);
	    };
	    
	    BitmapText.registerFont = function (data, textures) {
	        deprecation('5.3.0', 'PIXI.BitmapText.registerFont is deprecated, use PIXI.BitmapFont.install');
	        return BitmapFont.install(data, textures);
	    };
	    Object.defineProperty(BitmapText, "fonts", {
	        
	        get: function () {
	            deprecation('5.3.0', 'PIXI.BitmapText.fonts is deprecated, use PIXI.BitmapFont.available');
	            return BitmapFont.available;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    BitmapText.styleDefaults = {
	        align: 'left',
	        tint: 0xFFFFFF,
	        maxWidth: 0,
	        letterSpacing: 0,
	    };
	    return BitmapText;
	}(Container));

	
	var BitmapFontLoader =  (function () {
	    function BitmapFontLoader() {
	    }
	    
	    BitmapFontLoader.add = function () {
	        LoaderResource.setExtensionXhrType('fnt', LoaderResource.XHR_RESPONSE_TYPE.TEXT);
	    };
	    
	    BitmapFontLoader.use = function (resource, next) {
	        var format = autoDetectFormat(resource.data);
	        
	        if (!format) {
	            next();
	            return;
	        }
	        var baseUrl = BitmapFontLoader.getBaseUrl(this, resource);
	        var data = format.parse(resource.data);
	        var textures = {};
	        
	        
	        var completed = function (page) {
	            textures[page.metadata.pageFile] = page.texture;
	            if (Object.keys(textures).length === data.page.length) {
	                resource.bitmapFont = BitmapFont.install(data, textures, true);
	                next();
	            }
	        };
	        for (var i = 0; i < data.page.length; ++i) {
	            var pageFile = data.page[i].file;
	            var url = baseUrl + pageFile;
	            var exists = false;
	            
	            
	            for (var name in this.resources) {
	                var bitmapResource = this.resources[name];
	                if (bitmapResource.url === url) {
	                    bitmapResource.metadata.pageFile = pageFile;
	                    if (bitmapResource.texture) {
	                        completed(bitmapResource);
	                    }
	                    else {
	                        bitmapResource.onAfterMiddleware.add(completed);
	                    }
	                    exists = true;
	                    break;
	                }
	            }
	            
	            
	            if (!exists) {
	                
	                var options = {
	                    crossOrigin: resource.crossOrigin,
	                    loadType: LoaderResource.LOAD_TYPE.IMAGE,
	                    metadata: Object.assign({ pageFile: pageFile }, resource.metadata.imageMetadata),
	                    parentResource: resource,
	                };
	                this.add(url, options, completed);
	            }
	        }
	    };
	    
	    BitmapFontLoader.getBaseUrl = function (loader, resource) {
	        var resUrl = !resource.isDataUrl ? BitmapFontLoader.dirname(resource.url) : '';
	        if (resource.isDataUrl) {
	            if (resUrl === '.') {
	                resUrl = '';
	            }
	            if (loader.baseUrl && resUrl) {
	                
	                if (loader.baseUrl.charAt(loader.baseUrl.length - 1) === '/') {
	                    resUrl += '/';
	                }
	            }
	        }
	        
	        resUrl = resUrl.replace(loader.baseUrl, '');
	        
	        if (resUrl && resUrl.charAt(resUrl.length - 1) !== '/') {
	            resUrl += '/';
	        }
	        return resUrl;
	    };
	    
	    BitmapFontLoader.dirname = function (url) {
	        var dir = url
	            .replace(/\\/g, '/') 
	            .replace(/\/$/, '') 
	            .replace(/\/[^\/]*$/, ''); 
	        
	        if (dir === url) {
	            return '.';
	        }
	        
	        else if (dir === '') {
	            return '/';
	        }
	        return dir;
	    };
	    return BitmapFontLoader;
	}());

	

	
	

	var extendStatics$c = function(d, b) {
	    extendStatics$c = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$c(d, b);
	};

	function __extends$c(d, b) {
	    extendStatics$c(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var fragment$4 = "varying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform float uAlpha;\n\nvoid main(void)\n{\n   gl_FragColor = texture2D(uSampler, vTextureCoord) * uAlpha;\n}\n";

	
	var AlphaFilter =  (function (_super) {
	    __extends$c(AlphaFilter, _super);
	    
	    function AlphaFilter(alpha) {
	        if (alpha === void 0) { alpha = 1.0; }
	        var _this = _super.call(this, _default, fragment$4, { uAlpha: 1 }) || this;
	        _this.alpha = alpha;
	        return _this;
	    }
	    Object.defineProperty(AlphaFilter.prototype, "alpha", {
	        
	        get: function () {
	            return this.uniforms.uAlpha;
	        },
	        set: function (value) {
	            this.uniforms.uAlpha = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return AlphaFilter;
	}(Filter));

	

	
	

	var extendStatics$d = function(d, b) {
	    extendStatics$d = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$d(d, b);
	};

	function __extends$d(d, b) {
	    extendStatics$d(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var vertTemplate = "\n    attribute vec2 aVertexPosition;\n\n    uniform mat3 projectionMatrix;\n\n    uniform float strength;\n\n    varying vec2 vBlurTexCoords[%size%];\n\n    uniform vec4 inputSize;\n    uniform vec4 outputFrame;\n\n    vec4 filterVertexPosition( void )\n    {\n        vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;\n\n        return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n    }\n\n    vec2 filterTextureCoord( void )\n    {\n        return aVertexPosition * (outputFrame.zw * inputSize.zw);\n    }\n\n    void main(void)\n    {\n        gl_Position = filterVertexPosition();\n\n        vec2 textureCoord = filterTextureCoord();\n        %blur%\n    }";
	function generateBlurVertSource(kernelSize, x) {
	    var halfLength = Math.ceil(kernelSize / 2);
	    var vertSource = vertTemplate;
	    var blurLoop = '';
	    var template;
	    if (x) {
	        template = 'vBlurTexCoords[%index%] =  textureCoord + vec2(%sampleIndex% * strength, 0.0);';
	    }
	    else {
	        template = 'vBlurTexCoords[%index%] =  textureCoord + vec2(0.0, %sampleIndex% * strength);';
	    }
	    for (var i = 0; i < kernelSize; i++) {
	        var blur = template.replace('%index%', i.toString());
	        blur = blur.replace('%sampleIndex%', i - (halfLength - 1) + ".0");
	        blurLoop += blur;
	        blurLoop += '\n';
	    }
	    vertSource = vertSource.replace('%blur%', blurLoop);
	    vertSource = vertSource.replace('%size%', kernelSize.toString());
	    return vertSource;
	}

	var GAUSSIAN_VALUES = {
	    5: [0.153388, 0.221461, 0.250301],
	    7: [0.071303, 0.131514, 0.189879, 0.214607],
	    9: [0.028532, 0.067234, 0.124009, 0.179044, 0.20236],
	    11: [0.0093, 0.028002, 0.065984, 0.121703, 0.175713, 0.198596],
	    13: [0.002406, 0.009255, 0.027867, 0.065666, 0.121117, 0.174868, 0.197641],
	    15: [0.000489, 0.002403, 0.009246, 0.02784, 0.065602, 0.120999, 0.174697, 0.197448],
	};
	var fragTemplate$1 = [
	    'varying vec2 vBlurTexCoords[%size%];',
	    'uniform sampler2D uSampler;',
	    'void main(void)',
	    '{',
	    '    gl_FragColor = vec4(0.0);',
	    '    %blur%',
	    '}' ].join('\n');
	function generateBlurFragSource(kernelSize) {
	    var kernel = GAUSSIAN_VALUES[kernelSize];
	    var halfLength = kernel.length;
	    var fragSource = fragTemplate$1;
	    var blurLoop = '';
	    var template = 'gl_FragColor += texture2D(uSampler, vBlurTexCoords[%index%]) * %value%;';
	    var value;
	    for (var i = 0; i < kernelSize; i++) {
	        var blur = template.replace('%index%', i.toString());
	        value = i;
	        if (i >= halfLength) {
	            value = kernelSize - i - 1;
	        }
	        blur = blur.replace('%value%', kernel[value].toString());
	        blurLoop += blur;
	        blurLoop += '\n';
	    }
	    fragSource = fragSource.replace('%blur%', blurLoop);
	    fragSource = fragSource.replace('%size%', kernelSize.toString());
	    return fragSource;
	}

	
	var ENV;
	(function (ENV) {
	    ENV[ENV["WEBGL_LEGACY"] = 0] = "WEBGL_LEGACY";
	    ENV[ENV["WEBGL"] = 1] = "WEBGL";
	    ENV[ENV["WEBGL2"] = 2] = "WEBGL2";
	})(ENV || (ENV = {}));
	
	var RENDERER_TYPE;
	(function (RENDERER_TYPE) {
	    RENDERER_TYPE[RENDERER_TYPE["UNKNOWN"] = 0] = "UNKNOWN";
	    RENDERER_TYPE[RENDERER_TYPE["WEBGL"] = 1] = "WEBGL";
	    RENDERER_TYPE[RENDERER_TYPE["CANVAS"] = 2] = "CANVAS";
	})(RENDERER_TYPE || (RENDERER_TYPE = {}));
	
	var BUFFER_BITS;
	(function (BUFFER_BITS) {
	    BUFFER_BITS[BUFFER_BITS["COLOR"] = 16384] = "COLOR";
	    BUFFER_BITS[BUFFER_BITS["DEPTH"] = 256] = "DEPTH";
	    BUFFER_BITS[BUFFER_BITS["STENCIL"] = 1024] = "STENCIL";
	})(BUFFER_BITS || (BUFFER_BITS = {}));
	
	var BLEND_MODES;
	(function (BLEND_MODES) {
	    BLEND_MODES[BLEND_MODES["NORMAL"] = 0] = "NORMAL";
	    BLEND_MODES[BLEND_MODES["ADD"] = 1] = "ADD";
	    BLEND_MODES[BLEND_MODES["MULTIPLY"] = 2] = "MULTIPLY";
	    BLEND_MODES[BLEND_MODES["SCREEN"] = 3] = "SCREEN";
	    BLEND_MODES[BLEND_MODES["OVERLAY"] = 4] = "OVERLAY";
	    BLEND_MODES[BLEND_MODES["DARKEN"] = 5] = "DARKEN";
	    BLEND_MODES[BLEND_MODES["LIGHTEN"] = 6] = "LIGHTEN";
	    BLEND_MODES[BLEND_MODES["COLOR_DODGE"] = 7] = "COLOR_DODGE";
	    BLEND_MODES[BLEND_MODES["COLOR_BURN"] = 8] = "COLOR_BURN";
	    BLEND_MODES[BLEND_MODES["HARD_LIGHT"] = 9] = "HARD_LIGHT";
	    BLEND_MODES[BLEND_MODES["SOFT_LIGHT"] = 10] = "SOFT_LIGHT";
	    BLEND_MODES[BLEND_MODES["DIFFERENCE"] = 11] = "DIFFERENCE";
	    BLEND_MODES[BLEND_MODES["EXCLUSION"] = 12] = "EXCLUSION";
	    BLEND_MODES[BLEND_MODES["HUE"] = 13] = "HUE";
	    BLEND_MODES[BLEND_MODES["SATURATION"] = 14] = "SATURATION";
	    BLEND_MODES[BLEND_MODES["COLOR"] = 15] = "COLOR";
	    BLEND_MODES[BLEND_MODES["LUMINOSITY"] = 16] = "LUMINOSITY";
	    BLEND_MODES[BLEND_MODES["NORMAL_NPM"] = 17] = "NORMAL_NPM";
	    BLEND_MODES[BLEND_MODES["ADD_NPM"] = 18] = "ADD_NPM";
	    BLEND_MODES[BLEND_MODES["SCREEN_NPM"] = 19] = "SCREEN_NPM";
	    BLEND_MODES[BLEND_MODES["NONE"] = 20] = "NONE";
	    BLEND_MODES[BLEND_MODES["SRC_OVER"] = 0] = "SRC_OVER";
	    BLEND_MODES[BLEND_MODES["SRC_IN"] = 21] = "SRC_IN";
	    BLEND_MODES[BLEND_MODES["SRC_OUT"] = 22] = "SRC_OUT";
	    BLEND_MODES[BLEND_MODES["SRC_ATOP"] = 23] = "SRC_ATOP";
	    BLEND_MODES[BLEND_MODES["DST_OVER"] = 24] = "DST_OVER";
	    BLEND_MODES[BLEND_MODES["DST_IN"] = 25] = "DST_IN";
	    BLEND_MODES[BLEND_MODES["DST_OUT"] = 26] = "DST_OUT";
	    BLEND_MODES[BLEND_MODES["DST_ATOP"] = 27] = "DST_ATOP";
	    BLEND_MODES[BLEND_MODES["ERASE"] = 26] = "ERASE";
	    BLEND_MODES[BLEND_MODES["SUBTRACT"] = 28] = "SUBTRACT";
	    BLEND_MODES[BLEND_MODES["XOR"] = 29] = "XOR";
	})(BLEND_MODES || (BLEND_MODES = {}));
	
	var DRAW_MODES;
	(function (DRAW_MODES) {
	    DRAW_MODES[DRAW_MODES["POINTS"] = 0] = "POINTS";
	    DRAW_MODES[DRAW_MODES["LINES"] = 1] = "LINES";
	    DRAW_MODES[DRAW_MODES["LINE_LOOP"] = 2] = "LINE_LOOP";
	    DRAW_MODES[DRAW_MODES["LINE_STRIP"] = 3] = "LINE_STRIP";
	    DRAW_MODES[DRAW_MODES["TRIANGLES"] = 4] = "TRIANGLES";
	    DRAW_MODES[DRAW_MODES["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
	    DRAW_MODES[DRAW_MODES["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
	})(DRAW_MODES || (DRAW_MODES = {}));
	
	var FORMATS;
	(function (FORMATS) {
	    FORMATS[FORMATS["RGBA"] = 6408] = "RGBA";
	    FORMATS[FORMATS["RGB"] = 6407] = "RGB";
	    FORMATS[FORMATS["ALPHA"] = 6406] = "ALPHA";
	    FORMATS[FORMATS["LUMINANCE"] = 6409] = "LUMINANCE";
	    FORMATS[FORMATS["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
	    FORMATS[FORMATS["DEPTH_COMPONENT"] = 6402] = "DEPTH_COMPONENT";
	    FORMATS[FORMATS["DEPTH_STENCIL"] = 34041] = "DEPTH_STENCIL";
	})(FORMATS || (FORMATS = {}));
	
	var TARGETS;
	(function (TARGETS) {
	    TARGETS[TARGETS["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP"] = 34067] = "TEXTURE_CUBE_MAP";
	    TARGETS[TARGETS["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_X"] = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_X"] = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Y"] = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP_POSITIVE_Z"] = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z";
	    TARGETS[TARGETS["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z";
	})(TARGETS || (TARGETS = {}));
	
	var TYPES;
	(function (TYPES) {
	    TYPES[TYPES["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
	    TYPES[TYPES["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
	    TYPES[TYPES["UNSIGNED_SHORT_5_6_5"] = 33635] = "UNSIGNED_SHORT_5_6_5";
	    TYPES[TYPES["UNSIGNED_SHORT_4_4_4_4"] = 32819] = "UNSIGNED_SHORT_4_4_4_4";
	    TYPES[TYPES["UNSIGNED_SHORT_5_5_5_1"] = 32820] = "UNSIGNED_SHORT_5_5_5_1";
	    TYPES[TYPES["FLOAT"] = 5126] = "FLOAT";
	    TYPES[TYPES["HALF_FLOAT"] = 36193] = "HALF_FLOAT";
	})(TYPES || (TYPES = {}));
	
	var SCALE_MODES;
	(function (SCALE_MODES) {
	    SCALE_MODES[SCALE_MODES["NEAREST"] = 0] = "NEAREST";
	    SCALE_MODES[SCALE_MODES["LINEAR"] = 1] = "LINEAR";
	})(SCALE_MODES || (SCALE_MODES = {}));
	
	var WRAP_MODES;
	(function (WRAP_MODES) {
	    WRAP_MODES[WRAP_MODES["CLAMP"] = 33071] = "CLAMP";
	    WRAP_MODES[WRAP_MODES["REPEAT"] = 10497] = "REPEAT";
	    WRAP_MODES[WRAP_MODES["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
	})(WRAP_MODES || (WRAP_MODES = {}));
	
	var MIPMAP_MODES;
	(function (MIPMAP_MODES) {
	    MIPMAP_MODES[MIPMAP_MODES["OFF"] = 0] = "OFF";
	    MIPMAP_MODES[MIPMAP_MODES["POW2"] = 1] = "POW2";
	    MIPMAP_MODES[MIPMAP_MODES["ON"] = 2] = "ON";
	})(MIPMAP_MODES || (MIPMAP_MODES = {}));
	
	var ALPHA_MODES;
	(function (ALPHA_MODES) {
	    ALPHA_MODES[ALPHA_MODES["NPM"] = 0] = "NPM";
	    ALPHA_MODES[ALPHA_MODES["UNPACK"] = 1] = "UNPACK";
	    ALPHA_MODES[ALPHA_MODES["PMA"] = 2] = "PMA";
	    ALPHA_MODES[ALPHA_MODES["NO_PREMULTIPLIED_ALPHA"] = 0] = "NO_PREMULTIPLIED_ALPHA";
	    ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ON_UPLOAD"] = 1] = "PREMULTIPLY_ON_UPLOAD";
	    ALPHA_MODES[ALPHA_MODES["PREMULTIPLY_ALPHA"] = 2] = "PREMULTIPLY_ALPHA";
	})(ALPHA_MODES || (ALPHA_MODES = {}));
	
	var CLEAR_MODES;
	(function (CLEAR_MODES) {
	    CLEAR_MODES[CLEAR_MODES["NO"] = 0] = "NO";
	    CLEAR_MODES[CLEAR_MODES["YES"] = 1] = "YES";
	    CLEAR_MODES[CLEAR_MODES["AUTO"] = 2] = "AUTO";
	    CLEAR_MODES[CLEAR_MODES["BLEND"] = 0] = "BLEND";
	    CLEAR_MODES[CLEAR_MODES["CLEAR"] = 1] = "CLEAR";
	    CLEAR_MODES[CLEAR_MODES["BLIT"] = 2] = "BLIT";
	})(CLEAR_MODES || (CLEAR_MODES = {}));
	
	var GC_MODES;
	(function (GC_MODES) {
	    GC_MODES[GC_MODES["AUTO"] = 0] = "AUTO";
	    GC_MODES[GC_MODES["MANUAL"] = 1] = "MANUAL";
	})(GC_MODES || (GC_MODES = {}));
	
	var PRECISION;
	(function (PRECISION) {
	    PRECISION["LOW"] = "lowp";
	    PRECISION["MEDIUM"] = "mediump";
	    PRECISION["HIGH"] = "highp";
	})(PRECISION || (PRECISION = {}));
	
	var MASK_TYPES;
	(function (MASK_TYPES) {
	    MASK_TYPES[MASK_TYPES["NONE"] = 0] = "NONE";
	    MASK_TYPES[MASK_TYPES["SCISSOR"] = 1] = "SCISSOR";
	    MASK_TYPES[MASK_TYPES["STENCIL"] = 2] = "STENCIL";
	    MASK_TYPES[MASK_TYPES["SPRITE"] = 3] = "SPRITE";
	})(MASK_TYPES || (MASK_TYPES = {}));
	
	var MSAA_QUALITY;
	(function (MSAA_QUALITY) {
	    MSAA_QUALITY[MSAA_QUALITY["NONE"] = 0] = "NONE";
	    MSAA_QUALITY[MSAA_QUALITY["LOW"] = 2] = "LOW";
	    MSAA_QUALITY[MSAA_QUALITY["MEDIUM"] = 4] = "MEDIUM";
	    MSAA_QUALITY[MSAA_QUALITY["HIGH"] = 8] = "HIGH";
	})(MSAA_QUALITY || (MSAA_QUALITY = {}));

	
	var BlurFilterPass =  (function (_super) {
	    __extends$d(BlurFilterPass, _super);
	    
	    function BlurFilterPass(horizontal, strength, quality, resolution, kernelSize) {
	        if (strength === void 0) { strength = 8; }
	        if (quality === void 0) { quality = 4; }
	        if (resolution === void 0) { resolution = settings.FILTER_RESOLUTION; }
	        if (kernelSize === void 0) { kernelSize = 5; }
	        var _this = this;
	        var vertSrc = generateBlurVertSource(kernelSize, horizontal);
	        var fragSrc = generateBlurFragSource(kernelSize);
	        _this = _super.call(this, 
	        
	        vertSrc, 
	        
	        fragSrc) || this;
	        _this.horizontal = horizontal;
	        _this.resolution = resolution;
	        _this._quality = 0;
	        _this.quality = quality;
	        _this.blur = strength;
	        return _this;
	    }
	    
	    BlurFilterPass.prototype.apply = function (filterManager, input, output, clearMode) {
	        if (output) {
	            if (this.horizontal) {
	                this.uniforms.strength = (1 / output.width) * (output.width / input.width);
	            }
	            else {
	                this.uniforms.strength = (1 / output.height) * (output.height / input.height);
	            }
	        }
	        else {
	            if (this.horizontal) 
	             {
	                this.uniforms.strength = (1 / filterManager.renderer.width) * (filterManager.renderer.width / input.width);
	            }
	            else {
	                this.uniforms.strength = (1 / filterManager.renderer.height) * (filterManager.renderer.height / input.height); 
	            }
	        }
	        
	        this.uniforms.strength *= this.strength;
	        this.uniforms.strength /= this.passes;
	        if (this.passes === 1) {
	            filterManager.applyFilter(this, input, output, clearMode);
	        }
	        else {
	            var renderTarget = filterManager.getFilterTexture();
	            var renderer = filterManager.renderer;
	            var flip = input;
	            var flop = renderTarget;
	            this.state.blend = false;
	            filterManager.applyFilter(this, flip, flop, CLEAR_MODES.CLEAR);
	            for (var i = 1; i < this.passes - 1; i++) {
	                filterManager.bindAndClear(flip, CLEAR_MODES.BLIT);
	                this.uniforms.uSampler = flop;
	                var temp = flop;
	                flop = flip;
	                flip = temp;
	                renderer.shader.bind(this);
	                renderer.geometry.draw(5);
	            }
	            this.state.blend = true;
	            filterManager.applyFilter(this, flop, output, clearMode);
	            filterManager.returnFilterTexture(renderTarget);
	        }
	    };
	    Object.defineProperty(BlurFilterPass.prototype, "blur", {
	        
	        get: function () {
	            return this.strength;
	        },
	        set: function (value) {
	            this.padding = 1 + (Math.abs(value) * 2);
	            this.strength = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BlurFilterPass.prototype, "quality", {
	        
	        get: function () {
	            return this._quality;
	        },
	        set: function (value) {
	            this._quality = value;
	            this.passes = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return BlurFilterPass;
	}(Filter));

	
	var BlurFilter =  (function (_super) {
	    __extends$d(BlurFilter, _super);
	    
	    function BlurFilter(strength, quality, resolution, kernelSize) {
	        if (strength === void 0) { strength = 8; }
	        if (quality === void 0) { quality = 4; }
	        if (resolution === void 0) { resolution = settings.FILTER_RESOLUTION; }
	        if (kernelSize === void 0) { kernelSize = 5; }
	        var _this = _super.call(this) || this;
	        _this.blurXFilter = new BlurFilterPass(true, strength, quality, resolution, kernelSize);
	        _this.blurYFilter = new BlurFilterPass(false, strength, quality, resolution, kernelSize);
	        _this.resolution = resolution;
	        _this.quality = quality;
	        _this.blur = strength;
	        _this.repeatEdgePixels = false;
	        return _this;
	    }
	    
	    BlurFilter.prototype.apply = function (filterManager, input, output, clearMode) {
	        var xStrength = Math.abs(this.blurXFilter.strength);
	        var yStrength = Math.abs(this.blurYFilter.strength);
	        if (xStrength && yStrength) {
	            var renderTarget = filterManager.getFilterTexture();
	            this.blurXFilter.apply(filterManager, input, renderTarget, CLEAR_MODES.CLEAR);
	            this.blurYFilter.apply(filterManager, renderTarget, output, clearMode);
	            filterManager.returnFilterTexture(renderTarget);
	        }
	        else if (yStrength) {
	            this.blurYFilter.apply(filterManager, input, output, clearMode);
	        }
	        else {
	            this.blurXFilter.apply(filterManager, input, output, clearMode);
	        }
	    };
	    BlurFilter.prototype.updatePadding = function () {
	        if (this._repeatEdgePixels) {
	            this.padding = 0;
	        }
	        else {
	            this.padding = Math.max(Math.abs(this.blurXFilter.strength), Math.abs(this.blurYFilter.strength)) * 2;
	        }
	    };
	    Object.defineProperty(BlurFilter.prototype, "blur", {
	        
	        get: function () {
	            return this.blurXFilter.blur;
	        },
	        set: function (value) {
	            this.blurXFilter.blur = this.blurYFilter.blur = value;
	            this.updatePadding();
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BlurFilter.prototype, "quality", {
	        
	        get: function () {
	            return this.blurXFilter.quality;
	        },
	        set: function (value) {
	            this.blurXFilter.quality = this.blurYFilter.quality = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BlurFilter.prototype, "blurX", {
	        
	        get: function () {
	            return this.blurXFilter.blur;
	        },
	        set: function (value) {
	            this.blurXFilter.blur = value;
	            this.updatePadding();
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BlurFilter.prototype, "blurY", {
	        
	        get: function () {
	            return this.blurYFilter.blur;
	        },
	        set: function (value) {
	            this.blurYFilter.blur = value;
	            this.updatePadding();
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BlurFilter.prototype, "blendMode", {
	        
	        get: function () {
	            return this.blurYFilter.blendMode;
	        },
	        set: function (value) {
	            this.blurYFilter.blendMode = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(BlurFilter.prototype, "repeatEdgePixels", {
	        
	        get: function () {
	            return this._repeatEdgePixels;
	        },
	        set: function (value) {
	            this._repeatEdgePixels = value;
	            this.updatePadding();
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return BlurFilter;
	}(Filter));

	

	
	

	var extendStatics$e = function(d, b) {
	    extendStatics$e = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$e(d, b);
	};

	function __extends$e(d, b) {
	    extendStatics$e(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var fragment$5 = "varying vec2 vTextureCoord;\nuniform sampler2D uSampler;\nuniform float m[20];\nuniform float uAlpha;\n\nvoid main(void)\n{\n    vec4 c = texture2D(uSampler, vTextureCoord);\n\n    if (uAlpha == 0.0) {\n        gl_FragColor = c;\n        return;\n    }\n\n    

	
	var ColorMatrixFilter =  (function (_super) {
	    __extends$e(ColorMatrixFilter, _super);
	    function ColorMatrixFilter() {
	        var _this = this;
	        var uniforms = {
	            m: new Float32Array([1, 0, 0, 0, 0,
	                0, 1, 0, 0, 0,
	                0, 0, 1, 0, 0,
	                0, 0, 0, 1, 0]),
	            uAlpha: 1,
	        };
	        _this = _super.call(this, defaultFilter, fragment$5, uniforms) || this;
	        _this.alpha = 1;
	        return _this;
	    }
	    
	    ColorMatrixFilter.prototype._loadMatrix = function (matrix, multiply) {
	        if (multiply === void 0) { multiply = false; }
	        var newMatrix = matrix;
	        if (multiply) {
	            this._multiply(newMatrix, this.uniforms.m, matrix);
	            newMatrix = this._colorMatrix(newMatrix);
	        }
	        
	        this.uniforms.m = newMatrix;
	    };
	    
	    ColorMatrixFilter.prototype._multiply = function (out, a, b) {
	        
	        out[0] = (a[0] * b[0]) + (a[1] * b[5]) + (a[2] * b[10]) + (a[3] * b[15]);
	        out[1] = (a[0] * b[1]) + (a[1] * b[6]) + (a[2] * b[11]) + (a[3] * b[16]);
	        out[2] = (a[0] * b[2]) + (a[1] * b[7]) + (a[2] * b[12]) + (a[3] * b[17]);
	        out[3] = (a[0] * b[3]) + (a[1] * b[8]) + (a[2] * b[13]) + (a[3] * b[18]);
	        out[4] = (a[0] * b[4]) + (a[1] * b[9]) + (a[2] * b[14]) + (a[3] * b[19]) + a[4];
	        
	        out[5] = (a[5] * b[0]) + (a[6] * b[5]) + (a[7] * b[10]) + (a[8] * b[15]);
	        out[6] = (a[5] * b[1]) + (a[6] * b[6]) + (a[7] * b[11]) + (a[8] * b[16]);
	        out[7] = (a[5] * b[2]) + (a[6] * b[7]) + (a[7] * b[12]) + (a[8] * b[17]);
	        out[8] = (a[5] * b[3]) + (a[6] * b[8]) + (a[7] * b[13]) + (a[8] * b[18]);
	        out[9] = (a[5] * b[4]) + (a[6] * b[9]) + (a[7] * b[14]) + (a[8] * b[19]) + a[9];
	        
	        out[10] = (a[10] * b[0]) + (a[11] * b[5]) + (a[12] * b[10]) + (a[13] * b[15]);
	        out[11] = (a[10] * b[1]) + (a[11] * b[6]) + (a[12] * b[11]) + (a[13] * b[16]);
	        out[12] = (a[10] * b[2]) + (a[11] * b[7]) + (a[12] * b[12]) + (a[13] * b[17]);
	        out[13] = (a[10] * b[3]) + (a[11] * b[8]) + (a[12] * b[13]) + (a[13] * b[18]);
	        out[14] = (a[10] * b[4]) + (a[11] * b[9]) + (a[12] * b[14]) + (a[13] * b[19]) + a[14];
	        
	        out[15] = (a[15] * b[0]) + (a[16] * b[5]) + (a[17] * b[10]) + (a[18] * b[15]);
	        out[16] = (a[15] * b[1]) + (a[16] * b[6]) + (a[17] * b[11]) + (a[18] * b[16]);
	        out[17] = (a[15] * b[2]) + (a[16] * b[7]) + (a[17] * b[12]) + (a[18] * b[17]);
	        out[18] = (a[15] * b[3]) + (a[16] * b[8]) + (a[17] * b[13]) + (a[18] * b[18]);
	        out[19] = (a[15] * b[4]) + (a[16] * b[9]) + (a[17] * b[14]) + (a[18] * b[19]) + a[19];
	        return out;
	    };
	    
	    ColorMatrixFilter.prototype._colorMatrix = function (matrix) {
	        
	        var m = new Float32Array(matrix);
	        m[4] /= 255;
	        m[9] /= 255;
	        m[14] /= 255;
	        m[19] /= 255;
	        return m;
	    };
	    
	    ColorMatrixFilter.prototype.brightness = function (b, multiply) {
	        var matrix = [
	            b, 0, 0, 0, 0,
	            0, b, 0, 0, 0,
	            0, 0, b, 0, 0,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.greyscale = function (scale, multiply) {
	        var matrix = [
	            scale, scale, scale, 0, 0,
	            scale, scale, scale, 0, 0,
	            scale, scale, scale, 0, 0,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.blackAndWhite = function (multiply) {
	        var matrix = [
	            0.3, 0.6, 0.1, 0, 0,
	            0.3, 0.6, 0.1, 0, 0,
	            0.3, 0.6, 0.1, 0, 0,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.hue = function (rotation, multiply) {
	        rotation = (rotation || 0) / 180 * Math.PI;
	        var cosR = Math.cos(rotation);
	        var sinR = Math.sin(rotation);
	        var sqrt = Math.sqrt;
	        
	        var w = 1 / 3;
	        var sqrW = sqrt(w); 
	        var a00 = cosR + ((1.0 - cosR) * w);
	        var a01 = (w * (1.0 - cosR)) - (sqrW * sinR);
	        var a02 = (w * (1.0 - cosR)) + (sqrW * sinR);
	        var a10 = (w * (1.0 - cosR)) + (sqrW * sinR);
	        var a11 = cosR + (w * (1.0 - cosR));
	        var a12 = (w * (1.0 - cosR)) - (sqrW * sinR);
	        var a20 = (w * (1.0 - cosR)) - (sqrW * sinR);
	        var a21 = (w * (1.0 - cosR)) + (sqrW * sinR);
	        var a22 = cosR + (w * (1.0 - cosR));
	        var matrix = [
	            a00, a01, a02, 0, 0,
	            a10, a11, a12, 0, 0,
	            a20, a21, a22, 0, 0,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.contrast = function (amount, multiply) {
	        var v = (amount || 0) + 1;
	        var o = -0.5 * (v - 1);
	        var matrix = [
	            v, 0, 0, 0, o,
	            0, v, 0, 0, o,
	            0, 0, v, 0, o,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.saturate = function (amount, multiply) {
	        if (amount === void 0) { amount = 0; }
	        var x = (amount * 2 / 3) + 1;
	        var y = ((x - 1) * -0.5);
	        var matrix = [
	            x, y, y, 0, 0,
	            y, x, y, 0, 0,
	            y, y, x, 0, 0,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.desaturate = function () {
	        this.saturate(-1);
	    };
	    
	    ColorMatrixFilter.prototype.negative = function (multiply) {
	        var matrix = [
	            -1, 0, 0, 1, 0,
	            0, -1, 0, 1, 0,
	            0, 0, -1, 1, 0,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.sepia = function (multiply) {
	        var matrix = [
	            0.393, 0.7689999, 0.18899999, 0, 0,
	            0.349, 0.6859999, 0.16799999, 0, 0,
	            0.272, 0.5339999, 0.13099999, 0, 0,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.technicolor = function (multiply) {
	        var matrix = [
	            1.9125277891456083, -0.8545344976951645, -0.09155508482755585, 0, 11.793603434377337,
	            -0.3087833385928097, 1.7658908555458428, -0.10601743074722245, 0, -70.35205161461398,
	            -0.231103377548616, -0.7501899197440212, 1.847597816108189, 0, 30.950940869491138,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.polaroid = function (multiply) {
	        var matrix = [
	            1.438, -0.062, -0.062, 0, 0,
	            -0.122, 1.378, -0.122, 0, 0,
	            -0.016, -0.016, 1.483, 0, 0,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.toBGR = function (multiply) {
	        var matrix = [
	            0, 0, 1, 0, 0,
	            0, 1, 0, 0, 0,
	            1, 0, 0, 0, 0,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.kodachrome = function (multiply) {
	        var matrix = [
	            1.1285582396593525, -0.3967382283601348, -0.03992559172921793, 0, 63.72958762196502,
	            -0.16404339962244616, 1.0835251566291304, -0.05498805115633132, 0, 24.732407896706203,
	            -0.16786010706155763, -0.5603416277695248, 1.6014850761964943, 0, 35.62982807460946,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.browni = function (multiply) {
	        var matrix = [
	            0.5997023498159715, 0.34553243048391263, -0.2708298674538042, 0, 47.43192855600873,
	            -0.037703249837783157, 0.8609577587992641, 0.15059552388459913, 0, -36.96841498319127,
	            0.24113635128153335, -0.07441037908422492, 0.44972182064877153, 0, -7.562075277591283,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.vintage = function (multiply) {
	        var matrix = [
	            0.6279345635605994, 0.3202183420819367, -0.03965408211312453, 0, 9.651285835294123,
	            0.02578397704808868, 0.6441188644374771, 0.03259127616149294, 0, 7.462829176470591,
	            0.0466055556782719, -0.0851232987247891, 0.5241648018700465, 0, 5.159190588235296,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.colorTone = function (desaturation, toned, lightColor, darkColor, multiply) {
	        desaturation = desaturation || 0.2;
	        toned = toned || 0.15;
	        lightColor = lightColor || 0xFFE580;
	        darkColor = darkColor || 0x338000;
	        var lR = ((lightColor >> 16) & 0xFF) / 255;
	        var lG = ((lightColor >> 8) & 0xFF) / 255;
	        var lB = (lightColor & 0xFF) / 255;
	        var dR = ((darkColor >> 16) & 0xFF) / 255;
	        var dG = ((darkColor >> 8) & 0xFF) / 255;
	        var dB = (darkColor & 0xFF) / 255;
	        var matrix = [
	            0.3, 0.59, 0.11, 0, 0,
	            lR, lG, lB, desaturation, 0,
	            dR, dG, dB, toned, 0,
	            lR - dR, lG - dG, lB - dB, 0, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.night = function (intensity, multiply) {
	        intensity = intensity || 0.1;
	        var matrix = [
	            intensity * (-2.0), -intensity, 0, 0, 0,
	            -intensity, 0, intensity, 0, 0,
	            0, intensity, intensity * 2.0, 0, 0,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.predator = function (amount, multiply) {
	        var matrix = [
	            
	            11.224130630493164 * amount,
	            -4.794486999511719 * amount,
	            -2.8746118545532227 * amount,
	            0 * amount,
	            0.40342438220977783 * amount,
	            
	            -3.6330697536468506 * amount,
	            9.193157196044922 * amount,
	            -2.951810836791992 * amount,
	            0 * amount,
	            -1.316135048866272 * amount,
	            
	            -3.2184197902679443 * amount,
	            -4.2375030517578125 * amount,
	            7.476448059082031 * amount,
	            0 * amount,
	            0.8044459223747253 * amount,
	            
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.lsd = function (multiply) {
	        var matrix = [
	            2, -0.4, 0.5, 0, 0,
	            -0.5, 2, -0.4, 0, 0,
	            -0.4, -0.5, 3, 0, 0,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, multiply);
	    };
	    
	    ColorMatrixFilter.prototype.reset = function () {
	        var matrix = [
	            1, 0, 0, 0, 0,
	            0, 1, 0, 0, 0,
	            0, 0, 1, 0, 0,
	            0, 0, 0, 1, 0 ];
	        this._loadMatrix(matrix, false);
	    };
	    Object.defineProperty(ColorMatrixFilter.prototype, "matrix", {
	        
	        get: function () {
	            return this.uniforms.m;
	        },
	        set: function (value) {
	            this.uniforms.m = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(ColorMatrixFilter.prototype, "alpha", {
	        
	        get: function () {
	            return this.uniforms.uAlpha;
	        },
	        set: function (value) {
	            this.uniforms.uAlpha = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return ColorMatrixFilter;
	}(Filter));
	
	ColorMatrixFilter.prototype.grayscale = ColorMatrixFilter.prototype.greyscale;

	

	
	

	var extendStatics$f = function(d, b) {
	    extendStatics$f = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$f(d, b);
	};

	function __extends$f(d, b) {
	    extendStatics$f(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var fragment$6 = "varying vec2 vFilterCoord;\nvarying vec2 vTextureCoord;\n\nuniform vec2 scale;\nuniform mat2 rotation;\nuniform sampler2D uSampler;\nuniform sampler2D mapSampler;\n\nuniform highp vec4 inputSize;\nuniform vec4 inputClamp;\n\nvoid main(void)\n{\n  vec4 map =  texture2D(mapSampler, vFilterCoord);\n\n  map -= 0.5;\n  map.xy = scale * inputSize.zw * (rotation * map.xy);\n\n  gl_FragColor = texture2D(uSampler, clamp(vec2(vTextureCoord.x + map.x, vTextureCoord.y + map.y), inputClamp.xy, inputClamp.zw));\n}\n";

	var vertex$4 = "attribute vec2 aVertexPosition;\n\nuniform mat3 projectionMatrix;\nuniform mat3 filterMatrix;\n\nvarying vec2 vTextureCoord;\nvarying vec2 vFilterCoord;\n\nuniform vec4 inputSize;\nuniform vec4 outputFrame;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;\n\n    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aVertexPosition * (outputFrame.zw * inputSize.zw);\n}\n\nvoid main(void)\n{\n\tgl_Position = filterVertexPosition();\n\tvTextureCoord = filterTextureCoord();\n\tvFilterCoord = ( filterMatrix * vec3( vTextureCoord, 1.0)  ).xy;\n}\n";

	
	var DisplacementFilter =  (function (_super) {
	    __extends$f(DisplacementFilter, _super);
	    
	    function DisplacementFilter(sprite, scale) {
	        var _this = this;
	        var maskMatrix = new Matrix();
	        sprite.renderable = false;
	        _this = _super.call(this, vertex$4, fragment$6, {
	            mapSampler: sprite._texture,
	            filterMatrix: maskMatrix,
	            scale: { x: 1, y: 1 },
	            rotation: new Float32Array([1, 0, 0, 1]),
	        }) || this;
	        _this.maskSprite = sprite;
	        _this.maskMatrix = maskMatrix;
	        if (scale === null || scale === undefined) {
	            scale = 20;
	        }
	        
	        _this.scale = new Point(scale, scale);
	        return _this;
	    }
	    
	    DisplacementFilter.prototype.apply = function (filterManager, input, output, clearMode) {
	        
	        this.uniforms.filterMatrix = filterManager.calculateSpriteMatrix(this.maskMatrix, this.maskSprite);
	        this.uniforms.scale.x = this.scale.x;
	        this.uniforms.scale.y = this.scale.y;
	        
	        var wt = this.maskSprite.worldTransform;
	        var lenX = Math.sqrt((wt.a * wt.a) + (wt.b * wt.b));
	        var lenY = Math.sqrt((wt.c * wt.c) + (wt.d * wt.d));
	        if (lenX !== 0 && lenY !== 0) {
	            this.uniforms.rotation[0] = wt.a / lenX;
	            this.uniforms.rotation[1] = wt.b / lenX;
	            this.uniforms.rotation[2] = wt.c / lenY;
	            this.uniforms.rotation[3] = wt.d / lenY;
	        }
	        
	        filterManager.applyFilter(this, input, output, clearMode);
	    };
	    Object.defineProperty(DisplacementFilter.prototype, "map", {
	        
	        get: function () {
	            return this.uniforms.mapSampler;
	        },
	        set: function (value) {
	            this.uniforms.mapSampler = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return DisplacementFilter;
	}(Filter));

	

	
	

	var extendStatics$g = function(d, b) {
	    extendStatics$g = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$g(d, b);
	};

	function __extends$g(d, b) {
	    extendStatics$g(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var vertex$5 = "\nattribute vec2 aVertexPosition;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 v_rgbNW;\nvarying vec2 v_rgbNE;\nvarying vec2 v_rgbSW;\nvarying vec2 v_rgbSE;\nvarying vec2 v_rgbM;\n\nvarying vec2 vFragCoord;\n\nuniform vec4 inputPixel;\nuniform vec4 outputFrame;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;\n\n    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n}\n\nvoid texcoords(vec2 fragCoord, vec2 inverseVP,\n               out vec2 v_rgbNW, out vec2 v_rgbNE,\n               out vec2 v_rgbSW, out vec2 v_rgbSE,\n               out vec2 v_rgbM) {\n    v_rgbNW = (fragCoord + vec2(-1.0, -1.0)) * inverseVP;\n    v_rgbNE = (fragCoord + vec2(1.0, -1.0)) * inverseVP;\n    v_rgbSW = (fragCoord + vec2(-1.0, 1.0)) * inverseVP;\n    v_rgbSE = (fragCoord + vec2(1.0, 1.0)) * inverseVP;\n    v_rgbM = vec2(fragCoord * inverseVP);\n}\n\nvoid main(void) {\n\n   gl_Position = filterVertexPosition();\n\n   vFragCoord = aVertexPosition * outputFrame.zw;\n\n   texcoords(vFragCoord, inputPixel.zw, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);\n}\n";

	var fragment$7 = "varying vec2 v_rgbNW;\nvarying vec2 v_rgbNE;\nvarying vec2 v_rgbSW;\nvarying vec2 v_rgbSE;\nvarying vec2 v_rgbM;\n\nvarying vec2 vFragCoord;\nuniform sampler2D uSampler;\nuniform highp vec4 inputPixel;\n\n\n\n\n#ifndef FXAA_REDUCE_MIN\n#define FXAA_REDUCE_MIN   (1.0/ 128.0)\n#endif\n#ifndef FXAA_REDUCE_MUL\n#define FXAA_REDUCE_MUL   (1.0 / 8.0)\n#endif\n#ifndef FXAA_SPAN_MAX\n#define FXAA_SPAN_MAX     8.0\n#endif\n\n

	
	var FXAAFilter =  (function (_super) {
	    __extends$g(FXAAFilter, _super);
	    function FXAAFilter() {
	        
	        return _super.call(this, vertex$5, fragment$7) || this;
	    }
	    return FXAAFilter;
	}(Filter));

	

	
	

	var extendStatics$h = function(d, b) {
	    extendStatics$h = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$h(d, b);
	};

	function __extends$h(d, b) {
	    extendStatics$h(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var fragment$8 = "precision highp float;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nuniform float uNoise;\nuniform float uSeed;\nuniform sampler2D uSampler;\n\nfloat rand(vec2 co)\n{\n    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);\n}\n\nvoid main()\n{\n    vec4 color = texture2D(uSampler, vTextureCoord);\n    float randomValue = rand(gl_FragCoord.xy * uSeed);\n    float diff = (randomValue - 0.5) * uNoise;\n\n    

	
	
	var NoiseFilter =  (function (_super) {
	    __extends$h(NoiseFilter, _super);
	    
	    function NoiseFilter(noise, seed) {
	        if (noise === void 0) { noise = 0.5; }
	        if (seed === void 0) { seed = Math.random(); }
	        var _this = _super.call(this, defaultFilter, fragment$8, {
	            uNoise: 0,
	            uSeed: 0,
	        }) || this;
	        _this.noise = noise;
	        _this.seed = seed;
	        return _this;
	    }
	    Object.defineProperty(NoiseFilter.prototype, "noise", {
	        
	        get: function () {
	            return this.uniforms.uNoise;
	        },
	        set: function (value) {
	            this.uniforms.uNoise = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(NoiseFilter.prototype, "seed", {
	        
	        get: function () {
	            return this.uniforms.uSeed;
	        },
	        set: function (value) {
	            this.uniforms.uSeed = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return NoiseFilter;
	}(Filter));

	

	var _tempMatrix = new Matrix();
	DisplayObject.prototype._cacheAsBitmap = false;
	DisplayObject.prototype._cacheData = null;
	
	
	
	
	var CacheData =  (function () {
	    function CacheData() {
	        this.textureCacheId = null;
	        this.originalRender = null;
	        this.originalRenderCanvas = null;
	        this.originalCalculateBounds = null;
	        this.originalGetLocalBounds = null;
	        this.originalUpdateTransform = null;
	        this.originalDestroy = null;
	        this.originalMask = null;
	        this.originalFilterArea = null;
	        this.originalContainsPoint = null;
	        this.sprite = null;
	    }
	    return CacheData;
	}());
	Object.defineProperties(DisplayObject.prototype, {
	    
	    cacheAsBitmap: {
	        get: function () {
	            return this._cacheAsBitmap;
	        },
	        set: function (value) {
	            if (this._cacheAsBitmap === value) {
	                return;
	            }
	            this._cacheAsBitmap = value;
	            var data;
	            if (value) {
	                if (!this._cacheData) {
	                    this._cacheData = new CacheData();
	                }
	                data = this._cacheData;
	                data.originalRender = this.render;
	                data.originalRenderCanvas = this.renderCanvas;
	                data.originalUpdateTransform = this.updateTransform;
	                data.originalCalculateBounds = this.calculateBounds;
	                data.originalGetLocalBounds = this.getLocalBounds;
	                data.originalDestroy = this.destroy;
	                data.originalContainsPoint = this.containsPoint;
	                data.originalMask = this._mask;
	                data.originalFilterArea = this.filterArea;
	                this.render = this._renderCached;
	                this.renderCanvas = this._renderCachedCanvas;
	                this.destroy = this._cacheAsBitmapDestroy;
	            }
	            else {
	                data = this._cacheData;
	                if (data.sprite) {
	                    this._destroyCachedDisplayObject();
	                }
	                this.render = data.originalRender;
	                this.renderCanvas = data.originalRenderCanvas;
	                this.calculateBounds = data.originalCalculateBounds;
	                this.getLocalBounds = data.originalGetLocalBounds;
	                this.destroy = data.originalDestroy;
	                this.updateTransform = data.originalUpdateTransform;
	                this.containsPoint = data.originalContainsPoint;
	                this._mask = data.originalMask;
	                this.filterArea = data.originalFilterArea;
	            }
	        },
	    },
	});
	
	DisplayObject.prototype._renderCached = function _renderCached(renderer) {
	    if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
	        return;
	    }
	    this._initCachedDisplayObject(renderer);
	    this._cacheData.sprite.transform._worldID = this.transform._worldID;
	    this._cacheData.sprite.worldAlpha = this.worldAlpha;
	    this._cacheData.sprite._render(renderer);
	};
	
	DisplayObject.prototype._initCachedDisplayObject = function _initCachedDisplayObject(renderer) {
	    if (this._cacheData && this._cacheData.sprite) {
	        return;
	    }
	    
	    var cacheAlpha = this.alpha;
	    this.alpha = 1;
	    
	    renderer.batch.flush();
	    
	    
	    
	    
	    
	    var bounds = this.getLocalBounds(null, true).clone();
	    
	    if (this.filters) {
	        var padding = this.filters[0].padding;
	        bounds.pad(padding);
	    }
	    bounds.ceil(settings.RESOLUTION);
	    
	    
	    var cachedRenderTexture = renderer.renderTexture.current;
	    var cachedSourceFrame = renderer.renderTexture.sourceFrame.clone();
	    var cachedDestinationFrame = renderer.renderTexture.destinationFrame.clone();
	    var cachedProjectionTransform = renderer.projection.transform;
	    
	    
	    
	    var renderTexture = RenderTexture.create({ width: bounds.width, height: bounds.height });
	    var textureCacheId = "cacheAsBitmap_" + uid();
	    this._cacheData.textureCacheId = textureCacheId;
	    BaseTexture.addToCache(renderTexture.baseTexture, textureCacheId);
	    Texture.addToCache(renderTexture, textureCacheId);
	    
	    var m = this.transform.localTransform.copyTo(_tempMatrix).invert().translate(-bounds.x, -bounds.y);
	    
	    this.render = this._cacheData.originalRender;
	    renderer.render(this, renderTexture, true, m, false);
	    
	    renderer.projection.transform = cachedProjectionTransform;
	    renderer.renderTexture.bind(cachedRenderTexture, cachedSourceFrame, cachedDestinationFrame);
	    
	    this.render = this._renderCached;
	    
	    this.updateTransform = this.displayObjectUpdateTransform;
	    this.calculateBounds = this._calculateCachedBounds;
	    this.getLocalBounds = this._getCachedLocalBounds;
	    this._mask = null;
	    this.filterArea = null;
	    
	    var cachedSprite = new Sprite(renderTexture);
	    cachedSprite.transform.worldTransform = this.transform.worldTransform;
	    cachedSprite.anchor.x = -(bounds.x / bounds.width);
	    cachedSprite.anchor.y = -(bounds.y / bounds.height);
	    cachedSprite.alpha = cacheAlpha;
	    cachedSprite._bounds = this._bounds;
	    this._cacheData.sprite = cachedSprite;
	    this.transform._parentID = -1;
	    
	    if (!this.parent) {
	        this.enableTempParent();
	        this.updateTransform();
	        this.disableTempParent(null);
	    }
	    else {
	        this.updateTransform();
	    }
	    
	    this.containsPoint = cachedSprite.containsPoint.bind(cachedSprite);
	};
	
	DisplayObject.prototype._renderCachedCanvas = function _renderCachedCanvas(renderer) {
	    if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
	        return;
	    }
	    this._initCachedDisplayObjectCanvas(renderer);
	    this._cacheData.sprite.worldAlpha = this.worldAlpha;
	    this._cacheData.sprite._renderCanvas(renderer);
	};
	
	
	DisplayObject.prototype._initCachedDisplayObjectCanvas = function _initCachedDisplayObjectCanvas(renderer) {
	    if (this._cacheData && this._cacheData.sprite) {
	        return;
	    }
	    
	    var bounds = this.getLocalBounds(null, true);
	    var cacheAlpha = this.alpha;
	    this.alpha = 1;
	    var cachedRenderTarget = renderer.context;
	    var cachedProjectionTransform = renderer._projTransform;
	    bounds.ceil(settings.RESOLUTION);
	    var renderTexture = RenderTexture.create({ width: bounds.width, height: bounds.height });
	    var textureCacheId = "cacheAsBitmap_" + uid();
	    this._cacheData.textureCacheId = textureCacheId;
	    BaseTexture.addToCache(renderTexture.baseTexture, textureCacheId);
	    Texture.addToCache(renderTexture, textureCacheId);
	    
	    var m = _tempMatrix;
	    this.transform.localTransform.copyTo(m);
	    m.invert();
	    m.tx -= bounds.x;
	    m.ty -= bounds.y;
	    
	    
	    this.renderCanvas = this._cacheData.originalRenderCanvas;
	    renderer.render(this, renderTexture, true, m, false);
	    
	    renderer.context = cachedRenderTarget;
	    renderer._projTransform = cachedProjectionTransform;
	    this.renderCanvas = this._renderCachedCanvas;
	    
	    this.updateTransform = this.displayObjectUpdateTransform;
	    this.calculateBounds = this._calculateCachedBounds;
	    this.getLocalBounds = this._getCachedLocalBounds;
	    this._mask = null;
	    this.filterArea = null;
	    
	    var cachedSprite = new Sprite(renderTexture);
	    cachedSprite.transform.worldTransform = this.transform.worldTransform;
	    cachedSprite.anchor.x = -(bounds.x / bounds.width);
	    cachedSprite.anchor.y = -(bounds.y / bounds.height);
	    cachedSprite.alpha = cacheAlpha;
	    cachedSprite._bounds = this._bounds;
	    this._cacheData.sprite = cachedSprite;
	    this.transform._parentID = -1;
	    
	    if (!this.parent) {
	        this.parent = renderer._tempDisplayObjectParent;
	        this.updateTransform();
	        this.parent = null;
	    }
	    else {
	        this.updateTransform();
	    }
	    
	    this.containsPoint = cachedSprite.containsPoint.bind(cachedSprite);
	};
	
	DisplayObject.prototype._calculateCachedBounds = function _calculateCachedBounds() {
	    this._bounds.clear();
	    this._cacheData.sprite.transform._worldID = this.transform._worldID;
	    this._cacheData.sprite._calculateBounds();
	    this._bounds.updateID = this._boundsID;
	};
	
	DisplayObject.prototype._getCachedLocalBounds = function _getCachedLocalBounds() {
	    return this._cacheData.sprite.getLocalBounds(null);
	};
	
	DisplayObject.prototype._destroyCachedDisplayObject = function _destroyCachedDisplayObject() {
	    this._cacheData.sprite._texture.destroy(true);
	    this._cacheData.sprite = null;
	    BaseTexture.removeFromCache(this._cacheData.textureCacheId);
	    Texture.removeFromCache(this._cacheData.textureCacheId);
	    this._cacheData.textureCacheId = null;
	};
	
	DisplayObject.prototype._cacheAsBitmapDestroy = function _cacheAsBitmapDestroy(options) {
	    this.cacheAsBitmap = false;
	    this.destroy(options);
	};

	

	
	DisplayObject.prototype.name = null;
	
	Container.prototype.getChildByName = function getChildByName(name, deep) {
	    for (var i = 0, j = this.children.length; i < j; i++) {
	        if (this.children[i].name === name) {
	            return this.children[i];
	        }
	    }
	    if (deep) {
	        for (var i = 0, j = this.children.length; i < j; i++) {
	            var child = this.children[i];
	            if (!child.getChildByName) {
	                continue;
	            }
	            var target = this.children[i].getChildByName(name, true);
	            if (target) {
	                return target;
	            }
	        }
	    }
	    return null;
	};

	

	
	DisplayObject.prototype.getGlobalPosition = function getGlobalPosition(point, skipUpdate) {
	    if (point === void 0) { point = new Point(); }
	    if (skipUpdate === void 0) { skipUpdate = false; }
	    if (this.parent) {
	        this.parent.toGlobal(this.position, point, skipUpdate);
	    }
	    else {
	        point.x = this.position.x;
	        point.y = this.position.y;
	    }
	    return point;
	};

	
	

	var extendStatics$i = function(d, b) {
	    extendStatics$i = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$i(d, b);
	};

	function __extends$i(d, b) {
	    extendStatics$i(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var __assign = function() {
	    __assign = Object.assign || function __assign(t) {
	        var arguments$1 = arguments;

	        for (var s, i = 1, n = arguments.length; i < n; i++) {
	            s = arguments$1[i];
	            for (var p in s) { if (Object.prototype.hasOwnProperty.call(s, p)) { t[p] = s[p]; } }
	        }
	        return t;
	    };
	    return __assign.apply(this, arguments);
	};

	function __rest(s, e) {
	    var t = {};
	    for (var p in s) { if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
	        { t[p] = s[p]; } }
	    if (s != null && typeof Object.getOwnPropertySymbols === "function")
	        { for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) { if (e.indexOf(p[i]) < 0)
	            { t[p[i]] = s[p[i]]; } } }
	    return t;
	}

	function __decorate(decorators, target, key, desc) {
	    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") { r = Reflect.decorate(decorators, target, key, desc); }
	    else { for (var i = decorators.length - 1; i >= 0; i--) { if (d = decorators[i]) { r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r; } } }
	    return c > 3 && r && Object.defineProperty(target, key, r), r;
	}

	function __param(paramIndex, decorator) {
	    return function (target, key) { decorator(target, key, paramIndex); }
	}

	function __metadata(metadataKey, metadataValue) {
	    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") { return Reflect.metadata(metadataKey, metadataValue); }
	}

	function __awaiter(thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	}

	function __generator(thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) { throw t[1]; } return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) { throw new TypeError("Generator is already executing."); }
	        while (_) { try {
	            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) { return t; }
	            if (y = 0, t) { op = [op[0] & 2, t.value]; }
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) { _.ops.pop(); }
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; } }
	        if (op[0] & 5) { throw op[1]; } return { value: op[0] ? op[1] : void 0, done: true };
	    }
	}

	function __exportStar(m, exports) {
	    for (var p in m) { if (!exports.hasOwnProperty(p)) { exports[p] = m[p]; } }
	}

	function __values(o) {
	    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
	    if (m) { return m.call(o); }
	    return {
	        next: function () {
	            if (o && i >= o.length) { o = void 0; }
	            return { value: o && o[i++], done: !o };
	        }
	    };
	}

	function __read(o, n) {
	    var m = typeof Symbol === "function" && o[Symbol.iterator];
	    if (!m) { return o; }
	    var i = m.call(o), r, ar = [], e;
	    try {
	        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) { ar.push(r.value); }
	    }
	    catch (error) { e = { error: error }; }
	    finally {
	        try {
	            if (r && !r.done && (m = i["return"])) { m.call(i); }
	        }
	        finally { if (e) { throw e.error; } }
	    }
	    return ar;
	}

	function __spread() {
	    var arguments$1 = arguments;

	    for (var ar = [], i = 0; i < arguments.length; i++)
	        { ar = ar.concat(__read(arguments$1[i])); }
	    return ar;
	}

	function __await(v) {
	    return this instanceof __await ? (this.v = v, this) : new __await(v);
	}

	function __asyncGenerator(thisArg, _arguments, generator) {
	    if (!Symbol.asyncIterator) { throw new TypeError("Symbol.asyncIterator is not defined."); }
	    var g = generator.apply(thisArg, _arguments || []), i, q = [];
	    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
	    function verb(n) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; } }
	    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
	    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
	    function fulfill(value) { resume("next", value); }
	    function reject(value) { resume("throw", value); }
	    function settle(f, v) { if (f(v), q.shift(), q.length) { resume(q[0][0], q[0][1]); } }
	}

	function __asyncDelegator(o) {
	    var i, p;
	    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
	    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
	}

	function __asyncValues(o) {
	    if (!Symbol.asyncIterator) { throw new TypeError("Symbol.asyncIterator is not defined."); }
	    var m = o[Symbol.asyncIterator], i;
	    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
	    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
	    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
	}

	function __makeTemplateObject(cooked, raw) {
	    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
	    return cooked;
	};

	function __importStar(mod) {
	    if (mod && mod.__esModule) { return mod; }
	    var result = {};
	    if (mod != null) { for (var k in mod) { if (Object.hasOwnProperty.call(mod, k)) { result[k] = mod[k]; } } }
	    result.default = mod;
	    return result;
	}

	function __importDefault(mod) {
	    return (mod && mod.__esModule) ? mod : { default: mod };
	}

	var v5 = '5.0.0';
	
	
	function useDeprecated() {
	    
	    var PIXI = this;
	    Object.defineProperties(PIXI, {
	        
	        SVG_SIZE: {
	            get: function () {
	                deprecation(v5, 'PIXI.utils.SVG_SIZE property has moved to PIXI.resources.SVGResource.SVG_SIZE');
	                return PIXI.SVGResource.SVG_SIZE;
	            },
	        },
	        
	        TransformStatic: {
	            get: function () {
	                deprecation(v5, 'PIXI.TransformStatic class has been removed, use PIXI.Transform');
	                return PIXI.Transform;
	            },
	        },
	        
	        TransformBase: {
	            get: function () {
	                deprecation(v5, 'PIXI.TransformBase class has been removed, use PIXI.Transform');
	                return PIXI.Transform;
	            },
	        },
	        
	        TRANSFORM_MODE: {
	            get: function () {
	                deprecation(v5, 'PIXI.TRANSFORM_MODE property has been removed');
	                return { STATIC: 0, DYNAMIC: 1 };
	            },
	        },
	        
	        WebGLRenderer: {
	            get: function () {
	                deprecation(v5, 'PIXI.WebGLRenderer class has moved to PIXI.Renderer');
	                return PIXI.Renderer;
	            },
	        },
	        
	        CanvasRenderTarget: {
	            get: function () {
	                deprecation(v5, 'PIXI.CanvasRenderTarget class has moved to PIXI.utils.CanvasRenderTarget');
	                return PIXI.utils.CanvasRenderTarget;
	            },
	        },
	        
	        loader: {
	            get: function () {
	                deprecation(v5, 'PIXI.loader instance has moved to PIXI.Loader.shared');
	                return PIXI.Loader.shared;
	            },
	        },
	        
	        FilterManager: {
	            get: function () {
	                deprecation(v5, 'PIXI.FilterManager class has moved to PIXI.systems.FilterSystem');
	                return PIXI.systems.FilterSystem;
	            },
	        },
	        
	        CanvasTinter: {
	            get: function () {
	                deprecation('5.2.0', 'PIXI.CanvasTinter namespace has moved to PIXI.canvasUtils');
	                return PIXI.canvasUtils;
	            },
	        },
	        
	        GroupD8: {
	            get: function () {
	                deprecation('5.2.0', 'PIXI.GroupD8 namespace has moved to PIXI.groupD8');
	                return PIXI.groupD8;
	            },
	        },
	    });
	    
	    PIXI.accessibility = {};
	    Object.defineProperties(PIXI.accessibility, {
	        
	        AccessibilityManager: {
	            get: function () {
	                deprecation('5.3.0', 'PIXI.accessibility.AccessibilityManager moved to PIXI.AccessibilityManager');
	                return PIXI.AccessibilityManager;
	            },
	        },
	    });
	    
	    PIXI.interaction = {};
	    Object.defineProperties(PIXI.interaction, {
	        
	        InteractionManager: {
	            get: function () {
	                deprecation('5.3.0', 'PIXI.interaction.InteractionManager moved to PIXI.InteractionManager');
	                return PIXI.InteractionManager;
	            },
	        },
	        
	        InteractionData: {
	            get: function () {
	                deprecation('5.3.0', 'PIXI.interaction.InteractionData moved to PIXI.InteractionData');
	                return PIXI.InteractionData;
	            },
	        },
	        
	        InteractionEvent: {
	            get: function () {
	                deprecation('5.3.0', 'PIXI.interaction.InteractionEvent moved to PIXI.InteractionEvent');
	                return PIXI.InteractionEvent;
	            },
	        },
	    });
	    
	    PIXI.prepare = {};
	    Object.defineProperties(PIXI.prepare, {
	        
	        BasePrepare: {
	            get: function () {
	                deprecation('5.2.1', 'PIXI.prepare.BasePrepare moved to PIXI.BasePrepare');
	                return PIXI.BasePrepare;
	            },
	        },
	        
	        Prepare: {
	            get: function () {
	                deprecation('5.2.1', 'PIXI.prepare.Prepare moved to PIXI.Prepare');
	                return PIXI.Prepare;
	            },
	        },
	        
	        CanvasPrepare: {
	            get: function () {
	                deprecation('5.2.1', 'PIXI.prepare.CanvasPrepare moved to PIXI.CanvasPrepare');
	                return PIXI.CanvasPrepare;
	            },
	        },
	    });
	    
	    PIXI.extract = {};
	    Object.defineProperties(PIXI.extract, {
	        
	        Extract: {
	            get: function () {
	                deprecation('5.2.1', 'PIXI.extract.Extract moved to PIXI.Extract');
	                return PIXI.Extract;
	            },
	        },
	        
	        CanvasExtract: {
	            get: function () {
	                deprecation('5.2.1', 'PIXI.extract.CanvasExtract moved to PIXI.CanvasExtract');
	                return PIXI.CanvasExtract;
	            },
	        },
	    });
	    
	    PIXI.extras = {};
	    Object.defineProperties(PIXI.extras, {
	        
	        TilingSprite: {
	            get: function () {
	                deprecation(v5, 'PIXI.extras.TilingSprite class has moved to PIXI.TilingSprite');
	                return PIXI.TilingSprite;
	            },
	        },
	        
	        TilingSpriteRenderer: {
	            get: function () {
	                deprecation(v5, 'PIXI.extras.TilingSpriteRenderer class has moved to PIXI.TilingSpriteRenderer');
	                return PIXI.TilingSpriteRenderer;
	            },
	        },
	        
	        AnimatedSprite: {
	            get: function () {
	                deprecation(v5, 'PIXI.extras.AnimatedSprite class has moved to PIXI.AnimatedSprite');
	                return PIXI.AnimatedSprite;
	            },
	        },
	        
	        BitmapText: {
	            get: function () {
	                deprecation(v5, 'PIXI.extras.BitmapText class has moved to PIXI.BitmapText');
	                return PIXI.BitmapText;
	            },
	        },
	    });
	    
	    PIXI.TilingSprite.fromFrame = function fromFrame(frameId, width, height) {
	        deprecation('5.3.0', 'TilingSprite.fromFrame is deprecated, use TilingSprite.from');
	        return PIXI.TilingSprite.from(frameId, { width: width, height: height });
	    };
	    
	    PIXI.TilingSprite.fromImage = function fromImage(imageId, width, height, options) {
	        if (options === void 0) { options = {}; }
	        deprecation('5.3.0', 'TilingSprite.fromImage is deprecated, use TilingSprite.from');
	        
	        if (options && typeof options !== 'object') {
	            options = {
	                
	                scaleMode: arguments[4],
	                resourceOptions: {
	                    
	                    crossorigin: arguments[3],
	                },
	            };
	        }
	        options.width = width;
	        options.height = height;
	        return PIXI.TilingSprite.from(imageId, options);
	    };
	    Object.defineProperties(PIXI.utils, {
	        
	        getSvgSize: {
	            get: function () {
	                deprecation(v5, 'PIXI.utils.getSvgSize function has moved to PIXI.resources.SVGResource.getSize');
	                return PIXI.resources.SVGResource.getSize;
	            },
	        },
	    });
	    
	    PIXI.mesh = {};
	    Object.defineProperties(PIXI.mesh, {
	        
	        Mesh: {
	            get: function () {
	                deprecation(v5, 'PIXI.mesh.Mesh class has moved to PIXI.SimpleMesh');
	                return PIXI.SimpleMesh;
	            },
	        },
	        
	        NineSlicePlane: {
	            get: function () {
	                deprecation(v5, 'PIXI.mesh.NineSlicePlane class has moved to PIXI.NineSlicePlane');
	                return PIXI.NineSlicePlane;
	            },
	        },
	        
	        Plane: {
	            get: function () {
	                deprecation(v5, 'PIXI.mesh.Plane class has moved to PIXI.SimplePlane');
	                return PIXI.SimplePlane;
	            },
	        },
	        
	        Rope: {
	            get: function () {
	                deprecation(v5, 'PIXI.mesh.Rope class has moved to PIXI.SimpleRope');
	                return PIXI.SimpleRope;
	            },
	        },
	        
	        RawMesh: {
	            get: function () {
	                deprecation(v5, 'PIXI.mesh.RawMesh class has moved to PIXI.Mesh');
	                return PIXI.Mesh;
	            },
	        },
	        
	        CanvasMeshRenderer: {
	            get: function () {
	                deprecation(v5, 'PIXI.mesh.CanvasMeshRenderer class has moved to PIXI.CanvasMeshRenderer');
	                return PIXI.CanvasMeshRenderer;
	            },
	        },
	        
	        MeshRenderer: {
	            get: function () {
	                deprecation(v5, 'PIXI.mesh.MeshRenderer class has moved to PIXI.MeshRenderer');
	                return PIXI.MeshRenderer;
	            },
	        },
	    });
	    
	    PIXI.particles = {};
	    Object.defineProperties(PIXI.particles, {
	        
	        ParticleContainer: {
	            get: function () {
	                deprecation(v5, 'PIXI.particles.ParticleContainer class has moved to PIXI.ParticleContainer');
	                return PIXI.ParticleContainer;
	            },
	        },
	        
	        ParticleRenderer: {
	            get: function () {
	                deprecation(v5, 'PIXI.particles.ParticleRenderer class has moved to PIXI.ParticleRenderer');
	                return PIXI.ParticleRenderer;
	            },
	        },
	    });
	    
	    PIXI.ticker = {};
	    Object.defineProperties(PIXI.ticker, {
	        
	        Ticker: {
	            get: function () {
	                deprecation(v5, 'PIXI.ticker.Ticker class has moved to PIXI.Ticker');
	                return PIXI.Ticker;
	            },
	        },
	        
	        shared: {
	            get: function () {
	                deprecation(v5, 'PIXI.ticker.shared instance has moved to PIXI.Ticker.shared');
	                return PIXI.Ticker.shared;
	            },
	        },
	    });
	    
	    PIXI.loaders = {};
	    Object.defineProperties(PIXI.loaders, {
	        
	        Loader: {
	            get: function () {
	                deprecation(v5, 'PIXI.loaders.Loader class has moved to PIXI.Loader');
	                return PIXI.Loader;
	            },
	        },
	        
	        Resource: {
	            get: function () {
	                deprecation(v5, 'PIXI.loaders.Resource class has moved to PIXI.LoaderResource');
	                return PIXI.LoaderResource;
	            },
	        },
	        
	        bitmapFontParser: {
	            get: function () {
	                deprecation(v5, 'PIXI.loaders.bitmapFontParser function has moved to PIXI.BitmapFontLoader.use');
	                return PIXI.BitmapFontLoader.use;
	            },
	        },
	        
	        parseBitmapFontData: {
	            get: function () {
	                deprecation(v5, 'PIXI.loaders.parseBitmapFontData function has removed');
	            },
	        },
	        
	        spritesheetParser: {
	            get: function () {
	                deprecation(v5, 'PIXI.loaders.spritesheetParser function has moved to PIXI.SpritesheetLoader.use');
	                return PIXI.SpritesheetLoader.use;
	            },
	        },
	        
	        getResourcePath: {
	            get: function () {
	                deprecation(v5, 'PIXI.loaders.getResourcePath property has moved to PIXI.SpritesheetLoader.getResourcePath');
	                return PIXI.SpritesheetLoader.getResourcePath;
	            },
	        },
	    });
	    
	    PIXI.Loader.addPixiMiddleware = function addPixiMiddleware(middleware) {
	        deprecation(v5, 'PIXI.loaders.Loader.addPixiMiddleware function is deprecated, use PIXI.loaders.Loader.registerPlugin');
	        return PIXI.loaders.Loader.registerPlugin({ use: middleware() });
	    };
	    
	    var eventToSignal = function (event) {
	        return "on" + event.charAt(0).toUpperCase() + event.slice(1);
	    };
	    Object.assign(PIXI.Loader.prototype, {
	        
	        on: function (event) {
	            var signal = eventToSignal(event);
	            deprecation(v5, "PIXI.Loader#on is completely deprecated, use PIXI.Loader#" + signal + ".add");
	        },
	        
	        once: function (event) {
	            var signal = eventToSignal(event);
	            deprecation(v5, "PIXI.Loader#once is completely deprecated, use PIXI.Loader#" + signal + ".once");
	        },
	        
	        off: function (event) {
	            var signal = eventToSignal(event);
	            deprecation(v5, "PIXI.Loader#off is completely deprecated, use PIXI.Loader#" + signal + ".detach");
	        },
	    });
	    
	    Object.defineProperty(PIXI.extract, 'WebGLExtract', {
	        get: function () {
	            deprecation(v5, 'PIXI.extract.WebGLExtract method has moved to PIXI.Extract');
	            return PIXI.Extract;
	        },
	    });
	    
	    Object.defineProperty(PIXI.prepare, 'WebGLPrepare', {
	        get: function () {
	            deprecation(v5, 'PIXI.prepare.WebGLPrepare class has moved to PIXI.Prepare');
	            return PIXI.Prepare;
	        },
	    });
	    
	    PIXI.Container.prototype._renderWebGL = function _renderWebGL(renderer) {
	        deprecation(v5, 'PIXI.Container._renderWebGL method has moved to PIXI.Container._render');
	        this._render(renderer);
	    };
	    
	    PIXI.Container.prototype.renderWebGL = function renderWebGL(renderer) {
	        deprecation(v5, 'PIXI.Container.renderWebGL method has moved to PIXI.Container.render');
	        this.render(renderer);
	    };
	    
	    PIXI.DisplayObject.prototype.renderWebGL = function renderWebGL(renderer) {
	        deprecation(v5, 'PIXI.DisplayObject.renderWebGL method has moved to PIXI.DisplayObject.render');
	        this.render(renderer);
	    };
	    
	    PIXI.Container.prototype.renderAdvancedWebGL = function renderAdvancedWebGL(renderer) {
	        deprecation(v5, 'PIXI.Container.renderAdvancedWebGL method has moved to PIXI.Container.renderAdvanced');
	        this.renderAdvanced(renderer);
	    };
	    Object.defineProperties(PIXI.settings, {
	        
	        TRANSFORM_MODE: {
	            get: function () {
	                deprecation(v5, 'PIXI.settings.TRANSFORM_MODE property has been removed');
	                return 0;
	            },
	            set: function () {
	                deprecation(v5, 'PIXI.settings.TRANSFORM_MODE property has been removed');
	            },
	        },
	    });
	    var BaseTextureAny = PIXI.BaseTexture;
	    
	    BaseTextureAny.prototype.loadSource = function loadSource(image) {
	        deprecation(v5, 'PIXI.BaseTexture.loadSource method has been deprecated');
	        var resource = PIXI.resources.autoDetectResource(image);
	        resource.internal = true;
	        this.setResource(resource);
	        this.update();
	    };
	    var baseTextureIdDeprecation = false;
	    Object.defineProperties(BaseTextureAny.prototype, {
	        
	        hasLoaded: {
	            get: function () {
	                deprecation(v5, 'PIXI.BaseTexture.hasLoaded property has been removed, use PIXI.BaseTexture.valid');
	                return this.valid;
	            },
	        },
	        
	        imageUrl: {
	            get: function () {
	                var _a;
	                deprecation(v5, 'PIXI.BaseTexture.imageUrl property has been removed, use PIXI.BaseTexture.resource.url');
	                return (_a = this.resource) === null || _a === void 0 ? void 0 : _a.url;
	            },
	            set: function (imageUrl) {
	                deprecation(v5, 'PIXI.BaseTexture.imageUrl property has been removed, use PIXI.BaseTexture.resource.url');
	                if (this.resource) {
	                    this.resource.url = imageUrl;
	                }
	            },
	        },
	        
	        source: {
	            get: function () {
	                deprecation(v5, 'PIXI.BaseTexture.source property has been moved, use `PIXI.BaseTexture.resource.source`');
	                return this.resource.source;
	            },
	            set: function (source) {
	                deprecation(v5, 'PIXI.BaseTexture.source property has been moved, use `PIXI.BaseTexture.resource.source` '
	                    + 'if you want to set HTMLCanvasElement. Otherwise, create new BaseTexture.');
	                if (this.resource) {
	                    this.resource.source = source;
	                }
	            },
	        },
	        
	        premultiplyAlpha: {
	            get: function () {
	                deprecation('5.2.0', 'PIXI.BaseTexture.premultiplyAlpha property has been changed to `alphaMode`'
	                    + ', see `PIXI.ALPHA_MODES`');
	                return this.alphaMode !== 0;
	            },
	            set: function (value) {
	                deprecation('5.2.0', 'PIXI.BaseTexture.premultiplyAlpha property has been changed to `alphaMode`'
	                    + ', see `PIXI.ALPHA_MODES`');
	                this.alphaMode = Number(value);
	            },
	        },
	        
	        _id: {
	            get: function () {
	                if (!baseTextureIdDeprecation) {
	                    
	                    deprecation('5.2.0', 'PIXI.BaseTexture._id batch local field has been changed to `_batchLocation`');
	                    baseTextureIdDeprecation = true;
	                }
	                return this._batchLocation;
	            },
	            set: function (value) {
	                this._batchLocation = value;
	            },
	        },
	    });
	    
	    BaseTextureAny.fromImage = function fromImage(canvas, crossorigin, scaleMode, scale) {
	        deprecation(v5, 'PIXI.BaseTexture.fromImage method has been replaced with PIXI.BaseTexture.from');
	        var resourceOptions = { scale: scale, crossorigin: crossorigin };
	        return BaseTextureAny.from(canvas, { scaleMode: scaleMode, resourceOptions: resourceOptions });
	    };
	    
	    BaseTextureAny.fromCanvas = function fromCanvas(canvas, scaleMode) {
	        deprecation(v5, 'PIXI.BaseTexture.fromCanvas method has been replaced with PIXI.BaseTexture.from');
	        return BaseTextureAny.from(canvas, { scaleMode: scaleMode });
	    };
	    
	    BaseTextureAny.fromSVG = function fromSVG(canvas, crossorigin, scaleMode, scale) {
	        deprecation(v5, 'PIXI.BaseTexture.fromSVG method has been replaced with PIXI.BaseTexture.from');
	        var resourceOptions = { scale: scale, crossorigin: crossorigin };
	        return BaseTextureAny.from(canvas, { scaleMode: scaleMode, resourceOptions: resourceOptions });
	    };
	    Object.defineProperties(PIXI.resources.ImageResource.prototype, {
	        
	        premultiplyAlpha: {
	            get: function () {
	                deprecation('5.2.0', 'PIXI.resources.ImageResource.premultiplyAlpha property '
	                    + 'has been changed to `alphaMode`, see `PIXI.ALPHA_MODES`');
	                return this.alphaMode !== 0;
	            },
	            set: function (value) {
	                deprecation('5.2.0', 'PIXI.resources.ImageResource.premultiplyAlpha property '
	                    + 'has been changed to `alphaMode`, see `PIXI.ALPHA_MODES`');
	                this.alphaMode = Number(value);
	            },
	        },
	    });
	    
	    PIXI.Point.prototype.copy = function copy(p) {
	        deprecation(v5, 'PIXI.Point.copy method has been replaced with PIXI.Point.copyFrom');
	        return this.copyFrom(p);
	    };
	    
	    PIXI.ObservablePoint.prototype.copy = function copy(p) {
	        deprecation(v5, 'PIXI.ObservablePoint.copy method has been replaced with PIXI.ObservablePoint.copyFrom');
	        return this.copyFrom(p);
	    };
	    
	    PIXI.Rectangle.prototype.copy = function copy(p) {
	        deprecation(v5, 'PIXI.Rectangle.copy method has been replaced with PIXI.Rectangle.copyFrom');
	        return this.copyFrom(p);
	    };
	    
	    PIXI.Matrix.prototype.copy = function copy(p) {
	        deprecation(v5, 'PIXI.Matrix.copy method has been replaced with PIXI.Matrix.copyTo');
	        return this.copyTo(p);
	    };
	    
	    PIXI.systems.StateSystem.prototype.setState = function setState(s) {
	        deprecation('v5.1.0', 'StateSystem.setState has been renamed to StateSystem.set');
	        return this.set(s);
	    };
	    Object.assign(PIXI.systems.FilterSystem.prototype, {
	        
	        getRenderTarget: function (_clear, resolution) {
	            deprecation(v5, 'PIXI.FilterManager.getRenderTarget method has been replaced with PIXI.systems.FilterSystem#getFilterTexture');
	            return this.getFilterTexture(null, resolution);
	        },
	        
	        returnRenderTarget: function (renderTexture) {
	            deprecation(v5, 'PIXI.FilterManager.returnRenderTarget method has been replaced with '
	                + 'PIXI.systems.FilterSystem.returnFilterTexture');
	            this.returnFilterTexture(renderTexture);
	        },
	        
	        calculateScreenSpaceMatrix: function (outputMatrix) {
	            deprecation(v5, 'PIXI.systems.FilterSystem.calculateScreenSpaceMatrix method is removed, '
	                + 'use `(vTextureCoord * inputSize.xy) + outputFrame.xy` instead');
	            var mappedMatrix = outputMatrix.identity();
	            var _a = this.activeState, sourceFrame = _a.sourceFrame, destinationFrame = _a.destinationFrame;
	            mappedMatrix.translate(sourceFrame.x / destinationFrame.width, sourceFrame.y / destinationFrame.height);
	            mappedMatrix.scale(destinationFrame.width, destinationFrame.height);
	            return mappedMatrix;
	        },
	        
	        calculateNormalizedScreenSpaceMatrix: function (outputMatrix) {
	            deprecation(v5, 'PIXI.systems.FilterManager.calculateNormalizedScreenSpaceMatrix method is removed, '
	                + 'use `((vTextureCoord * inputSize.xy) + outputFrame.xy) / outputFrame.zw` instead.');
	            var _a = this.activeState, sourceFrame = _a.sourceFrame, destinationFrame = _a.destinationFrame;
	            var mappedMatrix = outputMatrix.identity();
	            mappedMatrix.translate(sourceFrame.x / destinationFrame.width, sourceFrame.y / destinationFrame.height);
	            var translateScaleX = (destinationFrame.width / sourceFrame.width);
	            var translateScaleY = (destinationFrame.height / sourceFrame.height);
	            mappedMatrix.scale(translateScaleX, translateScaleY);
	            return mappedMatrix;
	        },
	    });
	    Object.defineProperties(PIXI.RenderTexture.prototype, {
	        
	        sourceFrame: {
	            get: function () {
	                deprecation(v5, 'PIXI.RenderTexture.sourceFrame property has been removed');
	                return this.filterFrame;
	            },
	        },
	        
	        size: {
	            get: function () {
	                deprecation(v5, 'PIXI.RenderTexture.size property has been removed');
	                return this._frame;
	            },
	        },
	    });
	    
	    var BlurXFilter =  (function (_super) {
	        __extends$i(BlurXFilter, _super);
	        function BlurXFilter(strength, quality, resolution, kernelSize) {
	            var _this = this;
	            deprecation(v5, 'PIXI.filters.BlurXFilter class is deprecated, use PIXI.filters.BlurFilterPass');
	            _this = _super.call(this, true, strength, quality, resolution, kernelSize) || this;
	            return _this;
	        }
	        return BlurXFilter;
	    }(PIXI.filters.BlurFilterPass));
	    
	    var BlurYFilter =  (function (_super) {
	        __extends$i(BlurYFilter, _super);
	        function BlurYFilter(strength, quality, resolution, kernelSize) {
	            var _this = this;
	            deprecation(v5, 'PIXI.filters.BlurYFilter class is deprecated, use PIXI.filters.BlurFilterPass');
	            _this = _super.call(this, false, strength, quality, resolution, kernelSize) || this;
	            return _this;
	        }
	        return BlurYFilter;
	    }(PIXI.filters.BlurFilterPass));
	    Object.assign(PIXI.filters, {
	        BlurXFilter: BlurXFilter,
	        BlurYFilter: BlurYFilter,
	    });
	    var SpriteAny = PIXI.Sprite, TextureAny = PIXI.Texture, GraphicsAny = PIXI.Graphics;
	    
	    
	    if (!GraphicsAny.prototype.generateCanvasTexture) {
	        GraphicsAny.prototype.generateCanvasTexture = function generateCanvasTexture() {
	            deprecation(v5, 'PIXI.Graphics.generateCanvasTexture method is only available in "pixi.js-legacy"');
	        };
	    }
	    
	    Object.defineProperty(GraphicsAny.prototype, 'graphicsData', {
	        get: function () {
	            deprecation(v5, 'PIXI.Graphics.graphicsData property is deprecated, use PIXI.Graphics.geometry.graphicsData');
	            return this.geometry.graphicsData;
	        },
	    });
	    
	    function spriteFrom(name, source, crossorigin, scaleMode) {
	        deprecation(v5, "PIXI.Sprite." + name + " method is deprecated, use PIXI.Sprite.from");
	        return SpriteAny.from(source, {
	            resourceOptions: {
	                scale: scaleMode,
	                crossorigin: crossorigin,
	            },
	        });
	    }
	    
	    SpriteAny.fromImage = spriteFrom.bind(null, 'fromImage');
	    
	    SpriteAny.fromSVG = spriteFrom.bind(null, 'fromSVG');
	    
	    SpriteAny.fromCanvas = spriteFrom.bind(null, 'fromCanvas');
	    
	    SpriteAny.fromVideo = spriteFrom.bind(null, 'fromVideo');
	    
	    SpriteAny.fromFrame = spriteFrom.bind(null, 'fromFrame');
	    
	    function textureFrom(name, source, crossorigin, scaleMode) {
	        deprecation(v5, "PIXI.Texture." + name + " method is deprecated, use PIXI.Texture.from");
	        return TextureAny.from(source, {
	            resourceOptions: {
	                scale: scaleMode,
	                crossorigin: crossorigin,
	            },
	        });
	    }
	    
	    TextureAny.fromImage = textureFrom.bind(null, 'fromImage');
	    
	    TextureAny.fromSVG = textureFrom.bind(null, 'fromSVG');
	    
	    TextureAny.fromCanvas = textureFrom.bind(null, 'fromCanvas');
	    
	    TextureAny.fromVideo = textureFrom.bind(null, 'fromVideo');
	    
	    TextureAny.fromFrame = textureFrom.bind(null, 'fromFrame');
	    
	    Object.defineProperty(PIXI.AbstractRenderer.prototype, 'autoResize', {
	        get: function () {
	            deprecation(v5, 'PIXI.AbstractRenderer.autoResize property is deprecated, '
	                + 'use PIXI.AbstractRenderer.autoDensity');
	            return this.autoDensity;
	        },
	        set: function (value) {
	            deprecation(v5, 'PIXI.AbstractRenderer.autoResize property is deprecated, '
	                + 'use PIXI.AbstractRenderer.autoDensity');
	            this.autoDensity = value;
	        },
	    });
	    
	    Object.defineProperty(PIXI.Renderer.prototype, 'textureManager', {
	        get: function () {
	            deprecation(v5, 'PIXI.Renderer.textureManager property is deprecated, use PIXI.Renderer.texture');
	            return this.texture;
	        },
	    });
	    
	    PIXI.utils.mixins = {
	        
	        mixin: function () {
	            deprecation(v5, 'PIXI.utils.mixins.mixin function is no longer available');
	        },
	        
	        delayMixin: function () {
	            deprecation(v5, 'PIXI.utils.mixins.delayMixin function is no longer available');
	        },
	        
	        performMixins: function () {
	            deprecation(v5, 'PIXI.utils.mixins.performMixins function is no longer available');
	        },
	    };
	    
	    Object.defineProperty(PIXI.BitmapText.prototype, 'font', {
	        get: function () {
	            deprecation('5.3.0', 'PIXI.BitmapText.font property is deprecated, '
	                + 'use fontName, fontSize, tint or align properties');
	            return {
	                name: this._fontName,
	                size: this._fontSize,
	                tint: this._tint,
	                align: this._align,
	            };
	        },
	        set: function (value) {
	            deprecation('5.3.0', 'PIXI.BitmapText.font property is deprecated, '
	                + 'use fontName, fontSize, tint or align properties');
	            if (!value) {
	                return;
	            }
	            var style = { font: value };
	            this._upgradeStyle(style);
	            style.fontSize = style.fontSize || PIXI.BitmapFont.available[style.fontName].size;
	            this._fontName = style.fontName;
	            this._fontSize = style.fontSize;
	            this.dirty = true;
	        },
	    });
	}

	

	
	

	var extendStatics$j = function(d, b) {
	    extendStatics$j = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$j(d, b);
	};

	function __extends$j(d, b) {
	    extendStatics$j(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var PlaneGeometry =  (function (_super) {
	    __extends$j(PlaneGeometry, _super);
	    function PlaneGeometry(width, height, segWidth, segHeight) {
	        if (width === void 0) { width = 100; }
	        if (height === void 0) { height = 100; }
	        if (segWidth === void 0) { segWidth = 10; }
	        if (segHeight === void 0) { segHeight = 10; }
	        var _this = _super.call(this) || this;
	        _this.segWidth = segWidth;
	        _this.segHeight = segHeight;
	        _this.width = width;
	        _this.height = height;
	        _this.build();
	        return _this;
	    }
	    
	    PlaneGeometry.prototype.build = function () {
	        var total = this.segWidth * this.segHeight;
	        var verts = [];
	        var uvs = [];
	        var indices = [];
	        var segmentsX = this.segWidth - 1;
	        var segmentsY = this.segHeight - 1;
	        var sizeX = (this.width) / segmentsX;
	        var sizeY = (this.height) / segmentsY;
	        for (var i = 0; i < total; i++) {
	            var x = (i % this.segWidth);
	            var y = ((i / this.segWidth) | 0);
	            verts.push(x * sizeX, y * sizeY);
	            uvs.push(x / segmentsX, y / segmentsY);
	        }
	        var totalSub = segmentsX * segmentsY;
	        for (var i = 0; i < totalSub; i++) {
	            var xpos = i % segmentsX;
	            var ypos = (i / segmentsX) | 0;
	            var value = (ypos * this.segWidth) + xpos;
	            var value2 = (ypos * this.segWidth) + xpos + 1;
	            var value3 = ((ypos + 1) * this.segWidth) + xpos;
	            var value4 = ((ypos + 1) * this.segWidth) + xpos + 1;
	            indices.push(value, value2, value3, value2, value4, value3);
	        }
	        this.buffers[0].data = new Float32Array(verts);
	        this.buffers[1].data = new Float32Array(uvs);
	        this.indexBuffer.data = new Uint16Array(indices);
	        
	        this.buffers[0].update();
	        this.buffers[1].update();
	        this.indexBuffer.update();
	    };
	    return PlaneGeometry;
	}(MeshGeometry));

	
	var RopeGeometry =  (function (_super) {
	    __extends$j(RopeGeometry, _super);
	    
	    function RopeGeometry(width, points, textureScale) {
	        if (width === void 0) { width = 200; }
	        if (textureScale === void 0) { textureScale = 0; }
	        var _this = _super.call(this, new Float32Array(points.length * 4), new Float32Array(points.length * 4), new Uint16Array((points.length - 1) * 6)) || this;
	        
	        _this.points = points;
	        
	        _this._width = width;
	        
	        _this.textureScale = textureScale;
	        _this.build();
	        return _this;
	    }
	    Object.defineProperty(RopeGeometry.prototype, "width", {
	        
	        get: function () {
	            return this._width;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    RopeGeometry.prototype.build = function () {
	        var points = this.points;
	        if (!points)
	            { return; }
	        var vertexBuffer = this.getBuffer('aVertexPosition');
	        var uvBuffer = this.getBuffer('aTextureCoord');
	        var indexBuffer = this.getIndex();
	        
	        if (points.length < 1) {
	            return;
	        }
	        
	        if (vertexBuffer.data.length / 4 !== points.length) {
	            vertexBuffer.data = new Float32Array(points.length * 4);
	            uvBuffer.data = new Float32Array(points.length * 4);
	            indexBuffer.data = new Uint16Array((points.length - 1) * 6);
	        }
	        var uvs = uvBuffer.data;
	        var indices = indexBuffer.data;
	        uvs[0] = 0;
	        uvs[1] = 0;
	        uvs[2] = 0;
	        uvs[3] = 1;
	        var amount = 0;
	        var prev = points[0];
	        var textureWidth = this._width * this.textureScale;
	        var total = points.length; 
	        for (var i = 0; i < total; i++) {
	            
	            var index = i * 4;
	            if (this.textureScale > 0) {
	                
	                var dx = prev.x - points[i].x;
	                var dy = prev.y - points[i].y;
	                var distance = Math.sqrt((dx * dx) + (dy * dy));
	                prev = points[i];
	                amount += distance / textureWidth;
	            }
	            else {
	                
	                amount = i / (total - 1);
	            }
	            uvs[index] = amount;
	            uvs[index + 1] = 0;
	            uvs[index + 2] = amount;
	            uvs[index + 3] = 1;
	        }
	        var indexCount = 0;
	        for (var i = 0; i < total - 1; i++) {
	            var index = i * 2;
	            indices[indexCount++] = index;
	            indices[indexCount++] = index + 1;
	            indices[indexCount++] = index + 2;
	            indices[indexCount++] = index + 2;
	            indices[indexCount++] = index + 1;
	            indices[indexCount++] = index + 3;
	        }
	        
	        uvBuffer.update();
	        indexBuffer.update();
	        this.updateVertices();
	    };
	    
	    RopeGeometry.prototype.updateVertices = function () {
	        var points = this.points;
	        if (points.length < 1) {
	            return;
	        }
	        var lastPoint = points[0];
	        var nextPoint;
	        var perpX = 0;
	        var perpY = 0;
	        var vertices = this.buffers[0].data;
	        var total = points.length;
	        for (var i = 0; i < total; i++) {
	            var point = points[i];
	            var index = i * 4;
	            if (i < points.length - 1) {
	                nextPoint = points[i + 1];
	            }
	            else {
	                nextPoint = point;
	            }
	            perpY = -(nextPoint.x - lastPoint.x);
	            perpX = nextPoint.y - lastPoint.y;
	            var perpLength = Math.sqrt((perpX * perpX) + (perpY * perpY));
	            var num = this.textureScale > 0 ? this.textureScale * this._width / 2 : this._width / 2;
	            perpX /= perpLength;
	            perpY /= perpLength;
	            perpX *= num;
	            perpY *= num;
	            vertices[index] = point.x + perpX;
	            vertices[index + 1] = point.y + perpY;
	            vertices[index + 2] = point.x - perpX;
	            vertices[index + 3] = point.y - perpY;
	            lastPoint = point;
	        }
	        this.buffers[0].update();
	    };
	    RopeGeometry.prototype.update = function () {
	        if (this.textureScale > 0) {
	            this.build(); 
	        }
	        else {
	            this.updateVertices();
	        }
	    };
	    return RopeGeometry;
	}(MeshGeometry));

	
	var SimpleRope =  (function (_super) {
	    __extends$j(SimpleRope, _super);
	    
	    function SimpleRope(texture, points, textureScale) {
	        if (textureScale === void 0) { textureScale = 0; }
	        var _this = this;
	        var ropeGeometry = new RopeGeometry(texture.height, points, textureScale);
	        var meshMaterial = new MeshMaterial(texture);
	        if (textureScale > 0) {
	            
	            texture.baseTexture.wrapMode = exports.WRAP_MODES.REPEAT;
	        }
	        _this = _super.call(this, ropeGeometry, meshMaterial) || this;
	        
	        _this.autoUpdate = true;
	        return _this;
	    }
	    SimpleRope.prototype._render = function (renderer) {
	        var geometry = this.geometry;
	        if (this.autoUpdate || geometry._width !== this.shader.texture.height) {
	            geometry._width = this.shader.texture.height;
	            geometry.update();
	        }
	        _super.prototype._render.call(this, renderer);
	    };
	    return SimpleRope;
	}(Mesh));

	
	var SimplePlane =  (function (_super) {
	    __extends$j(SimplePlane, _super);
	    
	    function SimplePlane(texture, verticesX, verticesY) {
	        var _this = this;
	        var planeGeometry = new PlaneGeometry(texture.width, texture.height, verticesX, verticesY);
	        var meshMaterial = new MeshMaterial(Texture.WHITE);
	        _this = _super.call(this, planeGeometry, meshMaterial) || this;
	        
	        _this.texture = texture;
	        return _this;
	    }
	    
	    SimplePlane.prototype.textureUpdated = function () {
	        this._textureID = this.shader.texture._updateID;
	        var geometry = this.geometry;
	        geometry.width = this.shader.texture.width;
	        geometry.height = this.shader.texture.height;
	        geometry.build();
	    };
	    Object.defineProperty(SimplePlane.prototype, "texture", {
	        get: function () {
	            return this.shader.texture;
	        },
	        set: function (value) {
	            
	            
	            
	            if (this.shader.texture === value) {
	                return;
	            }
	            this.shader.texture = value;
	            this._textureID = -1;
	            if (value.baseTexture.valid) {
	                this.textureUpdated();
	            }
	            else {
	                value.once('update', this.textureUpdated, this);
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    SimplePlane.prototype._render = function (renderer) {
	        if (this._textureID !== this.shader.texture._updateID) {
	            this.textureUpdated();
	        }
	        _super.prototype._render.call(this, renderer);
	    };
	    SimplePlane.prototype.destroy = function (options) {
	        this.shader.texture.off('update', this.textureUpdated, this);
	        _super.prototype.destroy.call(this, options);
	    };
	    return SimplePlane;
	}(Mesh));

	
	var SimpleMesh =  (function (_super) {
	    __extends$j(SimpleMesh, _super);
	    
	    function SimpleMesh(texture, vertices, uvs, indices, drawMode) {
	        if (texture === void 0) { texture = Texture.EMPTY; }
	        var _this = this;
	        var geometry = new MeshGeometry(vertices, uvs, indices);
	        geometry.getBuffer('aVertexPosition').static = false;
	        var meshMaterial = new MeshMaterial(texture);
	        _this = _super.call(this, geometry, meshMaterial, null, drawMode) || this;
	        
	        _this.autoUpdate = true;
	        return _this;
	    }
	    Object.defineProperty(SimpleMesh.prototype, "vertices", {
	        
	        get: function () {
	            return this.geometry.getBuffer('aVertexPosition').data;
	        },
	        set: function (value) {
	            this.geometry.getBuffer('aVertexPosition').data = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    SimpleMesh.prototype._render = function (renderer) {
	        if (this.autoUpdate) {
	            this.geometry.getBuffer('aVertexPosition').update();
	        }
	        _super.prototype._render.call(this, renderer);
	    };
	    return SimpleMesh;
	}(Mesh));

	var DEFAULT_BORDER_SIZE = 10;
	
	var NineSlicePlane =  (function (_super) {
	    __extends$j(NineSlicePlane, _super);
	    
	    function NineSlicePlane(texture, leftWidth, topHeight, rightWidth, bottomHeight) {
	        if (leftWidth === void 0) { leftWidth = DEFAULT_BORDER_SIZE; }
	        if (topHeight === void 0) { topHeight = DEFAULT_BORDER_SIZE; }
	        if (rightWidth === void 0) { rightWidth = DEFAULT_BORDER_SIZE; }
	        if (bottomHeight === void 0) { bottomHeight = DEFAULT_BORDER_SIZE; }
	        var _this = _super.call(this, Texture.WHITE, 4, 4) || this;
	        _this._origWidth = texture.orig.width;
	        _this._origHeight = texture.orig.height;
	        
	        _this._width = _this._origWidth;
	        
	        _this._height = _this._origHeight;
	        
	        _this._leftWidth = leftWidth;
	        
	        _this._rightWidth = rightWidth;
	        
	        _this._topHeight = topHeight;
	        
	        _this._bottomHeight = bottomHeight;
	        
	        _this.texture = texture;
	        return _this;
	    }
	    NineSlicePlane.prototype.textureUpdated = function () {
	        this._textureID = this.shader.texture._updateID;
	        this._refresh();
	    };
	    Object.defineProperty(NineSlicePlane.prototype, "vertices", {
	        get: function () {
	            return this.geometry.getBuffer('aVertexPosition').data;
	        },
	        set: function (value) {
	            this.geometry.getBuffer('aVertexPosition').data = value;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    NineSlicePlane.prototype.updateHorizontalVertices = function () {
	        var vertices = this.vertices;
	        var scale = this._getMinScale();
	        vertices[9] = vertices[11] = vertices[13] = vertices[15] = this._topHeight * scale;
	        vertices[17] = vertices[19] = vertices[21] = vertices[23] = this._height - (this._bottomHeight * scale);
	        vertices[25] = vertices[27] = vertices[29] = vertices[31] = this._height;
	    };
	    
	    NineSlicePlane.prototype.updateVerticalVertices = function () {
	        var vertices = this.vertices;
	        var scale = this._getMinScale();
	        vertices[2] = vertices[10] = vertices[18] = vertices[26] = this._leftWidth * scale;
	        vertices[4] = vertices[12] = vertices[20] = vertices[28] = this._width - (this._rightWidth * scale);
	        vertices[6] = vertices[14] = vertices[22] = vertices[30] = this._width;
	    };
	    
	    NineSlicePlane.prototype._getMinScale = function () {
	        var w = this._leftWidth + this._rightWidth;
	        var scaleW = this._width > w ? 1.0 : this._width / w;
	        var h = this._topHeight + this._bottomHeight;
	        var scaleH = this._height > h ? 1.0 : this._height / h;
	        var scale = Math.min(scaleW, scaleH);
	        return scale;
	    };
	    Object.defineProperty(NineSlicePlane.prototype, "width", {
	        
	        get: function () {
	            return this._width;
	        },
	        set: function (value) {
	            this._width = value;
	            this._refresh();
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(NineSlicePlane.prototype, "height", {
	        
	        get: function () {
	            return this._height;
	        },
	        set: function (value) {
	            this._height = value;
	            this._refresh();
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(NineSlicePlane.prototype, "leftWidth", {
	        
	        get: function () {
	            return this._leftWidth;
	        },
	        set: function (value) {
	            this._leftWidth = value;
	            this._refresh();
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(NineSlicePlane.prototype, "rightWidth", {
	        
	        get: function () {
	            return this._rightWidth;
	        },
	        set: function (value) {
	            this._rightWidth = value;
	            this._refresh();
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(NineSlicePlane.prototype, "topHeight", {
	        
	        get: function () {
	            return this._topHeight;
	        },
	        set: function (value) {
	            this._topHeight = value;
	            this._refresh();
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(NineSlicePlane.prototype, "bottomHeight", {
	        
	        get: function () {
	            return this._bottomHeight;
	        },
	        set: function (value) {
	            this._bottomHeight = value;
	            this._refresh();
	        },
	        enumerable: false,
	        configurable: true
	    });
	    
	    NineSlicePlane.prototype._refresh = function () {
	        var texture = this.texture;
	        var uvs = this.geometry.buffers[1].data;
	        this._origWidth = texture.orig.width;
	        this._origHeight = texture.orig.height;
	        var _uvw = 1.0 / this._origWidth;
	        var _uvh = 1.0 / this._origHeight;
	        uvs[0] = uvs[8] = uvs[16] = uvs[24] = 0;
	        uvs[1] = uvs[3] = uvs[5] = uvs[7] = 0;
	        uvs[6] = uvs[14] = uvs[22] = uvs[30] = 1;
	        uvs[25] = uvs[27] = uvs[29] = uvs[31] = 1;
	        uvs[2] = uvs[10] = uvs[18] = uvs[26] = _uvw * this._leftWidth;
	        uvs[4] = uvs[12] = uvs[20] = uvs[28] = 1 - (_uvw * this._rightWidth);
	        uvs[9] = uvs[11] = uvs[13] = uvs[15] = _uvh * this._topHeight;
	        uvs[17] = uvs[19] = uvs[21] = uvs[23] = 1 - (_uvh * this._bottomHeight);
	        this.updateHorizontalVertices();
	        this.updateVerticalVertices();
	        this.geometry.buffers[0].update();
	        this.geometry.buffers[1].update();
	    };
	    return NineSlicePlane;
	}(SimplePlane));

	

	
	

	var extendStatics$k = function(d, b) {
	    extendStatics$k = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
	    return extendStatics$k(d, b);
	};

	function __extends$k(d, b) {
	    extendStatics$k(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	
	var AnimatedSprite =  (function (_super) {
	    __extends$k(AnimatedSprite, _super);
	    
	    function AnimatedSprite(textures, autoUpdate) {
	        if (autoUpdate === void 0) { autoUpdate = true; }
	        var _this = _super.call(this, textures[0] instanceof Texture ? textures[0] : textures[0].texture) || this;
	        
	        _this._textures = null;
	        
	        _this._durations = null;
	        
	        _this._autoUpdate = autoUpdate;
	        
	        _this._isConnectedToTicker = false;
	        
	        _this.animationSpeed = 1;
	        
	        _this.loop = true;
	        
	        _this.updateAnchor = false;
	        
	        _this.onComplete = null;
	        
	        _this.onFrameChange = null;
	        
	        _this.onLoop = null;
	        
	        _this._currentTime = 0;
	        _this._playing = false;
	        
	        _this._previousFrame = null;
	        _this.textures = textures;
	        return _this;
	    }
	    
	    AnimatedSprite.prototype.stop = function () {
	        if (!this._playing) {
	            return;
	        }
	        this._playing = false;
	        if (this._autoUpdate && this._isConnectedToTicker) {
	            Ticker.shared.remove(this.update, this);
	            this._isConnectedToTicker = false;
	        }
	    };
	    
	    AnimatedSprite.prototype.play = function () {
	        if (this._playing) {
	            return;
	        }
	        this._playing = true;
	        if (this._autoUpdate && !this._isConnectedToTicker) {
	            Ticker.shared.add(this.update, this, exports.UPDATE_PRIORITY.HIGH);
	            this._isConnectedToTicker = true;
	        }
	    };
	    
	    AnimatedSprite.prototype.gotoAndStop = function (frameNumber) {
	        this.stop();
	        var previousFrame = this.currentFrame;
	        this._currentTime = frameNumber;
	        if (previousFrame !== this.currentFrame) {
	            this.updateTexture();
	        }
	    };
	    
	    AnimatedSprite.prototype.gotoAndPlay = function (frameNumber) {
	        var previousFrame = this.currentFrame;
	        this._currentTime = frameNumber;
	        if (previousFrame !== this.currentFrame) {
	            this.updateTexture();
	        }
	        this.play();
	    };
	    
	    AnimatedSprite.prototype.update = function (deltaTime) {
	        if (!this._playing) {
	            return;
	        }
	        var elapsed = this.animationSpeed * deltaTime;
	        var previousFrame = this.currentFrame;
	        if (this._durations !== null) {
	            var lag = this._currentTime % 1 * this._durations[this.currentFrame];
	            lag += elapsed / 60 * 1000;
	            while (lag < 0) {
	                this._currentTime--;
	                lag += this._durations[this.currentFrame];
	            }
	            var sign = Math.sign(this.animationSpeed * deltaTime);
	            this._currentTime = Math.floor(this._currentTime);
	            while (lag >= this._durations[this.currentFrame]) {
	                lag -= this._durations[this.currentFrame] * sign;
	                this._currentTime += sign;
	            }
	            this._currentTime += lag / this._durations[this.currentFrame];
	        }
	        else {
	            this._currentTime += elapsed;
	        }
	        if (this._currentTime < 0 && !this.loop) {
	            this.gotoAndStop(0);
	            if (this.onComplete) {
	                this.onComplete();
	            }
	        }
	        else if (this._currentTime >= this._textures.length && !this.loop) {
	            this.gotoAndStop(this._textures.length - 1);
	            if (this.onComplete) {
	                this.onComplete();
	            }
	        }
	        else if (previousFrame !== this.currentFrame) {
	            if (this.loop && this.onLoop) {
	                if (this.animationSpeed > 0 && this.currentFrame < previousFrame) {
	                    this.onLoop();
	                }
	                else if (this.animationSpeed < 0 && this.currentFrame > previousFrame) {
	                    this.onLoop();
	                }
	            }
	            this.updateTexture();
	        }
	    };
	    
	    AnimatedSprite.prototype.updateTexture = function () {
	        var currentFrame = this.currentFrame;
	        if (this._previousFrame === currentFrame) {
	            return;
	        }
	        this._previousFrame = currentFrame;
	        this._texture = this._textures[currentFrame];
	        this._textureID = -1;
	        this._textureTrimmedID = -1;
	        this._cachedTint = 0xFFFFFF;
	        this.uvs = this._texture._uvs.uvsFloat32;
	        if (this.updateAnchor) {
	            this._anchor.copyFrom(this._texture.defaultAnchor);
	        }
	        if (this.onFrameChange) {
	            this.onFrameChange(this.currentFrame);
	        }
	    };
	    
	    AnimatedSprite.prototype.destroy = function (options) {
	        this.stop();
	        _super.prototype.destroy.call(this, options);
	        this.onComplete = null;
	        this.onFrameChange = null;
	        this.onLoop = null;
	    };
	    
	    AnimatedSprite.fromFrames = function (frames) {
	        var textures = [];
	        for (var i = 0; i < frames.length; ++i) {
	            textures.push(Texture.from(frames[i]));
	        }
	        return new AnimatedSprite(textures);
	    };
	    
	    AnimatedSprite.fromImages = function (images) {
	        var textures = [];
	        for (var i = 0; i < images.length; ++i) {
	            textures.push(Texture.from(images[i]));
	        }
	        return new AnimatedSprite(textures);
	    };
	    Object.defineProperty(AnimatedSprite.prototype, "totalFrames", {
	        
	        get: function () {
	            return this._textures.length;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(AnimatedSprite.prototype, "textures", {
	        
	        get: function () {
	            return this._textures;
	        },
	        set: function (value) {
	            if (value[0] instanceof Texture) {
	                this._textures = value;
	                this._durations = null;
	            }
	            else {
	                this._textures = [];
	                this._durations = [];
	                for (var i = 0; i < value.length; i++) {
	                    this._textures.push(value[i].texture);
	                    this._durations.push(value[i].time);
	                }
	            }
	            this._previousFrame = null;
	            this.gotoAndStop(0);
	            this.updateTexture();
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(AnimatedSprite.prototype, "currentFrame", {
	        
	        get: function () {
	            var currentFrame = Math.floor(this._currentTime) % this._textures.length;
	            if (currentFrame < 0) {
	                currentFrame += this._textures.length;
	            }
	            return currentFrame;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(AnimatedSprite.prototype, "playing", {
	        
	        get: function () {
	            return this._playing;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    Object.defineProperty(AnimatedSprite.prototype, "autoUpdate", {
	        
	        get: function () {
	            return this._autoUpdate;
	        },
	        set: function (value) {
	            if (value !== this._autoUpdate) {
	                this._autoUpdate = value;
	                if (!this._autoUpdate && this._isConnectedToTicker) {
	                    Ticker.shared.remove(this.update, this);
	                    this._isConnectedToTicker = false;
	                }
	                else if (this._autoUpdate && !this._isConnectedToTicker && this._playing) {
	                    Ticker.shared.add(this.update, this);
	                    this._isConnectedToTicker = true;
	                }
	            }
	        },
	        enumerable: false,
	        configurable: true
	    });
	    return AnimatedSprite;
	}(Sprite));

	
	Renderer.registerPlugin('accessibility', AccessibilityManager);
	Renderer.registerPlugin('extract', Extract);
	Renderer.registerPlugin('interaction', InteractionManager);
	Renderer.registerPlugin('particle', ParticleRenderer);
	Renderer.registerPlugin('prepare', Prepare);
	Renderer.registerPlugin('batch', BatchRenderer);
	Renderer.registerPlugin('tilingSprite', TilingSpriteRenderer);
	Loader$1.registerPlugin(BitmapFontLoader);
	Loader$1.registerPlugin(SpritesheetLoader);
	Application.registerPlugin(TickerPlugin);
	Application.registerPlugin(AppLoaderPlugin);
	
	var VERSION$1 = '5.3.12';
	
	
	var filters = {
	    AlphaFilter: AlphaFilter,
	    BlurFilter: BlurFilter,
	    BlurFilterPass: BlurFilterPass,
	    ColorMatrixFilter: ColorMatrixFilter,
	    DisplacementFilter: DisplacementFilter,
	    FXAAFilter: FXAAFilter,
	    NoiseFilter: NoiseFilter,
	};

	exports.AbstractBatchRenderer = AbstractBatchRenderer;
	exports.AbstractRenderer = AbstractRenderer;
	exports.AccessibilityManager = AccessibilityManager;
	exports.AnimatedSprite = AnimatedSprite;
	exports.AppLoaderPlugin = AppLoaderPlugin;
	exports.Application = Application;
	exports.Attribute = Attribute;
	exports.BasePrepare = BasePrepare;
	exports.BaseRenderTexture = BaseRenderTexture;
	exports.BaseTexture = BaseTexture;
	exports.BatchDrawCall = BatchDrawCall;
	exports.BatchGeometry = BatchGeometry;
	exports.BatchPluginFactory = BatchPluginFactory;
	exports.BatchRenderer = BatchRenderer;
	exports.BatchShaderGenerator = BatchShaderGenerator;
	exports.BatchTextureArray = BatchTextureArray;
	exports.BitmapFont = BitmapFont;
	exports.BitmapFontData = BitmapFontData;
	exports.BitmapFontLoader = BitmapFontLoader;
	exports.BitmapText = BitmapText;
	exports.Bounds = Bounds;
	exports.Buffer = Buffer;
	exports.Circle = Circle;
	exports.Container = Container;
	exports.CountLimiter = CountLimiter;
	exports.DEG_TO_RAD = DEG_TO_RAD;
	exports.DisplayObject = DisplayObject;
	exports.Ellipse = Ellipse;
	exports.Extract = Extract;
	exports.FillStyle = FillStyle;
	exports.Filter = Filter;
	exports.FilterState = FilterState;
	exports.Framebuffer = Framebuffer;
	exports.GLFramebuffer = GLFramebuffer;
	exports.GLProgram = GLProgram;
	exports.GLTexture = GLTexture;
	exports.GRAPHICS_CURVES = GRAPHICS_CURVES;
	exports.Geometry = Geometry;
	exports.Graphics = Graphics;
	exports.GraphicsData = GraphicsData;
	exports.GraphicsGeometry = GraphicsGeometry;
	exports.IGLUniformData = IGLUniformData;
	exports.InteractionData = InteractionData;
	exports.InteractionEvent = InteractionEvent;
	exports.InteractionManager = InteractionManager;
	exports.InteractionTrackingData = InteractionTrackingData;
	exports.LineStyle = LineStyle;
	exports.Loader = Loader$1;
	exports.LoaderResource = LoaderResource;
	exports.MaskData = MaskData;
	exports.Matrix = Matrix;
	exports.Mesh = Mesh;
	exports.MeshBatchUvs = MeshBatchUvs;
	exports.MeshGeometry = MeshGeometry;
	exports.MeshMaterial = MeshMaterial;
	exports.NineSlicePlane = NineSlicePlane;
	exports.ObjectRenderer = ObjectRenderer;
	exports.ObservablePoint = ObservablePoint;
	exports.PI_2 = PI_2;
	exports.ParticleContainer = ParticleContainer;
	exports.ParticleRenderer = ParticleRenderer;
	exports.PlaneGeometry = PlaneGeometry;
	exports.Point = Point;
	exports.Polygon = Polygon;
	exports.Prepare = Prepare;
	exports.Program = Program;
	exports.Quad = Quad;
	exports.QuadUv = QuadUv;
	exports.RAD_TO_DEG = RAD_TO_DEG;
	exports.Rectangle = Rectangle;
	exports.RenderTexture = RenderTexture;
	exports.RenderTexturePool = RenderTexturePool;
	exports.Renderer = Renderer;
	exports.RopeGeometry = RopeGeometry;
	exports.RoundedRectangle = RoundedRectangle;
	exports.Runner = Runner;
	exports.Shader = Shader;
	exports.SimpleMesh = SimpleMesh;
	exports.SimplePlane = SimplePlane;
	exports.SimpleRope = SimpleRope;
	exports.Sprite = Sprite;
	exports.SpriteMaskFilter = SpriteMaskFilter;
	exports.Spritesheet = Spritesheet;
	exports.SpritesheetLoader = SpritesheetLoader;
	exports.State = State;
	exports.System = System;
	exports.TemporaryDisplayObject = TemporaryDisplayObject;
	exports.Text = Text;
	exports.TextMetrics = TextMetrics;
	exports.TextStyle = TextStyle;
	exports.Texture = Texture;
	exports.TextureLoader = TextureLoader;
	exports.TextureMatrix = TextureMatrix;
	exports.TextureUvs = TextureUvs;
	exports.Ticker = Ticker;
	exports.TickerPlugin = TickerPlugin;
	exports.TilingSprite = TilingSprite;
	exports.TilingSpriteRenderer = TilingSpriteRenderer;
	exports.TimeLimiter = TimeLimiter;
	exports.Transform = Transform;
	exports.UniformGroup = UniformGroup;
	exports.VERSION = VERSION$1;
	exports.ViewableBuffer = ViewableBuffer;
	exports.accessibleTarget = accessibleTarget;
	exports.autoDetectRenderer = autoDetectRenderer;
	exports.checkMaxIfStatementsInShader = checkMaxIfStatementsInShader;
	exports.defaultFilterVertex = defaultFilter;
	exports.defaultVertex = _default;
	exports.filters = filters;
	exports.graphicsUtils = index$2;
	exports.groupD8 = groupD8;
	exports.interactiveTarget = interactiveTarget;
	exports.isMobile = isMobile$1;
	exports.resources = index;
	exports.settings = settings;
	exports.systems = systems;
	exports.uniformParsers = uniformParsers;
	exports.useDeprecated = useDeprecated;
	exports.utils = utils_es;

	return exports;

}({}));
PIXI.useDeprecated();

