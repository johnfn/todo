// TODO: 
// X skip undefined
// X shortcut to open
// X Bug with buffer position increment
// * load on click
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var LocalStorageBackedModel = (function (_super) {
    __extends(LocalStorageBackedModel, _super);
    function LocalStorageBackedModel() {
        _super.apply(this, arguments);
        this.savedProps = ['bufferSize', 'bufferPosition'];
    }
    LocalStorageBackedModel.prototype.namespace = function () {
        return '';
    };
    LocalStorageBackedModel.prototype.fetch = function (options) {
        for (var i = 0; i < this.savedProps.length; i++) {
            var prop = this.savedProps[i];
            // Most things can be serialized just fine, but for e.g. objects we
            // allow you to use your own serialize/unserialize methods - just put a function
            // named serialize[your property name] on the derived class.
            var unserializer = this['unserialize' + prop] || Util.id;
            this[prop] = unserializer(window.localStorage.getItem(this.namespace() + prop));
        }
        return null;
    };
    LocalStorageBackedModel.prototype.save = function () {
        for (var i = 0; i < this.savedProps.length; i++) {
            var prop = this.savedProps[i];
            var serializer = this['serialize' + prop] || Util.id;
            window.localStorage.setItem(this.namespace() + prop, serializer(this[prop]));
        }
    };
    return LocalStorageBackedModel;
})(Backbone.Model);
/** The state of the entire todo list at some point in time. */
var SavedSnapshot = (function (_super) {
    __extends(SavedSnapshot, _super);
    function SavedSnapshot() {
        _super.apply(this, arguments);
        this.index = -1;
        this.savedProps = ['data', 'date'];
    }
    SavedSnapshot.prototype.namespace = function () {
        if (this.index === -1)
            throw 'SavedSnapshot not initialized';
        return 'snapshot' + this.index + '-';
    };
    SavedSnapshot.prototype.init = function (index) {
        this.index = index;
    };
    Object.defineProperty(SavedSnapshot.prototype, "hasData", {
        get: function () {
            return this.get('data') !== "null";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SavedSnapshot.prototype, "data", {
        get: function () {
            if (!this.get('data')) {
                return null;
            }
            return JSON.parse(this.get('data'));
        },
        set: function (value) {
            this.set('data', JSON.stringify(value));
        },
        enumerable: true,
        configurable: true
    });
    // These methods will be called by LocalStorageBackedModel.
    SavedSnapshot.prototype.serializedata = function (data) {
        return JSON.stringify(data);
    };
    SavedSnapshot.prototype.unserializedata = function (data) {
        return (data === 'undefined') ? undefined : JSON.parse(data);
    };
    Object.defineProperty(SavedSnapshot.prototype, "date", {
        get: function () {
            return this.get('date');
        },
        set: function (value) {
            this.set('date', value);
        },
        enumerable: true,
        configurable: true
    });
    return SavedSnapshot;
})(LocalStorageBackedModel);
/** State related to saving data. */
var SavedDataState = (function (_super) {
    __extends(SavedDataState, _super);
    function SavedDataState() {
        _super.apply(this, arguments);
        this.savedProps = ['bufferSize', 'bufferPosition', 'hasEverUsedApp'];
    }
    Object.defineProperty(SavedDataState.prototype, "bufferSize", {
        get: function () {
            return this.get('bufferSize');
        },
        set: function (value) {
            this.set('bufferSize', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SavedDataState.prototype, "bufferPosition", {
        get: function () {
            return this.get('bufferPosition');
        },
        set: function (value) {
            this.set('bufferPosition', value);
        },
        enumerable: true,
        configurable: true
    });
    SavedDataState.prototype.unserializebufferPosition = function (value) {
        return parseInt(value, 10);
    };
    Object.defineProperty(SavedDataState.prototype, "hasEverUsedApp", {
        get: function () {
            return this.get('hasEverUsedApp');
        },
        set: function (value) {
            this.set('hasEverUsedApp', value);
        },
        enumerable: true,
        configurable: true
    });
    return SavedDataState;
})(LocalStorageBackedModel);
var SavedData = (function (_super) {
    __extends(SavedData, _super);
    function SavedData() {
        _super.apply(this, arguments);
    }
    SavedData.prototype.initialize = function (attributes, options) {
    };
    SavedData.prototype.watch = function (todoModel) {
        this.baseTodoModel = todoModel;
        this.listenTo(this.baseTodoModel, 'good-time-to-save', this.save);
    };
    /** Save, and potentially roll the buffer forwards. */
    SavedData.prototype.save = function () {
        if (true) {
            this.savedDataState.bufferPosition = (this.savedDataState.bufferPosition + 1) % this.savedDataState.bufferSize;
            this.savedDataState.save();
        }
        this.activeTodo().data = this.baseTodoModel.getData();
        this.activeTodo().date = (new Date()).toString();
        this.activeTodo().save();
    };
    SavedData.prototype.activeTodo = function () {
        return this.at(this.savedDataState.bufferPosition);
    };
    SavedData.prototype.load = function () {
        this.savedDataState = new SavedDataState();
        this.savedDataState.fetch();
        if (this.savedDataState.hasEverUsedApp) {
            this.loadCircularBuffer();
        }
        else {
            this.firstTimeLoad();
        }
        return this.activeTodo().data;
    };
    SavedData.prototype.firstTimeLoad = function () {
        this.savedDataState.bufferPosition = 0;
        this.savedDataState.bufferSize = 50;
        this.savedDataState.hasEverUsedApp = true;
        this.savedDataState.save();
        var data = {
            name: 'This is a starter todo list.',
            content: '',
            children: [{
                name: 'Put some stuff here',
                children: []
            }, {
                name: 'More stuff here.',
                children: []
            }]
        };
        this.createCircularBuffer();
        var active = this.activeTodo();
        active.data = data;
        active.save();
        return data;
    };
    SavedData.prototype.createCircularBuffer = function (load) {
        if (load === void 0) { load = false; }
        for (var i = 0; i < this.savedDataState.bufferSize; i++) {
            var snapshot = new SavedSnapshot();
            snapshot.init(i);
            if (load) {
                snapshot.fetch();
            }
            else {
                snapshot.save();
            }
            this.add(snapshot);
        }
    };
    SavedData.prototype.loadCircularBuffer = function () {
        this.createCircularBuffer(true);
    };
    return SavedData;
})(Backbone.Collection);
var IndividualSavedItemView = (function (_super) {
    __extends(IndividualSavedItemView, _super);
    function IndividualSavedItemView() {
        _super.apply(this, arguments);
    }
    IndividualSavedItemView.prototype.initialize = function (options) {
        this.individualItem = Util.getTemplate('autosave-list-item');
    };
    IndividualSavedItemView.prototype.render = function () {
        this.$el.html(this.individualItem(this.model.toJSON()));
        return this;
    };
    return IndividualSavedItemView;
})(Backbone.View);
var SavedDataView = (function (_super) {
    __extends(SavedDataView, _super);
    function SavedDataView() {
        _super.apply(this, arguments);
    }
    SavedDataView.prototype.initialize = function () {
        this.setElement($('.modal'));
    };
    SavedDataView.prototype.render = function () {
        this.$el.modal();
        var $body = this.$('.modal-body').empty();
        this.collection.each(function (item, i) {
            if (!item.hasData)
                return;
            item.set('index', i);
            var view = new IndividualSavedItemView({
                model: item
            });
            view.render().$el.appendTo($body);
        });
        return this;
    };
    return SavedDataView;
})(Backbone.View);
//# sourceMappingURL=storage.js.map