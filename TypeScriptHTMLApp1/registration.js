var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var showDialog = function (dialog) {
    $('.dialogs-go-here').empty();
    var newDialog = new dialog();
    newDialog.render();
};
var RegisterOrSigninView = (function (_super) {
    __extends(RegisterOrSigninView, _super);
    function RegisterOrSigninView() {
        _super.apply(this, arguments);
    }
    RegisterOrSigninView.prototype.events = function () {
        return {
            'click .log-in-js': this.showLoginDialog,
            'click .register-js': this.showRegisterDialog
        };
    };
    RegisterOrSigninView.prototype.initialize = function () {
        _.bindAll(this, 'render');
        this.setElement($('.dialogs-go-here'));
        this.template = Util.getTemplate('register-or-signin');
    };
    RegisterOrSigninView.prototype.showLoginDialog = function () {
        this.undelegateEvents();
        showDialog(SigninView);
    };
    RegisterOrSigninView.prototype.showRegisterDialog = function () {
        this.undelegateEvents();
        showDialog(RegisterView);
    };
    RegisterOrSigninView.prototype.render = function () {
        this.$el.html(this.template());
        return this;
    };
    return RegisterOrSigninView;
})(Backbone.View);
var SigninView = (function (_super) {
    __extends(SigninView, _super);
    function SigninView() {
        _super.apply(this, arguments);
    }
    SigninView.prototype.events = function () {
        return {
            'click .done-js': this.signin,
            'click .cancel-js': this.cancel
        };
    };
    SigninView.prototype.initialize = function () {
        _.bindAll(this, 'render');
        this.setElement($('.dialogs-go-here'));
        this.template = Util.getTemplate('signin');
    };
    SigninView.prototype.cancel = function () {
        this.undelegateEvents();
        showDialog(RegisterOrSigninView);
    };
    SigninView.prototype.signin = function () {
        console.log('Sign in.');
    };
    SigninView.prototype.render = function () {
        this.$el.html(this.template());
        return this;
    };
    return SigninView;
})(Backbone.View);
// TODO
// * Error messages should be in red
// * Separate validation code from register code
var RegisterView = (function (_super) {
    __extends(RegisterView, _super);
    function RegisterView() {
        _super.apply(this, arguments);
    }
    RegisterView.prototype.events = function () {
        return {
            'click .done-js': this.register,
            'click .cancel-js': this.cancel
        };
    };
    RegisterView.prototype.initialize = function () {
        _.bindAll(this, 'render');
        this.setElement($('.dialogs-go-here'));
        this.template = Util.getTemplate('register');
    };
    RegisterView.prototype.showValidationError = function (msg) {
        this.$('.error-message').html(msg);
        this.$('.error-message').toggle(msg !== '');
    };
    RegisterView.prototype.showHelpfulMessage = function (msg) {
        this.$('.helpful-message').html(msg);
        this.$('.helpful-message').toggle(msg !== '');
    };
    RegisterView.prototype.register = function () {
        var _this = this;
        var email = this.$('#email-input').val();
        var password = this.$('#password-input').val();
        var confirm = this.$('#confirm-input').val();
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
        }, function (response) {
            // Check if the server responded with errors
            if (typeof response == 'string') {
                var error = response.match(/<li>(.*)<\/li>/);
                var firstError = error[1];
                if (firstError) {
                    _this.showValidationError(firstError);
                    return;
                }
            }
            _this.showHelpfulMessage('Registration success! You may procede to log in.');
        });
    };
    RegisterView.prototype.cancel = function () {
        this.undelegateEvents();
        showDialog(RegisterOrSigninView);
    };
    RegisterView.prototype.render = function () {
        this.$el.html(this.template());
        return this;
    };
    return RegisterView;
})(Backbone.View);
