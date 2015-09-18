var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var Vidyano;
(function (Vidyano) {
    var WebComponents;
    (function (WebComponents) {
        var MaskedInput = (function (_super) {
            __extends(MaskedInput, _super);
            function MaskedInput() {
                _super.apply(this, arguments);
            }
            MaskedInput.prototype._initialize = function (format, separator, isAttached) {
                var _this = this;
                if (!isAttached)
                    return;
                var mi = new window["MaskedInput"]({
                    elm: this,
                    format: format,
                    separator: separator,
                    onfilled: function () {
                        _this.fire("filled", { value: _this.value });
                    }
                });
            };
            MaskedInput = __decorate([
                WebComponents.WebComponent.register({
                    extends: "input",
                    properties: {
                        format: {
                            type: String,
                            reflectToAttribute: true
                        },
                        separator: {
                            type: String,
                            reflectToAttribute: true
                        }
                    },
                    observers: [
                        "_initialize(format, separator, isAttached)"
                    ]
                })
            ], MaskedInput);
            return MaskedInput;
        })(WebComponents.WebComponent);
        WebComponents.MaskedInput = MaskedInput;
    })(WebComponents = Vidyano.WebComponents || (Vidyano.WebComponents = {}));
})(Vidyano || (Vidyano = {}));
