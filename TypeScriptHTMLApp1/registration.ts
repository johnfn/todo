// TODO (file)
// * Sign in is totally shimmed right now
// * This whole shindig could be refactored - I could make a generic dialog box abstraction
//   Not really worth it until I make more dialogs, though.

var showDialog = function(dialog: any) {
    $('.dialogs-go-here').empty();

    var newDialog = new dialog();
    newDialog.render();
}

var hideDialogs = function() {
    $('.dialogs-go-here').empty();
}

/*
    Singleton class for the current user.
*/
class User extends Backbone.Model {
    public static currentUser: User;

    get email(): string { return this.get('email'); }
    set email(value) { this.set('email', value); }

    // This can't be a backbone prop because they are backed by strings.
    public content: ITodo;
}

class RegisterOrSigninView extends Backbone.View<Backbone.Model> {
    template: ITemplate;

    events() {
        return {
            'click .log-in-js': this.showLoginDialog,
            'click .register-js': this.showRegisterDialog
        };
    }

    initialize() {
        _.bindAll(this, 'render');

        this.setElement($('.dialogs-go-here'));
        this.template = Util.getTemplate('register-or-signin');
    }

    showLoginDialog() {
        this.undelegateEvents();
        showDialog(SigninView);
    }

    showRegisterDialog() {
        this.undelegateEvents();
        showDialog(RegisterView);
    }

    render(): RegisterOrSigninView {
        this.$el.html(this.template());

        return this;
    }
}


// TODO
// * Server registration is broken, so I have stubbed out that code for now.

class SigninView extends Backbone.View<Backbone.Model> {
    template: ITemplate;

    events() {
        return {
            'click .done-js': this.signin,
            'click .cancel-js': this.cancel
        };
    }

    initialize() {
        _.bindAll(this, 'render');

        this.setElement($('.dialogs-go-here'));
        this.template = Util.getTemplate('signin');
    }

    cancel() {
        this.undelegateEvents();
        showDialog(RegisterOrSigninView);
    }

    showValidationError(msg: string) {
        this.$('.error-message').html(msg);
        this.$('.error-message').toggle(msg !== '');
    }

    signin() {
        var email: string = this.$('#email-input').val();
        var password: string = this.$('#password-input').val();

        $.post(baseUrl + '/users/sign_in', {
            user: {
                email: email,
                password: password,
                remember_me: 1
            }
        }, response => {
            // Check if the server responded with errors
            if (typeof response == 'string') {
                var error = response.match(/<li>(.*)<\/li>/);
                var firstError = error[1];

                if (firstError) {
                    this.showValidationError(firstError);
                    return;
                }
            }

            // TODO: Something is broken on server.

            var user = new User();
            user.email = "johnfn@gmail.com";
            user.id = response[0].id;
            user.content = response[0].content;

            User.currentUser = user;

            hideDialogs();
            kickItOff();
        });
    }

    render(): SigninView {
        this.$el.html(this.template());

        return this;
    }
}


// TODO
// * Separate validation code from register code

class RegisterView extends Backbone.View<Backbone.Model> {
    template: ITemplate;

    events() {
        return {
            'click .done-js': this.register,
            'click .cancel-js': this.cancel
        };
    }

    initialize() {
        _.bindAll(this, 'render');

        this.setElement($('.dialogs-go-here'));
        this.template = Util.getTemplate('register');
    }

    showValidationError(msg: string) {
        this.$('.error-message').html(msg);
        this.$('.error-message').toggle(msg !== '');
    }

    showHelpfulMessage(msg: string) {
        this.$('.helpful-message').html(msg);
        this.$('.helpful-message').toggle(msg !== '');
    }

    register() {
        var email: string = this.$('#email-input').val();
        var password: string = this.$('#password-input').val();
        var confirm: string = this.$('#confirm-input').val();

        this.$('.error-message').hide();

        if (password !== confirm) {
            this.showValidationError('Passwords do not match.');
            return;
        }

        if (password.length <= 6) {
            this.showValidationError('Password should be at least 6 characters.');
            return;
        }

        $.post(baseUrl + '/users', {
            user: {
                email: email,
                password: password,
                password_confirmation: confirm
            }
        }, response => {
            // Check if the server responded with errors
            if (typeof response == 'string') {
                var error = response.match(/<li>(.*)<\/li>/);
                var firstError = error[1];

                if (firstError) {
                    this.showValidationError(firstError);
                    return;
                }
            }

            this.showHelpfulMessage('Registration success! You may procede to log in.');
        });
    }

    cancel() {
        this.undelegateEvents();
        showDialog(RegisterOrSigninView);
    }

    render(): RegisterView {
        this.$el.html(this.template());

        return this;
    }
}
