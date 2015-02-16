var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var SavedSnapshot = (function (_super) {
    __extends(SavedSnapshot, _super);
    function SavedSnapshot() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(SavedSnapshot.prototype, "data", {
        // TODO: Actually grab from localstorage
        get: function () {
            return this.get('data');
        },
        set: function (value) {
            this.set('data', value);
        },
        enumerable: true,
        configurable: true
    });
    return SavedSnapshot;
})(Backbone.Model);
/** State related to saving data. */
var SavedDataState = (function (_super) {
    __extends(SavedDataState, _super);
    function SavedDataState() {
        _super.apply(this, arguments);
        this.savedProps = ['circularBufferSize', 'circularBufferPosition'];
    }
    SavedDataState.prototype.fetch = function (options) {
        for (var i = 0; i < this.savedProps.length; i++) {
            var prop = this.savedProps[i];
            this[prop] = window.localStorage.getItem(prop);
        }
        return null;
    };
    SavedDataState.prototype.save = function () {
        for (var i = 0; i < this.savedProps.length; i++) {
            var prop = this.savedProps[i];
            window.localStorage.setItem(prop, this[prop]);
        }
    };
    Object.defineProperty(SavedDataState.prototype, "circularBufferSize", {
        get: function () {
            return this.get('circularBufferSize');
        },
        set: function (value) {
            this.set('circularBufferSize', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SavedDataState.prototype, "circularBufferPosition", {
        get: function () {
            return this.get('circularBufferPosition');
        },
        set: function (value) {
            this.set('circularBufferPosition', value);
        },
        enumerable: true,
        configurable: true
    });
    return SavedDataState;
})(Backbone.Model);
var SavedData = (function (_super) {
    __extends(SavedData, _super);
    function SavedData() {
        _super.apply(this, arguments);
    }
    SavedData.prototype.initialize = function (attributes, options) {
    };
    SavedData.prototype.watch = function (todoModel) {
        this.baseTodoModel = todoModel;
        this.listenTo(this.baseTodoModel, 'good-time-to-save', this.maybeSave);
    };
    /** Consider if we should save. */
    SavedData.prototype.maybeSave = function () {
    };
    SavedData.prototype.load = function () {
        var result;
        var savedData = window.localStorage.getItem('data');
        this.savedDataState = new SavedDataState();
        if (savedData) {
            savedData = JSON.parse(savedData);
            result = savedData;
            this.savedDataState.fetch();
        }
        else {
            result = this.firstTimeLoad();
        }
        console.log(this.savedDataState.toJSON());
        return result;
    };
    SavedData.prototype.firstTimeLoad = function () {
        this.savedDataState.circularBufferPosition = 0;
        this.savedDataState.circularBufferSize = 50;
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
        return data;
    };
    return SavedData;
})(Backbone.Collection);
var SavedDataView = (function (_super) {
    __extends(SavedDataView, _super);
    function SavedDataView() {
        _super.apply(this, arguments);
    }
    return SavedDataView;
})(Backbone.View);
//# sourceMappingURL=storage.js.map