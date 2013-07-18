var JohnSmith;
(function (JohnSmith) {
    (function (Common) {
        /////////////////////////////////
        // Utils
        /////////////////////////////////
        var TypeUtils = (function () {
            function TypeUtils() {
            }
            TypeUtils.isFunction = /**
            * Checks if provided object is a function.
            * @param target An object to check.
            * @returns {boolean}
            */
            function (target) {
                var getType = {};
                return (target && getType.toString.call(target) === '[object Function]');
            };

            TypeUtils.isObject = /**
            * Checks if provided object is actual object.
            * @param target An object to check.
            * @returns {boolean}
            */
            function (target) {
                return target != null && typeof target === "object";
            };
            return TypeUtils;
        })();
        Common.TypeUtils = TypeUtils;

        var ArgumentProcessorsBasedHandler = (function () {
            function ArgumentProcessorsBasedHandler(processors) {
                this._processors = processors;
            }
            ArgumentProcessorsBasedHandler.prototype.processArguments = function (args, context) {
                var lastArgument = args[args.length - 1];
                var options;
                if (this.isOptionsArgument(lastArgument)) {
                    options = lastArgument;
                    args.pop();
                } else {
                    options = {};
                }

                var argumentIndex = 0;
                while (args.length > 0) {
                    var argument = args[0];
                    this.processHandlerArgument(argument, argumentIndex, options, context);
                    args.splice(0, 1);
                    argumentIndex++;
                }

                return options;
            };

            ArgumentProcessorsBasedHandler.prototype.processHandlerArgument = function (argument, index, options, context) {
                for (var i = 0; i < this._processors.length; i++) {
                    var processor = this._processors[i];
                    if (processor.canProcess(argument, index, options, context)) {
                        processor.process(argument, options, context);
                        return;
                    }
                }

                throw new Error("Could not process argument " + argument);
            };

            /**
            * @protected
            */
            ArgumentProcessorsBasedHandler.prototype.isOptionsArgument = function (value) {
                return JohnSmith.Common.TypeUtils.isObject(value);
            };
            return ArgumentProcessorsBasedHandler;
        })();
        Common.ArgumentProcessorsBasedHandler = ArgumentProcessorsBasedHandler;

        var ArrayList = (function () {
            function ArrayList() {
                this._items = [];
            }
            ArrayList.prototype.getAt = function (index) {
                return this._items[index];
            };

            ArrayList.prototype.setAt = function (index, item) {
                this._items[index] = item;
            };

            ArrayList.prototype.removeAt = function (index) {
                this._items.splice(index, 1);
            };

            ArrayList.prototype.insertAt = function (index, item) {
                this._items.splice(index, 0, item);
            };

            ArrayList.prototype.add = function (item) {
                this._items.push(item);
            };

            ArrayList.prototype.count = function () {
                return this._items.length;
            };

            ArrayList.prototype.clear = function () {
                this._items.length = 0;
            };
            return ArrayList;
        })();
        Common.ArrayList = ArrayList;

        // Using no-op logger by default
        Common.log = {
            info: function (message) {
            },
            warn: function (message) {
            },
            error: function (message) {
            }
        };

        /////////////////////////////////
        // Exposing public API
        /////////////////////////////////
        var jsVarName = "js";
        window[jsVarName] = window[jsVarName] || {};
        Common.JS = window[jsVarName];

        var DefaultEventBus = (function () {
            function DefaultEventBus() {
                this._listeners = new ArrayList();
            }
            DefaultEventBus.prototype.addListener = function (eventType, callback) {
                var listener = {
                    eventType: eventType,
                    callback: callback
                };

                this._listeners.add(listener);
            };

            DefaultEventBus.prototype.trigger = function (eventType, data) {
                var listenersCount = this._listeners.count();
                for (var i = 0; i < listenersCount; i++) {
                    var listener = this._listeners.getAt(i);
                    if (listener.eventType === eventType) {
                        listener.callback(data);
                    }
                }
            };
            return DefaultEventBus;
        })();

        Common.JS.event = {};
        Common.JS.event.bus = new DefaultEventBus();

        /////////////////////////////////
        // Dom services
        /////////////////////////////////
        /**
        * Describes the type of string value
        */
        var ValueType = (function () {
            function ValueType() {
            }
            ValueType.text = "text";

            ValueType.html = "html";

            ValueType.unknown = "unknown";
            return ValueType;
        })();
        Common.ValueType = ValueType;

        var Container = (function () {
            function Container() {
                this.clear();
            }
            Container.prototype.has = function (key) {
                return (this._resolvedDependencies[key] != null);
            };

            Container.prototype.resolve = function (key) {
                var dependency = this._resolvedDependencies[key];

                if (!dependency) {
                    return null;
                }

                return dependency;
            };

            Container.prototype.register = function (key, service) {
                this._resolvedDependencies[key] = service;
                this.checkCallbacks();
            };

            Container.prototype.registerWithDependencies = function (key, createCallback) {
                var dependencies = [];
                for (var _i = 0; _i < (arguments.length - 2); _i++) {
                    dependencies[_i] = arguments[_i + 2];
                }
                this._definitions.push({
                    key: key,
                    dependencies: dependencies,
                    factoryCallback: createCallback
                });

                this.checkCallbacks();
            };

            Container.prototype.withRegistered = function (callback) {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    args[_i] = arguments[_i + 1];
                }
                this._definitions.push({
                    dependencies: args,
                    factoryCallback: callback
                });

                this.checkCallbacks();
            };

            Container.prototype.clear = function () {
                this._resolvedDependencies = {};
                this._definitions = [];
            };

            Container.prototype.checkCallbacks = function () {
                var isProcessed = false;
                var index = 0;
                var resolved = {};

                do {
                    if (index >= this._definitions.length) {
                        isProcessed = true;
                    }
                    if (!isProcessed) {
                        var definition = this._definitions[index];
                        if (this.processCallback(definition, resolved)) {
                            this._definitions.splice(index, 1);
                        } else {
                            index++;
                        }
                    }
                } while(!isProcessed);

                for (var key in resolved) {
                    this.register(key, resolved[key]);
                }
            };

            Container.prototype.processCallback = function (definition, resolved) {
                var dependencies = [];

                for (var j = 0; j < definition.dependencies.length; j++) {
                    var key = definition.dependencies[j];
                    if (this.has(key)) {
                        var dependency = this.resolve(key);
                        dependencies.push(dependency);
                    } else {
                        return false;
                    }
                }

                var resolvedService = definition.factoryCallback.apply(this, dependencies);
                if (resolvedService && definition.key) {
                    resolved[definition.key] = resolvedService;
                }

                return true;
            };
            return Container;
        })();

        var ioc = new Container();

        Common.JS.ioc = ioc;

        Common.JS.createIocContainer = function () {
            return new Container();
        };
    })(JohnSmith.Common || (JohnSmith.Common = {}));
    var Common = JohnSmith.Common;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="../Common.ts"/>
    (function (Command) {
        var CommandWire = (function () {
            function CommandWire(command, cause) {
                this._command = command;
                this._cause = cause;
            }
            CommandWire.prototype.init = function () {
                this._cause.wireWith(this._command);
            };

            CommandWire.prototype.dispose = function () {
                this._cause.dispose();
            };
            return CommandWire;
        })();
        Command.CommandWire = CommandWire;

        var CommandConfig = (function () {
            function CommandConfig(causeData, commandManager, context, commandContext) {
                this._causeData = causeData;
                this._commandManager = commandManager;
                this._context = context;
                this._commandContext = commandContext;
                this._wires = [];
            }
            CommandConfig.prototype.do = function (command, commandContext) {
                var wire = this._commandManager.setUpBinding({
                    command: command,
                    context: this._context,
                    causeData: this._causeData,
                    commandContext: commandContext || this._commandContext || null
                });

                this._wires.push(wire);

                wire.init();
                return this;
            };

            CommandConfig.prototype.dispose = function () {
                for (var i = 0; i < this._wires.length; i++) {
                    this._wires[i].dispose();
                }
            };
            return CommandConfig;
        })();
        Command.CommandConfig = CommandConfig;
    })(JohnSmith.Command || (JohnSmith.Command = {}));
    var Command = JohnSmith.Command;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="../Common.ts"/>
    /// <reference path="../command/Contracts.ts"/>
    (function (Binding) {
        /////////////////////////////////
        // Common Enums
        /////////////////////////////////
        (function (DataChangeReason) {
            DataChangeReason[DataChangeReason["replace"] = 0] = "replace";
            DataChangeReason[DataChangeReason["add"] = 1] = "add";
            DataChangeReason[DataChangeReason["remove"] = 2] = "remove";
        })(Binding.DataChangeReason || (Binding.DataChangeReason = {}));
        var DataChangeReason = Binding.DataChangeReason;

        // stores a combination of bindable and handler
        var BindingWire = (function () {
            function BindingWire(bindable, handler) {
                this._bindable = bindable;
                this._handler = handler;
            }
            // initializes the wire
            BindingWire.prototype.init = function () {
                this._handler.wireWith(this._bindable);
            };

            // disposes the wire
            BindingWire.prototype.dispose = function () {
                this._handler.unwireWith(this._bindable);
                this._handler.dispose();
            };

            BindingWire.prototype.getBindable = function () {
                return this._bindable;
            };

            BindingWire.prototype.getHandler = function () {
                return this._handler;
            };
            return BindingWire;
        })();
        Binding.BindingWire = BindingWire;

        var BindingConfig = (function () {
            function BindingConfig(manager, bindable, context, commandHost) {
                this._manager = manager;
                this._bindable = bindable;
                this._context = context;
                this._commandHost = commandHost;
                this._wires = [];
            }
            BindingConfig.prototype.to = function () {
                var handler = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    handler[_i] = arguments[_i + 0];
                }
                var wire = this._manager.bind({
                    bindableData: this._bindable,
                    handlerData: handler,
                    context: this._context,
                    commandHost: this._commandHost
                });
                this._wires.push(wire);
                wire.init();
                return this;
            };

            BindingConfig.prototype.dispose = function () {
                for (var i = 0; i < this._wires.length; i++) {
                    this._wires[i].dispose();
                }
            };
            return BindingConfig;
        })();
        Binding.BindingConfig = BindingConfig;
    })(JohnSmith.Binding || (JohnSmith.Binding = {}));
    var Binding = JohnSmith.Binding;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="Contracts.ts"/>
    (function (Binding) {
        /**
        * Creates simple bindable value.
        */
        var BindableValue = (function () {
            function BindableValue() {
                this._listeners = new JohnSmith.Common.ArrayList();
            }
            BindableValue.prototype.getValue = function () {
                return this._value;
            };

            BindableValue.prototype.setValue = function (value) {
                this.notifyListeners(value, Binding.DataChangeReason.replace);
                this._value = value;
            };

            BindableValue.prototype.getState = function () {
                return this._state;
            };

            BindableValue.prototype.setState = function (state) {
                for (var i = 0; i < this._listeners.count(); i++) {
                    var listener = this._listeners.getAt(i);
                    listener.stateChanged(this._state, state);
                }

                this._state = state;
            };

            BindableValue.prototype.addListener = function (listener) {
                this._listeners.add(listener);
            };

            BindableValue.prototype.removeListener = function (listener) {
                var indexToRemove = -1;
                for (var i = 0; i < this._listeners.count(); i++) {
                    if (this._listeners.getAt(i) == listener) {
                        indexToRemove = i;
                    }
                }

                if (indexToRemove >= 0) {
                    this._listeners.removeAt(indexToRemove);
                }
            };

            BindableValue.prototype.getListenersCount = function () {
                return this._listeners.count();
            };

            BindableValue.prototype.notifyListeners = function (newValue, reason) {
                for (var i = 0; i < this._listeners.count(); i++) {
                    var listener = this._listeners.getAt(i);
                    listener.valueChanged(this._value, newValue, reason);
                }
            };
            return BindableValue;
        })();
        Binding.BindableValue = BindableValue;

        JohnSmith.Common.JS.bindableValue = function () {
            return new BindableValue();
        };
    })(JohnSmith.Binding || (JohnSmith.Binding = {}));
    var Binding = JohnSmith.Binding;
})(JohnSmith || (JohnSmith = {}));
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="../Common.ts"/>
    /// <reference path="Contracts.ts"/>
    /// <reference path="BindableValue.ts"/>
    (function (Binding) {
        var BindableList = (function (_super) {
            __extends(BindableList, _super);
            function BindableList() {
                _super.call(this);
                _super.prototype.setValue.call(this, []);
            }
            BindableList.prototype.setValue = function (value) {
                if (value) {
                    if (!(value instanceof Array)) {
                        throw new Error("Bindable list supports only array values");
                    }
                }

                _super.prototype.setValue.call(this, value);
                this.notifyCountListeners();
            };

            BindableList.prototype.add = function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                var array = this.getValue();
                for (var i = 0; i < args.length; i++) {
                    array.push(args[i]);
                }

                this.reactOnChange(args, Binding.DataChangeReason.add);
            };

            BindableList.prototype.remove = function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                var array = this.getValue();
                for (var i = 0; i < args.length; i++) {
                    var indexToRemove = -1;
                    for (var j = 0; j < array.length; j++) {
                        if (array[j] == args[i]) {
                            indexToRemove = j;
                        }
                    }

                    if (indexToRemove >= 0) {
                        array.splice(indexToRemove, 1);
                    }
                }

                this.reactOnChange(args, Binding.DataChangeReason.remove);
            };

            /** Returns a bindable value that stores size of the list */
            BindableList.prototype.count = function () {
                if (!this._count) {
                    this._count = new Binding.BindableValue();
                }

                return this._count;
            };

            BindableList.prototype.reactOnChange = function (items, reason) {
                _super.prototype.notifyListeners.call(this, items, reason);
                this.notifyCountListeners();
            };

            BindableList.prototype.notifyCountListeners = function () {
                if (this._count) {
                    if (this.getValue()) {
                        this._count.setValue(this.getValue().length);
                    } else {
                        this._count.setValue(0);
                    }
                }
            };
            return BindableList;
        })(Binding.BindableValue);
        Binding.BindableList = BindableList;

        JohnSmith.Common.JS.bindableList = function () {
            return new BindableList();
        };
    })(JohnSmith.Binding || (JohnSmith.Binding = {}));
    var Binding = JohnSmith.Binding;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="Contracts.ts"/>
    (function (Binding) {
        var StaticBindableValue = (function () {
            function StaticBindableValue(value) {
                this._value = value;
            }
            StaticBindableValue.prototype.getValue = function () {
                return this._value;
            };

            StaticBindableValue.prototype.getState = function () {
                return "normal";
            };

            StaticBindableValue.prototype.addListener = function (listener) {
            };

            StaticBindableValue.prototype.removeListener = function (listener) {
            };
            return StaticBindableValue;
        })();
        Binding.StaticBindableValue = StaticBindableValue;

        var StaticBindableFactory = (function () {
            function StaticBindableFactory() {
            }
            StaticBindableFactory.prototype.createBindable = function (bindable) {
                return new StaticBindableValue(bindable);
            };
            return StaticBindableFactory;
        })();
        Binding.StaticBindableFactory = StaticBindableFactory;
    })(JohnSmith.Binding || (JohnSmith.Binding = {}));
    var Binding = JohnSmith.Binding;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="../Common.ts"/>
    /// <reference path="Contracts.ts"/>
    /// <reference path="StaticBindableValue.ts"/>
    (function (Binding) {
        var Log = function () {
            return JohnSmith.Common.log;
        };

        /**
        * Default implementation of binding manager.
        */
        var DefaultBindingManager = (function (_super) {
            __extends(DefaultBindingManager, _super);
            function DefaultBindingManager(bindableFactories, handlerFactories, handlerArgumentProcessors) {
                _super.call(this, handlerArgumentProcessors);

                this._bindableFactories = bindableFactories;
                this._handlerFactories = handlerFactories;
            }
            DefaultBindingManager.prototype.bind = function (data) {
                Log().info("Binding ", data.bindableData, " to ", data.handlerData);

                var bindable = this.getBindable(data.bindableData);
                var handler = this.getHandler(data.handlerData, bindable, data.context, data.commandHost);

                Log().info("    resolved bindable: ", bindable);
                Log().info("    resolved handler: ", handler);

                var result = new Binding.BindingWire(bindable, handler);
                return result;
            };

            DefaultBindingManager.prototype.getBindable = function (bindableObject) {
                for (var i = 0; i < this._bindableFactories.count(); i++) {
                    var factory = this._bindableFactories.getAt(i);
                    var result = factory.createBindable(bindableObject);
                    if (result != null) {
                        return result;
                    }
                }

                throw new Error("Could not transform object " + bindableObject + " to bindable");
            };

            DefaultBindingManager.prototype.getHandler = function (handlerData, bindable, context, commandHost) {
                var options = this.processArguments(handlerData, context);
                for (var i = 0; i < this._handlerFactories.count(); i++) {
                    var factory = this._handlerFactories.getAt(i);
                    var result = factory.createHandler(options, bindable, context, commandHost);
                    if (result) {
                        return result;
                    }
                }

                throw new Error("Could not transform object " + handlerData + " to bindable handler");
            };
            return DefaultBindingManager;
        })(JohnSmith.Common.ArgumentProcessorsBasedHandler);
        Binding.DefaultBindingManager = DefaultBindingManager;

        var DefaultBindableFactory = (function () {
            function DefaultBindableFactory() {
            }
            DefaultBindableFactory.prototype.createBindable = function (bindable) {
                if (bindable && bindable.getValue && bindable.addListener) {
                    return bindable;
                }

                return null;
            };
            return DefaultBindableFactory;
        })();

        var bindableFactories = new JohnSmith.Common.ArrayList();
        var handlerFactories = new JohnSmith.Common.ArrayList();
        var handlerArgumentProcessors = [];

        JohnSmith.Common.JS.getBindableFactories = function () {
            return bindableFactories;
        };

        JohnSmith.Common.JS.getHandlerFactories = function () {
            return handlerFactories;
        };

        JohnSmith.Common.JS.addBindableFactory = function (factory) {
            bindableFactories.add(factory);
        };

        JohnSmith.Common.JS.addHandlerFactory = function (transformer) {
            handlerFactories.insertAt(0, transformer);
        };

        JohnSmith.Common.JS.addHandlerArgumentProcessor = function (processor) {
            handlerArgumentProcessors.push(processor);
        };

        JohnSmith.Common.JS.addBindableFactory(new DefaultBindableFactory());
        JohnSmith.Common.JS.addBindableFactory(new Binding.StaticBindableFactory());

        JohnSmith.Common.JS.addHandlerFactory({
            createHandler: function (handler, context) {
                if (handler && handler.wireWith && handler.unwireWith) {
                    return handler;
                }

                return null;
            }
        });

        var bindingManager = new DefaultBindingManager(bindableFactories, handlerFactories, handlerArgumentProcessors);

        JohnSmith.Common.JS.ioc.register("bindingManager", bindingManager);

        JohnSmith.Common.JS.bind = function (bindable) {
            return new Binding.BindingConfig(bindingManager, bindable, null, JohnSmith.Common.JS);
        };
    })(JohnSmith.Binding || (JohnSmith.Binding = {}));
    var Binding = JohnSmith.Binding;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="../Common.ts"/>
    /// <reference path="../binding/Contracts.ts"/>
    /// <reference path="../command/Contracts.ts"/>
    /// <reference path="Contracts.ts"/>
    (function (View) {
        var DefaultView = (function () {
            function DefaultView(bindableManager, commandManager, elementFactory, viewData, viewModel, eventBus, viewFactory, markupResolver) {
                this._bindableManager = bindableManager;
                this._commandManager = commandManager;
                this._elementFactory = elementFactory;
                this._data = viewData;
                this._viewModel = viewModel;
                this._eventBus = eventBus;
                this._viewFactory = viewFactory;
                this._markupResolver = markupResolver;

                this._bindings = [];
                this._commands = [];
            }
            DefaultView.prototype.addChild = function (destination, child, viewModel) {
                if (!this.hasChildren()) {
                    this._children = [];
                }

                this._children.push({
                    child: child,
                    destination: destination,
                    viewModel: viewModel
                });
            };

            DefaultView.prototype.renderTo = function (destination) {
                var templateHtml = this._markupResolver.resolve(this._data.template);
                var destinationElement = typeof destination == "string" ? this._elementFactory.createElement(destination) : destination;

                this._rootElement = destinationElement.appendHtml(templateHtml);

                this._eventBus.trigger("viewRendered", {
                    root: this._rootElement,
                    view: this
                });

                if (this._data.init) {
                    this._data.init.call(this, this._viewModel);
                }

                if (this.hasChildren()) {
                    for (var i = 0; i < this._children.length; i++) {
                        var childData = this._children[i];
                        var viewModel = childData.viewModel;
                        var child = this._viewFactory.resolve(childData.child, viewModel);
                        child.renderTo(this._rootElement.findRelative(childData.destination));
                    }
                }

                if (this._viewModel && this._viewModel.resetState) {
                    this._viewModel.resetState();
                }
            };

            DefaultView.prototype.bind = function (bindable) {
                var binding = new JohnSmith.Binding.BindingConfig(this._bindableManager, bindable, this._rootElement, this);

                this._bindings.push(binding);

                return binding;
            };

            DefaultView.prototype.on = function () {
                var causeArguments = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    causeArguments[_i] = arguments[_i + 0];
                }
                var commandConfig = new JohnSmith.Command.CommandConfig(causeArguments, this._commandManager, this.getRootElement(), this._viewModel);

                this._commands.push(commandConfig);

                return commandConfig;
            };

            DefaultView.prototype.getRootElement = function () {
                return this._rootElement;
            };

            DefaultView.prototype.dispose = function () {
                if (this.hasChildren()) {
                    for (var i = 0; i < this._children.length; i++) {
                        this._children[i].child.dispose();
                    }
                }

                for (var i = 0; i < this._bindings.length; i++) {
                    this._bindings[i].dispose();
                }

                for (var i = 0; i < this._commands.length; i++) {
                    this._commands[i].dispose();
                }
            };

            DefaultView.prototype.hasChildren = function () {
                return this._children != null;
            };
            return DefaultView;
        })();
        View.DefaultView = DefaultView;
    })(JohnSmith.View || (JohnSmith.View = {}));
    var View = JohnSmith.View;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="../Common.ts"/>
    /// <reference path="../binding/Contracts.ts"/>
    /// <reference path="../command/Contracts.ts"/>
    /// <reference path="Contracts.ts"/>
    /// <reference path="DefaultView.ts"/>
    (function (View) {
        /**
        * Default implementation of IViewFactory
        */
        var DefaultViewFactory = (function () {
            function DefaultViewFactory(bindableManager, commandManager, elementFactory, eventBus, markupResolver) {
                this._bindableManager = bindableManager;
                this._commandManager = commandManager;
                this._elementFactory = elementFactory;
                this._eventBus = eventBus;
                this._markupResolver = markupResolver;
            }
            DefaultViewFactory.prototype.resolve = function (dataDescriptor, viewModel) {
                if (!dataDescriptor) {
                    throw new Error("Expected view data object was not defined");
                }

                if (JohnSmith.Common.TypeUtils.isFunction(dataDescriptor)) {
                    var newInstance = new dataDescriptor();
                    return this.resolve(newInstance, viewModel);
                }

                if (dataDescriptor.template) {
                    return new View.DefaultView(this._bindableManager, this._commandManager, this._elementFactory, dataDescriptor, viewModel, this._eventBus, this, this._markupResolver);
                }

                if (dataDescriptor.renderTo && dataDescriptor.getRootElement) {
                    return dataDescriptor;
                }

                throw new Error("Could not resolve view data by provided descriptor");
            };
            return DefaultViewFactory;
        })();
        View.DefaultViewFactory = DefaultViewFactory;
    })(JohnSmith.View || (JohnSmith.View = {}));
    var View = JohnSmith.View;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="../Common.ts"/>
    /// <reference path="../command/Contracts.ts"/>
    /// <reference path="../binding/Contracts.ts"/>
    /// <reference path="../binding/Handling.ts"/>
    /// <reference path="../binding/BindableManager.ts"/>
    /// <reference path="Contracts.ts"/>
    /// <reference path="DefaultViewFactory.ts"/>
    (function (View) {
        var ViewArgumentProcessor = (function () {
            function ViewArgumentProcessor(viewFactory) {
                this._viewFactory = viewFactory;
            }
            ViewArgumentProcessor.prototype.canProcess = function (argument, argumentIndex, options, context) {
                return argumentIndex === 1 && (!options.view);
            };

            ViewArgumentProcessor.prototype.process = function (argument, options, context) {
                try  {
                    var viewFactory = this._viewFactory;
                    viewFactory.resolve(argument, null);
                    options.view = argument;
                } catch (Error) {
                }
            };
            return ViewArgumentProcessor;
        })();
        View.ViewArgumentProcessor = ViewArgumentProcessor;

        var ViewValueRenderer = (function () {
            function ViewValueRenderer(viewFactory, viewDescriptor) {
                this._viewFactory = viewFactory;
                this._viewDescriptor = viewDescriptor;
            }
            ViewValueRenderer.prototype.render = function (value, destination) {
                if (this._currentView) {
                    this._currentView.dispose();
                }

                this._currentView = this._viewFactory.resolve(this._viewDescriptor, value);
                this._currentView.renderTo(destination);

                return this._currentView.getRootElement();
            };

            ViewValueRenderer.prototype.dispose = function () {
                if (this._currentView) {
                    this._currentView.dispose();
                }
            };
            return ViewValueRenderer;
        })();
        View.ViewValueRenderer = ViewValueRenderer;

        /////////////////////////////////
        // Config
        /////////////////////////////////
        JohnSmith.Common.JS.ioc.registerWithDependencies("viewFactory", function (bindableManager, commandManager, elementFactory, markupResolver) {
            return new View.DefaultViewFactory(bindableManager, commandManager, elementFactory, JohnSmith.Common.JS.event.bus, markupResolver);
        }, "bindingManager", "commandManager", "elementFactory", "markupResolver");

        JohnSmith.Common.JS.ioc.withRegistered(function (viewFactory) {
            JohnSmith.Common.JS.addHandlerArgumentProcessor(new ViewArgumentProcessor(viewFactory));
        }, "viewFactory");

        JohnSmith.Common.JS.createView = function (viewDescriptor, viewModel) {
            var viewFactory = JohnSmith.Common.JS.ioc.resolve("viewFactory");
            return viewFactory.resolve(viewDescriptor, viewModel);
        };
    })(JohnSmith.View || (JohnSmith.View = {}));
    var View = JohnSmith.View;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="Common.ts"/>
    (function (Fetchers) {
        var common = JohnSmith.Common;

        var FetcherType = (function () {
            function FetcherType() {
            }
            FetcherType.Value = "value";
            FetcherType.CheckedAttribute = "checkedAttribute";
            return FetcherType;
        })();
        Fetchers.FetcherType = FetcherType;

        var ValueFetcher = (function () {
            function ValueFetcher() {
            }
            ValueFetcher.prototype.isSuitableFor = function (element) {
                var nodeName = element.getNodeName();
                if (nodeName) {
                    nodeName = nodeName.toUpperCase();

                    if (nodeName === "TEXTAREA") {
                        return true;
                    }

                    if (nodeName === "INPUT") {
                        var inputType = element.getAttribute("type");
                        if ((!inputType) || inputType.toUpperCase() === "TEXT") {
                            return true;
                        }
                    }
                }

                return false;
            };

            ValueFetcher.prototype.valueToElement = function (value, element) {
                element.setValue(value);
            };

            ValueFetcher.prototype.valueFromElement = function (element) {
                return element.getValue();
            };
            return ValueFetcher;
        })();

        var CheckedAttributeFetcher = (function () {
            function CheckedAttributeFetcher() {
            }
            CheckedAttributeFetcher.prototype.isSuitableFor = function (element) {
                var nodeName = element.getNodeName();
                if (nodeName) {
                    nodeName = nodeName.toUpperCase();
                    var type = element.getAttribute("type");
                    return nodeName === "INPUT" && type && type.toUpperCase() === "CHECKBOX";
                }

                return false;
            };

            CheckedAttributeFetcher.prototype.valueToElement = function (value, element) {
                element.setProperty("checked", value);
            };

            CheckedAttributeFetcher.prototype.valueFromElement = function (element) {
                var isChecked = false;
                if (element.getProperty("checked")) {
                    isChecked = true;
                }

                return isChecked;
            };
            return CheckedAttributeFetcher;
        })();

        var FetcherFactory = (function () {
            function FetcherFactory() {
                this._items = {};
            }
            FetcherFactory.prototype.getForElement = function (element) {
                for (var key in this._items) {
                    var fetcher = this._items[key];
                    if (fetcher.isSuitableFor(element)) {
                        return fetcher;
                    }
                }

                return null;
            };

            FetcherFactory.prototype.getByKey = function (key) {
                return this._items[key];
            };

            FetcherFactory.prototype.registerFetcher = function (key, fetcher) {
                this._items[key] = fetcher;
            };
            return FetcherFactory;
        })();

        var factory = new FetcherFactory();
        factory.registerFetcher(FetcherType.Value, new ValueFetcher());
        factory.registerFetcher(FetcherType.CheckedAttribute, new CheckedAttributeFetcher());

        JohnSmith.Common.JS.ioc.register("fetcherFactory", factory);
    })(JohnSmith.Fetchers || (JohnSmith.Fetchers = {}));
    var Fetchers = JohnSmith.Fetchers;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="../Common.ts"/>
    /// <reference path="../Fetchers.ts"/>
    /// <reference path="Contracts.ts"/>
    (function (Command) {
        var EventCommandCause = (function () {
            function EventCommandCause(targetElement, event, commandContext, argumentsFetcher) {
                this._targetElement = targetElement;
                this._event = event;
                this._commandContext = commandContext;
                this._argumentsFetcher = argumentsFetcher;
            }
            EventCommandCause.prototype.wireWith = function (command) {
                var context = this._commandContext;
                var argumentsFetcher = this._argumentsFetcher;

                this._handlerRef = this._targetElement.attachEventHandler(this._event, function (target) {
                    var commandArguments = argumentsFetcher == null ? [] : argumentsFetcher.fetch(target);

                    command.execute.apply(context, commandArguments);
                });
            };

            EventCommandCause.prototype.dispose = function () {
                this._targetElement.detachEventHandler(this._event, this._handlerRef);
            };
            return EventCommandCause;
        })();
        Command.EventCommandCause = EventCommandCause;

        var FetcherToArgumentFetcherAdapter = (function () {
            function FetcherToArgumentFetcherAdapter(fetcher) {
                this._fetcher = fetcher;
            }
            FetcherToArgumentFetcherAdapter.prototype.fetch = function (target) {
                return [this._fetcher.valueFromElement(target)];
            };
            return FetcherToArgumentFetcherAdapter;
        })();

        var DefaultCommandManager = (function (_super) {
            __extends(DefaultCommandManager, _super);
            function DefaultCommandManager(argumentProcessors, elementFactory, fetcherFactory) {
                _super.call(this, argumentProcessors);
                this._elementFactory = elementFactory;
                this._fetcherFactory = fetcherFactory;
            }
            DefaultCommandManager.prototype.setUpBinding = function (data) {
                var command = this.getCommand(data.command);
                if (!data.commandContext) {
                    data.commandContext = command;
                }

                var cause = this.getCause(data.causeData, data.context, data.commandContext);
                return new Command.CommandWire(command, cause);
            };

            DefaultCommandManager.prototype.getCommand = function (command) {
                if (JohnSmith.Common.TypeUtils.isFunction(command)) {
                    var result = {
                        execute: command
                    };

                    return result;
                }

                if (command.execute) {
                    return command;
                }

                throw new Error("Could not transform " + command + " to command object");
            };

            DefaultCommandManager.prototype.getCause = function (causeData, context, commandContext) {
                var options = this.processArguments(causeData, context);
                return this.getCauseByOptions(options, context, commandContext);
            };

            DefaultCommandManager.prototype.getCauseByOptions = function (commandCauseOptions, context, commandContext) {
                var options = commandCauseOptions;
                if (!options.to) {
                    throw new Error("Required option 'to' is not set!");
                }

                if (!options.event) {
                    throw new Error("Required option 'event' is not set!");
                }

                var target = context == null ? this._elementFactory.createElement(options.to) : context.findRelative(options.to);

                if (!options.argumentsFetcher) {
                    var fetcher = null;
                    if (options.fetch) {
                        fetcher = this._fetcherFactory.getByKey(options.fetch);
                    } else {
                        fetcher = this._fetcherFactory.getForElement(target);
                    }

                    if (fetcher) {
                        options.argumentsFetcher = new FetcherToArgumentFetcherAdapter(fetcher);
                    }
                }

                return new EventCommandCause(target, options.event, commandContext, options.argumentsFetcher);
            };
            return DefaultCommandManager;
        })(JohnSmith.Common.ArgumentProcessorsBasedHandler);
        Command.DefaultCommandManager = DefaultCommandManager;
    })(JohnSmith.Command || (JohnSmith.Command = {}));
    var Command = JohnSmith.Command;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="../Common.ts"/>
    /// <reference path="../Fetchers.ts"/>
    /// <reference path="Contracts.ts"/>
    /// <reference path="CommandManager.ts"/>
    (function (Command) {
        var EventArgumentProcessor = (function () {
            function EventArgumentProcessor() {
            }
            EventArgumentProcessor.prototype.canProcess = function (argument, argumentIndex, options, context) {
                return (typeof argument == "string") && argumentIndex == 1;
            };

            EventArgumentProcessor.prototype.process = function (argument, options, context) {
                options.event = argument;
            };
            return EventArgumentProcessor;
        })();

        var commandCauseArgumentProcessors = [];

        JohnSmith.Common.JS.ioc.registerWithDependencies("commandManager", function (elementFactory, fetcherFactory) {
            return new Command.DefaultCommandManager(commandCauseArgumentProcessors, elementFactory, fetcherFactory);
        }, "elementFactory", "fetcherFactory");

        JohnSmith.Common.JS.on = function () {
            var causeData = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                causeData[_i] = arguments[_i + 0];
            }
            var commandManager = JohnSmith.Common.JS.ioc.resolve("commandManager");
            return new Command.CommandConfig(causeData, commandManager, null);
        };

        JohnSmith.Common.JS.addCommandCauseArgumentProcessor = function (processor) {
            commandCauseArgumentProcessors.push(processor);
        };

        JohnSmith.Common.JS.addCommandCauseArgumentProcessor(new EventArgumentProcessor());
    })(JohnSmith.Command || (JohnSmith.Command = {}));
    var Command = JohnSmith.Command;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="../libs/jquery.d.ts"/>
    /// <reference path="binding/Handling.ts"/>
    /// <reference path="binding/Contracts.ts"/>
    /// <reference path="binding/BindableManager.ts"/>
    /// <reference path="binding/BindableList.ts"/>
    /// <reference path="command/Contracts.ts"/>
    /// <reference path="command/Integration.ts"/>
    /// <reference path="Common.ts"/>
    (function (JQuery) {
        var JQueryElement = (function () {
            function JQueryElement(target) {
                this._target = target;
            }
            JQueryElement.prototype.isEmpty = function () {
                return this._target.length == 0;
            };

            JQueryElement.prototype.empty = function () {
                this._target.empty();
            };

            JQueryElement.prototype.appendHtml = function (html) {
                if (!html) {
                    throw new Error("Could not append empty string!");
                }

                if (typeof html !== "string") {
                    throw new Error("Expected string markup but was" + html);
                }

                var parsedHtml = $($.parseHTML(html));

                this._target.append(parsedHtml);
                return new JQueryElement(parsedHtml);
            };

            JQueryElement.prototype.appendText = function (text) {
                if (!text) {
                    throw new Error("Could not append empty string!");
                }

                if (typeof text !== "string") {
                    throw new Error("Expected string text but was" + text);
                }

                var encodedHtml = $("<div/>").text(text).html();
                return this.appendHtml(encodedHtml);
            };

            JQueryElement.prototype.getHtml = function () {
                return this._target.html();
            };

            JQueryElement.prototype.getNodeName = function () {
                if (this._target.length == 1) {
                    return this._target[0].nodeName;
                }

                return null;
            };

            JQueryElement.prototype.findRelative = function (query) {
                var result = this._target.filter(query);
                if (result.length == 0) {
                    result = this._target.find(query);
                }

                return new JQueryElement(result);
            };

            JQueryElement.prototype.remove = function () {
                this._target.remove();
            };

            JQueryElement.prototype.getTarget = function () {
                return this._target;
            };

            JQueryElement.prototype.setText = function (text) {
                this._target.text(text);
            };

            JQueryElement.prototype.setHtml = function (html) {
                this._target.html(html);
            };

            JQueryElement.prototype.addClass = function (className) {
                this._target.addClass(className);
            };

            JQueryElement.prototype.removeClass = function (className) {
                this._target.removeClass(className);
            };

            JQueryElement.prototype.attachClickHandler = function (callback) {
                this._target.click(callback);
            };

            JQueryElement.prototype.attachEventHandler = function (event, callback) {
                var actualCallback = function () {
                    callback(new JQueryElement($(this)));
                    return false;
                };

                this._target.on(event, actualCallback);
                return actualCallback;
            };

            JQueryElement.prototype.detachEventHandler = function (event, handler) {
                this._target.off(event, handler);
            };

            JQueryElement.prototype.getValue = function () {
                return this._target.val();
            };

            JQueryElement.prototype.setValue = function (value) {
                return this._target.val(value);
            };

            JQueryElement.prototype.getAttribute = function (attribute) {
                return this._target.attr(attribute);
            };

            JQueryElement.prototype.setAttribute = function (attribute, value) {
                this._target.attr(attribute, value);
            };

            JQueryElement.prototype.getProperty = function (property) {
                return this._target.prop(property);
            };

            JQueryElement.prototype.setProperty = function (property, value) {
                this._target.prop(property, value);
            };
            return JQueryElement;
        })();

        var JQueryMarkupResolver = (function () {
            function JQueryMarkupResolver() {
            }
            JQueryMarkupResolver.prototype.resolve = function (markup) {
                var jqueryMarkup = markup instanceof jQuery ? markup : $(markup);

                if (jqueryMarkup.parent().length > 0) {
                    return jqueryMarkup.html();
                }

                if (typeof markup === "string") {
                    return markup;
                }

                if (markup instanceof jQuery) {
                    return $("<p>").append(markup).html();
                }

                throw new Error("Could not resolve markup by object " + markup);
            };
            return JQueryMarkupResolver;
        })();
        JQuery.JQueryMarkupResolver = JQueryMarkupResolver;

        var JQueryTargetArgumentProcessor = (function () {
            function JQueryTargetArgumentProcessor() {
            }
            JQueryTargetArgumentProcessor.prototype.canProcess = function (argument, argumentIndex, options, context) {
                return (typeof argument == "string") && argumentIndex == 0;
            };

            JQueryTargetArgumentProcessor.prototype.process = function (argument, options, context) {
                if (!options.to) {
                    options.to = argument;
                }
            };
            return JQueryTargetArgumentProcessor;
        })();

        var JQueryValueToElementMapper = (function () {
            function JQueryValueToElementMapper() {
            }
            JQueryValueToElementMapper.prototype.getElementFor = function (value, root) {
                var $items = (root.findRelative(".dataItem")).getTarget();
                for (var i = 0; i < $items.length; i++) {
                    var $element = $($items[i]);
                    if ($element.data("dataItem") === value) {
                        return new JQueryElement($element);
                    }
                }

                return null;
            };

            JQueryValueToElementMapper.prototype.attachValueToElement = function (value, element) {
                var $target = (element).getTarget();
                $target.addClass("dataItem").data("dataItem", value);
            };
            return JQueryValueToElementMapper;
        })();
        JQuery.JQueryValueToElementMapper = JQueryValueToElementMapper;

        /////////////////////////////////
        // Configuring ioc dependencies
        /////////////////////////////////
        JohnSmith.Common.JS.ioc.register("elementFactory", {
            createElement: function (query) {
                return new JQueryElement($(query));
            },
            createRelativeElement: function (parent, query) {
            }
        });

        JohnSmith.Common.JS.addHandlerArgumentProcessor(new JQueryTargetArgumentProcessor());
        JohnSmith.Common.JS.addCommandCauseArgumentProcessor(new JQueryTargetArgumentProcessor());
        JohnSmith.Common.JS.ioc.register("markupResolver", new JQueryMarkupResolver());
        JohnSmith.Common.JS.ioc.register("valueToElementMapper", new JQueryValueToElementMapper());
    })(JohnSmith.JQuery || (JohnSmith.JQuery = {}));
    var JQuery = JohnSmith.JQuery;
})(JohnSmith || (JohnSmith = {}));
/// <reference path="Common.ts"/>
/// <reference path="view/Contracts.ts"/>
/// <reference path="view/Integration.ts"/>
/// <reference path="JQuery.ts"/>
/// <reference path="../libs/jquery.d.ts"/>
// Replace no-op logger with console-based implementation
JohnSmith.Common.log = {
    info: function (args) {
        try  {
        } catch (Error) {
        }
    },
    warn: function (args) {
        try  {
            console.warn.apply(console, arguments);
        } catch (Error) {
        }
    },
    error: function (args) {
        try  {
            console.error.apply(console, arguments);
        } catch (Error) {
        }
    }
};

var log = JohnSmith.Common.log;

log.info("========================================================== ");
log.info("       _       _              _____           _ _   _      ");
log.info("      | |     | |            / ____|         (_) | | |     ");
log.info("      | | ___ | |__  _ __   | (___  _ __ ___  _| |_| |__   ");
log.info("  _   | |/ _ \\| '_ \\| '_ \\   \\___ \\| '_ ` _ \\| | __| '_ \\  ");
log.info(" | |__| | (_) | | | | | | |  ____) | | | | | | | |_| | | | ");
log.info("  \\____/ \\___/|_| |_|_| |_| |_____/|_| |_| |_|_|\\__|_| |_| ");
log.info("========================================================== ");
log.warn("You are using debug version of JohnSmith. Do not use this version in production code.");
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="Contracts.ts"/>
    /// <reference path="BindableManager.ts"/>
    (function (Binding) {
        var CALLBACK_HANDLER_KEY = "callback";

        var CallbackHandler = (function () {
            function CallbackHandler(callback) {
                this._callback = callback;
            }
            CallbackHandler.prototype.wireWith = function (bindable) {
                bindable.addListener(this);
            };

            CallbackHandler.prototype.unwireWith = function (bindable) {
                bindable.removeListener(this);
            };

            CallbackHandler.prototype.valueChanged = function (oldValue, newValue, changeType) {
                // context should be 'window' by default
                // so 'native' functions like 'alert' would work correctly
                var context = window;

                this._callback.call(context, newValue, oldValue, changeType);
            };

            CallbackHandler.prototype.dispose = function () {
            };
            return CallbackHandler;
        })();
        Binding.CallbackHandler = CallbackHandler;

        var CallbackArgumentProcessor = (function () {
            function CallbackArgumentProcessor() {
            }
            CallbackArgumentProcessor.prototype.canProcess = function (argument, argumentIndex, options, /*bindable:IBindable,*/ context) {
                return argumentIndex == 0 && (options.handler == null || options.handler == CALLBACK_HANDLER_KEY) && (options.callback == null) && JohnSmith.Common.TypeUtils.isFunction(argument);
            };

            CallbackArgumentProcessor.prototype.process = function (argument, options, /*bindable:IBindable,*/ context) {
                options.handler = "callback";
                options.callback = argument;
            };
            return CallbackArgumentProcessor;
        })();

        JohnSmith.Common.JS.addHandlerArgumentProcessor(new CallbackArgumentProcessor());

        JohnSmith.Common.JS.addHandlerFactory({
            createHandler: function (data, context) {
                if (data && data.handler === "callback") {
                    return new CallbackHandler(data.callback);
                }

                return null;
            }
        });
    })(JohnSmith.Binding || (JohnSmith.Binding = {}));
    var Binding = JohnSmith.Binding;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="../Common.ts"/>
    /// <reference path="../Fetchers.ts"/>
    /// <reference path="Contracts.ts"/>
    /// <reference path="Handling.ts"/>
    (function (Binding) {
        var RendererBase = (function () {
            function RendererBase(formatter) {
                this._formatter = formatter;
            }
            RendererBase.prototype.render = function (value, destination) {
                var formattedValue = this._formatter.format(value);
                return this.doRender(formattedValue, destination);
            };

            /**
            * @abstract
            * @param formattedValue
            */
            RendererBase.prototype.doRender = function (formattedValue, destination) {
                return null;
            };
            return RendererBase;
        })();
        Binding.RendererBase = RendererBase;

        /**
        * Appends encoded text to destination element.
        */
        var TextRenderer = (function (_super) {
            __extends(TextRenderer, _super);
            function TextRenderer(formatter) {
                _super.call(this, formatter);
            }
            TextRenderer.prototype.doRender = function (formattedValue, destination) {
                return destination.appendText(formattedValue);
            };
            return TextRenderer;
        })(RendererBase);
        Binding.TextRenderer = TextRenderer;

        /**
        * Appends html markup to destination element.
        */
        var HtmlRenderer = (function (_super) {
            __extends(HtmlRenderer, _super);
            function HtmlRenderer(formatter) {
                _super.call(this, formatter);
            }
            HtmlRenderer.prototype.doRender = function (formattedValue, destination) {
                return destination.appendHtml(formattedValue);
            };
            return HtmlRenderer;
        })(RendererBase);
        Binding.HtmlRenderer = HtmlRenderer;

        /**
        * Appends html markup to destination element.
        */
        var ResolvableMarkupRenderer = (function (_super) {
            __extends(ResolvableMarkupRenderer, _super);
            function ResolvableMarkupRenderer(formatter, markupResolver) {
                _super.call(this, formatter);
                this._markupResolver = markupResolver;
            }
            ResolvableMarkupRenderer.prototype.doRender = function (formattedValue, destination) {
                var markup = this._markupResolver.resolve(formattedValue);
                return destination.appendHtml(markup);
            };
            return ResolvableMarkupRenderer;
        })(RendererBase);
        Binding.ResolvableMarkupRenderer = ResolvableMarkupRenderer;

        var FetcherToRendererAdapter = (function () {
            function FetcherToRendererAdapter(fetcher) {
                this._fetcher = fetcher;
            }
            FetcherToRendererAdapter.prototype.render = function (formattedValue, destination) {
                this._fetcher.valueToElement(formattedValue, destination);
                return destination;
            };
            return FetcherToRendererAdapter;
        })();
        Binding.FetcherToRendererAdapter = FetcherToRendererAdapter;
    })(JohnSmith.Binding || (JohnSmith.Binding = {}));
    var Binding = JohnSmith.Binding;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="../Common.ts"/>
    /// <reference path="../Fetchers.ts"/>
    /// <reference path="../view/Integration.ts"/>
    /// <reference path="Contracts.ts"/>
    /// <reference path="Handling.ts"/>
    /// <reference path="Renderers.ts"/>
    /// <reference path="BindableManager.ts"/>
    /// <reference path="BindableList.ts"/>
    (function (Binding) {
        var RenderValueHandler = (function () {
            function RenderValueHandler(contentDestination, renderer) {
                this._contentDestination = contentDestination;
                this._valueRenderer = renderer;
            }
            RenderValueHandler.prototype.wireWith = function (bindable) {
                this.doRender(bindable.getValue());
                bindable.addListener(this);
            };

            RenderValueHandler.prototype.unwireWith = function (bindable) {
                bindable.removeListener(this);
            };

            RenderValueHandler.prototype.valueChanged = function (oldValue, newValue, changeType) {
                this.doRender(newValue);
            };

            RenderValueHandler.prototype.stateChanged = function (oldState, newState) {
            };

            RenderValueHandler.prototype.dispose = function () {
                if (this._valueRenderer.dispose) {
                    this._valueRenderer.dispose();
                }
            };

            RenderValueHandler.prototype.doRender = function (value) {
                this._contentDestination.empty();
                if (value !== null && value !== undefined) {
                    this._valueRenderer.render(value, this._contentDestination);
                }
            };
            return RenderValueHandler;
        })();
        Binding.RenderValueHandler = RenderValueHandler;

        /**
        * A base class for rendering-related handlers.
        * Contains a few handy util methods.
        */
        var RenderHandlerFactoryBase = (function () {
            function RenderHandlerFactoryBase(destinationFactory, markupResolver, viewFactory, fetcherFactory) {
                this._destinationFactory = destinationFactory;
                this._markupResolver = markupResolver;
                this._viewFactory = viewFactory;
                this._fetcherFactory = fetcherFactory;
            }
            RenderHandlerFactoryBase.prototype.fillContentDestination = function (options, context) {
                if (!options.contentDestination) {
                    options.contentDestination = context == null ? this._destinationFactory.createElement(options.to) : context.findRelative(options.to);
                }
            };

            RenderHandlerFactoryBase.prototype.fillRenderer = function (options, commandHost, bindable) {
                if (!options.renderer) {
                    if (options.view) {
                        options.renderer = new JohnSmith.View.ViewValueRenderer(this._viewFactory, options.view);
                    } else {
                        if (!options.valueType) {
                            var encode = true;
                            if (options.encode !== undefined) {
                                encode = options.encode;
                            }

                            options.valueType = encode ? JohnSmith.Common.ValueType.text : JohnSmith.Common.ValueType.html;
                        }

                        if (!options.formatter) {
                            options.formatter = new DefaultFormatter();
                        }

                        options.renderer = this.getRenderer(options, commandHost, bindable);
                    }
                }
            };

            RenderHandlerFactoryBase.prototype.getRenderer = function (options, commandHost, bindable) {
                var fetcher = null;

                if (options.fetch) {
                    fetcher = this._fetcherFactory.getByKey(options.fetch);
                    if (!fetcher) {
                        throw new Error("Fetcher " + options.fetch + " not found");
                    }
                } else {
                    fetcher = this._fetcherFactory.getForElement(options.contentDestination);
                }

                if (fetcher) {
                    if (options.bidirectional !== false) {
                        var command = options.command;
                        var context = options.commandContext;
                        var event = options.event || "change";

                        var bindableObject = bindable;
                        if ((!command) && bindableObject.setValue) {
                            command = bindableObject.setValue;
                            context = bindableObject;
                        }

                        if (command) {
                            commandHost.on(options.to, event).do(command, context);
                        }
                    }

                    return new Binding.FetcherToRendererAdapter(fetcher);
                }

                switch (options.valueType) {
                    case JohnSmith.Common.ValueType.text:
                        return new Binding.TextRenderer(options.formatter);
                    case JohnSmith.Common.ValueType.html:
                        return new Binding.HtmlRenderer(options.formatter);
                    case JohnSmith.Common.ValueType.unknown:
                        return new Binding.ResolvableMarkupRenderer(options.formatter, this._markupResolver);
                    default:
                        throw new Error("Unknown value type: " + options.valueType);
                }
            };

            /**
            * Checks id the bindable stores an array.
            */
            RenderHandlerFactoryBase.prototype.isList = function (bindable) {
                if (bindable instanceof Binding.BindableList) {
                    return true;
                } else if (bindable) {
                    var value = bindable.getValue();
                    if (value instanceof Array) {
                        return true;
                    }
                }

                return false;
            };
            return RenderHandlerFactoryBase;
        })();
        Binding.RenderHandlerFactoryBase = RenderHandlerFactoryBase;

        var RenderValueFactory = (function (_super) {
            __extends(RenderValueFactory, _super);
            function RenderValueFactory(destinationFactory, markupResolver, viewFactory, fetcherFactory) {
                _super.call(this, destinationFactory, markupResolver, viewFactory, fetcherFactory);
            }
            RenderValueFactory.prototype.createHandler = function (handlerData, bindable, context, commandHost) {
                if (!handlerData) {
                    return null;
                }

                var options = handlerData;
                if (options.handler && options.handler !== "render") {
                    return null;
                }

                if (options.type && options.type !== "value") {
                    return null;
                }

                if (!options.type) {
                    if (this.isList(bindable)) {
                        return null;
                    }
                }

                this.fillContentDestination(options, context);
                this.fillRenderer(options, commandHost, bindable);

                var handler = new RenderValueHandler(options.contentDestination, options.renderer);

                return handler;
            };
            return RenderValueFactory;
        })(RenderHandlerFactoryBase);
        Binding.RenderValueFactory = RenderValueFactory;

        var DefaultFormatter = (function () {
            function DefaultFormatter() {
            }
            DefaultFormatter.prototype.format = function (value) {
                return value.toString();
            };
            return DefaultFormatter;
        })();
        Binding.DefaultFormatter = DefaultFormatter;

        JohnSmith.Common.JS.ioc.withRegistered(function (destinationFactory, markupResolver, viewFactory, fetcherFactory) {
            JohnSmith.Common.JS.addHandlerFactory(new RenderValueFactory(destinationFactory, markupResolver, viewFactory, fetcherFactory));
        }, "elementFactory", "markupResolver", "viewFactory", "fetcherFactory");
    })(JohnSmith.Binding || (JohnSmith.Binding = {}));
    var Binding = JohnSmith.Binding;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="../Fetchers.ts"/>
    /// <reference path="Contracts.ts"/>
    /// <reference path="Handling.ts"/>
    /// <reference path="RenderValueHandler.ts"/>
    (function (Binding) {
        var MarkSelectedHandler = (function () {
            function MarkSelectedHandler(listBindable, contentDestination, valueRenderer, mapper) {
                this._listBindable = listBindable;
                this._contentDestination = contentDestination;
                this._valueRenderer = valueRenderer;
                this._mapper = mapper;
            }
            MarkSelectedHandler.prototype.wireWith = function (bindable) {
                this.doRender(bindable.getValue(), Binding.DataChangeReason.replace);
                bindable.addListener(this);
            };

            MarkSelectedHandler.prototype.unwireWith = function (bindable) {
                bindable.removeListener(this);
            };

            MarkSelectedHandler.prototype.valueChanged = function (oldValue, newValue, changeType) {
                this.doRender(newValue, changeType);
            };

            MarkSelectedHandler.prototype.stateChanged = function (oldState, newState) {
            };

            MarkSelectedHandler.prototype.dispose = function () {
            };

            MarkSelectedHandler.prototype.doRender = function (value, reason) {
                var items = this._listBindable.getValue();
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var element = this._mapper.getElementFor(item, this._contentDestination);
                    if (item == value) {
                        element.addClass("selected");
                    } else {
                        element.removeClass("selected");
                    }
                }
            };
            return MarkSelectedHandler;
        })();
        Binding.MarkSelectedHandler = MarkSelectedHandler;

        var RenderListHandler = (function () {
            function RenderListHandler(contentDestination, renderer, mapper, selectionOptions) {
                this._contentDestination = contentDestination;
                this._valueRenderer = renderer;
                this._mapper = mapper;
            }
            RenderListHandler.prototype.wireWith = function (bindable) {
                this.doRender(bindable.getValue(), Binding.DataChangeReason.replace);
                bindable.addListener(this);
            };

            RenderListHandler.prototype.unwireWith = function (bindable) {
                bindable.removeListener(this);
            };

            RenderListHandler.prototype.valueChanged = function (oldValue, newValue, changeType) {
                this.doRender(newValue, changeType);
            };

            RenderListHandler.prototype.stateChanged = function (oldState, newState) {
            };

            RenderListHandler.prototype.dispose = function () {
                if (this._valueRenderer.dispose) {
                    this._valueRenderer.dispose();
                }
            };

            RenderListHandler.prototype.doRender = function (value, reason) {
                var items = value;

                if (reason == Binding.DataChangeReason.remove) {
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        var itemElement = this._mapper.getElementFor(item, this._contentDestination);
                        if (itemElement) {
                            itemElement.remove();
                        }
                    }
                } else if (reason == Binding.DataChangeReason.add) {
                    this.appendItems(value);
                } else {
                    this._contentDestination.empty();
                    this.appendItems(value);
                }
            };

            RenderListHandler.prototype.appendItems = function (items) {
                if (!items) {
                    return;
                }

                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var itemElement = this._valueRenderer.render(item, this._contentDestination);

                    this._mapper.attachValueToElement(item, itemElement);
                }
            };
            return RenderListHandler;
        })();
        Binding.RenderListHandler = RenderListHandler;

        var RenderListFactory = (function (_super) {
            __extends(RenderListFactory, _super);
            function RenderListFactory(destinationFactory, markupResolver, viewFactory, mapper, fetcherFactory) {
                _super.call(this, destinationFactory, markupResolver, viewFactory, fetcherFactory);
                this._mapper = mapper;
            }
            RenderListFactory.prototype.createHandler = function (handlerData, bindable, context, commandHost) {
                if (!handlerData) {
                    return null;
                }

                var options = handlerData;
                if (options.handler && options.handler !== "render") {
                    return null;
                }

                if (options.type && options.type !== "list") {
                    return null;
                }

                if (!options.type) {
                    if (!this.isList(bindable)) {
                        return null;
                    }
                }

                this.fillContentDestination(options, context);
                this.fillRenderer(options, commandHost, bindable);

                if (!options.mapper) {
                    options.mapper = this._mapper;
                }

                if (options.selectedItem) {
                    options.selectable = true;

                    if (!options.setSelection) {
                        options.setSelection = function (value) {
                            options.selectedItem.setValue(value);
                        };
                    }
                }

                var isSelectable = options.selectable || false;
                var selectionOptions = {
                    isSelectable: isSelectable,
                    selectedItem: options.selectedItem,
                    setSelectedCallback: options.setSelection
                };

                var handler = new RenderListHandler(options.contentDestination, options.renderer, options.mapper, selectionOptions);

                return handler;
            };
            return RenderListFactory;
        })(Binding.RenderHandlerFactoryBase);
        Binding.RenderListFactory = RenderListFactory;

        JohnSmith.Common.JS.ioc.withRegistered(function (destinationFactory, markupResolver, mapper, viewFactory, fetcherFactory) {
            JohnSmith.Common.JS.addHandlerFactory(new RenderListFactory(destinationFactory, markupResolver, viewFactory, mapper, fetcherFactory));
        }, "elementFactory", "markupResolver", "valueToElementMapper", "viewFactory", "fetcherFactory");
    })(JohnSmith.Binding || (JohnSmith.Binding = {}));
    var Binding = JohnSmith.Binding;
})(JohnSmith || (JohnSmith = {}));
var JohnSmith;
(function (JohnSmith) {
    /// <reference path="Contracts.ts"/>
    /// <reference path="Contracts.ts"/>
    /// <reference path="Handling.ts"/>
    (function (Binding) {
        var StateTransitionHandler = (function () {
            function StateTransitionHandler() {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                this._items = new JohnSmith.Common.ArrayList();
                for (var i = 0; i < args.length; i++) {
                    this._items.add(args[i]);
                }
            }
            StateTransitionHandler.prototype.wireWith = function (bindable) {
                bindable.addListener(this);
            };

            StateTransitionHandler.prototype.unwireWith = function (bindable) {
                bindable.removeListener(this);
            };

            StateTransitionHandler.prototype.valueChanged = function (oldValue, newValue, changeType) {
            };

            StateTransitionHandler.prototype.stateChanged = function (oldState, newState) {
                for (var i = 0; i < this._items.count(); i++) {
                    var item = this._items.getAt(i);
                    if (item.isMatched(oldState, newState)) {
                        item.handle(oldState, newState);
                    }
                }
            };

            StateTransitionHandler.prototype.dispose = function () {
                this._items.clear();
            };
            return StateTransitionHandler;
        })();
        Binding.StateTransitionHandler = StateTransitionHandler;
    })(JohnSmith.Binding || (JohnSmith.Binding = {}));
    var Binding = JohnSmith.Binding;
})(JohnSmith || (JohnSmith = {}));
