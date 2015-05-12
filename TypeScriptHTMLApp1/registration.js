var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
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
        this.$el.empty();
        var signinView = new SigninView();
        signinView.render();
    };
    RegisterOrSigninView.prototype.showRegisterDialog = function () {
        this.$el.empty();
        var registerView = new RegisterView();
        registerView.render();
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
            'click .done-js': this.signin
        };
    };
    SigninView.prototype.initialize = function () {
        _.bindAll(this, 'render');
        this.setElement($('.dialogs-go-here'));
        this.template = Util.getTemplate('signin');
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
var RegisterView = (function (_super) {
    __extends(RegisterView, _super);
    function RegisterView() {
        _super.apply(this, arguments);
    }
    RegisterView.prototype.events = function () {
        return {
            'click .done-js': this.register
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
    RegisterView.prototype.register = function () {
        var email = this.$('#email-input').val();
        var password = this.$('#password-input').val();
        var confirm = this.$('#confirm-input').val();
        this.$('.error-message').hide();
        debugger;
        if (password !== confirm) {
            this.showValidationError('Passwords do not match.');
            return;
        }
        if (password.length <= 6) {
            this.showValidationError('Password should be at least 6 characters.');
            return;
        }
    };
    RegisterView.prototype.render = function () {
        this.$el.html(this.template());
        return this;
    };
    return RegisterView;
})(Backbone.View);
//# sourceMappingURL=registration.js.map