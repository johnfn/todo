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
        this.$el.empty();

        var signinView = new SigninView();
        signinView.render();
    }

    showRegisterDialog() {
        this.$el.empty();

        var registerView = new RegisterView();
        registerView.render();
    }

    render(): RegisterOrSigninView {
        this.$el.html(this.template());

        return this;
    }
}

class SigninView extends Backbone.View<Backbone.Model> {
    template: ITemplate;

    events() {
        return {
            'click .done-js': this.signin
        };
    }

    initialize() {
        _.bindAll(this, 'render');

        this.setElement($('.dialogs-go-here'));
        this.template = Util.getTemplate('signin');
    }

    signin() {
        console.log('Sign in.');
    }

    render(): SigninView {
        this.$el.html(this.template());

        return this;
    }
}


// TODO
// * Error messages should be in red
// * Separate validation code from register code

class RegisterView extends Backbone.View<Backbone.Model> {
    template: ITemplate;

    events() {
        return {
            'click .done-js': this.register
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

    render(): RegisterView {
        this.$el.html(this.template());

        return this;
    }
}
