﻿// TODO: 
// * Indicate which one you're on.

class LocalStorageBackedModel extends Backbone.Model {
	savedProps: string[] = ['bufferSize', 'bufferPosition'];
	namespace():string { return ''; }

	fetch(options?: Backbone.ModelFetchOptions): JQueryXHR {
		for (var i = 0; i < this.savedProps.length; i++) {
			var prop = this.savedProps[i];

			// Most things can be serialized just fine, but for e.g. objects we
			// allow you to use your own serialize/unserialize methods - just put a function
			// named serialize[your property name] on the derived class.

			var unserializer = this['unserialize' + prop] || Util.id;

			this[prop] = unserializer(window.localStorage.getItem(this.namespace() + prop));
		}

		return null;
	}

	save() {
		for (var i = 0; i < this.savedProps.length; i++) {
			var prop = this.savedProps[i];
			var serializer = this['serialize' + prop] || Util.id;

			window.localStorage.setItem(this.namespace() + prop, serializer(this[prop]));
		}
	}
	
}

/** The state of the entire todo list at some point in time. */
class SavedSnapshot extends LocalStorageBackedModel {
	namespace(): string {
		if (this.id === -1) throw 'SavedSnapshot not initialized';

		return 'snapshot' + this.id + '-';
	}

	init(id: number) {
		this.id = id;
	}

	savedProps: string[] = ['data', 'date'];

	get hasData(): boolean {
		return this.get('data') !== 'null' && this.get('data') !== undefined;
	}
	
    get data(): ITodo {
		if (!this.get('data')) {
			return null;
		}

	    return <ITodo> JSON.parse(this.get('data'));
    }
    set data(value: ITodo) { this.set('data', JSON.stringify(value)); }

	// These methods will be called by LocalStorageBackedModel.
	serializedata(data: ITodo):string { return JSON.stringify(data); }
	unserializedata(data: string): ITodo {
		return (data === 'undefined') ? undefined : JSON.parse(data);
	}
	
    get date(): string { return this.get('date'); }
    set date(value: string) { this.set('date', value); }
}

/** State related to saving data. */
class SavedDataState extends LocalStorageBackedModel {
	savedProps: string[] = ['bufferSize', 'bufferPosition', 'hasEverUsedApp'];

    get bufferSize(): number { return this.get('bufferSize'); }
    set bufferSize(value: number) { this.set('bufferSize', value); }

    get bufferPosition(): number { return this.get('bufferPosition'); }
    set bufferPosition(value: number) { this.set('bufferPosition', value); }
	unserializebufferPosition(value: string) { return parseInt(value, 10); }

    get hasEverUsedApp(): boolean { return this.get('hasEverUsedApp'); }
    set hasEverUsedApp(value: boolean) { this.set('hasEverUsedApp', value); }
}

class SavedData extends Backbone.Collection<SavedSnapshot> {
	baseTodoModel: TodoModel;
	savedDataState: SavedDataState;
	lastSave = 0;

	initialize(attributes?: any, options?: any) {
		
	}

	watch(todoModel: TodoModel) {
		this.baseTodoModel = todoModel;

		this.listenTo(this.baseTodoModel, 'global-change', this.save);
	}

	/** Save, and potentially roll the buffer forwards. */
	save():void {
		if ((+new Date()) - this.lastSave > 2 * 1000) { // TODO: Use better condition.
			this.savedDataState.bufferPosition = (this.savedDataState.bufferPosition + 1) % this.savedDataState.bufferSize;
			this.savedDataState.save();

			this.lastSave = +new Date();
		}

		this.activeTodo().data = this.baseTodoModel.getData();
		this.activeTodo().date = (new Date()).toUTCString();

		this.activeTodo().save();
	}

	private activeTodo(): SavedSnapshot {
		return this.at(this.savedDataState.bufferPosition);
	}

	load(): ITodo {
		this.savedDataState = new SavedDataState();
		this.savedDataState.fetch();

		if (this.savedDataState.hasEverUsedApp) {
			this.loadCircularBuffer();
		} else {
			this.firstTimeLoad();
		}

		return this.activeTodo().data;
	}

	loadModel(model: SavedSnapshot) {
		var index = this.indexOf(model);

		this.savedDataState.bufferPosition = index;
		this.savedDataState.save();

		this.trigger('load');
	}

	firstTimeLoad():ITodo {
		this.savedDataState.bufferPosition = 0;
		this.savedDataState.bufferSize = 50;
		this.savedDataState.hasEverUsedApp = true;

		this.savedDataState.save();

		var data: ITodo =  {
			name: 'This is a starter todo list.',
			createdDate: Util.fairlyLegibleDateTime(),
			modifiedDate: Util.fairlyLegibleDateTime(),
            archivalDate: '',
			content: '',
            searchMatch: SearchMatch.NoMatch,
			done: false,
            archived: false,
			isHeader: true,
            starred: false,
			children:
			[{
				createdDate: Util.fairlyLegibleDateTime(),
				modifiedDate: Util.fairlyLegibleDateTime(),
                archivalDate: '',
				name: 'Put some stuff here',
				content: '',
                searchMatch: SearchMatch.NoMatch,
				done: false,
                archived: false,
				isHeader: false,
                starred: false,
				children: []
			}, {
				createdDate: Util.fairlyLegibleDateTime(),
				modifiedDate: Util.fairlyLegibleDateTime(),
                archivalDate: '',
				name: 'More stuff here.',
				content: '',
                searchMatch: SearchMatch.NoMatch,
				done: false,
                archived: false,
				isHeader: false,
                starred: false,
				children: []
			}]
		};

		this.createCircularBuffer();

		var active = this.activeTodo();
		active.data = data;
		active.date = (new Date()).toUTCString();
		active.save();

		return data;
	}

	private createCircularBuffer(load:boolean = false):void {
		for (var i = 0; i < this.savedDataState.bufferSize; i++) {
			var snapshot = new SavedSnapshot();

			snapshot.init(i);

			if (load) {
				snapshot.fetch();
			} else {
				snapshot.save();
			}

			if (!this.get(snapshot.id))
				this.add(snapshot);
		}
	}

	private loadCircularBuffer(): void {
		this.createCircularBuffer(true);
	}
}

class IndividualSavedItemView extends Backbone.View<SavedSnapshot> {
	individualItem: ITemplate;

    events() {
        return {
            'click a': 'load'
        };
    }

	initialize(options: Backbone.ViewOptions<SavedSnapshot>) {
		this.individualItem = Util.getTemplate('autosave-list-item');
	}

	load() {
		this.trigger('load', this.model);
	}

	render():IndividualSavedItemView {
		this.$el.html(this.individualItem(this.model.toJSON()));
		this.$('.timeago-js').timeago();

		return this;
	}
}

class SavedDataView extends Backbone.View<SavedSnapshot> {
	initialize() {
		this.setElement($('.modal'));
	}

	load(model: SavedSnapshot):void {
		this.$el.modal('hide');

		// TODO: Dumb.
		(<any> this.collection).loadModel(model);
	}

	render():SavedDataView {
		this.$el.modal();

		var self = this;
		var $body = this.$('.modal-body .items').empty();

		this.collection.each((item: SavedSnapshot, i: number) => {
			if (!item.hasData)
				return;

			item.set('index', i);

			var view = new IndividualSavedItemView(<any>{
				model: item
			});

			view.render().$el.appendTo($body);
			this.listenTo(view, 'load', self.load);
		});

		return this;
	}
}