"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _listeners;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
class EventBus {
    constructor() {
        _listeners.set(this, void 0);
        // private _get_listners: ()=>object = function(){
        //   return this.#listeners
        // }
        this._setListeners = function (event, callback, number, isRaw) {
            __classPrivateFieldGet(this, _listeners)[event] = __classPrivateFieldGet(this, _listeners)[event] || [];
            __classPrivateFieldGet(this, _listeners)[event].push({
                callback: callback,
                number: number,
                isRaw: isRaw
            });
        };
        this._registerListener = function (event, callback, number, isRaw) {
            var type = event.constructor.name;
            number = this._validateNumber(number || 'any');
            if (type !== 'Array') {
                event = [event];
            }
            var that = this;
            event.forEach(function (e) {
                if (e.constructor.name !== 'String') {
                    throw new Error('Only `String` and array of `String` are accepted for the event names!');
                }
                that._setListeners(e, callback, number, isRaw);
            });
        };
        // valiodate that the number is a vild number for the number of executions
        this._validateNumber = function (n) {
            var type = n.constructor.name;
            if (type === 'Number') {
                return n;
            }
            else if (type === 'String' && n.toLowerCase() === 'any') {
                return 'any';
            }
            throw new Error('Only `Number` and `any` are accepted in the number of possible executions!');
        };
        // return wether or not this event needs to be removed
        this._toBeRemoved = function (info) {
            var number = info.number;
            info.execution = info.execution || 0;
            info.execution++;
            if (number === 'any' || info.execution < number) {
                return false;
            }
            return true;
        };
        __classPrivateFieldSet(this, _listeners, {});
    }
    ;
    /**
     * Attach a callback to an event
     * @param {string} eventName - name of the event.
     * @param {function} callback - callback executed when this event is triggered
     */
    on(eventName, callback) {
        // origin: that.registerListener.bind(that)(eventName, callback, 'any');
        this._registerListener(eventName, callback, 'any', false);
    }
    ;
    /**
     * Attach a callback to an event, expect the callback to receive raw object
     * @param {string} eventName - name of the event.
     * @param {function} callback - callback executed when this event is triggered
     */
    onRaw(eventName, callback) {
        // origin: that.registerListener.bind(that)(eventName, callback, 'any');
        this._registerListener(eventName, callback, 'any', true);
    }
    ;
    /**
     * Attach a callback to an event. This callback will not be executed more than once if the event is trigger mutiple times
     * @param {string} eventName - name of the event.
     * @param {function} callback - callback executed when this event is triggered
     */
    once(eventName, callback) {
        this._registerListener(eventName, callback, 1, false);
    }
    ;
    /**
     * Attach a callback to an event. This callback will be executed will not be executed more than the number if the event is trigger mutiple times
     * @param {number} number - max number of executions
     * @param {string} eventName - name of the event.
     * @param {function} callback - callback executed when this event is triggered
     */
    exactly(number, eventName, callback) {
        this._registerListener(eventName, callback, number, false);
    }
    ;
    /**
     * Kill an event with all it's callbacks
     * @param {string} eventName - name of the event.
     */
    die(eventName) {
        delete __classPrivateFieldGet(this, _listeners)[eventName];
    }
    ;
    /**
     * Kill an event with all it's callbacks
     * @param {string} eventName - name of the event.
     */
    off(eventName) {
        this.die(eventName);
    }
    ;
    /**
     * Remove the callback for the given event
     * @param {string} eventName - name of the event.
     * @param {callback} [callback] - the callback to remove (undefined to remove all of them).
     */
    detach(eventName, callback) {
        if (callback === undefined) {
            __classPrivateFieldGet(this, _listeners)[eventName] = [];
            return true;
        }
        for (var k in __classPrivateFieldGet(this, _listeners)[eventName]) {
            if (__classPrivateFieldGet(this, _listeners)[eventName].hasOwnProperty(k) &&
                __classPrivateFieldGet(this, _listeners)[eventName][k].callback === callback) {
                __classPrivateFieldGet(this, _listeners)[eventName].splice(k, 1);
                return this.detach(eventName, callback);
            }
        }
        return true;
    }
    ;
    /**
     * Remove all the events
     */
    detachAll() {
        for (var eventName in __classPrivateFieldGet(this, _listeners)) {
            if (__classPrivateFieldGet(this, _listeners).hasOwnProperty(eventName)) {
                this.detach(eventName);
            }
        }
    }
    ;
    /**
     * Emit the event, directly without involving context
     * @param {string} eventName - name of the event.
     * @param {...any} Data - additional data.
     */
    emit(eventName) {
        var args = Array.from(arguments);
        // insert the context variable as null, and avoid warning the expected number of parmeters
        args.splice(1, 0, null);
        this.emitContext(eventName, ...args.slice(1));
    }
    ;
    /**
     * Emit the event with context
     * @param {string} eventName - name of the event.
     * @param {string} context - add a context.
     * @param {...any} Data - additional data.
     */
    emitContext(eventName, context) {
        var listeners = [];
        let name;
        for (name in __classPrivateFieldGet(this, _listeners)) {
            if (__classPrivateFieldGet(this, _listeners).hasOwnProperty(name)) {
                if (name === eventName) {
                    //TODO: this lib should definitely use > ES5
                    Array.prototype.push.apply(listeners, __classPrivateFieldGet(this, _listeners)[name]);
                }
                if (name.indexOf('*') >= 0) {
                    var newName = name.replace(/\*\*/, '([^.]+.?)+');
                    newName = newName.replace(/\*/g, '[^.]+');
                    var match = eventName.match(newName);
                    if (match && eventName === match[0]) {
                        Array.prototype.push.apply(listeners, __classPrivateFieldGet(this, _listeners)[name]);
                    }
                }
            }
        }
        var parentArgs = arguments;
        var that = this;
        context = context || this;
        listeners.forEach(function (info, index) {
            var callback = info.callback;
            var number = info.number;
            var isRaw = info.isRaw;
            if (context) {
                callback = callback.bind(context);
            }
            var args = [];
            Object.keys(parentArgs).map(function (value, i, array) {
                if (i > 1) {
                    args.push(parentArgs[i]);
                }
            });
            // this event cannot be fired again, remove from the stack
            if (that._toBeRemoved(info)) {
                __classPrivateFieldGet(that, _listeners)[eventName].splice(index, 1);
            }
            // for isRaw=true operation, add data: args.slice(0) to avoid [circular]
            if (!isRaw) {
                // args.splice(0,0,eventName);
                // if call not Raw do nothing.
            }
            else {
                args.splice(0, 0, { name: eventName, data: args.slice(0) });
            }
            callback.apply(null, args);
        });
    }
    ;
}
exports.EventBus = EventBus;
_listeners = new WeakMap();
