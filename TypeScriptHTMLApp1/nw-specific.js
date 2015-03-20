// Load native UI library
if (typeof require !== 'undefined') {
    var gui = require('nw.gui');

    var win = gui.Window.get();
    var tray;

    win.menu = new gui.Menu({ type: 'menubar' });
    win.menu.createMacBuiltin("grants-todos");

// Get the minimize event
    win.on('minimize', function() {
        // Hide window
        win.hide();

        // Show tray
        tray = new gui.Tray({ icon: 'icon.png' });

        // Show window and remove tray when clicked
        tray.on('click', function() {
            win.show();
            tray.remove();
            tray = null;
        });
    });

    win.on('restore', function() {
        if (tray) {
            tray.remove();
            tray = null;
        }

        win.focus()
    });

    var option = {
        key: "Ctrl+Period",
        active: function() {
            win.restore();
            win.focus();
        },
        failed: function(msg) {
            console.log(msg);
        }
    };

    var shortcut = new gui.Shortcut(option);
    gui.App.registerGlobalHotKey(shortcut);

    win.focus();
}
