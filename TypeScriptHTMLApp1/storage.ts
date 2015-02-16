class LocalStorageBackedModel extends Backbone.Model {
	savedProps: string[] = ['circularBufferSize', 'circularBufferPosition'];
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
		if (this.index === -1) throw 'SavedSnapshot not initialized';

		return 'snapshot' + this.index + '-';
	}

	private index = -1;

	init(index: number) {
		this.index = index;
	}

	savedProps: string[] = ['data', 'date'];
	
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
		if (data === 'undefined') return undefined;

		return JSON.parse(data);
	}
	
    get date(): string { return this.get('date'); }
    set date(value: string) { this.set('date', value); }
}

/** State related to saving data. */
class SavedDataState extends LocalStorageBackedModel {
	savedProps: string[] = ['circularBufferSize', 'circularBufferPosition', 'hasEverUsedApp'];

    get circularBufferSize(): number { return this.get('circularBufferSize'); }
    set circularBufferSize(value: number) { this.set('circularBufferSize', value); }

    get circularBufferPosition(): number { return this.get('circularBufferPosition'); }
    set circularBufferPosition(value: number) { this.set('circularBufferPosition', value); }

    get hasEverUsedApp(): boolean { return this.get('hasEverUsedApp'); }
    set hasEverUsedApp(value: boolean) { this.set('hasEverUsedApp', value); }
}

class SavedData extends Backbone.Collection<SavedSnapshot> {
	baseTodoModel: TodoModel;
	savedDataState: SavedDataState;

	initialize(attributes?: any, options?: any) {
		
	}

	watch(todoModel: TodoModel) {
		this.baseTodoModel = todoModel;

		this.listenTo(this.baseTodoModel, 'good-time-to-save', this.maybeSave);
	}

	/** Consider if we should save. */
	maybeSave():void {
		this.activeTodo().data = this.baseTodoModel.getData();
		this.activeTodo().save();
	}

	private activeTodo(): SavedSnapshot {
		return this.at(this.savedDataState.circularBufferPosition);
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

	firstTimeLoad():ITodo {
		this.savedDataState.circularBufferPosition = 0;
		this.savedDataState.circularBufferSize = 50;
		this.savedDataState.hasEverUsedApp = true;

		this.savedDataState.save();

		var data: ITodo = <any> {
			name: 'This is a starter todo list.',
			content: '',
			children:
			[{
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
	}

	private createCircularBuffer(load:boolean = false):void {
		for (var i = 0; i < this.savedDataState.circularBufferSize; i++) {
			var snapshot = new SavedSnapshot();

			snapshot.init(i);

			if (load) {
				snapshot.fetch();
			} else {
				snapshot.save();
			}

			this.add(snapshot);
		}
	}

	private loadCircularBuffer(): void {
		this.createCircularBuffer(true);
	}
}

class SavedDataView extends Backbone.View<SavedSnapshot> {

}