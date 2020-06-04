interface Info{
  number: number | string; 
  execution: number; 
}
export class EventBus {
    #listeners: object

    constructor(){
      this.#listeners = {};
    };

    // private _get_listners: ()=>object = function(){
    //   return this.#listeners
    // }
    private _setListeners: (e:string,callback:Function,number:any)=>void = function(event:string,callback:Function,number:any) {
      this.#listeners[event] = this.#listeners[event] || [];
      this.#listeners[event].push({
        callback: callback,
        number: number,
      });
    }

    
    private _registerListener: (event: Array<string>|string, callback: Function, number: any)=> void = function (event, callback, number) {
        var type = event.constructor.name;
        number = this._validateNumber(number || 'any');
  
        if (type !== 'Array') {
          event = [(event as string)];
        }

        var that = this;
  
        (event as Array<string>).forEach(function(e: string) {
          if (e.constructor.name !== 'String') {
            throw new Error(
              'Only `String` and array of `String` are accepted for the event names!'
            );
          }

          that._setListeners(e,callback,number);
        });
    };

    // valiodate that the number is a vild number for the number of executions
    private _validateNumber: (n: number | string)=> any = function (n) {
    var type = n.constructor.name;

    if (type === 'Number') {
        return n;
    } else if (type === 'String' && (n as string).toLowerCase() === 'any') {
        return 'any';
    }

    throw new Error(
        'Only `Number` and `any` are accepted in the number of possible executions!'
    );
    };

    // return wether or not this event needs to be removed
    private _toBeRemoved: (info: Info)=> boolean = function (info) {
    var number = info.number;
    info.execution = info.execution || 0;
    info.execution++;

    if (number === 'any' || info.execution < number) {
        return false;
    }

    return true;
    };

    /**
     * Attach a callback to an event
     * @param {string} eventName - name of the event.
     * @param {function} callback - callback executed when this event is triggered
     */
    public on(eventName: string, callback: Function) {
        // origin: that.registerListener.bind(that)(eventName, callback, 'any');
        this._registerListener(eventName,callback,'any'); 
    };

    /**
     * Attach a callback to an event. This callback will not be executed more than once if the event is trigger mutiple times
     * @param {string} eventName - name of the event.
     * @param {function} callback - callback executed when this event is triggered
     */
    public once(eventName: string, callback: Function) {
      this._registerListener(eventName, callback, 1);
    };

    /**
     * Attach a callback to an event. This callback will be executed will not be executed more than the number if the event is trigger mutiple times
     * @param {number} number - max number of executions
     * @param {string} eventName - name of the event.
     * @param {function} callback - callback executed when this event is triggered
     */
    public exactly(number: number, eventName: string, callback: Function) {
      this._registerListener(eventName, callback, number);
    };

    /**
     * Kill an event with all it's callbacks
     * @param {string} eventName - name of the event.
     */
    public die(eventName: string) {
      delete this.#listeners[eventName];
    };

    /**
     * Kill an event with all it's callbacks
     * @param {string} eventName - name of the event.
     */
    public off (eventName: string) {
      this.die(eventName);
    };

    /**
     * Remove the callback for the given event
     * @param {string} eventName - name of the event.
     * @param {callback} [callback] - the callback to remove (undefined to remove all of them).
     */
    public detach(eventName: string, callback?: Function) {
      if (callback === undefined) {
          this.#listeners[eventName] = [];
          return true;
      }
      for (var k in this.#listeners[eventName]) {
          if (this.#listeners[eventName].hasOwnProperty(k) &&
              this.#listeners[eventName][k].callback === callback) {
              this.#listeners[eventName].splice(k, 1);
              return this.detach(eventName, callback);
          }
      }
      return true;
    };

    /**
     * Remove all the events
     */
    public detachAll() {
      for (var eventName in this.#listeners) {
        if (this.#listeners.hasOwnProperty(eventName)) {
          this.detach(eventName);
        }
      }
    };

    /**
     * Emit the event
     * @param {string} eventName - name of the event.
     * @param {string} [context] - add a context ~~deleted~~
     */
    public emit (eventName: string) {
      var listeners = [];
      let name:string; 
      for (name in this.#listeners) {
        if (this.#listeners.hasOwnProperty(name)) {
          if (name === eventName) {
            //TODO: this lib should definitely use > ES5
            Array.prototype.push.apply(listeners, this.#listeners[name]);
          }

          if (name.indexOf('*') >= 0) {
            var newName = name.replace(/\*\*/, '([^.]+.?)+');
            newName = newName.replace(/\*/g, '[^.]+');

            var match = eventName.match(newName);
            if (match && eventName === match[0]) {
              Array.prototype.push.apply(listeners, this.#listeners[name]);
            }
          }
        }
      }

      var parentArgs = arguments;
      var that = this; 

      // context = context || this;
      listeners.forEach(function(info, index) {
        var callback = info.callback;
        var number = info.number;

        // if (context) {
          // callback = callback.bind(context);
        // }

        var args = [];
        Object.keys(parentArgs).map(function(value,i,array) {
          if (i > 0) {
            args.push(parentArgs[i]);
          }
        });

        // this event cannot be fired again, remove from the stack
        if (that._toBeRemoved(info)) {
          that.#listeners[eventName].splice(index, 1);
        }

        callback.apply(null, args);
      });
    };

}